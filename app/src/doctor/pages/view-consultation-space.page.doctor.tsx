import { PatientDataSidebar } from "../components/patient-data-sidebar.component.doctor";
import { ConsultationMainContent } from "../components/consultation-space-main-content.component.doctor";
import { ConsultationOrdersDrawer } from "../components/consultation-orders-drawer.component.doctor";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserRound, MoveLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { Doctor } from "@/lib/types";
import {
  getConsultationSpaceDetailsReq,
  getDoctorProfileReq,
} from "@/config/service/doctor.service";
import { getDoctorVideoSessionReq } from "@/config/service/video-consultation.service";
import { VideoCall } from "@/shared/components/video-call.component";
import { getApiErrorMessage } from "@/lib/utils";

// "locked"   → patient route, doctor is NOT assigned (full page locked/blank)
// "addendum" → patient route, doctor IS assigned (only addendum section editable)
// "edit"     → normal flow, consultation not yet completed (full edit access)
// "preview"  → normal flow, completed + doctor is not the owner (read-only view)
export type ConsultationMode = "edit" | "addendum" | "preview" | "locked";

function ConsultationSpace() {
  const param = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const consultationId = param.id ?? "";
  const appointmentId = searchParams.get("appointmentId") ?? "";
  const shouldJoinVideo = searchParams.get("join") === "1";

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
    queryKey: ["doctor-video-session", appointmentId],
    queryFn: () => getDoctorVideoSessionReq(appointmentId),
    enabled: Boolean(appointmentId) && shouldJoinVideo && isVideoConsultation,
    retry: 1,
  });
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
                <PatientDataSidebar
                  patient={consultationDetails?.user_id}
                  consultationId={consultationId}
                />
              </SheetContent>
            </Sheet>
            <ConsultationOrdersDrawer consultationId={consultationId} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-2 items-start flex-1 min-h-0">
        <div className="hidden lg:block col-span-1 sticky top-0 h-full overflow-y-auto">
          <PatientDataSidebar
            patient={consultationDetails?.user_id}
            consultationId={consultationId}
          />
        </div>

        <div className="col-span-1 lg:col-span-3 h-full min-h-0 flex flex-col gap-2">
          {shouldJoinVideo && isVideoConsultation && (
            <VideoCall
              session={videoSessionQuery.data?.data}
              displayName={doctorDisplayName}
              role="doctor"
              appointmentId={appointmentId}
              scheduledEndAtUtc={
                consultationDetails?.appointment_id?.scheduled_end_at_utc ||
                null
              }
              onLeave={() => navigate(location.pathname, { replace: true })}
              isUnavailable={!appointmentId}
              isLoading={videoSessionQuery.isLoading}
              isError={
                videoSessionQuery.isError ||
                (!videoSessionQuery.isLoading && !videoSessionQuery.data?.data)
              }
              errorMessage={videoErrorMessage}
              onRetry={() => void videoSessionQuery.refetch()}
            />
          )}

          <div className="flex-1 shadow-sm overflow-hidden bg-white flex flex-col min-h-0">
            <ConsultationMainContent
              consultationId={consultationId}
              mode={consultationMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsultationSpace;
