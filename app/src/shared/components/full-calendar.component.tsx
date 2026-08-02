import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core/index.js";
import { FullCalendarData } from "@/lib/types";
import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";

interface Props {
  data: FullCalendarData;
  eventClickHandler: (event: EventClickArg) => void;
  datesSetHandler?: (dateInfo: DatesSetArg) => void;
  loading?: boolean;
}

const getEventClassName = (status?: string) => {
  switch (status) {
    case "APPROVED":
    case "ACTIVE":
    case "CONFIRMED":
    case "RESCHEDULED":
      return "event-approved";
    case "PENDING":
      return "event-pending";
    case "CANCELLED":
    case "CANCELED":
    case "NO_SHOW":
    case "FAILED":
    case "FORFEITED":
      return "event-cancelled";
    case "COMPLETED":
      return "event-completed";
    case "CONSULTATION_COMPLETED":
      return "event-consultation-completed";
    case "BLACKOUT":
      return "event-blackout";
    default:
      return "event-default";
  }
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Calendar({
  data,
  eventClickHandler,
  datesSetHandler,
  loading,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
  const isMobile = useIsMobile();

  // Handle switching view based on isMobile
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (isMobile) {
        api.changeView("timeGridDay");
      } else {
        api.changeView("timeGridWeek");
      }
    }
  }, [isMobile]);

  // Sync currentDate when the calendar view changes
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      const midpoint = new Date(
        (dateInfo.start.getTime() + dateInfo.end.getTime()) / 2,
      );
      setCurrentDate(midpoint);
      datesSetHandler?.(dateInfo);
    },
    [datesSetHandler],
  );

  // Close picker on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPicker]);

  const jumpTo = (month: number) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(new Date(pickerYear, month, 1));
    setShowPicker(false);
  };

  const titleText = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border border-gray-100">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            <span className="text-sm font-medium text-gray-600">
              Loading schedule...
            </span>
          </div>
        </div>
      )}

      {/* Custom clickable month/year title with picker */}
      <div className="flex justify-center mb-2 relative" ref={pickerRef}>
        <button
          type="button"
          className="text-lg font-medium text-gray-800 hover:text-primary transition-colors cursor-pointer px-3 py-1 rounded-md hover:bg-gray-100"
          onClick={() => {
            setPickerYear(currentDate.getFullYear());
            setShowPicker((prev) => !prev);
          }}
        >
          {titleText}
        </button>

        {showPicker && (
          <div className="absolute top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72">
            {/* Year selector */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                onClick={() => setPickerYear((y) => y - 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="font-semibold text-gray-800">{pickerYear}</span>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                onClick={() => setPickerYear((y) => y + 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2">
              {MONTHS.map((month, idx) => {
                const isActive =
                  idx === currentDate.getMonth() &&
                  pickerYear === currentDate.getFullYear();
                return (
                  <button
                    key={month}
                    type="button"
                    className={`text-sm py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => jumpTo(idx)}
                  >
                    {month.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
        firstDay={1}
        timeZone="local"
        headerToolbar={{
          left: "prev,next",
          center: "",
          right: isMobile ? "" : "timeGridWeek,timeGridDay",
        }}
        events={data}
        eventClick={eventClickHandler}
        datesSet={handleDatesSet}
        // Add event class names based on status
        eventClassNames={(arg) => {
          const status = arg.event.extendedProps?.status;
          return [getEventClassName(status)];
        }}
        height="auto"
        titleFormat={{ year: "numeric", month: "long" }}
        slotDuration="00:15:00"
        slotLabelInterval="01:00:00"
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        snapDuration="00:15:00"
        eventMinHeight={20}
        displayEventTime={false}
        dayHeaderContent={(dayHeader) => {
          const date = new Date(dayHeader.date);
          const weekday = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const day = date.getDate().toString();
          return (
            <div className="flex flex-col gap-2 items-center justify-center">
              <span className=" font-light uppercase text-xs">{weekday}</span>
              <span
                className={`${dayHeader.isToday ? "border bg-primary text-white" : ""} size-12 rounded-full text-2xl flex justify-center items-center font-normal`}
              >
                {day}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
