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
  MoveLeft,
  RefreshCw,
  // CheckCircle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSingleDoctorAppointmentReq,
  cancelDoctorAppointmentReq,
  rescheduleDoctorAppointmentReq,
} from "@/config/service/doctor.service";
import { fetchDoctorVideoSession } from "@/config/service/video-consultation.service";
import { toast } from "sonner";
import type { RejectedPayload } from "@/lib/types";
import {
  formatLocalDateTime,
  formatZonedDate,
  formatZonedTimeRange,
  getBrowserTimeZone,
  isScheduledTimeError,
  extractScheduledTimeFromError,
  formatScheduledTimeMessage,
  getApiErrorMessage,
} from "@/lib/utils";
import {
  isJoinWindowEnded,
  isOutsideJoinWindow,
} from "@/shared/utils/video-session-errors.util";
import {
  getBookingComplaintDetails,
  getBookingReasonForAppointment,
} from "@/shared/utils/appointment-booking-fields.util";
import { parse, format } from "date-fns";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AppointmentStatusBadge } from "../components/appointment-status-badge.component.doctor";
import type { AppointmentStatus } from "../types/consultation.types";
import { AppointmentDetailSkeleton } from "@/shared/components/appointment-detail-skeleton.component.shared";
import SEO from "@/shared/components/seo.component";
import { displayMrn } from "@/lib/mrn";

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
      "Have the patient's records open and ready for reference",
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
      "Have the patient's history and records ready",
      "Keep a pen and paper handy for any notes",
      "Confirm the patient's identity before proceeding",
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
      "Review the patient's history before starting the chat",
      "Ask clarifying questions about symptoms",
      "Request photos of visible symptoms if applicable",
      "Provide clear written instructions for follow-up",
    ],
  },
  MEETADOCTOR: {
    label: "Meet a Doctor",
    icon: UserRound,
    platformLabel: "In-Person Visit",
    platformIcon: MapPin,
    actionLabel: "View Location",
    actionIcon: MapPin,
    instructions: [
      "Prepare examination room before the patient arrives",
      "Review the patient's history and previous records",
      "Ensure all necessary equipment is sterilised and ready",
      "Have referral and prescription forms available",
    ],
  },
  HOMESERVICE: {
    label: "Home Service",
    icon: Home,
    platformLabel: "Home Visit",
    platformIcon: Home,
    actionLabel: "View Address",
    actionIcon: Home,
    instructions: [
      "Confirm the patient's home address before departure",
      "Pack all necessary examination equipment",
      "Carry prescription pads and referral forms",
      "Contact the patient if you will be delayed",
    ],
  },
};

const DURATION_OPTIONS: { label: string; value: 15 | 30 | 45 | 60 }[] = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "60 minutes", value: 60 },
];

// ─── Component ──────────────────────────────────────────────────────────────

function DoctorAppointmentDetails() {
  const params = useParams();
  const queryClient = useQueryClient();
  const appointmentId = params.id ?? "";
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState<
    15 | 30 | 45 | 60
  >(30);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor-appointment", appointmentId],
    queryFn: () => getSingleDoctorAppointmentReq(appointmentId),
    enabled: !!appointmentId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["doctor-appointment", appointmentId],
    });
    queryClient.invalidateQueries({ queryKey: ["schedules"] });
    refetch();
  };

  const navigate = useNavigate();

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelDoctorAppointmentReq(appointmentId, { reason: cancelReason }),
    onSuccess: (response) => {
      toast.success(
        response.response_description || "Appointment cancelled successfully.",
      );
      invalidate();
      setCancelDialogOpen(false);
      setCancelReason("");
    },
    onError: (error: RejectedPayload) => {
      toast.warning(error.message || "Failed to cancel appointment.");
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      const timeZone = getBrowserTimeZone();
      const naiveStart = parse(
        `${rescheduleDate} ${rescheduleTime}`,
        "yyyy-MM-dd HH:mm",
        new Date(),
      );

      return rescheduleDoctorAppointmentReq(appointmentId, {
        scheduled_start_local: formatLocalDateTime(naiveStart),
        timezone: timeZone,
        requested_duration_minutes: rescheduleDuration,
      });
    },
    onSuccess: (response) => {
      toast.success(
        response.response_description ||
          "Appointment rescheduled successfully.",
      );
      invalidate();
      setRescheduleDialogOpen(false);
      setRescheduleDate("");
      setRescheduleTime("");
      setRescheduleDuration(30);
    },
    onError: (error: RejectedPayload) => {
      toast.warning(error.message || "Failed to reschedule appointment.");
    },
  });

  const handleJoinMutation = useMutation({
    // Cache-aware fetch: the consultation space reads the same key, so the
    // token endpoint is hit exactly once per join (spec §3).
    mutationFn: () => fetchDoctorVideoSession(queryClient, appointmentId),
    onSuccess: (res) => {
      const consultationIdValue = res.data?.consultationId;
      if (consultationIdValue) {
        navigate(
          `/doctor/dashboard/consultations/${consultationIdValue}?join=1&appointmentId=${appointmentId}`,
        );
      } else {
        toast.warning("Could not retrieve consultation ID for this session.");
      }
    },
    onError: (error: RejectedPayload) => {
      // Window ENDED — nothing to wait for; show the backend's own patient/
      // doctor-facing copy instead of "starts at …" (spec §5/§6: these 400
      // descriptions are written to be shown as-is).
      if (isJoinWindowEnded(error)) {
        toast.warning(
          getApiErrorMessage(
            error,
            "This appointment window has already ended.",
          ),
        );
        return;
      }
      // Too EARLY — tell the doctor when the appointment starts. Do not quote
      // the join window's lead time: doctors read it as "the call starts then"
      // and turn up expecting the patient to already be there.
      if (isOutsideJoinWindow(error) || isScheduledTimeError(error)) {
        const scheduledTime = extractScheduledTimeFromError(error);
        const timeMessage = scheduledTime
          ? formatScheduledTimeMessage(scheduledTime)
          : null;
        toast.warning(
          timeMessage
            ? `This appointment starts at ${timeMessage}.`
            : "This session isn't open yet. Please try again at the scheduled start time.",
        );
        return;
      }
      toast.error(getApiErrorMessage(error, "Failed to start video session."));
    },
  });

  // ─── Loading / Error states ─────────────────────────────────────────

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
    {
      timeZone: userTimezone,
    },
  );

  const handleJoin = () => {
    if (!canJoin) return;
    handleJoinMutation.mutate();
  };

  const patient = appointment.patient_id as {
    full_name?: string;
    mrn?: string;
    profile_picture_url?: string;
  };
  const patientName =
    patient?.full_name ||
    (appointment.booking_profile_snapshot
      ? `${appointment.booking_profile_snapshot.first_name} ${appointment.booking_profile_snapshot.last_name}`
      : "Patient");
  const profilePictureUrl =
    patient?.profile_picture_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${appointment.booking_profile_snapshot?.first_name || "Patient"}`;

  const consultationType =
    (appointment.consultation_id?.type as ConsultationType) || "VIDEO";
  const config = CONSULTATION_CONFIG[consultationType];
  const TypeIcon = config.icon;
  const PlatformIcon = config.platformIcon;
  const ActionIcon = config.actionIcon;

  // ─── Button state logic ─────────────────────────────────────────────

  const appointmentStatus = appointment.status;

  const isAppointmentCancelled = appointmentStatus === "CANCELED";
  const isCompleted = appointmentStatus === "COMPLETED";
  const isRescheduled = appointmentStatus === "RESCHEDULED";

  const canJoin =
    appointmentStatus === "CONFIRMED" || appointmentStatus === "ACTIVE";

  const isTerminal = isAppointmentCancelled || isCompleted;

  const canReschedule =
    !isTerminal && !isRescheduled && rescheduleDate && rescheduleTime;
  const rescheduleHistory = [...(appointment.rescheduled_history ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const reasonForAppointment = getBookingReasonForAppointment(appointment);
  const complaintDetails = getBookingComplaintDetails(appointment);

  return (
    <>
      <SEO
        title="Appointment Details"
        description="View appointment details and manage patient consultations on Carelexa."
        canonicalPath="/doctor/dashboard/appointments/:id"
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
        <h1 className="text-base sm:text-xl font-semibold tracking-tight">
          Appointment Details
        </h1>
        <p className="text-xs text-[#6C6C6C] mt-1">
          Reference ID: {appointment.appointment_number}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        {/* Main content card */}
        <div className="bg-card rounded-[20px] border border-border p-4 md:p-6 min-w-0">
          {/* Patient info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-5 md:mb-6 p-4 bg-[#F7F7F7] rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={profilePictureUrl}
                alt={patientName}
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                {patientName}
              </p>
              <p className="text-xs text-[#828282]">
                MRN: {displayMrn(patient?.mrn)}
              </p>
              <p className="text-xs text-[#828282]">
                {appointment.booking_profile_snapshot?.occupation || "Patient"}
              </p>
            </div>
          </div>

          {/* Date & Time row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 mb-4 md:mb-5">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm text-foreground">{displayDate}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm text-foreground">{displayTime}</span>
            </div>
          </div>

          {/* Consultation type row */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 mb-6 md:mb-8">
            <div className="flex items-center gap-2.5">
              <TypeIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm text-foreground">{config.label}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <PlatformIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm text-foreground">
                {config.platformLabel}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border mb-5 md:mb-6" />

          {/* Patient snapshot details */}
          {appointment.booking_profile_snapshot && (
            <div className="mb-5 md:mb-6">
              <div className="flex items-center gap-2 mb-3">
                <UserRound className="w-4 h-4 shrink-0" color="#6C6C6C" />
                <span className="text-sm font-semibold text-foreground">
                  Patient Information
                </span>
              </div>
              <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Gender:</span>{" "}
                  <span className="text-foreground capitalize">
                    {appointment.booking_profile_snapshot.gender || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">DOB:</span>{" "}
                  <span className="text-foreground">
                    {appointment.booking_profile_snapshot.date_of_birth
                      ? new Date(
                          appointment.booking_profile_snapshot.date_of_birth,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Marital Status:</span>{" "}
                  <span className="text-foreground capitalize">
                    {appointment.booking_profile_snapshot.marital_status || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Occupation:</span>{" "}
                  <span className="text-foreground">
                    {appointment.booking_profile_snapshot.occupation || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border mb-5 md:mb-6" />

          {/* Reason for Appointment (visit) */}
          <div className="mb-5 md:mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm font-semibold text-foreground">
                Reason for Appointment (visit)
              </span>
            </div>
            <div className="ml-6 rounded-lg border border-border bg-[#F7F7F7] px-3 py-2">
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {reasonForAppointment || "No reason provided"}
              </p>
            </div>
          </div>

          {/* Complaint Details */}
          {complaintDetails && (
            <div className="mb-5 md:mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 shrink-0" color="#6C6C6C" />
                <span className="text-sm font-semibold text-foreground">
                  Complaint Details
                </span>
              </div>
              <div className="ml-6 rounded-lg border border-border bg-[#F7F7F7] px-3 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {complaintDetails}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className={rescheduleHistory.length > 0 ? "mb-6" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 shrink-0" color="#6C6C6C" />
              <span className="text-sm font-semibold text-foreground">
                Instructions
              </span>
            </div>
            <ul className="space-y-2 ml-6">
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
                  const historyReason = getBookingReasonForAppointment(history);

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
                            <AppointmentStatusBadge
                              status={history.status as AppointmentStatus}
                            />
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

                          {(historyReason || history.cancelled_reason) && (
                            <div className="mt-3 space-y-1 border-l-2 border-[#DDD6FE] pl-3 text-xs">
                              {historyReason && (
                                <p className="text-muted-foreground">
                                  Reason:{" "}
                                  <span className="text-foreground">
                                    {historyReason}
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
        <div className="mt-4 md:mt-0">
          <div className="bg-card rounded-xl border border-border p-4 md:p-5 sticky top-4 md:top-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#727171]">Actions</h3>
              <AppointmentStatusBadge
                status={appointmentStatus as AppointmentStatus}
              />
            </div>

            <div className="space-y-3 flex flex-col">
              {/* Join */}
              <Button
                size="default"
                className="gap-2 rounded-[12px] h-12"
                onClick={handleJoin}
                disabled={!canJoin || handleJoinMutation.isPending}
              >
                <ActionIcon className="w-4 h-4" />
                {handleJoinMutation.isPending
                  ? "Starting..."
                  : config.actionLabel}
              </Button>

              {/* Cancel */}
              <Button
                variant="destructive"
                size="default"
                className="rounded-[12px] h-12 bg-[#FFECEB] text-[#D92D20] hover:text-white"
                onClick={() => setCancelDialogOpen(true)}
                disabled={isTerminal || isRescheduled}
              >
                {isAppointmentCancelled
                  ? "Appointment Cancelled"
                  : isRescheduled
                    ? "Appointment Rescheduled"
                    : "Cancel Appointment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel Dialog ── */}
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

      {/* ── Reschedule Dialog ── */}
      <Dialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date, time and duration for this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                aria-label="Reschedule Date"
                min={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-time">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRescheduleDuration(opt.value)}
                    className={`rounded-[10px] border py-2 text-sm font-medium transition-colors ${
                      rescheduleDuration === opt.value
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-[#F7F7F7] text-foreground hover:border-primary"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setRescheduleDialogOpen(false);
                setRescheduleDate("");
                setRescheduleTime("");
                setRescheduleDuration(30);
              }}
              className="rounded-[12px]"
            >
              Go Back
            </Button>
            <Button
              onClick={() => rescheduleMutation.mutate()}
              disabled={!canReschedule || rescheduleMutation.isPending}
              className="rounded-[12px]"
            >
              {rescheduleMutation.isPending
                ? "Rescheduling..."
                : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DoctorAppointmentDetails;
