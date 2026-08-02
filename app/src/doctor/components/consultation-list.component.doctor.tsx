import { useNavigate, Link } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import { ConsultationRecordStatusIcon } from "@/shared/components/consultation-record-status-icon.component.shared";
import { ItemRow } from "./item-row.component.doctor";
import {
  Consultation,
  RawDoctorConsultation,
} from "../types/consultation.types";
import { useQuery } from "@tanstack/react-query";
import { getDoctorConsultationsReq } from "@/config/service/doctor.service"; // ✅ fixed: was patient.service
import { Pagination } from "@/shared/components/pagination.component.shared";
import { getZonedAppointmentDateTime } from "@/lib/utils";
import { EmptyListState } from "@/shared/components/empty-list-state.component.shared";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { ListRowSkeleton } from "@/shared/components/list-row-skeleton.component.shared";

export function ConsultationList({
  searchTerm = "",
  inTabs = false,
}: {
  searchTerm?: string;
  inTabs?: boolean;
}) {
  const navigate = useNavigate();
  const perPage = inTabs ? 3 : 10;
  const { getParam } = useUrlSearchParams();
  const pageParam = getParam("page");
  const page = pageParam && !inTabs ? parseInt(pageParam, 10) : 1;
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading } = useQuery({
    queryKey: [
      "doctor-consultations",
      { perPage: String(perPage), page: String(page), q: searchTerm },
    ],
    queryFn: () =>
      getDoctorConsultationsReq({
        perPage: String(perPage),
        page: String(page),
        q: searchTerm,
      }),
  });

  const typeMapping: Record<string, string> = {
    VIDEO: "Video Call",
    AUDIO: "Audio Call",
    IN_PERSON: "In Person",
  };

  const rawData = data?.data;
  const consultationItems: RawDoctorConsultation[] =
    rawData?.consultation || [];
  const totalPages = rawData?.meta?.lastPage ?? 1;

  const consultations: Consultation[] = consultationItems.map(
    (item: RawDoctorConsultation) => {
      const { date, time } = getZonedAppointmentDateTime(
        item.appointment_id?.scheduled_start_at_utc,
        item.appointment_id?.scheduled_end_at_utc,
        userTimezone,
      );

      return {
        id: item._id,
        appointmentId: item.appointment_id?._id,
        patientName: item.user_id
          ? `${item.user_id.first_name} ${item.user_id.last_name}`.trim()
          : "Unknown Patient",
        first_name: item.user_id?.first_name || "",
        last_name: item.user_id?.last_name || "",
        profile_picture_url: item.user_id?.profile_picture_url,
        ref: item.appointment_id?.appointment_number || item.consultation_id,
        type: typeMapping[item.type] || "Video Call",
        date,
        time,
        status: item.status,
      };
    },
  );

  const filteredConsultations = consultations;
  const hasConsultations = filteredConsultations.length > 0;

  const content = (
    <div className="mt-0 flex flex-col gap-2">
      {isLoading ? (
        Array.from({ length: inTabs ? 3 : 5 }).map((_, i) => (
          <ListRowSkeleton key={i} variant="date" />
        ))
      ) : filteredConsultations.length === 0 ? (
        <EmptyListState
          sectionLabel="Consultation history"
          title="No consultations yet"
          description="Patient consultations will appear here once appointments move into consultation. You can review your appointment queue in the meantime."
          actionLabel="View appointments"
          actionIcon={<CalendarDays className="h-5 w-5" strokeWidth={1.8} />}
          onAction={() => navigate("/doctor/dashboard/appointments")}
          inTabs={inTabs}
        />
      ) : (
        filteredConsultations.slice(0, inTabs ? 3 : undefined).map((c) => {
          const handleConsultationClick = () => {
            const url = `/doctor/dashboard/consultations/${c.id}${c.appointmentId ? `?appointmentId=${c.appointmentId}` : ""}`;
            navigate(url);
          };

          return (
            <div
              key={c.id}
              onClick={handleConsultationClick}
              className="block cursor-pointer hover:opacity-90 transition-opacity"
            >
              <ItemRow item={c} variant="date">
                <div className="flex items-center gap-2">
                  <ConsultationRecordStatusIcon
                    status={c.status}
                    audience="doctor"
                  />
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </ItemRow>
            </div>
          );
        })
      )}
      {inTabs ? (
        hasConsultations &&
        (rawData?.meta?.total ?? 0) > 3 && (
          <div className="flex justify-end mt-2">
            <Link
              to="/doctor/dashboard/consultations"
              className="text-sm hover:underline"
            >
              see all
            </Link>
          </div>
        )
      ) : hasConsultations ? (
        <Pagination totalPages={totalPages} />
      ) : null}
    </div>
  );

  if (inTabs) {
    return content;
  }

  if (!isLoading && !hasConsultations) {
    return content;
  }

  return (
    <div className="w-full rounded-xl bg-white shadow-sm border border-border p-4">
      {content}
    </div>
  );
}
