import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Hourglass,
  MessageSquareMore,
} from "lucide-react";
import { ConsultationStatus } from "../types/consultation.types";

export function ConsultationStatusBadge({
  status,
}: {
  status: ConsultationStatus;
}) {
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDE7E5] px-3 py-1 text-xs font-medium text-[#D92D20]">
        <span className=" size-4 flex justify-center items-center rounded-full bg-[#D92D20]">
          <CircleAlert className=" text-[#fff]" size={10} />
        </span>
        Failed
      </span>
    );
  }
  if (status === "CANCELLED" || status === "CANCELED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5EAFD] px-3 py-1 text-xs font-medium text-[#A2A2A2]">
        <span className="size-4 flex justify-center items-center rounded-full bg-[#A2A2A2]">
          <CircleX size={10} className=" text-white" />
        </span>
        Cancelled
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5F2EA] px-3 py-1 text-xs font-medium text-[#0BAB4E]">
        <span className="size-4 flex justify-center items-center rounded-full bg-[#0BAB4E]">
          <CircleCheck size={10} className="text-white" />
        </span>
        Completed
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFEEDA] px-3 py-1 text-xs font-medium text-[#F98D11]">
        <span className="size-4 flex justify-center items-center rounded-full bg-[#F98D11]">
          <Hourglass size={10} className="text-white" />
        </span>
        Pending
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <MessageSquareMore className="ml-1 h-4 w-4 text-muted-foreground" />
    </div>
  );
}
