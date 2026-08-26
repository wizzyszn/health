import { CircleCheck, Hourglass } from "lucide-react";

function isPublishedStatus(status: string) {
  return status === "COMPLETED";
}

function isOngoingStatus(status: string) {
  return status === "PENDING" || status === "ACTIVE";
}

export function ConsultationRecordStatusIcon({
  status,
  audience,
  className = "w-4 h-4",
}: {
  status: string;
  audience: "doctor" | "patient";
  className?: string;
}) {
  if (isPublishedStatus(status)) {
    const label = audience === "doctor" ? "Published" : "Completed";

    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <CircleCheck className={className} color="#0BAB4E" aria-hidden />
        <span className="text-xs font-medium text-[#0BAB4E]">{label}</span>
      </div>
    );
  }

  if (isOngoingStatus(status)) {
    return (
      <div className="flex items-center gap-1.5 shrink-0">
        <Hourglass className={className} color="#F98D11" aria-hidden />
        <span className="text-xs font-medium text-[#F98D11]">Ongoing</span>
      </div>
    );
  }

  return null;
}
