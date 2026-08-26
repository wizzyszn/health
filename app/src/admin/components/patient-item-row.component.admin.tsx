import { ChevronRight } from "lucide-react";
import { AdminPatient } from "@/admin/types/admin.types";

interface AdminPatientItemRowProps {
  patient: AdminPatient;
}

export default function AdminPatientItemRow({
  patient,
}: AdminPatientItemRowProps) {
  const initials = patient.full_name
    ? patient.full_name
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
    : "PA";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[12px] bg-[#F7F7F7] px-4 py-4 transition-colors hover:bg-[#F1F1F1]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[12px] border border-border bg-white text-sm font-semibold text-foreground">
          {initials}
        </div>

        <div>
          <p className="text-[16px] font-medium text-foreground">
            {patient.full_name}
          </p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#6C6C6C]">
            <span>{patient.registration_no || "No ID"}</span>
            <span>•</span>
            <span>{patient.email}</span>
            <span>•</span>
            <span>{patient.phone_number || "-"}</span>
          </div>
        </div>
      </div>

      <ChevronRight size={18} className="text-muted-foreground" />
    </div>
  );
}
