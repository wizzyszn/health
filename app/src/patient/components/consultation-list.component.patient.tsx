import { Link } from "react-router-dom";
import { CalendarPlus2, ChevronRight } from "lucide-react";
import { ConsultationRecordStatusIcon } from "@/shared/components/consultation-record-status-icon.component.shared";
import { ItemRow } from "./item-row.component.patient";
import { Consultation } from "../types/consultation.types";
import { useQuery } from "@tanstack/react-query";
import { getAllConsultationsForPatient } from "@/config/service/patient.service";
import { Pagination } from "@/shared/components/pagination.component.shared";
import { getZonedAppointmentDateTime } from "@/lib/utils";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { EmptyListState } from "@/shared/components/empty-list-state.component.shared";
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
  const perPage = inTabs ? 3 : 10;
  const { updateParam, getParam } = useUrlSearchParams();
  const pageParam = getParam("page");
  const page = pageParam && !inTabs ? parseInt(pageParam, 10) : 1;
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading } = useQuery({
    queryKey: ["consultations", { perPage, page, searchTerm }],
    queryFn: () =>
      getAllConsultationsForPatient(
        page,
        perPage,
        undefined,
        undefined,
        searchTerm || undefined,
      ),
  });

  const typeMapping: Record<string, string> = {
    VIDEO: "Video Call",
    AUDIO: "Audio Call",
    IN_PERSON: "In Person",
  };

  const rawData = data?.data;
  const consultationItems = rawData?.consultation || [];
  const totalPages = rawData?.meta?.lastPage ?? 1;

  const consultations: Consultation[] = consultationItems.map((item) => {
    const { date, time } = getZonedAppointmentDateTime(
      item.appointment_id?.scheduled_start_at_utc,
      item.appointment_id?.scheduled_end_at_utc,
      userTimezone,
    );

    return {
      id: item._id,
      doctorName: item.doctor_id?.full_name || "Unknown Doctor",
      specialty: item.doctor_id?.specializations?.[0] || "General Practitioner",
      ref: item.appointment_id?.appointment_number || item.consultation_id,
      type: typeMapping[item.type] || "Video Call",
      date,
      time,
      status: item.status,
    };
  });

  const filteredConsultations = consultations;
  const hasConsultations = filteredConsultations.length > 0;

  const content = (
    <div className="mt-0 flex flex-col gap-2 md:gap-3">
      {isLoading ? (
        Array.from({ length: inTabs ? 3 : 5 }).map((_, i) => (
          <ListRowSkeleton key={i} variant="date" />
        ))
      ) : filteredConsultations.length === 0 ? (
        <EmptyListState
          sectionLabel="Consultation history"
          title="No consultations yet"
          description="Your consultation history will appear here after your appointments are completed. You can book a consultation to get started."
          actionLabel="Book consultant"
          actionIcon={<CalendarPlus2 className="h-5 w-5" strokeWidth={1.8} />}
          onAction={() => updateParam("step", "0")}
          inTabs={inTabs}
        />
      ) : (
        filteredConsultations.map((c) => (
          <Link
            key={c.id}
            to={`/patient/dashboard/consultations/${c.id}`}
            className="block hover:opacity-90 transition-opacity"
          >
            <ItemRow item={c}>
              <div className="flex items-center gap-2">
                <ConsultationRecordStatusIcon
                  status={c.status}
                  audience="patient"
                />
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </ItemRow>
          </Link>
        ))
      )}
      {inTabs && hasConsultations ? (
        <div className="flex justify-end mt-2">
          <Link
            to="/patient/dashboard/consultations"
            className="text-sm hover:underline "
          >
            see all
          </Link>
        </div>
      ) : !inTabs && hasConsultations ? (
        <Pagination totalPages={totalPages} />
      ) : null}
    </div>
  );

  const renderedContent =
    inTabs || (!isLoading && !hasConsultations) ? (
      content
    ) : (
      <div className="w-full rounded-xl bg-white shadow-sm border border-border p-3 md:p-4">
        {content}
      </div>
    );

  return renderedContent;
}
