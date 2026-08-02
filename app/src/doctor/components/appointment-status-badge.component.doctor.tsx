import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Hourglass,
  RefreshCw,
  UserX,
} from "lucide-react";
import { AppointmentStatus } from "../types/consultation.types";

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  if (status === "CONFIRMED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0BAB4E] bg-[#E5F2EA] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0BAB4E]">
          <svg
            className="h-2.5 w-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
        <span className="pr-1">Confirmed</span>
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0BAB4E] bg-[#E5F2EA] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#0BAB4E]">
          <CircleCheck className="text-white" size={10} />
        </span>
        <span className="pr-1">Completed</span>
      </span>
    );
  }

  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] bg-[#EFF6FF] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB]">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        </span>
        <span className="pr-1">Active</span>
      </span>
    );
  }

  // ✅ handles both CANCELED and CANCELLED
  if (status === "CANCELED" || status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A2A2A2] bg-[#E5EAFD] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A2A2A2]">
          <CircleX className="text-white" size={10} />
        </span>
        <span className="pr-1">Cancelled</span>
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D92D20] bg-[#FDE7E5] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D92D20]">
          <CircleAlert className="text-white" size={10} />
        </span>
        <span className="pr-1">Failed</span>
      </span>
    );
  }

  if (status === "NO_SHOW") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D92D20] bg-[#FDE7E5] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D92D20]">
          <UserX className="text-white" size={10} />
        </span>
        <span className="pr-1">No Show</span>
      </span>
    );
  }

  if (status === "FORFEITED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A2A2A2] bg-[#F3F4F6] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#A2A2A2]">
          <CircleX className="text-white" size={10} />
        </span>
        <span className="pr-1">Forfeited</span>
      </span>
    );
  }

  if (status === "RESCHEDULED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7C3AED] bg-[#EDE9FE] p-1 rounded-full">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C3AED]">
          <RefreshCw className="text-white" size={10} />
        </span>
        <span className="pr-1">Rescheduled</span>
      </span>
    );
  }

  // Default: PENDING
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F98D11] bg-[#FFEEDA] p-1 rounded-full">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#F98D11] text-white">
        <Hourglass className="text-white" size={10} />
      </span>
      <span className="pr-1">Pending</span>
    </span>
  );
}
