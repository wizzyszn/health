import { useEffect } from "react";
import { PatientDataSidebar } from "../components/patient-data-sidebar.component.doctor";
import { ConsultationMainContent } from "../components/consultation-space-main-content.component.doctor";
import { ConsultationOrdersDrawer } from "../components/consultation-orders-drawer.component.doctor";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserRound, MoveLeft, VideoOff, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { Doctor } from "@/lib/types";
import {
  getConsultationSpaceDetailsReq,
  getDoctorProfileReq,
} from "@/config/service/doctor.service";
import {
  DOCTOR_VIDEO_SESSION_QUERY_KEY,
  getDoctorVideoSessionReq,
} from "@/config/service/video-consultation.service";
import { shouldRetryTokenFetch } from "@/shared/utils/video-session-errors.util";
import { VideoCall } from "@/shared/components/video-call.component";
import { getApiErrorMessage } from "@/lib/utils";
import SEO from "@/shared/components/seo.component";

// "locked"   → patient route, doctor is NOT assigned (full page locked/blank)
// "addendum" → patient route, doctor IS assigned (only addendum section editable)
// "edit"     → normal flow, consultation not yet completed (full edit access)
// "preview"  → normal flow, completed + doctor is not the owner (read-only view)
export type ConsultationMode = "edit" | "addendum" | "preview" | "locked";

function ConsultationSpace() {
  const param = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const consultationId = param.id ?? "";
  const appointmentId = searchParams.get("appointmentId") ?? "";
  const shouldJoinVideo = searchParams.get("join") === "1";
  const isInCallIntent = shouldJoinVideo;

  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Doctor>;

  const { data, isLoading } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => getConsultationSpaceDetailsReq(consultationId),
    enabled: !!consultationId,
  });

  const { data: profileData } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: getDoctorProfileReq,
  });
  const startTimeUtc = data?.data.appointment_id.scheduled_start_at_utc;
  const endTimeUtc = data?.data.appointment_id.scheduled_end_at_utc;
  const currentTimeUtc = new Date().toISOString();
  const tenminsBeforeStartTimeUtc = startTimeUtc
    ? new Date(new Date(startTimeUtc).getTime() - 10 * 60 * 1000).toISOString()
    : null;
  // const isBeforeStartTime = startTimeUtc && currentTimeUtc < startTimeUtc;
  const isAfterEndTime = endTimeUtc && currentTimeUtc > endTimeUtc;
  const isWithinAppointmentWindow =
    !!tenminsBeforeStartTimeUtc &&
    currentTimeUtc >= tenminsBeforeStartTimeUtc &&
    !isAfterEndTime;
  const consultationDetails = data?.data;

  const doctorId = profileData?.data?._id ?? user?.doctor?._id;

  const assignedDoctorId = consultationDetails?.doctor_id;

  const isAssignedDoctor = !!doctorId && assignedDoctorId === doctorId;
  const isCompleted = consultationDetails?.status === "COMPLETED";
  const isVideoConsultation = consultationDetails?.type === "VIDEO";
  const doctorDisplayName = profileData?.data
    ? `${profileData.data.first_name} ${profileData.data.last_name}`
    : user?.doctor
      ? `${user.doctor.first_name} ${user.doctor.last_name}`
      : "Doctor";

  const videoSessionQuery = useQuery({
    // Shared key with the join mutation (appointment detail) so the token
    // endpoint fires once per appointment — spec §3.
    queryKey: [DOCTOR_VIDEO_SESSION_QUERY_KEY, appointmentId],
    queryFn: () => getDoctorVideoSessionReq(appointmentId),
    enabled: Boolean(appointmentId) && shouldJoinVideo && isVideoConsultation,
    // Only the room-not-open 400 is transient; never retry window/auth/403.
    retry: (failureCount: number, error: unknown) =>
      failureCount < 2 && shouldRetryTokenFetch(error),
    staleTime: 60_000,
  });

  // Join state lives in the URL (?join=1) so a page refresh mid-call
  // restores the frame, and leaving/rejoining is just a param flip.
  const hasLeftCall = shouldJoinVideo && !isInCallIntent;

  /** Enter (or re-enter) the call: refetch a fresh token, then set ?join=1. */
  const joinCall = () => {
    void videoSessionQuery.refetch();
    const next = new URLSearchParams(searchParams);
    next.set("join", "1");
    setSearchParams(next, { replace: true });
  };

  /** Leave: strip ?join=1 so the space returns to charting view. */
  const leaveCall = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("join");
    setSearchParams(next, { replace: true });
  };
  // Auto-leave the call when the appointment window closes.
  // A setTimeout fires at the exact moment the window ends, pulling the
  // doctor back to the charting view. Cleanup cancels the timer if the
  // component unmounts or dependencies change first.
  useEffect(() => {
    if (!shouldJoinVideo || !endTimeUtc) return;

    const endTimeMs = new Date(endTimeUtc).getTime();
    const msUntilEnd = endTimeMs - Date.now();

    if (msUntilEnd <= 0) {
      // Window already closed — leave immediately.
      leaveCall();
      return;
    }

    const timer = setTimeout(() => leaveCall(), msUntilEnd);
    return () => clearTimeout(timer);
  }, [shouldJoinVideo, endTimeUtc]);

  const videoErrorMessage = getApiErrorMessage(
    videoSessionQuery.error,
    "Unable to load the video session.",
  );

  const consultationMode: ConsultationMode = (() => {
    if (!isAssignedDoctor && isCompleted) {
      return "preview";
    }
    if (!isAssignedDoctor) {
      return "locked";
    }
    if (isCompleted) {
      return "addendum";
    }

    return "edit";
  })();

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100dvh-120px)] items-center justify-center">
        <p className="text-[#6B7280]">Loading consultation space...</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Consultation Space"
        description="Manage your consultation session including medications, investigations, and referrals on Carelexa."
        canonicalPath="/doctor/dashboard/consultations/:id"
      />
      <div className="flex flex-col h-[calc(100dvh-120px)]">
        {/* Title */}
        <div className="mb-4 sm:mb-6 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 group"
          >
            <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <h1 className="text-2xl font-semibold text-foreground">
              Consultation Details
            </h1>
            <div className="flex gap-2 items-center self-end sm:self-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <UserRound className="w-5 h-5 text-gray-500" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 sm:max-w-md w-full overflow-y-auto"
                >
                  <PatientDataSidebar patient={consultationDetails?.user_id} />
                </SheetContent>
              </Sheet>
              <ConsultationOrdersDrawer consultationId={consultationId} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-2 items-start flex-1 min-h-0">
          <div className="hidden lg:block col-span-1 sticky top-0 h-full overflow-y-auto">
            <PatientDataSidebar patient={consultationDetails?.user_id} />
          </div>

          <div className="col-span-1 lg:col-span-3 h-full min-h-0 flex flex-col gap-2">
            {isVideoConsultation &&
              (!shouldJoinVideo || hasLeftCall) &&
              isWithinAppointmentWindow && (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-gray-50 p-6 text-center">
                  <VideoOff className="h-7 w-7 text-gray-400" />
                  {hasLeftCall ? (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          You've left the consultation room
                        </p>
                        <p className="mt-1 max-w-[42ch] text-xs text-gray-500">
                          You can rejoin while the appointment window is open.
                          The patient may still be waiting inside.
                        </p>
                      </div>
                      <Button
                        onClick={joinCall}
                        disabled={videoSessionQuery.isFetching}
                      >
                        {videoSessionQuery.isFetching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preparing room…
                          </>
                        ) : (
                          "Rejoin call"
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          Video consultation ready
                        </p>
                        <p className="mt-1 max-w-[42ch] text-xs text-gray-500">
                          Start the video call with your patient.
                        </p>
                      </div>
                      <Button
                        onClick={joinCall}
                        disabled={videoSessionQuery.isFetching}
                      >
                        {videoSessionQuery.isFetching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preparing room…
                          </>
                        ) : (
                          "Join call"
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}

            {shouldJoinVideo && isVideoConsultation && !hasLeftCall && (
              <VideoCall
                session={videoSessionQuery.data?.data}
                displayName={doctorDisplayName}
                role="doctor"
                appointmentId={appointmentId}
                scheduledEndAtUtc={
                  consultationDetails?.appointment_id?.scheduled_end_at_utc ||
                  null
                }
                onLeave={leaveCall}
                isUnavailable={!appointmentId}
                isLoading={videoSessionQuery.isLoading}
                isError={
                  videoSessionQuery.isError ||
                  (!videoSessionQuery.isLoading &&
                    !videoSessionQuery.data?.data)
                }
                errorMessage={videoErrorMessage}
                onRetry={() => void videoSessionQuery.refetch()}
                onSessionStale={() => void videoSessionQuery.refetch()}
              />
            )}

            <div className="flex-1 shadow-sm overflow-hidden bg-white flex flex-col min-h-0">
              <ConsultationMainContent
                consultationId={consultationId}
                mode={consultationMode}
                patientId={
                  typeof consultationDetails?.user_id === "object"
                    ? (consultationDetails.user_id._id ??
                      consultationDetails.user_id.id)
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConsultationSpace;
