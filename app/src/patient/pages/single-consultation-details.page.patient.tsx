import { MoveLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAConsultation,
  getConsultationSummaryReq,
  getGroupedMedicationsForConsultationsReq,
  getInvestigationsForConsultationReq,
  getPatientProfileReq,
  listReferralsForPatientConsultationReq,
  uploadInvestigationResultImageReq,
} from "@/config/service/patient.service";
import {
  formatZonedDate,
  formatZonedTimeRange,
  getApiErrorMessage,
} from "@/lib/utils";
import {
  getBookingComplaintDetails,
  getBookingReasonForAppointment,
} from "@/shared/utils/appointment-booking-fields.util";
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
import { ConsultationSummaryTab } from "@/patient/components/consultation-details/consultation-summary-tab.component.patient";
import { generateConsultationInvestigationPdf } from "@/patient/components/consultation-details/generate-consultation-investigation-pdf.patient";
import { generateConsultationMedicationPdf } from "@/patient/components/consultation-details/generate-consultation-medication-pdf.patient";
import { generateReferralLetterPdf } from "@/patient/components/referral/generate-referral-letter-pdf.patient";
import {
  buildReferralLetterData,
  buildAttachmentChecklist,
} from "@/patient/components/referral/referral-letter-data.util.patient";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { PatientConsultationDetailSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";
import SEO from "@/shared/components/seo.component";

type ConsultationTab = "summary" | "investigation" | "medication" | "referrals";

function ViewConsultationDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const consultationId = params.id ?? "";
  const queryClient = useQueryClient();
  const tabsSectionRef = useRef<HTMLDivElement>(null);
  const [uploadingInvestigationId, setUploadingInvestigationId] = useState<
    string | null
  >(null);
  // Summary leads: it is the one tab that answers "what came out of this
  // consultation?" without the patient having to open three others first.
  const [activeTab, setActiveTab] = useState<ConsultationTab>("summary");
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
    queryKey: queryKeys.patientProfile,
    queryFn: () => getPatientProfileReq(),
  });

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useQuery({
    queryKey: ["consultation-summary", consultationId],
    queryFn: () => getConsultationSummaryReq(consultationId),
    enabled: !!consultationId,
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

  const openTabAndScroll = (tab: ConsultationTab) => {
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
      toast.error(
        getApiErrorMessage(error, "Failed to upload investigation result."),
      );
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

  const handleDownloadReferralPDF = async (referral: ReferralItem) => {
    if (!profile) {
      toast.warning("Your profile is still loading — please try again.");
      return;
    }
    try {
      const attachedIds = referral.attachment_investigation_ids ?? [];
      const attachedRecords = investigationItems.filter((item) =>
        attachedIds.includes(item._id),
      );
      const images = attachedRecords.flatMap((record) =>
        (record.result_images ?? []).map((url) => ({
          url,
          label: `${record.name} — uploaded result`,
        })),
      );

      const letterData = buildReferralLetterData({
        referral: {
          specialty: referral.specialty,
          specialist_name: referral.specialist_name,
          hospital: referral.hospital,
          hospital_address: referral.hospital_address,
          referral_details: referral.referral_details,
          current_medications: referral.current_medications,
        },
        patient: {
          fullName:
            [profile.first_name, profile.middle_name, profile.last_name]
              .filter(Boolean)
              .join(" ") || "—",
          mrn: profile.mrn,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender || undefined,
          phone: profile.phone_number,
          email: profile.email,
          allergies: profile.allergies,
          previous_medical_conditions: profile.previous_medical_conditions,
        },
        referringDoctorFullName: referral.doctor_id.full_name,
        referralDate: new Date(referral.createdAt),
        consultationMedications: medicationGroups.flatMap(
          (group) => group.medications,
        ),
      });
      letterData.attachments = buildAttachmentChecklist(
        attachedRecords.map((record) => record.name),
      );
      letterData.investigations = attachedRecords.map((record) => ({
        name: record.name,
        date: record.createdAt,
      }));

      await generateReferralLetterPdf(letterData, images);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download referral letter.");
    }
  };

  return (
    <>
      <SEO
        title="Consultation Details"
        description="View consultation details including investigations, medications, and referrals on Carelexa."
        canonicalPath="/patient/dashboard/consultations/:id"
      />
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
      </>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 md:gap-6">
        <ConsultationDoctorCard
          doctorFirstName={consultation.doctor_id?.first_name}
          doctorFullName={consultation.doctor_id?.full_name}
          doctorSpecializations={consultation.doctor_id?.specializations}
          appointmentReasonForVisit={getBookingReasonForAppointment(
            consultation.appointment_id,
          )}
          appointmentComplaintDetails={getBookingComplaintDetails(
            consultation.appointment_id,
          )}
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
          onValueChange={(value) => setActiveTab(value as ConsultationTab)}
        >
          <div className="flex items-center justify-between px-2 md:px-4">
            <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0 overflow-x-auto custom-scrollbar">
              <TabsTrigger
                value="summary"
                className="rounded-none border-b-[3px] border-transparent px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
              >
                Summary
              </TabsTrigger>
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
            <TabsContent value="summary" className="mt-0">
              <ConsultationSummaryTab
                isLoading={isSummaryLoading}
                isError={isSummaryError}
                summary={summaryData?.data}
                onOpenMedication={() => openTabAndScroll("medication")}
                onOpenInvestigation={() => openTabAndScroll("investigation")}
                onOpenReferral={() => openTabAndScroll("referrals")}
              />
            </TabsContent>

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
