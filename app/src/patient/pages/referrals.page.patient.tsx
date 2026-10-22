import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import {
  getGroupedReferralsForConsultationsReq,
  getPatientProfileReq,
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
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { toast } from "sonner";
import { ReferralPageHeader } from "@/patient/components/referral/referral-page-header.component.patient";
import { ReferralSearchBar } from "@/patient/components/referral/referral-search-bar.component.patient";
import { ReferralGroupCard } from "@/patient/components/referral/referral-group-card.component.patient";
import { ReferralEmptyState } from "@/patient/components/referral/referral-empty-state.component.patient";
import { ReferralGroup } from "@/patient/components/referral/referral.types.patient";
import { getReferralGroupTitle } from "@/patient/components/referral/referral-group.util.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";
import SEO from "@/shared/components/seo.component";

export default function ReferralsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingGroupId, setDownloadingGroupId] = useState<string | null>(
    null,
  );
  const { updateParam } = useUrlSearchParams();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-referrals-grouped"],
    queryFn: () => getGroupedReferralsForConsultationsReq(),
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.patientProfile,
    queryFn: () => getPatientProfileReq(),
  });

  const groups = useMemo(() => (data?.data || []) as ReferralGroup[], [data]);
  const profile = profileData?.data;

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return groups;

    return groups.filter((group) => {
      const groupTitle = getReferralGroupTitle(group).toLowerCase();
      const reference = (group.consultation?._id || "").toLowerCase();

      // Also search within individual referrals
      const refMatch = group.referrals?.some((ref) => {
        const specialist = (ref.specialist_name || "").toLowerCase();
        const hospital = (ref.hospital || "").toLowerCase();
        const doctorName = (ref.doctor_id?.full_name || "").toLowerCase();
        return (
          specialist.includes(normalizedSearch) ||
          hospital.includes(normalizedSearch) ||
          doctorName.includes(normalizedSearch)
        );
      });

      return (
        groupTitle.includes(normalizedSearch) ||
        reference.includes(normalizedSearch) ||
        refMatch
      );
    });
  }, [groups, searchTerm]);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  /* ─── PDF Generation (per group — all referrals in the consultation) ─── */

  const handleDownloadPDF = async (group: ReferralGroup) => {
    if (!profile) {
      toast.warning("Your profile is still loading — please try again.");
      return;
    }
    if (downloadingGroupId) return;

    const groupKey =
      group.consultation?._id || group.referrals?.[0]?._id || "group";
    setDownloadingGroupId(groupKey);
    const toastId = toast.loading("Preparing your referral documents…");

    try {
      const hasAttachments = group.referrals.some(
        (referral) => (referral.attachment_investigation_ids ?? []).length > 0,
      );
      const investigationPool = hasAttachments
        ? await loadReferralAttachmentPool(queryClient)
        : [];

      const patientName =
        [profile.first_name, profile.middle_name, profile.last_name]
          .filter(Boolean)
          .join(" ") || "—";

      const lettersWithAttachments = group.referrals.map((referral) => {
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
            fullName: patientName,
            mrn: profile.mrn,
            dateOfBirth: profile.date_of_birth,
            gender: profile.gender || undefined,
            phone: profile.phone_number,
            email: profile.email,
            allergies: profile.allergies,
            previous_medical_conditions: profile.previous_medical_conditions,
          },
          referringDoctorFullName:
            referral.doctor_id?.full_name ?? "Referring Physician",
          referralDate: new Date(referral.createdAt),
        });
        return {
          letterData,
          records: applyReferralAttachments(
            letterData,
            referral.attachment_investigation_ids,
            investigationPool,
          ),
        };
      });

      // One letter file per referral (not a combined multi-page document), so
      // each referral stays a single sheet. Attached results are separate too.
      const letterFiles = await Promise.all(
        lettersWithAttachments.map((entry, index) =>
          createReferralLetterPdf(entry.letterData, {
            fileNameSuffix:
              group.referrals[index]?.specialty ||
              group.referrals[index]?._id.slice(-6),
          }),
        ),
      );
      const resultSources = toInvestigationResultSources(
        lettersWithAttachments.flatMap((entry) => entry.records),
        { fullName: patientName, mrn: profile.mrn },
      );
      const resultPdfs = await createInvestigationResultPdfs(resultSources);
      await downloadPdfFiles([...letterFiles, ...resultPdfs]);

      const letterCount = letterFiles.length;
      const resultCount = resultPdfs.length;
      const lettersLabel =
        letterCount === 1
          ? "the referral letter"
          : `${letterCount} referral letters`;
      const resultsLabel = `${resultCount} result ${
        resultCount === 1 ? "file" : "files"
      }`;

      if (resultCount > 0) {
        toast.success(`Downloaded ${lettersLabel} and ${resultsLabel}.`, {
          id: toastId,
        });
      } else if (resultSources.some((source) => source.imageUrls.length > 0)) {
        toast.warning(
          `Downloaded ${lettersLabel}, but the attached result images could not be loaded.`,
          { id: toastId },
        );
      } else {
        toast.success(`Downloaded ${lettersLabel}.`, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to download the referral documents.", {
        id: toastId,
      });
    } finally {
      setDownloadingGroupId(null);
    }
  };

  return (
    <>
      <SEO
        title="Referrals"
        description="View and manage your medical referrals on Carelexa."
        canonicalPath="/patient/dashboard/referrals"
      />
      <div className="flex w-full flex-col gap-6">
        <ReferralPageHeader />

        <section className="overflow-hidden rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
          <div className="border-b border-[#F0F0F0] px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-[#6C6C6C]">
              Referral History
            </h2>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <ReferralSearchBar value={searchTerm} onChange={setSearchTerm} />

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <PatientRecordGroupSkeleton count={4} />
              ) : isError ? (
                <div className="text-center py-12 text-red-500">
                  Failed to load referral history. Please try again later.
                </div>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group, index) => {
                  const consultationId =
                    group.consultation?._id || `unknown-${index}`;
                  const isExpanded = expandedGroupId === consultationId;

                  return (
                    <ReferralGroupCard
                      key={consultationId}
                      group={group}
                      index={index}
                      isExpanded={isExpanded}
                      onToggle={toggleGroup}
                      onDownload={handleDownloadPDF}
                      downloadingGroupId={downloadingGroupId}
                    />
                  );
                })
              ) : (
                <ReferralEmptyState
                  onBookConsultant={() => updateParam("step", "0")}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
