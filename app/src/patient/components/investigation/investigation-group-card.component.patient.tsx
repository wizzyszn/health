import {
  CalendarDays,
  ChevronUp,
  ClipboardList,
  Download,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUtcDate } from "@/lib/utils";

import { InvestigationGroup } from "./investigation.types.patient";
import { InvestigationUploadRow } from "./investigation-upload-row.component.patient";

export function InvestigationGroupCard({
  group,
  index,
  isExpanded,
  onToggle,
  onDownload,
}: {
  group: InvestigationGroup;
  index: number;
  isExpanded: boolean;
  onToggle: (groupId: string) => void;
  onDownload: (group: InvestigationGroup) => void;
}) {
  const consultationId =
    group.consultation?._id ||
    group.investigations?.[0]?.consultation_id ||
    `unknown-${index}`;
  const consultationTitle =
    group.consultation?.appointment_id?.reason_for_visit ||
    group.consultation?.title ||
    "Consultation";
  const scheduledStartAt =
    group.consultation?.appointment_id?.scheduled_start_at_utc;
  const scheduledAt = scheduledStartAt
    ? formatUtcDate(scheduledStartAt, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";
  const refId = consultationId.substring(0, 8);
  const investigationCount = group.investigation_count || 0;

  return (
    <div className="flex flex-col gap-2">
      <article
        onClick={() => onToggle(consultationId)}
        className="cursor-pointer rounded-[12px] border border-[#F0F0F0] bg-[#F7F7F7] p-3 transition-colors hover:bg-[#F2F2F2] sm:flex sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#EAEDFF] text-primary sm:h-12 sm:w-12">
            <ClipboardList
              className="h-5 w-5 sm:h-6 sm:w-6"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#2B2B2B] sm:text-sm">
              {consultationTitle}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#6C6C6C] sm:text-xs md:text-sm">
              <span className="max-w-[100px] truncate rounded border border-gray-100 bg-white px-1.5 font-medium sm:max-w-none">
                Ref: {refId}...
              </span>
              <span className="hidden text-[#B0B0B0] sm:inline">•</span>
              <span className="inline text-[#B0B0B0] sm:hidden">-</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-medium">
                <CalendarDays
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  strokeWidth={1.8}
                />
                {scheduledAt}
              </span>
              <span className="hidden text-[#B0B0B0] sm:inline">•</span>
              <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary text-xs">
                {investigationCount}{" "}
                {investigationCount === 1 ? "test" : "tests"}
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

      {isExpanded &&
        group.investigations &&
        group.investigations.length > 0 && (
          <div className="mb-2 ml-4 mr-4 flex flex-col gap-2 border-l-2 border-primary/20 py-2 pl-4">
            {group.investigations.map((inv) => (
              <InvestigationUploadRow
                key={inv._id}
                inv={inv}
                doctor={inv.doctor_id}
              />
            ))}
          </div>
        )}
    </div>
  );
}
