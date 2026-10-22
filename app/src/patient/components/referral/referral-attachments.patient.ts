import type { QueryClient } from "@tanstack/react-query";
import { getPatientInvestigationListReq } from "@/config/service/patient.service";
import type { ReferralLetterSourceInvestigation } from "@/patient/components/referral/referral-letter-data.util.patient";
import type { InvestigationResultPdfSource } from "@/patient/components/referral/generate-investigation-result-pdf.patient";

/**
 * Cache key for the patient's investigation history used to resolve the
 * results a doctor attached to a referral. Shared by every referral download
 * path so repeated downloads reuse the same response.
 */
const REFERRAL_ATTACHMENT_POOL_QUERY_KEY = [
  "patient-investigations",
  "referral-attachments",
] as const;

const REFERRAL_ATTACHMENT_POOL_STALE_TIME = 5 * 60 * 1000;

/**
 * Loads every investigation the patient can see, regardless of consultation.
 *
 * The doctor picks attachments from the patient's whole history, so resolving
 * them from only the referral's own consultation would silently drop results
 * uploaded during an earlier visit. The patient endpoint pages by consultation
 * group; 100 groups covers the same window the doctor's picker offers.
 */
export async function loadReferralAttachmentPool(
  queryClient: QueryClient,
): Promise<ReferralLetterSourceInvestigation[]> {
  const response = await queryClient.fetchQuery({
    queryKey: REFERRAL_ATTACHMENT_POOL_QUERY_KEY,
    queryFn: () =>
      getPatientInvestigationListReq({ page: "1", perPage: "100" }),
    staleTime: REFERRAL_ATTACHMENT_POOL_STALE_TIME,
  });

  return response.data.groups.flatMap((group) => group.investigations ?? []);
}

/**
 * Maps attached investigation records to one result-PDF source each,
 * de-duplicating investigations that multiple referrals in the same export
 * share (the patient only needs one copy of each result).
 */
export function toInvestigationResultSources(
  records: ReferralLetterSourceInvestigation[],
  patient: { fullName: string; mrn?: string },
): InvestigationResultPdfSource[] {
  const seen = new Set<string>();
  return records
    .filter((record) => {
      if (seen.has(record._id)) return false;
      seen.add(record._id);
      return true;
    })
    .map((record) => ({
      investigationId: record._id,
      investigationName: record.name,
      investigationDate: record.createdAt,
      patientName: patient.fullName,
      mrn: patient.mrn,
      imageUrls: record.result_images ?? [],
    }));
}
