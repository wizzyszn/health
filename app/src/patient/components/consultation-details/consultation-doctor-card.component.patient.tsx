import { Calendar, Clock, Stethoscope, ClipboardList } from "lucide-react";
import type { ElementType } from "react";

interface ConsultationDoctorCardProps {
  doctorFirstName?: string;
  doctorFullName?: string;
  doctorSpecializations?: string[];
  appointmentReasonForVisit?: string;
  appointmentComplaintDetails?: string;
  displayDate: string;
  displayTime: string;
  TypeIcon: ElementType;
  typeLabel: string;
  PlatformIcon: ElementType;
  platformLabel: string;
}

export function ConsultationDoctorCard({
  doctorFirstName,
  doctorFullName,
  doctorSpecializations,
  appointmentReasonForVisit,
  appointmentComplaintDetails,
  displayDate,
  displayTime,
  TypeIcon,
  typeLabel,
  PlatformIcon,
  platformLabel,
}: ConsultationDoctorCardProps) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-4 md:p-6 min-w-0">
      {/* Doctor info */}
      <div className="mb-5 md:mb-6 p-4 md:p-5 bg-[#F7F7F7] rounded-xl border border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-0 sm:mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctorFirstName || "Doctor"}`}
              alt={doctorFullName || "Doctor"}
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-base">
                {doctorFullName || "Doctor"}
              </h3>
            </div>
            <p className="text-sm text-primary font-medium mt-0.5">
              {doctorSpecializations?.join(", ") || "General physician"}
            </p>
          </div>
        </div>
      </div>

      {/* Date & Time row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-4 md:mb-5 mt-4 sm:mt-0">
        <div className="flex items-center gap-2 md:gap-2.5">
          <Calendar className="w-4 h-4 shrink-0" color="#6C6C6C" />
          <span className="text-xs md:text-sm text-foreground truncate">
            {displayDate}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-2.5">
          <Clock className="w-4 h-4 shrink-0" color="#6C6C6C" />
          <span className="text-xs md:text-sm text-foreground truncate">
            {displayTime}
          </span>
        </div>
      </div>

      {/* Consultation type row */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-12 mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-2.5">
          <TypeIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
          <span className="text-xs md:text-sm text-foreground truncate">
            {typeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-2.5">
          <PlatformIcon className="w-4 h-4 shrink-0" color="#6C6C6C" />
          <span className="text-xs md:text-sm text-foreground truncate">
            {platformLabel}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-6" />

      {/* Reason for Appointment (visit) */}
      {appointmentReasonForVisit && (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Stethoscope className="w-4 h-4" color="#6C6C6C" />
            <span className="text-sm font-semibold text-foreground">
              Reason for Appointment (visit)
            </span>
          </div>
          <div className="ml-0 md:ml-6 rounded-lg border border-border bg-[#F7F7F7] px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {appointmentReasonForVisit}
            </p>
          </div>
        </div>
      )}

      {/* Complaint Details */}
      {appointmentComplaintDetails && (
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <ClipboardList className="w-4 h-4" color="#6C6C6C" />
            <span className="text-sm font-semibold text-foreground">
              Complaint Details
            </span>
          </div>
          <div className="ml-0 md:ml-6 rounded-lg border border-border bg-[#F7F7F7] px-3 py-2">
            <p className="whitespace-pre-wrap break-words text-sm text-foreground">
              {appointmentComplaintDetails}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
