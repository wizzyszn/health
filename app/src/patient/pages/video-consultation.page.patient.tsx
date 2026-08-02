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

function VideoConsultationPagePatient() {
  const { id: appointmentId = "" } = useParams();
  const navigate = useNavigate();
  const patientState = useSelector(
    (state: RootState) => state.auth.user,
  ) as Patient | null;

  const patientName = patientState?.user
    ? `${patientState.user.first_name} ${patientState.user.last_name}`
    : "Patient";

  const sessionQuery = useQuery({
    queryKey: ["patient-video-session", appointmentId],
    queryFn: () => getPatientVideoSessionReq(appointmentId),
    enabled: Boolean(appointmentId),
    retry: 1,
  });

  const handleExit = () => {
    navigate(`/patient/dashboard/appointments/${appointmentId}`, {
      replace: true,
    });
  };

  const videoErrorMessage = getApiErrorMessage(
    sessionQuery.error,
    "Unable to load the video session.",
  );
  const isWaitingForDoctor =
    videoErrorMessage ===
      "Doctor hasn't opened the session yet. Please wait." ||
    videoErrorMessage.includes("opened the session");

  return (
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
      />
    </div>
  );
}

export default VideoConsultationPagePatient;
