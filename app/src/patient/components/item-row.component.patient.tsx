import { Calendar } from "lucide-react";
import React from "react";
import { BaseItem } from "../types/consultation.types";

export function ItemRow({
  item,
  children,
}: {
  item: BaseItem;
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-[#F7F7F7] flex-col sm:flex-row sm:items-center justify-between p-3 md:px-4 md:py-4 rounded-[12px] gap-3 sm:gap-0">
      <div className="flex items-start gap-3 md:gap-4">
        <div className="flex flex-col items-center justify-center border py-[4px] md:py-[6px] px-[8px] md:px-[10px] bg-white rounded-[8px] gap-0.5 md:gap-1 min-w-[48px] md:min-w-[56px]">
          <span className="font-medium text-sm md:text-[16px] leading-none text-foreground">
            {item.date.day}
          </span>
          <span className="text-[10px] md:text-xs font-normal text-[#E85151]">
            {item.date.month}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-sm font-medium text-foreground truncate">
            {item.doctorName}
            <span className="hidden sm:inline text-muted-foreground ml-1">
              ({item.specialty})
            </span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-[#6C6C6C]">
            <span className="whitespace-nowrap truncate max-w-[100px] sm:max-w-none">
              Ref: {item.ref}
            </span>
            <span>•</span>
            <span className="whitespace-nowrap">{item.type}</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3 hidden sm:block" />
              <span>{item.time}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="self-end sm:self-auto flex-shrink-0">{children}</div>
    </div>
  );
}
