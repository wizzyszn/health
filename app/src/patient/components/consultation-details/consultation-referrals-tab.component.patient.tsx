import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReferralItem } from "./consultation-detail.types.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

interface ConsultationReferralsTabProps {
  isLoading: boolean;
  isError: boolean;
  referrals: ReferralItem[];
  onDownloadPdf: (referral: ReferralItem) => void;
}

export function ConsultationReferralsTab({
  isLoading,
  isError,
  referrals,
  onDownloadPdf,
}: ConsultationReferralsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <PatientRecordGroupSkeleton count={2} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load referral data.
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No referrals found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((referral) => (
        <div
          key={referral._id}
          className="rounded-lg border border-border bg-[#F7F7F7] p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {referral.referred_doctor_name ? (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {referral.referred_doctor_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {referral.specialist_name}
                    {referral.hospital && ` • ${referral.hospital}`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground">
                    {referral.specialist_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {referral.hospital}
                  </p>
                </>
              )}
              <p className="text-sm text-foreground mt-2">
                {referral.referral_details}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Referred by {referral.doctor_id.full_name} •{" "}
                {new Date(referral.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 text-xs"
              onClick={() => onDownloadPdf(referral)}
            >
              <Download className="mr-1 h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
