import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  Monitor,
  Stethoscope,
  Info,
  Headphones,
  MapPin,
  Home,
  UserRound,
  Loader2,
  MoveLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSingleAppointmentReq,
  cancelAppointmentReq,
} from "@/config/service/patient.service";
import { getPatientVideoSessionReq } from "@/config/service/video-consultation.service";
import { toast } from "sonner";
import {
  formatZonedDate,
  formatZonedTimeRange,
  isScheduledTimeError,
  extractScheduledTimeFromError,
  formatScheduledTimeMessage,
  getApiErrorMessage,
} from "@/lib/utils";
import {
  isJoinWindowEnded,
  isRoomNotOpenYet,
} from "@/shared/utils/video-session-errors.util";
import type { Patient, RejectedPayload } from "@/lib/types";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";
import { AppointmentStatusBadge } from "@/patient/components/appointment-status-badge.component.patient";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { VideoCall } from "@/shared/components/video-call.component";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AppointmentDetailSkeleton } from "@/shared/components/appointment-detail-skeleton.component.shared";
import SEO from "@/shared/components/seo.component";

// ─── Consultation type config ───────────────────────────────────────────────

type ConsultationType =
  | "VIDEO"
  | "CHAT"
  | "AUDIO"
  | "MEETADOCTOR"
  | "HOMESERVICE";

const CONSULTATION_CONFIG: Record<
  ConsultationType,
  {
    label: string;
    icon: typeof Video;
    platformLabel: string;
    platformIcon: typeof Monitor;
    actionLabel: string;
    actionIcon: typeof Video;
    instructions: string[];
  }
> = {
  VIDEO: {
    label: "Video Call",
    icon: Video,
    platformLabel: "Carelexa",
    platformIcon: Monitor,
    actionLabel: "Join Video Call",
    actionIcon: Video,
    instructions: [
      "Please join the call 5 minutes early",
      "Ensure your camera and microphone are working",
      "Find a quiet, well-lit environment",
      "Have your medical records or prescriptions ready if available",
    ],
  },
  AUDIO: {
    label: "Audio Call",
    icon: Headphones,
    platformLabel: "Phone Call",
    platformIcon: Headphones,
    actionLabel: "Join Audio Call",
    actionIcon: Headphones,
    instructions: [
      "Ensure you are in a quiet environment with good reception",
      "Have your phone fully charged",
      "Keep a pen and paper handy for any notes",
      "Have your medical records ready if available",
    ],
  },
  CHAT: {
    label: "Chat Session",
    icon: Monitor,
    platformLabel: "In-App Chat",
    platformIcon: Monitor,
    actionLabel: "Open Chat",
    actionIcon: Monitor,
    instructions: [
      "Be ready to describe your symptoms clearly via text",
      "Have photos of any visible symptoms ready to share",
      "Keep your medical records accessible for reference",
    ],
  },
  MEETADOCTOR: {
    label: "Meet a Doctor",
    icon: UserRound,
    platformLabel: "In-Person Visit",
    platformIcon: MapPin,
    actionLabel: "Get Directions",
    actionIcon: MapPin,
    instructions: [
      "Arrive at the clinic 15 minutes before your scheduled time",
      "Bring a valid ID and your insurance card",
      "Carry any recent test results or prescriptions",
      "Wear comfortable clothing for examination",
    ],
  },
  HOMESERVICE: {
    label: "Home Service",
    icon: Home,
    platformLabel: "Doctor Visit",
    platformIcon: Home,
    actionLabel: "Confirm Address",
    actionIcon: Home,
    instructions: [
      "Ensure your home address is correct and accessible",
      "Have a clean, well-lit area prepared for examination",
      "Keep a list of current medications ready",
      "Someone should be available to open the door for the doctor",
    ],
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

const AppointmentDetails = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { updateParams } = useUrlSearchParams();
  const queryClient = useQueryClient();
  const consultationId = params.id ?? "";
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showVideo, setShowVideo] = useState(false);

  const patientState = useSelector(
    (state: RootState) => state.auth.user,
  ) as Patient | null;
  const patientName = patientState?.user
    ? `${patientState.user.first_name} ${patientState.user.last_name}`
    : "Patient";
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["appointment", consultationId],
    queryFn: () => getSingleAppointmentReq(consultationId),
    enabled: !!consultationId,
  });

  const consultationType =
    (data?.data?.consultation_id?.type as ConsultationType) || "VIDEO";
  const isVideoConsultation = consultationType === "VIDEO";

  // Spec §4: bounded backoff only for the room-not-open-yet 400; no
  // background polling while the patient waits.
  const videoSessionQuery = useQuery({
    queryKey: ["patient-video-session", consultationId],
    queryFn: () => getPatientVideoSessionReq(consultationId),
    enabled: Boolean(consultationId) && showVideo && isVideoConsultation,
    retry: (failureCount: number, error: unknown) =>
      failureCount < 3 && isRoomNotOpenYet(error),
    retryDelay: (attempt: number) => Math.min(1500 * 2 ** attempt, 5000),
    staleTime: 60_000,
  });

  const videoErrorMessage = getApiErrorMessage(
    videoSessionQuery.error,
    "Unable to load the video session.",
  );

  // Check for scheduled time error (appointment time hasn't arrived yet)
  const scheduledTimeError = isScheduledTimeError(videoSessionQuery.error);
  const scheduledTime = extractScheduledTimeFromError(videoSessionQuery.error);
  const scheduledTimeMessage = scheduledTime
    ? formatScheduledTimeMessage(scheduledTime)
    : null;

  const isWaitingForDoctor = isRoomNotOpenYet(videoSessionQuery.error);

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelAppointmentReq(consultationId, { reason: cancelReason }),
    onSuccess: (response) => {
      toast.success(
        response.response_description || "Appointment cancelled successfully.",
      );
      queryClient.invalidateQueries({
        queryKey: ["appointment", consultationId],
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      refetch();
      setCancelDialogOpen(false);
      setCancelReason("");
    },
    onError: (error: RejectedPayload) => {
      toast.error(
        error.message || "Failed to cancel appointment. Please try again.",
      );
    },
  });

  if (isLoading) {
    return <AppointmentDetailSkeleton />;
  }

  if (isError || !data?.data) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">
          Failed to load appointment details.
        </p>
      </div>
    );
  }

  const appointment = data.data;
  const displayDate = formatZonedDate(
    appointment.scheduled_start_at_utc,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
    undefined,
    userTimezone,
  );
  const displayTime = formatZonedTimeRange(
    appointment.scheduled_start_at_utc,
    appointment.scheduled_end_at_utc,
    { timeZone: userTimezone },
  );

  const config = CONSULTATION_CONFIG[consultationType];
  const TypeIcon = config.icon;
  const PlatformIcon = config.platformIcon;
  const ActionIcon = config.actionIcon;

  const canJoinVideo =
    appointment.status === "CONFIRMED" || appointment.status === "ACTIVE";
  const rescheduleHistory = [...(appointment.rescheduled_history ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const doctorImage =
    appointment.doctor_id?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.doctor_id?.first_name || "Doctor"}`;

  const handleJoin = () => {
    // Window ENDED — show the backend's own copy (spec §6: safe to display).
    if (videoSessionQuery.error && isJoinWindowEnded(videoSessionQuery.error)) {
      toast.error(
        getApiErrorMessage(
          videoSessionQuery.error,
          "This appointment window has already ended.",
        ),
      );
      return;
    }
    // Too EARLY — point the patient to when joins open (spec §5: start −10 min).
    if (scheduledTimeError && scheduledTimeMessage) {
      toast.error(
        `This appointment starts at ${scheduledTimeMessage}. You can join 10 minutes before then.`,
      );
      return;
    }
    if (isVideoConsultation && canJoinVideo) {
      setShowVideo(true);
    }
  };

  return (
    <>
      <SEO
        title="Appointment Details"
        description="View appointment details, join video calls, and manage your upcoming appointments on Carelexa."
        canonicalPath="/patient/dashboard/appointments/:id"
      />
      <>{/* Title */}</>
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-5 group"
        >
          <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
        <h1 className="text-base font-semibold tracking-tight sm:text-xl">
          Appointment Details
        </h1>
        <p className="text-xs m text-[#6C6C6C] mt-1">
          Reference ID: {appointment.appointment_number}
        </p>
      </div>

      {showVideo && isVideoConsultation && (
        <VideoCall
          session={videoSessionQuery.data?.data}
          displayName={patientName}
          role="patient"
          appointmentId={consultationId}
          onLeave={() => setShowVideo(false)}
          isUnavailable={isWaitingForDoctor}
          isLoading={videoSessionQuery.isLoading}
          isError={
            videoSessionQuery.isError ||
            (!videoSessionQuery.isLoading && !videoSessionQuery.data?.data)
          }
          errorMessage={videoErrorMessage}
          onRetry={() => void videoSessionQuery.refetch()}
          onSessionStale={() => void videoSessionQuery.refetch()}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        {/* Main content card */}
        <div className="bg-card rounded-[20px] border border-border p-4 md:p-6 min-w-0">
          {/* Doctor info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-5 md:mb-6 p-4 md:p-5 bg-[#F7F7F7] rounded-lg border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              <img
                src={doctorImage}
                alt={appointment.doctor_id?.full_name || "Doctor"}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {appointment.doctor_id?.full_name || "Doctor"}
              </p>
              <p className="text-xs text-[#828282]">
                {appointment.doctor_id?.specializations?.[0] ||
                  "General physician"}
              </p>
            </div>
          </div>

          {/* Date & Time row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-4 md:mb-5 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 md:gap-2.5">
              <Calendar className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-xs md:text-sm text-foreground truncate">
                {displayDate}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-2.5">
              <Clock className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-xs md:text-sm text-foreground truncate">
                {displayTime}
              </span>
            </div>
          </div>

          {/* Consultation type row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-6 md:mb-8">
            <div className="flex items-center gap-2 md:gap-2.5">
              <TypeIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-xs md:text-sm text-foreground truncate">
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-2.5">
              <PlatformIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-xs md:text-sm text-foreground truncate">
                {config.platformLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-6" />

          {/* Reason for Visit */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Stethoscope className="w-4 h-4" color="#6C6C6C" />
              <span className="text-sm font-semibold text-foreground">
                Reason for Visit
              </span>
            </div>
            <div className="ml-0 md:ml-6 rounded-lg border border-border bg-[#F7F7F7] overflow-hidden">
              <ReactQuill
                value={appointment.reason_for_visit || "No reason provided"}
                readOnly
                theme="bubble"
                modules={{ toolbar: false }}
              />
            </div>
          </div>

          {/* Instructions — dynamic per consultation type */}
          <div className={rescheduleHistory.length > 0 ? "mb-6" : ""}>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Info className="w-4 h-4" color="#6C6C6C" />
              <span className="text-sm font-semibold text-foreground">
                Instructions
              </span>
            </div>
            <ul className="space-y-2 ml-0 md:ml-6">
              {config.instructions.map((instruction, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>

          {rescheduleHistory.length > 0 && (
            <div className="border-t border-border pt-5 md:pt-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-4 h-4" color="#6C6C6C" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Reschedule History
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {rescheduleHistory.length} previous{" "}
                    {rescheduleHistory.length === 1 ? "slot" : "slots"} in this
                    appointment thread
                  </p>
                </div>
              </div>

              <div className="ml-0 md:ml-6">
                {rescheduleHistory.map((history, index) => {
                  const historyDate = formatZonedDate(
                    history.scheduled_start_at_utc,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                    undefined,
                    userTimezone,
                  );
                  const historyTime = formatZonedTimeRange(
                    history.scheduled_start_at_utc,
                    history.scheduled_end_at_utc,
                    { timeZone: userTimezone },
                  );
                  const changedAt = formatZonedDate(
                    history.updatedAt || history.createdAt,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                    undefined,
                    userTimezone,
                  );
                  const isLast = index === rescheduleHistory.length - 1;

                  return (
                    <article key={history._id} className="relative flex gap-3">
                      <div className="flex w-8 shrink-0 flex-col items-center">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DDD6FE] bg-[#EDE9FE] text-[#7C3AED]">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </span>
                        {!isLast && <span className="w-px flex-1 bg-border" />}
                      </div>

                      <div className="min-w-0 flex-1 pb-5">
                        <div className="rounded-xl border border-border bg-background p-3 md:p-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                Appointment was rescheduled
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                Previous ref: {history.appointment_number}
                              </p>
                            </div>
                            <AppointmentStatusBadge status={history.status} />
                          </div>

                          <div className="mt-3 flex flex-col gap-2 text-sm text-foreground sm:flex-row sm:items-center sm:gap-5">
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Calendar className="h-4 w-4 shrink-0 text-[#6C6C6C]" />
                              <span className="truncate">{historyDate}</span>
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Clock className="h-4 w-4 shrink-0 text-[#6C6C6C]" />
                              <span className="truncate">{historyTime}</span>
                            </span>
                          </div>

                          {(history.reason_for_visit ||
                            history.cancelled_reason) && (
                            <div className="mt-3 space-y-1 border-l-2 border-[#DDD6FE] pl-3 text-xs">
                              {history.reason_for_visit && (
                                <p className="text-muted-foreground">
                                  Reason:{" "}
                                  <span className="text-foreground">
                                    {history.reason_for_visit}
                                  </span>
                                </p>
                              )}
                              {history.cancelled_reason && (
                                <p className="text-muted-foreground">
                                  Note:{" "}
                                  <span className="text-foreground">
                                    {history.cancelled_reason}
                                  </span>
                                </p>
                              )}
                            </div>
                          )}

                          <p className="mt-3 text-xs text-muted-foreground">
                            Updated {changedAt}
                            {history.cancelled_by
                              ? ` by ${history.cancelled_by}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions panel */}
        <div>
          <div className="bg-card rounded-xl border border-border p-5 sticky top-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#727171]">Actions</h3>
              <AppointmentStatusBadge status={appointment.status} />
            </div>
            <div className="space-y-3 flex flex-col">
              <Button
                size="default"
                className="gap-2 rounded-[12px] h-12"
                onClick={handleJoin}
                disabled={
                  showVideo ||
                  scheduledTimeError ||
                  (appointment.status !== "CONFIRMED" &&
                    appointment.status !== "ACTIVE")
                }
              >
                {showVideo && videoSessionQuery.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ActionIcon className="w-4 h-4" />
                )}
                {showVideo ? "In Call" : config.actionLabel}
              </Button>
              {!["FAILED", "RESCHEDULED", "CANCELED"].includes(
                appointment.status,
              ) && (
                <Button
                  size="default"
                  className="gap-2 rounded-[12px] h-12"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateParams({ step: "1", appointmentId: appointment._id });
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Reschedule
                </Button>
              )}

              <Button
                variant="destructive"
                size="default"
                className="rounded-[12px] h-12 bg-[#FFECEB] text-[#D92D20] hover:text-white"
                onClick={() => setCancelDialogOpen(true)}
                disabled={
                  appointment.status === "CANCELED" ||
                  appointment.status === "COMPLETED" ||
                  appointment.status === "RESCHEDULED"
                }
              >
                {appointment.status === "CANCELED"
                  ? "Appointment Cancelled"
                  : appointment.status === "RESCHEDULED"
                    ? "Appointment Rescheduled"
                    : "Cancel Appointment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Textarea
              placeholder="Please provide a reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
              }}
              className="rounded-[12px]"
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              className="rounded-[12px] bg-[#D92D20] hover:bg-[#B42318]"
            >
              {cancelMutation.isPending
                ? "Cancelling..."
                : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentDetails;
