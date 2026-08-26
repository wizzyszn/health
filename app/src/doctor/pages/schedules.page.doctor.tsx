import {
  getDoctorSchedules,
  getDoctorAvailabilitySlotReq,
  getDoctorConsultationsReq,
} from "@/config/service/doctor.service";
import { FullCalendarData } from "@/lib/types";
import { getBrowserTimeZone } from "@/lib/utils";
import ViewSchedules from "@/shared/components/view-schedules.component";
import { format, getISOWeek, getISOWeekYear } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useState } from "react";
import { DatesSetArg } from "@fullcalendar/core/index.js";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

import { useQuery } from "@tanstack/react-query";
import SEO from "@/shared/components/seo.component";

const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Video Call",
  AUDIO: "Audio Call",
  IN_PERSON: "In Person",
};

function Schedules() {
  const [dateRange, setDateRange] = useState({
    week: "",
    year: "",
    startDate: "",
    endDate: "",
  });
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);

  const { data, isLoading } = useQuery({
    queryKey: ["schedules", dateRange.week, dateRange.year],
    queryFn: () =>
      getDoctorSchedules({
        weekly: dateRange.week,
        year: dateRange.year,
      }),
    enabled: !!dateRange.week && !!dateRange.year,
  });

  const { data: availabilityData } = useQuery({
    queryKey: ["availability"],
    queryFn: () => getDoctorAvailabilitySlotReq(),
  });

  const { data: consultationsData, isLoading: isConsultationsLoading } =
    useQuery({
      queryKey: [
        "doctor-schedule-consultations",
        dateRange.startDate,
        dateRange.endDate,
      ],
      queryFn: () =>
        getDoctorConsultationsReq({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          perPage: "100",
          page: "1",
        }),
      enabled: !!dateRange.startDate && !!dateRange.endDate,
    });

  const refinedAppointments: FullCalendarData = (
    data?.data?.appointments || []
  ).map((appointment) => {
    const timeZone =
      userTimezone || appointment.timezone_snapshot || getBrowserTimeZone();
    const zonedStart = toZonedTime(
      new Date(appointment.scheduled_start_at_utc),
      timeZone,
    );
    const zonedEnd = toZonedTime(
      new Date(appointment.scheduled_end_at_utc),
      timeZone,
    );

    const startStr = format(zonedStart, "yyyy-MM-dd'T'HH:mm:ss");
    const endStr = format(zonedEnd, "yyyy-MM-dd'T'HH:mm:ss");

    const patientName = appointment.patient_id
      ? `${appointment.patient_id.first_name} ${appointment.patient_id.last_name}`
      : "Patient";
    const consType = "";

    const baseTitle =
      appointment.reason_for_visit ||
      `Appointment ${appointment.appointment_number}`;
    const uniqueId = appointment.appointment_number;
    const fullTitle = `${patientName}  - ${uniqueId} - ${baseTitle}`;

    // The main title doctors see on the slot
    const title = patientName;

    return {
      start: startStr,
      end: endStr,
      endStr: endStr,
      startStr: startStr,
      date: format(zonedStart, "yyyy-MM-dd"),
      _id: appointment._id || "",
      consultationId: appointment.consultation_id?._id,
      title: title.trim(),
      fullTitle: fullTitle.trim(),
      details: appointment.reason_for_visit,
      patientName: patientName,
      consultationType: consType,
      status: appointment.status,
    };
  });

  const refinedBlackouts: FullCalendarData = (data?.data?.blackouts || []).map(
    (blackout) => {
      const timeZone =
        userTimezone || blackout.timezone || getBrowserTimeZone();
      const zonedStart = toZonedTime(new Date(blackout.start_at_utc), timeZone);
      const zonedEnd = toZonedTime(new Date(blackout.end_at_utc), timeZone);

      const startStr = format(zonedStart, "yyyy-MM-dd'T'HH:mm:ss");
      const endStr = format(zonedEnd, "yyyy-MM-dd'T'HH:mm:ss");

      return {
        start: startStr,
        end: endStr,
        endStr: endStr,
        startStr: startStr,
        date: format(zonedStart, "yyyy-MM-dd"),
        _id: blackout._id || "",
        title: "Unavailable",
        display: "background",
        status: "BLACKOUT",
      };
    },
  );

  const refinedCompletedConsultations: FullCalendarData = (
    consultationsData?.data?.consultation || []
  )
    .filter((consultation) => consultation.status === "COMPLETED")
    .map((consultation) => {
      const appointment = consultation.appointment_id;
      const timeZone =
        userTimezone || appointment.timezone_snapshot || getBrowserTimeZone();
      const zonedStart = toZonedTime(
        new Date(appointment.scheduled_start_at_utc),
        timeZone,
      );
      const zonedEnd = toZonedTime(
        new Date(appointment.scheduled_end_at_utc),
        timeZone,
      );

      const startStr = format(zonedStart, "yyyy-MM-dd'T'HH:mm:ss");
      const endStr = format(zonedEnd, "yyyy-MM-dd'T'HH:mm:ss");

      const patientName = consultation.user_id
        ? `${consultation.user_id.first_name} ${consultation.user_id.last_name}`
        : "Patient";
      const consType =
        CONSULTATION_TYPE_LABELS[consultation.type] || consultation.type;

      const baseTitle =
        appointment.reason_for_visit ||
        consultation.title ||
        `Consultation ${consultation.consultation_id}`;
      const uniqueId = appointment.appointment_number;
      const fullTitle = `${patientName} - ${uniqueId} - ${baseTitle}`;

      return {
        start: startStr,
        end: endStr,
        endStr,
        startStr,
        date: format(zonedStart, "yyyy-MM-dd"),
        _id: appointment._id || "",
        consultationId: consultation._id,
        title: patientName.trim(),
        fullTitle: fullTitle.trim(),
        details: consultation.details || appointment.reason_for_visit,
        patientName,
        consultationType: consType,
        status: "CONSULTATION_COMPLETED",
      };
    });

  const refinedAvailability: FullCalendarData = (
    availabilityData?.data?.weekly_slots || []
  )
    .filter((slot) => slot.is_active)
    .map((slot) => {
      return {
        _id: `availability-${slot.day_of_week}-${slot.start_time}`,
        title: "Unavailable",
        start: "",
        end: "",
        endStr: "",
        startStr: "",
        date: "",
        startTime: slot.start_time,
        endTime: slot.end_time,
        daysOfWeek: [slot.day_of_week],
        display: "inverse-background",
        status: "BLACKOUT",
        groupId: "availableForInverse",
      };
    });

  const refinedData: FullCalendarData = [
    ...(refinedAppointments || []),
    ...(refinedCompletedConsultations || []),
    ...(refinedBlackouts || []),
    ...(refinedAvailability || []),
  ];

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    const midpoint = new Date(
      (dateInfo.start.getTime() + dateInfo.end.getTime()) / 2,
    );

    setDateRange({
      week: getISOWeek(midpoint).toString(),
      year: getISOWeekYear(midpoint).toString(),
      startDate: format(dateInfo.start, "yyyy-MM-dd"),
      endDate: format(dateInfo.end, "yyyy-MM-dd"),
    });
  };

  return (
    <>
      <SEO
        title="Schedules"
        description="View your doctor schedules and availability on Carelexa."
        canonicalPath="/doctor/dashboard/schedules"
      />
      <div className="w-full h-full overflow-auto rounded-md bg-white">
        <ViewSchedules
          data={refinedData}
          loading={isLoading || isConsultationsLoading}
          user="doctor"
          datesSetHandler={handleDatesSet}
        />
      </div>
    </>
  );
}

export default Schedules;
