import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPatientVideoSessionReq } from "@/config/service/video-consultation.service";
import { RootState } from "@/config/stores/store";
import type { Patient } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { VideoCall } from "@/shared/components/video-call.component";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { isRoomNotOpenYet } from "@/shared/utils/video-session-errors.util";
import SEO from "@/shared/components/seo.component";

function VideoConsultationPagePatient() {
  const { id: appointmentId = "" } = useParams();
  const navigate = useNavigate();
  const patientState = useSelector(
    (state: RootState) => state.auth.user,
  ) as Patient | null;

  const patientName = patientState?.user
    ? `${patientState.user.first_name} ${patientState.user.last_name}`
    : "Patient";

  // Spec §4: never poll the token endpoint. Retry ONLY the rare
  // room-not-open-yet 400 while the doctor's create-room request may still
  // be in flight — then stop and wait for user action / notification.
  const sessionQuery = useQuery({
    queryKey: ["patient-video-session", appointmentId],
    queryFn: () => getPatientVideoSessionReq(appointmentId),
    enabled: Boolean(appointmentId),
    retry: (failureCount: number, error: unknown) =>
      failureCount < 3 && isRoomNotOpenYet(error),
    retryDelay: (attempt: number) => Math.min(1500 * 2 ** attempt, 5000),
    staleTime: 60_000,
  });

  // Spec: ending the call does NOT complete the consultation — the doctor
  // still writes it up. Set expectations instead of dropping the patient
  // back with no status (gap: post-call continuity).
  const handleExit = () => {
    toast.success(
      "You've left the consultation. Your doctor will finalize the visit notes shortly.",
    );
    navigate(`/patient/dashboard/appointments/${appointmentId}`, {
      replace: true,
    });
  };

  const videoErrorMessage = getApiErrorMessage(
    sessionQuery.error,
    "Unable to load the video session.",
  );
  const isWaitingForDoctor = isRoomNotOpenYet(sessionQuery.error);

  return (
    <>
      <SEO
        title="Video Consultation"
        description="Join your live video consultation with your doctor on Carelexa."
        canonicalPath="/patient/dashboard/appointments/:id/video"
      />
      <div className="flex h-full flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Video Consultation
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Join your Daily room securely without leaving the app.
            </p>
          </div>
          <Button variant="outline" onClick={handleExit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointment
          </Button>
        </div>

        <VideoCall
          session={sessionQuery.data?.data}
          displayName={patientName}
          role="patient"
          appointmentId={appointmentId}
          onLeave={handleExit}
          isUnavailable={isWaitingForDoctor}
          isLoading={sessionQuery.isLoading}
          isError={
            sessionQuery.isError ||
            (!sessionQuery.isLoading && !sessionQuery.data?.data)
          }
          errorMessage={videoErrorMessage}
          onRetry={() => void sessionQuery.refetch()}
          onSessionStale={() => void sessionQuery.refetch()}
        />
      </div>
    </>
  );
}

export default VideoConsultationPagePatient;
