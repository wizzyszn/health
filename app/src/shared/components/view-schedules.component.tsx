import Calendar from "./full-calendar.component";
import { FullCalendarData } from "@/lib/types";
import { EventClickArg, DatesSetArg } from "@fullcalendar/core/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/shared/hooks/use-mobile";

import "./view-schedule.css";
import { useNavigate } from "react-router-dom";
interface Props {
  data: FullCalendarData;
  loading?: boolean;
  user: "doctor" | "patient" | "admin";
  datesSetHandler?: (dateInfo: DatesSetArg) => void;
}
function ViewSchedules({ data, loading, user, datesSetHandler }: Props) {
  const [offset, setOffset] = useState<{ X: number; Y: number }>({
    X: 0,
    Y: 0,
  });
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg | null>(
    null,
  );
  const calendarRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close popover if clicking outside both the popover container and calendar events
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest(".fc-event")
      ) {
        closePopover();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const eventClickHandler = (e: EventClickArg) => {
    // Prevent interaction with blackout (background) and inverse background events
    if (
      e.event.display === "background" ||
      e.event.display === "inverse-background"
    ) {
      return;
    }

    if (calendarRef.current) {
      const rect = calendarRef.current.getBoundingClientRect();
      const popoverWidth = 320;

      const clickX = e.jsEvent.clientX - rect.left;
      const clickY = e.jsEvent.clientY - rect.top;

      let leftPosition = clickX + 20;

      // Prevent popover from overflowing the right side of the calendar
      if (leftPosition + popoverWidth > rect.width) {
        leftPosition = Math.max(10, clickX - popoverWidth - 20);
      }

      setOffset({
        X: leftPosition,
        Y: clickY,
      });
    }

    setSelectedEvent(e);
  };
  const handleNavigateToConsultation = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();
      const proxy =
        user === "patient" ? "patient" : user === "doctor" ? "doctor" : "admin";

      const props = selectedEvent?.event.extendedProps;
      const status = props?.status;
      const id = props?._id;
      const consultationId = props?.consultationId;

      if (
        status === "CONFIRMED" ||
        status === "ACTIVE" ||
        status === "CONSULTATION_COMPLETED"
      ) {
        if (consultationId) {
          navigate(`/${proxy}/dashboard/consultations/${consultationId}`);
        } else {
          // If for some reason we missed the consultation ID, fail gracefully
          navigate(`/${proxy}/dashboard/appointments/${id}`);
        }
      } else {
        navigate(`/${proxy}/dashboard/appointments/${id}`);
      }
    },
    [selectedEvent, user, navigate],
  );
  // Close popover when clicking outside
  const closePopover = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="relative p-2 md:p-5 h-auto w-full" ref={calendarRef}>
      <Calendar
        data={data}
        eventClickHandler={eventClickHandler}
        datesSetHandler={datesSetHandler}
        loading={loading}
      />

      {selectedEvent && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={closePopover}
            />
          )}
          <div
            ref={popoverRef}
            className={`${isMobile ? "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)]" : "absolute min-w-[300px]"} z-50 bg-white border border-gray-100 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.2)] p-4 text-sm max-w-sm mx-auto`}
            style={
              isMobile
                ? {}
                : {
                    top: `${offset.Y}px`,
                    left: `${offset.X}px`,
                  }
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h3
                className="font-semibold text-lg text-gray-800 pr-2"
                title={
                  selectedEvent.event.extendedProps?.fullTitle ||
                  selectedEvent.event.title
                }
              >
                {(
                  selectedEvent.event.extendedProps?.fullTitle ||
                  selectedEvent.event.title
                ).length > 30
                  ? `${(selectedEvent.event.extendedProps?.fullTitle || selectedEvent.event.title).slice(0, 60)}...`
                  : selectedEvent.event.extendedProps?.fullTitle ||
                    selectedEvent.event.title}
              </h3>
              {/* {selectedEvent.event.extendedProps?.consultationType && (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                {selectedEvent.event.extendedProps.consultationType}
              </span>
            )} */}
            </div>

            <div className="mb-3">
              <p className="text-xs mt-1 text-gray-500 font-medium">
                {new Date(
                  selectedEvent.event.extendedProps.startStr,
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                •{" "}
                {new Date(
                  selectedEvent.event.extendedProps.startStr,
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}{" "}
                -{" "}
                {new Date(
                  selectedEvent.event.extendedProps.endStr,
                ).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>

            {selectedEvent.event.extendedProps?.details && (
              <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm mb-4 leading-relaxed max-h-32 overflow-y-auto">
                <span className="font-semibold block mb-1">Details:</span>
                {selectedEvent.event.extendedProps.details}
              </div>
            )}

            <div className="flex gap-3 items-center mt-3 pt-3 border-t border-gray-100">
              <button
                className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors w-full"
                onClick={handleNavigateToConsultation}
              >
                View Details
              </button>
              <button
                className="px-4 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors w-full"
                onClick={closePopover}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ViewSchedules;
