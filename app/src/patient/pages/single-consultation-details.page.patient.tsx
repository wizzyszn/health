import { MoveLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAConsultation,
  getGroupedMedicationsForConsultationsReq,
  getInvestigationsForConsultationReq,
  getPatientProfileReq,
  listReferralsForPatientConsultationReq,
  uploadInvestigationResultImageReq,
} from "@/config/service/patient.service";
import { formatZonedDate, formatZonedTimeRange } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CONSULTATION_CONFIG,
  type ConsultationType,
  type GroupedMedicationItem,
  type ReferralItem,
} from "@/patient/components/consultation-details/consultation-detail.types.patient";
import { ConsultationDoctorCard } from "@/patient/components/consultation-details/consultation-doctor-card.component.patient";
import { ConsultationActionCenter } from "@/patient/components/consultation-details/consultation-action-center.component.patient";
import { ConsultationInvestigationTab } from "@/patient/components/consultation-details/consultation-investigation-tab.component.patient";
import { ConsultationMedicationTab } from "@/patient/components/consultation-details/consultation-medication-tab.component.patient";
import { ConsultationReferralsTab } from "@/patient/components/consultation-details/consultation-referrals-tab.component.patient";
import { generateConsultationInvestigationPdf } from "@/patient/components/consultation-details/generate-consultation-investigation-pdf.patient";
import { generateConsultationMedicationPdf } from "@/patient/components/consultation-details/generate-consultation-medication-pdf.patient";
import { generateReferralLetterPdf } from "@/patient/components/referral/generate-referral-letter-pdf.patient";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { PatientConsultationDetailSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

function ViewConsultationDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const consultationId = params.id ?? "";
  const queryClient = useQueryClient();
  const tabsSectionRef = useRef<HTMLDivElement>(null);
  const [uploadingInvestigationId, setUploadingInvestigationId] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState<
    "investigation" | "medication" | "referrals"
  >("investigation");
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["consultation", consultationId],
    queryFn: () => getAConsultation(consultationId),
    enabled: !!consultationId,
  });

  const {
    data: referralsData,
    isLoading: isReferralsLoading,
    isError: isReferralsError,
  } = useQuery({
    queryKey: ["consultation-referrals", consultationId],
    queryFn: () => listReferralsForPatientConsultationReq(consultationId),
    enabled: !!consultationId,
  });

  const {
    data: groupedMedicationData,
    isLoading: isGroupedMedicationLoading,
    isError: isGroupedMedicationError,
  } = useQuery({
    queryKey: ["consultation-grouped-medications", consultationId],
    queryFn: () => getGroupedMedicationsForConsultationsReq(consultationId),
    enabled: !!consultationId,
  });

  const {
    data: investigationsData,
    isLoading: isInvestigationsLoading,
    isError: isInvestigationsError,
  } = useQuery({
    queryKey: ["consultation-investigations", consultationId],
    queryFn: () => getInvestigationsForConsultationReq(consultationId),
    enabled: !!consultationId,
  });

  const { data: profileData } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: () => getPatientProfileReq(),
  });

  if (isLoading) {
    return <PatientConsultationDetailSkeleton />;
  }

  if (isError || !data?.data) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">
          Failed to load consultation details.
        </p>
      </div>
    );
  }

  const consultation = data.data;
  const startDate = new Date(
    consultation.appointment_id?.scheduled_start_at_utc ||
      consultation.createdAt,
  );
  const endDate =
    consultation.appointment_id?.scheduled_end_at_utc || consultation.createdAt;
  const displayDate = formatZonedDate(
    startDate,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
    undefined,
    userTimezone,
  );
  const displayTime = formatZonedTimeRange(startDate, endDate, {
    timeZone: userTimezone,
  });

  const consultationType = (consultation.type as ConsultationType) || "VIDEO";
  const config = CONSULTATION_CONFIG[consultationType];
  const referrals = referralsData?.data ?? [];
  const medicationGroups = groupedMedicationData?.data?.groups ?? [];
  const investigationSummary = investigationsData?.data;
  const investigationItems = investigationSummary?.investigations ?? [];
  const profile = profileData?.data;

  const pendingInvestigationCount = investigationItems.filter(
    (item) => (item.result_images ?? []).length === 0,
  ).length;
  const medicationCount = medicationGroups.reduce(
    (total, group) => total + group.count,
    0,
  );

  const openTabAndScroll = (
    tab: "investigation" | "medication" | "referrals",
  ) => {
    setActiveTab(tab);
    tabsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleInvestigationUpload = async (
    investigationId: string,
    files: File[],
  ) => {
    try {
      setUploadingInvestigationId(investigationId);
      await uploadInvestigationResultImageReq(investigationId, files);
      toast.success("Investigation result uploaded successfully.");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["consultation-investigations", consultationId],
        }),
        queryClient.invalidateQueries({ queryKey: ["patient-investigations"] }),
      ]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload investigation result.");
    } finally {
      setUploadingInvestigationId(null);
    }
  };

  const handleDownloadInvestigationRequest = () => {
    try {
      if (!investigationItems.length) return;
      generateConsultationInvestigationPdf(
        consultationId,
        investigationItems,
        {
          _id: consultationId,
          doctor_id: consultation.doctor_id,
          appointment_id: consultation.appointment_id,
        },
        profile,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to download investigation request.");
    }
  };

  const handleDownloadMedicationPDF = (med: GroupedMedicationItem) => {
    try {
      generateConsultationMedicationPdf(
        consultationId,
        med,
        consultation,
        profile,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to download medication prescription.");
    }
  };

  const handleDownloadReferralPDF = (referral: ReferralItem) => {
    try {
      generateReferralLetterPdf(
        {
          _id: referral._id,
          specialist_name: referral.specialist_name,
          hospital: referral.hospital,
          referral_details: referral.referral_details,
          referred_doctor_name: referral.referred_doctor_name,
          createdAt: referral.createdAt,
          doctor_id: referral.doctor_id,
          consultation_id: {
            _id: consultation._id,
            title: consultation.title,
            appointment_id: consultation.appointment_id,
          },
        },
        profile,
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to download referral letter.");
    }
  };

  return (
    <>
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-5 group"
        >
          <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
        <h1 className="text-xl md:text-xl font-semibold ">
          Consultation Details
        </h1>
        <p className="text-xs text-[#6C6C6C] mt-1">
          Reference ID:{" "}
          {consultation.appointment_id?.appointment_number ||
            consultation.consultation_id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        <ConsultationDoctorCard
          doctorFirstName={consultation.doctor_id?.first_name}
          doctorFullName={consultation.doctor_id?.full_name}
          doctorSpecializations={consultation.doctor_id?.specializations}
          appointmentReasonForVisit={
            consultation.appointment_id?.reason_for_visit
          }
          displayDate={displayDate}
          displayTime={displayTime}
          TypeIcon={config.icon}
          typeLabel={config.label}
          PlatformIcon={config.platformIcon}
          platformLabel={config.platformLabel}
        />

        <div>
          <ConsultationActionCenter
            medicationCount={medicationCount}
            investigationCount={investigationItems.length}
            pendingInvestigationCount={pendingInvestigationCount}
            referralCount={referrals.length}
            isLoading={
              isGroupedMedicationLoading ||
              isInvestigationsLoading ||
              isReferralsLoading
            }
            onOpenMedication={() => openTabAndScroll("medication")}
            onOpenInvestigation={() => openTabAndScroll("investigation")}
            onOpenReferral={() => openTabAndScroll("referrals")}
          />
        </div>
      </div>

      <div
        ref={tabsSectionRef}
        className="w-full rounded-xl bg-white shadow-sm border border-border mt-4 md:mt-6"
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "investigation" | "medication" | "referrals")
          }
        >
          <div className="flex items-center justify-between px-2 md:px-4">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0 overflow-x-auto custom-scrollbar">
              <TabsTrigger
                value="investigation"
                className="rounded-none border-b-[3px] border-transparent px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
              >
                Investigation
              </TabsTrigger>
              <TabsTrigger
                value="medication"
                className="rounded-none border-b-[3px] border-transparent px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
              >
                Medication
              </TabsTrigger>
              <TabsTrigger
                value="referrals"
                className="rounded-none border-b-[3px] border-transparent px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
              >
                Referrals
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="py-2 md:py-[12px] px-3 md:px-[16px]">
            <TabsContent value="investigation" className="mt-0">
              <ConsultationInvestigationTab
                isLoading={isInvestigationsLoading}
                isError={isInvestigationsError}
                investigationItems={investigationItems}
                investigationSummary={investigationSummary}
                uploadingInvestigationId={uploadingInvestigationId}
                onUpload={handleInvestigationUpload}
                onDownloadRequest={handleDownloadInvestigationRequest}
              />
            </TabsContent>

            <TabsContent value="medication" className="mt-0">
              <ConsultationMedicationTab
                isLoading={isGroupedMedicationLoading}
                isError={isGroupedMedicationError}
                medicationGroups={medicationGroups}
                onDownloadPdf={handleDownloadMedicationPDF}
              />
            </TabsContent>

            <TabsContent value="referrals" className="mt-0">
              <ConsultationReferralsTab
                isLoading={isReferralsLoading}
                isError={isReferralsError}
                referrals={referrals}
                onDownloadPdf={handleDownloadReferralPDF}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}

export default ViewConsultationDetails;
