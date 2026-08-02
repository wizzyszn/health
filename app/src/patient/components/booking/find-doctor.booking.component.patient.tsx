import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NoDoctorIcon from "@/shared/components/svgs/icons/no-doctor.icon";
import { optimalLookupAvailableDoctorsReq } from "@/config/service/patient.service";
import type { BookingFormData } from "@/patient/lib/schemas";
import { format, parse } from "date-fns";
import { formatLocalDateTime, getBrowserTimeZone } from "@/lib/utils";

interface FindDoctorProps {
  onNext: () => void;
  onBack: () => void;
}

/** Common shape used to render doctor cards from both endpoints */
type DoctorListItem = {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  specializations: string[];
  profile_picture_url?: string;
};

const AVATAR_COLORS = [
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
];

const getInitials = (firstName: string, lastName: string) =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const MotionButton = motion.create(Button);

/** Extract duration in minutes from a time-slot string like "09:00 AM - 09:30 AM" */
const parseDuration = (slot: string): "15" | "30" | "45" | "60" => {
  const parts = slot.split(" - ");
  if (parts.length !== 2) return "30";

  const parseTime = (t: string) => {
    const [time, meridian] = t.trim().split(" ");
    const [h, minutes] = time.split(":").map(Number);
    let hours = h;
    if (meridian?.toUpperCase() === "PM" && hours !== 12) hours += 12;
    if (meridian?.toUpperCase() === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const diff = parseTime(parts[1]) - parseTime(parts[0]);
  if (diff <= 15) return "15";
  if (diff <= 30) return "30";
  if (diff <= 45) return "45";
  return "60";
};

const FindDoctor = ({ onNext, onBack }: FindDoctorProps) => {
  const { setValue, watch } = useFormContext<BookingFormData>();

  const selectedDate = watch("selectedDate");
  const timeSlot = watch("timeSlot");
  const currentDoctorId = watch("doctorId");

  const {
    data: availableResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["availableDoctors", selectedDate, timeSlot],
    queryFn: () => {
      const params: Parameters<typeof optimalLookupAvailableDoctorsReq>[0] = {
        duration: timeSlot ? parseDuration(timeSlot) : "30",
      };
      if (selectedDate) {
        const timeZone = getBrowserTimeZone();
        params.timezone = timeZone;

        try {
          const localDateTime = timeSlot
            ? parse(
                `${selectedDate} ${timeSlot.split(" - ")[0].trim()}`,
                "d MMMM yyyy hh:mm a",
                new Date(),
              )
            : parse(selectedDate, "d MMMM yyyy", new Date());

          params.datetime_local = formatLocalDateTime(localDateTime);
        } catch {
          params.datetime_local = `${format(
            parse(selectedDate, "d MMMM yyyy", new Date()),
            "yyyy-MM-dd",
          )}T00:00:00`;
        }
      }
      return optimalLookupAvailableDoctorsReq(params);
    },
    enabled: !!selectedDate,
  });

  const doctors: DoctorListItem[] = (() => {
    const result = availableResponse?.data;
    if (!result?.found) return [];
    return [
      {
        ...result.doctor,
        specializations: result.doctor.specializations as string[],
      },
    ];
  })();

  // Derived state to determine which doctor is currently active/selected
  const isCurrentDoctorInList = doctors.some((d) => d._id === currentDoctorId);
  const activeDoctor = isCurrentDoctorInList
    ? doctors.find((d) => d._id === currentDoctorId)
    : doctors[0];
  const activeDoctorId = activeDoctor?._id;

  const handleSelectDoctor = (doctor: (typeof doctors)[0]) => {
    setValue("doctorId", doctor._id, { shouldValidate: true });
    setValue("doctorName", doctor.full_name, { shouldValidate: true });
    setValue(
      "doctorSpecialty",
      doctor.specializations?.[0] ?? "General Physician",
      { shouldValidate: true },
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2 } },
  };

  const canContinue = !!activeDoctorId;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4">
        {/* Loading state */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              Loading available doctors…
            </p>
          </motion.div>
        )}

        {/* Error state */}
        {isError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-sm text-destructive mb-1">
              Something went wrong while fetching doctors.
            </p>
            <p className="text-xs text-muted-foreground">
              Please try again later.
            </p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence mode="wait">
          {!isLoading && !isError && (
            <motion.div
              key="available-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Available Doctors
              </p>

              {doctors.length > 0 ? (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="max-h-[300px] space-y-2 overflow-y-auto pr-1 md:max-h-[380px]"
                >
                  {doctors.map((doctor, index) => {
                    const isSelected = activeDoctorId === doctor._id;
                    return (
                      <motion.div
                        key={doctor._id}
                        variants={itemVariants}
                        whileTap={{ scale: 0.98 }}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {doctor.profile_picture_url ? (
                              <AvatarImage
                                src={doctor.profile_picture_url}
                                alt={doctor.full_name}
                              />
                            ) : null}
                            <AvatarFallback
                              className={
                                AVATAR_COLORS[index % AVATAR_COLORS.length]
                              }
                            >
                              {getInitials(doctor.first_name, doctor.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground line-clamp-1">
                              {doctor.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {doctor.specializations?.join(", ") ||
                                "General Physician"}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="ml-2 shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                            Selected
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <NoDoctorIcon size={80} />
                  </div>
                  <p className="font-semibold text-foreground mb-1">
                    No available doctors
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 max-w-[260px]">
                    No doctors are available for this timeslot. Please go back
                    and choose another timeslot.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-3 border-t border-border pt-5">
        <MotionButton
          variant="outline"
          className="h-10 flex-1"
          onClick={onBack}
          type="button"
        >
          Go Back
        </MotionButton>
        <MotionButton
          className="h-10 flex-1"
          onClick={() => {
            if (canContinue) {
              if (activeDoctor && currentDoctorId !== activeDoctor._id) {
                handleSelectDoctor(activeDoctor);
              }
              onNext();
            }
          }}
          type="button"
          disabled={!canContinue}
        >
          Continue
        </MotionButton>
      </div>
    </div>
  );
};

export default FindDoctor;
