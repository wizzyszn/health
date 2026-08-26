import { Link } from "react-router-dom";
import { CalendarPlus2, ChevronRight, RefreshCw } from "lucide-react";
import { ItemRow } from "./item-row.component.patient";
import { AppointmentStatusBadge } from "./appointment-status-badge.component.patient";
import { Appointment } from "../types/consultation.types";
import { Pagination } from "@/shared/components/pagination.component.shared";
import { getZonedAppointmentDateTime } from "@/lib/utils";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentsReq } from "@/config/service/patient.service";
import EditIcon from "@/shared/components/svgs/icons/edit.icon";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { EmptyListState } from "@/shared/components/empty-list-state.component.shared";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";
import { ListRowSkeleton } from "@/shared/components/list-row-skeleton.component.shared";

export function AppointmentList({
  searchTerm = "",
  inTabs = false,
}: {
  searchTerm?: string;
  inTabs?: boolean;
}) {
  const perPage = inTabs ? 3 : 10;
  const { updateParam, updateParams, getParam } = useUrlSearchParams();
  const pageParam = getParam("page");
  const page = pageParam && !inTabs ? parseInt(pageParam, 10) : 1;
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading } = useQuery({
    queryKey: [
      "appointments",
      { perPage: String(perPage), page: String(page), q: searchTerm },
    ],
    queryFn: () =>
      getAppointmentsReq({
        perPage: String(perPage),
        page: String(page),
        q: searchTerm,
      }),
  });

  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const appointments: Appointment[] = (data?.data?.items || []).map((item) => {
    const { date, time } = getZonedAppointmentDateTime(
      item.scheduled_start_at_utc,
      item.scheduled_end_at_utc,
      userTimezone,
    );

    const typeMapping: Record<string, string> = {
      VIDEO: "Video Call",
      AUDIO: "Audio Call",
      IN_PERSON: "In Person",
      MEETADOCTOR: "Meet a Doctor",
      HOMESERVICE: "Home Service",
    };

    return {
      id: item._id,
      doctorName: item.doctor_id?.full_name || "Unknown Doctor",
      specialty: item.doctor_id?.specializations?.[0] || "General Practitioner",
      ref: item.appointment_number,
      type: typeMapping[item.status] || "Video Call",
      date,
      time,
      status: item.status,
      hasRescheduledHistory: (item.rescheduled_history?.length ?? 0) > 0,
    };
  });

  const filteredAppointments = appointments;
  const hasAppointments = filteredAppointments.length > 0;

  const content = (
    <div className="mt-0 flex flex-col gap-2">
      {isLoading ? (
        Array.from({ length: inTabs ? 3 : 5 }).map((_, i) => (
          <ListRowSkeleton key={i} variant="date" />
        ))
      ) : filteredAppointments.length === 0 ? (
        <EmptyListState
          sectionLabel="Upcoming appointments"
          title="No upcoming appointments"
          description="You haven't booked any consultations yet. Let's find the right doctor for you."
          actionLabel="Book consultant"
          actionIcon={<CalendarPlus2 className="h-5 w-5" strokeWidth={1.8} />}
          onAction={() => updateParam("step", "0")}
          inTabs={inTabs}
        />
      ) : (
        filteredAppointments.map((a) => (
          <Link
            key={a.id}
            to={`/patient/dashboard/appointments/${a.id}`}
            className="block hover:opacity-90 transition-opacity"
          >
            <ItemRow item={a}>
              <div className="flex items-center gap-2">
                <AppointmentStatusBadge status={a.status} />
                {a.hasRescheduledHistory && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDE9FE] p-1 text-xs font-medium text-[#7C3AED]">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C3AED]">
                      <RefreshCw className="text-white" size={10} />
                    </span>
                    <span className="pr-1">Rescheduled</span>
                  </span>
                )}
                {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                  <button
                    type="button"
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateParams({ step: "1", appointmentId: a.id });
                    }}
                  >
                    <EditIcon />
                  </button>
                )}

                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </ItemRow>
          </Link>
        ))
      )}
      {inTabs && hasAppointments ? (
        <div className="flex justify-end mt-2">
          <Link
            to="/patient/dashboard/appointments"
            className="text-sm hover:underline "
          >
            see all
          </Link>
        </div>
      ) : !inTabs && hasAppointments ? (
        <Pagination totalPages={totalPages} />
      ) : null}
    </div>
  );

  if (inTabs) {
    return content;
  }

  if (!isLoading && !hasAppointments) {
    return content;
  }

  return (
    <div className="w-full rounded-xl bg-white shadow-sm border border-border p-4">
      {content}
    </div>
  );
}
