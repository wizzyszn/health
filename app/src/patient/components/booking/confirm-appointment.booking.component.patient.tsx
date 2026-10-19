import {
  Calendar,
  Video,
  Globe,
  AlarmClock,
  Loader2,
  Phone,
  MessageSquare,
  User,
  Home,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { BookingFormData } from "@/patient/lib/schemas";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.bubble.css";

interface ConfirmAppointmentProps {
  onNext: () => void;
  onBack: () => void;
  isPending?: boolean;
  isReschedule?: boolean;
}

const MotionButton = motion.create(Button);

const ConfirmAppointment = ({
  onBack,
  onNext,
  isPending,
  isReschedule,
}: ConfirmAppointmentProps) => {
  const { getValues } = useFormContext<BookingFormData>();
  const data = getValues();

  const getConsultationDisplay = (type?: string) => {
    switch (type) {
      case "AUDIO":
        return {
          icon: <Phone size={16} color="#6C6C6C" />,
          label: "Audio Call",
          platform: "Phone Number",
        };
      case "CHAT":
        return {
          icon: <MessageSquare size={16} color="#6C6C6C" />,
          label: "Chat Consultation",
          platform: "In-App Chat",
        };
      case "MEETADOCTOR":
        return {
          icon: <User size={16} color="#6C6C6C" />,
          label: "In-Person Visit",
          platform: "Hospital / Clinic",
        };
      case "HOMESERVICE":
        return {
          icon: <Home size={16} color="#6C6C6C" />,
          label: "Home Service",
          platform: "Patient's Address",
        };
      case "VIDEO":
      default:
        return {
          icon: <Video size={16} color="#6C6C6C" />,
          label: "Video Call",
          platform: "Carelexa",
        };
    }
  };

  const consultationConfig = getConsultationDisplay(data.consultationType);
  const displayDoctorName = data.suggestedDoctorName || data.doctorName || "";
  const displayDoctorSpecialty =
    data.suggestedDoctorSpecialty ||
    data.doctorSpecialty ||
    "General physician";
  const isNewRescheduledDoctor =
    !!isReschedule &&
    !!data.originalDoctorId &&
    !!data.doctorId &&
    data.originalDoctorId !== data.doctorId;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3.5"
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-amber-100 text-amber-700">
              {displayDoctorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {displayDoctorName}
            </p>
            <p className="text-xs text-muted-foreground">
              {displayDoctorSpecialty}
            </p>
          </div>
        </div>

        {isNewRescheduledDoctor && (
          <span className="inline-flex shrink-0 items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            New rescheduled doctor
          </span>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3.5 sm:grid-cols-2"
      >
        <div className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {data.suggestedDate || data.selectedDate || ""}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <AlarmClock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {data.suggestedTimeSlot || data.timeSlot || ""}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 text-muted-foreground">
            {consultationConfig.icon}
          </span>
          <span className="text-sm text-foreground">
            {consultationConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {consultationConfig.platform}
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Complaint
        </p>
        <p className="max-h-[120px] overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground custom-scrollbar">
          {data.reasonForAppointment ||
            "General Checkup-Patient reported mild headaches and fatigue"}
        </p>
      </motion.div>

      {data.complaintDetails && (
        <motion.div variants={itemVariants} className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Complaint Details
          </p>
          <div className="max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            <ReactQuill
              value={data.complaintDetails}
              readOnly
              theme="bubble"
              className="text-sm text-muted-foreground [&_.ql-editor]:p-0"
            />
          </div>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="mt-6 border-t border-border pt-5"
      >
        <p className="mb-4 text-xs text-muted-foreground">
          By clicking {isReschedule ? "reschedule" : "confirm booking"}, you've
          agreed to{" "}
          <span className="font-medium text-foreground">
            Carelexa's Consultant's terms
          </span>
        </p>
        <div className="flex gap-3">
          <MotionButton
            variant="outline"
            className="h-10 flex-1"
            onClick={onBack}
            type="button"
            disabled={isPending}
          >
            Go Back
          </MotionButton>
          <MotionButton
            className="h-10 flex-1"
            onClick={() => {
              if (isPending) return;
              onNext();
            }}
            type="button"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isReschedule ? (
              "Reschedule Appointment"
            ) : (
              "Book appointments"
            )}
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmAppointment;
