import {
  Download,
  Calendar,
  UserRound,
  Stethoscope,
  FileText,
  ChevronRight,
  MoveLeft,
  MapPin,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import { Button } from "@/components/ui/button";
import {
  getGroupedMedicationsForConsultationsReq,
  getPatientProfileReq,
  getSingleReferralForPatientReq,
} from "@/config/service/patient.service";
import { createReferralLetterPdf } from "@/patient/components/referral/generate-referral-letter-pdf.patient";
import { createInvestigationResultPdfs } from "@/patient/components/referral/generate-investigation-result-pdf.patient";
import {
  buildReferralLetterData,
  applyReferralAttachments,
} from "@/patient/components/referral/referral-letter-data.util.patient";
import {
  loadReferralAttachmentPool,
  toInvestigationResultSources,
} from "@/patient/components/referral/referral-attachments.patient";
import { downloadPdfFiles } from "@/shared/utils/pdf-download.util";
import type { ReferralLetterSourceMedication } from "@/patient/components/referral/referral-letter-data.util.patient";
import { toast } from "sonner";
import { PatientReferralDetailSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";
import SEO from "@/shared/components/seo.component";

type ReferralData = NonNullable<
  Awaited<ReturnType<typeof getSingleReferralForPatientReq>>["data"]
>;

export default function ViewReferralDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-referral", id],
    queryFn: () => getSingleReferralForPatientReq(id!),
    enabled: !!id,
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.patientProfile,
    queryFn: () => getPatientProfileReq(),
  });

  const referral = data?.data;
  const profile = profileData?.data;
  const consultationId =
    typeof referral?.consultation_id === "object"
      ? referral.consultation_id?._id
      : undefined;

  const { data: medicationsRes } = useQuery({
    queryKey: ["patient-consultation-medications", consultationId],
    queryFn: () => getGroupedMedicationsForConsultationsReq(consultationId!),
    enabled: !!consultationId,
  });

  const handleDownloadPDF = async (ref: ReferralData) => {
    if (!profile) {
      toast.warning("Your profile is still loading — please try again.");
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);
    const toastId = toast.loading("Preparing your referral documents…");

    try {
      // Attachments may come from any consultation in the patient's history,
      // so resolve them from the full pool the doctor picked from. Skip the
      // request entirely when the referral has none.
      const hasAttachments =
        (ref.attachment_investigation_ids ?? []).length > 0;
      const investigationPool = hasAttachments
        ? await loadReferralAttachmentPool(queryClient)
        : [];

      const medications: ReferralLetterSourceMedication[] = (
        medicationsRes?.data.groups ?? []
      ).flatMap((group) => group.medications);

      const patientName =
        [profile.first_name, profile.middle_name, profile.last_name]
          .filter(Boolean)
          .join(" ") || "—";

      const letterData = buildReferralLetterData({
        referral: {
          specialty: ref.specialty,
          specialist_name: ref.specialist_name,
          hospital: ref.hospital,
          hospital_address: ref.hospital_address,
          referral_details: ref.referral_details,
          current_medications: ref.current_medications,
        },
        patient: {
          fullName: patientName,
          mrn: profile.mrn,
          dateOfBirth: profile.date_of_birth,
          gender: profile.gender || undefined,
          phone: profile.phone_number,
          email: profile.email,
          allergies: profile.allergies,
          previous_medical_conditions: profile.previous_medical_conditions,
        },
        referringDoctorFullName: ref.doctor_id.full_name,
        referralDate: new Date(ref.createdAt),
        consultationMedications: medications,
      });
      const attachedRecords = applyReferralAttachments(
        letterData,
        ref.attachment_investigation_ids,
        investigationPool,
      );

      // Letter and each result go out as separate files, so the referral PDF
      // stays a letter and each result carries its own investigation heading.
      const letterPdf = await createReferralLetterPdf(letterData);
      const resultSources = toInvestigationResultSources(attachedRecords, {
        fullName: patientName,
        mrn: profile.mrn,
      });
      const resultPdfs = await createInvestigationResultPdfs(resultSources);
      const fileCount = await downloadPdfFiles([letterPdf, ...resultPdfs]);

      if (fileCount > 1) {
        toast.success(
          `Downloaded the referral letter and ${fileCount - 1} result ${
            fileCount - 1 === 1 ? "file" : "files"
          }.`,
          { id: toastId },
        );
      } else if (resultSources.some((source) => source.imageUrls.length > 0)) {
        toast.warning(
          "Referral letter downloaded, but the attached result images could not be loaded.",
          { id: toastId },
        );
      } else {
        toast.success("Referral letter downloaded.", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to download the referral documents.", {
        id: toastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return <PatientReferralDetailSkeleton />;
  }

  if (isError || !referral) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Referral not found.</p>
        <Button onClick={() => navigate("/patient/dashboard/referrals")}>
          Back to Referrals
        </Button>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Referral Details"
        description="View detailed referral information and download referral letters on Carelexa."
        canonicalPath="/patient/dashboard/referrals/:id"
      />
      <div className="p-4 md:p-6">
        {/* Back Button & Title */}
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-5 group"
          >
            <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Referral Details
          </h1>
          <p className="text-xs md:text-sm text-[#6C6C6C] mt-1">
            Reference ID: {referral._id.slice(-8).toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
          {/* Main Content Card */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-4 md:p-6 shadow-sm min-w-0">
            {/* Referring Doctor */}
            <div className="mb-6 md:mb-8 p-4 md:p-5 bg-[#F7F7F7] rounded-xl border border-gray-100">
              <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 md:mb-4">
                Referring Doctor
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0 border border-primary/10">
                  <UserRound className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                    {referral.doctor_id.full_name}
                  </h3>
                  <p className="text-xs md:text-sm text-primary font-medium mt-0.5 truncate">
                    {referral.doctor_id.specializations.join(", ")}
                  </p>
                </div>
              </div>
            </div>

            {/* Referral Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
              <div className="space-y-4 md:space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Date of Referral
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 truncate">
                    {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Consultation
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 break-words">
                    {referral.consultation_id?.title ?? "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Hospital
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 break-words">
                    {referral.hospital}
                  </p>
                </div>

                {referral.referred_doctor_name ? (
                  <div>
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                      <UserRound className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                        Referred Doctor
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 truncate">
                      {referral.referred_doctor_name}
                    </p>
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <UserRound className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Specialist
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 truncate">
                    {referral.specialist_name}
                  </p>
                </div>

                {referral.specialty ? (
                  <div>
                    <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                      <Stethoscope className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                      <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                        Specialty
                      </span>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 truncate">
                      {referral.specialty}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gray-100 my-6 md:my-8" />

            {/* Referral Details */}
            <div>
              <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                <Stethoscope className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                <span className="text-sm font-semibold text-foreground">
                  Referral Details
                </span>
              </div>
              <div className="ml-0 md:ml-6 p-3 md:p-4 rounded-lg border border-gray-100 bg-[#F9FAFB] text-xs md:text-sm text-gray-700 leading-relaxed shadow-inner break-words">
                {referral.referral_details}
              </div>

              {referral.specialty ? (
                <div>
                  <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                    <Stethoscope className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                    <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">
                      Specialty
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-foreground ml-5 md:ml-6 truncate">
                    {referral.specialty}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 md:p-5 shadow-sm sticky top-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-5">
                Referral Actions
              </h3>

              <div className="space-y-4">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 rounded-lg border border-gray-100 bg-[#F7F7F7] p-3 text-left transition-colors hover:bg-[#EAEAEA] group disabled:cursor-wait disabled:opacity-80 disabled:hover:bg-[#F7F7F7]"
                  onClick={() => handleDownloadPDF(referral)}
                  disabled={isDownloading}
                  aria-busy={isDownloading}
                >
                  <div className="bg-white p-2 rounded-full shrink-0 shadow-sm border border-gray-100 group-hover:bg-gray-50 transition-colors">
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">
                      {isDownloading
                        ? "Preparing documents…"
                        : "Download Referral"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isDownloading
                        ? "Fetching the letter and attached results"
                        : referral.attachment_investigation_ids?.length
                          ? `Referral letter (PDF) + ${referral.attachment_investigation_ids.length} attached ${
                              referral.attachment_investigation_ids.length === 1
                                ? "result"
                                : "results"
                            }`
                          : "Official referral letter (PDF)"}
                    </p>
                  </div>
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 self-center animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
                  )}
                </button>
              </div>
              {/* 
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Consultation Status
                </span>
                <span
                  className={`text-xs font-bold ${
                    referral.consultation_id?.status === "COMPLETED"
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {referral.consultation_id?.status ?? "—"}
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    referral.consultation_id?.status === "COMPLETED"
                      ? "bg-green-500 w-full"
                      : "bg-amber-500 w-1/2"
                  }`}
                />
              </div>
            </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
