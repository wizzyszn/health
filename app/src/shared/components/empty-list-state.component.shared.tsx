import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type EmptyListStateProps = {
  sectionLabel: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  inTabs?: boolean;
};

function EmptyStateIllustration() {
  return (
    <div className="relative mb-6 h-[88px] w-[92px]">
      <div className="absolute left-0 top-[10px] h-[75px] w-[79px] rounded-[10px] bg-[#F7F7F7] shadow-[0px_10px_20px_-12px_rgba(43,43,43,0.28)]" />
      <div className="absolute left-0 top-[10px] h-[14px] w-[79px] rounded-t-[10px] bg-[#D2D2D2]" />
      <div className="absolute left-[6px] top-[30px] h-[6px] w-[17px] rounded-[3px] bg-[#E0E0E0]" />
      <div className="absolute left-[27px] top-[30px] h-[6px] w-[17px] rounded-[3px] bg-[#E0E0E0]" />
      <div className="absolute left-[48px] top-[30px] h-[6px] w-[17px] rounded-[3px] bg-[#E0E0E0]" />
      <div className="absolute left-[6px] top-[43px] h-[6px] w-[22px] rounded-[3px] bg-[#E0E0E0]" />
      <div className="absolute left-[33px] top-[43px] h-[16px] w-[23px] rounded-[3px] bg-[#D7D7D7]" />
      <div className="absolute left-[6px] top-[57px] h-[8px] w-[22px] rounded-[3px] bg-[#D9D9D9]" />
      <div className="absolute left-[39px] top-[62px] h-[11px] w-[21px] rounded-[3px] bg-[#DEDEDE]" />
      <div className="absolute left-[55px] top-0 flex h-9 w-9 items-center justify-center rounded-full border border-[#F2F2F2] bg-white text-[20px] font-medium leading-none text-[#D2D2D2] shadow-[0px_5px_15px_0px_rgba(167,171,179,0.25)]">
        0
      </div>
    </div>
  );
}

function EmptyStateBody({
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  inTabs,
}: Omit<EmptyListStateProps, "sectionLabel">) {
  return (
    <div
      className={`rounded-[12px] bg-[#F7F7F7] px-4 ${inTabs ? "py-8 sm:py-10" : "py-10 sm:py-12"}`}
    >
      <div
        className={`mx-auto flex max-w-md flex-col items-center text-center ${inTabs ? "min-h-[220px] justify-center" : "min-h-[260px] justify-center"}`}
      >
        <EmptyStateIllustration />
        <h3 className="text-[16px] font-semibold tracking-[-0.32px] text-[#2B2B2B]">
          {title}
        </h3>
        <p className="mt-1 max-w-[300px] text-sm leading-5 text-[#828282]">
          {description}
        </p>
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="outline"
            className="mt-5 h-10 rounded-[8px] border-[#F0F0F0] bg-white px-6 text-sm font-medium text-[#2B2B2B] shadow-[0px_4px_8px_-4px_rgba(194,196,211,0.16)] hover:bg-[#FAFAFA]"
            onClick={onAction}
          >
            {actionIcon ? <span className="mr-2">{actionIcon}</span> : null}
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyListState({
  sectionLabel,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  inTabs = false,
}: EmptyListStateProps) {
  if (inTabs) {
    return (
      <EmptyStateBody
        title={title}
        description={description}
        actionLabel={actionLabel}
        actionIcon={actionIcon}
        onAction={onAction}
        inTabs={inTabs}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
      <div className="border-b border-[#F0F0F0] px-4 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-[#6C6C6C]">{sectionLabel}</h2>
      </div>
      <div className="p-4 sm:p-6">
        <EmptyStateBody
          title={title}
          description={description}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          onAction={onAction}
          inTabs={inTabs}
        />
      </div>
    </div>
  );
}
