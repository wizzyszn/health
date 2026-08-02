import { Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import VerifiedSuccessIcon from "@/shared/components/svgs/icons/successful.icon";
import { formatZonedDate, formatZonedTimeRange } from "@/lib/utils";
import type { BookingFormData } from "@/patient/lib/schemas";
import type { BookingResponse } from "../modals/booking.modal.component.patient";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

interface AppointmentConfirmedProps {
  data: BookingFormData;
  appointmentResponse?: BookingResponse | null;
  onReset: () => void;
}

const MotionButton = motion.create(Button);

const AppointmentConfirmed = ({
  data,
  appointmentResponse,
  onReset,
}: AppointmentConfirmedProps) => {
  const userTimezone = useSelector((state: RootState) => state.auth.timezone);
  // Use server-confirmed times if available, fall back to form data
  const displayDate = appointmentResponse?.scheduled_start_at_utc
    ? formatZonedDate(
        appointmentResponse.scheduled_start_at_utc,
        { weekday: "long", day: "numeric", month: "long", year: "numeric" },
        "en-US",
        userTimezone,
      )
    : data.selectedDate
      ? `${data.selectedDate}`
      : "Friday, 30th June 2025";

  const displayTime =
    appointmentResponse?.scheduled_start_at_utc &&
    appointmentResponse?.scheduled_end_at_utc
      ? formatZonedTimeRange(
          appointmentResponse.scheduled_start_at_utc,
          appointmentResponse.scheduled_end_at_utc,
          { timeZone: userTimezone },
        )
      : data.timeSlot || "10:00 PM - 12:00 PM";

  const getDuration = (timeStr: string) => {
    try {
      if (!timeStr.includes(" - ")) return "1 hour";
      const [start, end] = timeStr.split(" - ");

      const parseTime = (t: string) => {
        const [time, meridian] = t.trim().split(" ");
        const timeParts = time.split(":").map(Number);
        let hours = timeParts[0];
        const minutes = timeParts[1] || 0;

        if (meridian?.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (meridian?.toUpperCase() === "AM" && hours === 12) hours = 0;

        return hours * 60 + minutes;
      };

      let diff = parseTime(end) - parseTime(start);
      if (diff < 0) diff += 24 * 60; // Handle overnight just in case

      if (diff === 60) return "1 hour";
      if (diff > 60) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return m > 0 ? `${h} hr ${m} mins` : `${h} hours`;
      }
      return `${diff} mins`;
    } catch {
      return "1 hour";
    }
  };

  const durationStr =
    appointmentResponse?.scheduled_start_at_utc &&
    appointmentResponse?.scheduled_end_at_utc
      ? (() => {
          const start = new Date(
            appointmentResponse.scheduled_start_at_utc,
          ).getTime();
          const end = new Date(
            appointmentResponse.scheduled_end_at_utc,
          ).getTime();
          const diff = Math.round((end - start) / 60000);
          if (diff === 60) return "1 hour";
          if (diff > 60) {
            const h = Math.floor(diff / 60);
            const m = diff % 60;
            return m > 0 ? `${h} hr ${m} mins` : `${h} hours`;
          }
          return `${diff} mins`;
        })()
      : getDuration(displayTime);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center text-center w-full"
    >
      <VerifiedSuccessIcon size={200} />

      <h2 className="text-xl font-semibold text-[#2B2B2B] mb-2">
        Appointment Confirmed!
      </h2>

      {appointmentResponse?.appointment_number && (
        <p className="text-sm text-muted-foreground mb-4">
          Appointment #{appointmentResponse.appointment_number}
        </p>
      )}

      <div className="space-y-2 text-sm text-muted-foreground mb-8">
        <div className="flex items-center justify-center gap-2">
          <Calendar size={16} color="#6C6C6C" />
          <span className="text-[#2B2B2B]">{displayDate}</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Calendar size={16} color="#6C6C6C" />
          <span className="text-[#2B2B2B]">
            {displayTime} ({durationStr})
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex gap-3 w-full max-w-md"
      >
        <MotionButton
          className="flex-1 h-12"
          onClick={onReset}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Book again
        </MotionButton>
      </motion.div>
    </motion.div>
  );
};

export default AppointmentConfirmed;
