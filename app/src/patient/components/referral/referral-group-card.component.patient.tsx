import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronUp, Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import SendIcon from "@/shared/components/svgs/icons/send.icon";

import { ReferralGroup, ReferralItem } from "./referral.types.patient";
import { getReferralGroupTitle } from "./referral-group.util.patient";

/* ─── Individual referral row (shown when group is expanded) ─── */

function ReferralRow({ referral }: { referral: ReferralItem }) {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-[#F0F0F0] bg-white p-3 shadow-sm cursor-pointer transition-colors hover:bg-[#FAFAFA]"
      onClick={() => navigate(`/patient/dashboard/referrals/${referral._id}`)}
    >
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 flex-col sm:flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-[#2B2B2B]">
              {referral.specialist_name}
            </span>
          </div>
          <span className="mt-0.5 truncate text-xs text-[#6C6C6C]">
            {referral.hospital}
          </span>
          <span className="mt-0.5 truncate text-xs text-[#6C6C6C]">
            Doctor: {referral.doctor_id?.full_name || "N/A"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-[10px] font-medium text-[#6C6C6C]">
            {new Date(referral.createdAt).toLocaleDateString()}
          </span>
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14m-7-7 7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Group card (one per consultation) ─── */

export function ReferralGroupCard({
  group,
  index,
  isExpanded,
  onToggle,
  onDownload,
}: {
  group: ReferralGroup;
  index: number;
  isExpanded: boolean;
  onToggle: (groupId: string) => void;
  onDownload: (group: ReferralGroup) => void;
}) {
  const consultationId = group.consultation?._id || `unknown-${index}`;

  const groupTitle = getReferralGroupTitle(group);

  const consultationDate = group.consultation?.createdAt
    ? new Date(group.consultation.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const refId = consultationId.substring(0, 8);
  const referralCount = group.referrals?.length || 0;

  return (
    <div className="flex flex-col gap-2">
      <article
        onClick={() => onToggle(consultationId)}
        className="cursor-pointer rounded-[12px] border border-[#F0F0F0] bg-[#F7F7F7] p-3 transition-colors hover:bg-[#F2F2F2] sm:flex sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#EAEDFF] text-primary sm:h-12 sm:w-12">
            <SendIcon size={24} color="currentColor" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium sm:text-sm">
              {groupTitle}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#6C6C6C] sm:text-xs md:text-sm">
              <span className="max-w-[100px] truncate rounded border border-gray-100 bg-white px-1.5 font-medium sm:max-w-none">
                Ref: {refId}…
              </span>
              <span className="hidden text-[#B0B0B0] sm:inline">•</span>
              <span className="inline text-[#B0B0B0] sm:hidden">-</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium">
                <CalendarDays
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  strokeWidth={1.8}
                />
                {consultationDate}
              </span>
              <span className="hidden text-[#B0B0B0] sm:inline">•</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary text-xs">
                {referralCount} {referralCount === 1 ? "referral" : "referrals"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex w-full shrink-0 items-center justify-between gap-2 self-end border-t border-gray-200/60 pt-3 sm:mt-0 sm:w-auto sm:self-auto sm:justify-end sm:border-none sm:pt-0">
          <Button
            type="button"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(group);
            }}
            className="h-8 w-8 rounded-[8px] border border-[#F0F0F0] bg-white p-0 text-[#2B2B2B] hover:bg-[#F7F7F7] sm:h-10 sm:w-10"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.8} />
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-8 rounded-[8px] bg-[#EFEFEF] px-4 text-xs font-medium text-[#2B2B2B] hover:bg-[#E6E6E6] hover:text-[#2B2B2B] sm:h-10 sm:min-w-[121px] sm:px-5 sm:text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" strokeWidth={1.8} />
                Hide
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" strokeWidth={1.8} />
                View
              </>
            )}
          </Button>
        </div>
      </article>

      {isExpanded && group.referrals && group.referrals.length > 0 && (
        <div className="mb-2 ml-4 mr-4 flex flex-col gap-2 border-l-2 border-primary/20 py-2 pl-4">
          {group.referrals.map((referral) => (
            <ReferralRow key={referral._id} referral={referral} />
          ))}
        </div>
      )}
    </div>
  );
}
