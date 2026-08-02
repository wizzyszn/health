import { useNavigate } from "react-router-dom";
import { ChevronRight, User } from "lucide-react";
import { Pagination } from "@/shared/components/pagination.component.shared";
import { formatZonedTime } from "@/lib/utils";
import { ItemRow } from "./item-row.component.doctor";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

export interface DoctorPatient {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string;
  registration_no?: string;
  createdAt?: string;
  profile_picture_url?: string;
  consultation_id: string | null;
  has_consultation_with_doctor: boolean;
}

export function PatientList({
  patients,
  totalPages,
  page = 1,
  isLoading = false,
  isDebouncing = false,
  onPageChange,
}: {
  patients: DoctorPatient[];
  totalPages: number;
  page?: number;
  isLoading?: boolean;
  isDebouncing?: boolean;
  onPageChange: (page: number) => void;
}) {
  const navigate = useNavigate();
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  if (!isLoading && !isDebouncing && !patients.length) {
    return (
      <div className="h-36 rounded-xl border border-border bg-white text-center text-muted-foreground flex items-center justify-center">
        No patients found.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white shadow-sm border border-border p-4">
      <div className="mt-0 flex flex-col gap-2">
        {isLoading || isDebouncing
          ? Array.from({ length: 5 }).map((_, idx) => (
              <PatientRowSkeleton key={idx} />
            ))
          : patients.map((patient) => {
              const joinedDate = new Date(patient.createdAt || Date.now());

              const patientItem = {
                id: patient._id,
                patientName:
                  patient.full_name ||
                  `${patient.first_name} ${patient.last_name}`,
                ref: patient.registration_no || "N/A",
                date: {
                  day: joinedDate.getDate(),
                  month: joinedDate.toLocaleString("default", {
                    month: "short",
                  }),
                },
                time: `Registered ${formatZonedTime(joinedDate, { timeZone: userTimezone })}`,
                profile_picture_url: patient.profile_picture_url,
                first_name: patient.first_name,
                last_name: patient.last_name,
              };

              const hasConsultation = patient.has_consultation_with_doctor;

              const handlePatientClick = () => {
                if (!hasConsultation || !patient.consultation_id) return;
                navigate(
                  `/doctor/dashboard/consultations/${patient.consultation_id}`,
                  {
                    state: { fromPatientRoute: true },
                  },
                );
              };

              return (
                <div
                  key={patient._id}
                  onClick={handlePatientClick}
                  className={`block transition-opacity ${
                    hasConsultation
                      ? "cursor-pointer hover:opacity-90"
                      : "cursor-default opacity-80"
                  }`}
                >
                  <ItemRow item={patientItem}>
                    <div className="flex items-center gap-2">
                      {!hasConsultation && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 whitespace-nowrap">
                          No consultation
                        </span>
                      )}
                      <User size={16} color="#969696" />
                      {hasConsultation && (
                        <ChevronRight
                          size={16}
                          className="text-muted-foreground"
                        />
                      )}
                    </div>
                  </ItemRow>
                </div>
              );
            })}
        {!isLoading && !isDebouncing && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}

function PatientRowSkeleton() {
  return (
    <div className="flex bg-[#F7F7F7] flex-col sm:flex-row sm:items-center justify-between p-3 md:px-4 md:py-4 rounded-[12px] gap-3 sm:gap-0">
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
        <div className="w-[40px] h-[40px] md:w-[50px] md:h-[50px] rounded-full bg-black/15 animate-pulse flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2 py-1">
          <div className="h-4 w-40 max-w-full rounded-md bg-black/15 animate-pulse" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-3 w-24 rounded-md bg-black/10 animate-pulse" />
            <div className="h-3 w-32 rounded-md bg-black/10 animate-pulse" />
          </div>
        </div>
      </div>
      <div className="self-end sm:self-auto flex items-center gap-2">
        <div className="h-6 w-24 rounded-full bg-black/10 animate-pulse" />
        <div className="h-4 w-4 rounded bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}
