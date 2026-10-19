import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFormContext } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Info,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatLocalDateTime, getBrowserTimeZone } from "@/lib/utils";
import {
  addDays,
  format,
  isSameDay,
  parse,
  startOfToday,
  eachDayOfInterval,
  isAfter,
  isBefore,
} from "date-fns";
import type { BookingFormData } from "@/patient/lib/schemas";
import {
  checkDoctorAvailabilityReq,
  type BookingAvailabilityByDate,
} from "@/config/service/patient.service";
import type { RejectedPayload } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MINUTES = ["00", "15", "30", "45"];

function generateTimeIntervals(meridiem: string) {
  return Array.from({ length: 12 }, (_, hour) => {
    const displayHour = hour === 0 ? 12 : hour;
    return MINUTES.map(
      (min) => `${String(displayHour).padStart(2, "0")}:${min} ${meridiem}`,
    );
  }).flat();
}

const ALL_INTERVALS = generateTimeIntervals("AM").concat(
  generateTimeIntervals("PM"),
);

function getEndTimeByBlocks(startInterval: string, blocks: number) {
  const idx = ALL_INTERVALS.indexOf(startInterval);
  if (idx === -1) return startInterval;
  const endIdx = idx + blocks;
  if (endIdx < ALL_INTERVALS.length) return ALL_INTERVALS[endIdx];
  return "12:00 AM";
}

type TimeIntervalAvailability = Record<
  string,
  {
    availableDoctors: number;
    maxConsecutiveSlots: number;
    /** The patient already has an appointment overlapping this slot. */
    patientConflict: boolean;
    /** Free, but an appointment of theirs caps how long a booking here can run. */
    patientLimitsDuration: boolean;
  }
>;

const TIME_GROUPS = [
  {
    title: "Morning",
    icon: Sunrise,
    range: [24, 48] as const,
    gradient: "from-amber-50 to-orange-50",
    iconColor: "text-amber-500",
    borderColor: "border-amber-100",
  },
  {
    title: "Afternoon",
    icon: Sun,
    range: [48, 68] as const,
    gradient: "from-sky-50 to-blue-50",
    iconColor: "text-sky-500",
    borderColor: "border-sky-100",
  },
  {
    title: "Evening",
    icon: Sunset,
    range: [68, 96] as const,
    gradient: "from-violet-50 to-purple-50",
    iconColor: "text-violet-500",
    borderColor: "border-violet-100",
  },
  {
    title: "Night",
    icon: Moon,
    range: [0, 24] as const,
    gradient: "from-slate-50 to-indigo-50",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-100",
  },
];

const DURATION_OPTIONS = [
  { value: 1, label: "15 min", minutes: 15 },
  { value: 2, label: "30 min", minutes: 30 },
  { value: 3, label: "45 min", minutes: 45 },
  { value: 4, label: "1 hour", minutes: 60 },
];

// const CONSULTATION_TYPES = [
//   { value: "VIDEO", label: "Video", icon: Video },
//   { value: "AUDIO", label: "Audio", icon: Phone },
//   { value: "CHAT", label: "Chat", icon: MessageSquare },
//   { value: "MEETADOCTOR", label: "In-Person", icon: User },
//   { value: "HOMESERVICE", label: "Home Visit", icon: Home },
// ] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChooseTimeSlotProps {
  onNext: () => void;
  onBack: () => void;
  onDoctorUnavailable?: () => void;
  isReschedule?: boolean;
  availabilityByDate?: BookingAvailabilityByDate;
  isAvailabilityLoading?: boolean;
  availabilityStartDate?: Date;
  availabilityEndDate?: Date;
}

const MotionButton = motion.create(Button);

const formatSelectedDate = (date: Date) => format(date, "d MMMM yyyy");

const parseStoredDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = parse(value, "d MMMM yyyy", new Date());
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ChooseTimeSlot = ({
  onNext,
  onBack,
  onDoctorUnavailable,
  isReschedule,
  availabilityByDate,
  isAvailabilityLoading,
  availabilityStartDate,
  availabilityEndDate,
}: ChooseTimeSlotProps) => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BookingFormData>();

  const selectedTimeSlot = watch("timeSlot");
  const selectedDateValue = watch("selectedDate");
  const originalSelectedDate = watch("originalSelectedDate");
  const originalTimeSlot = watch("originalTimeSlot");

  const today = startOfToday();
  const enabledStartDate = availabilityStartDate || today;
  const enabledEndDate = availabilityEndDate;
  const selectedDate = parseStoredDate(selectedDateValue);

  const isSelectedDateWithinAvailabilityRange = Boolean(
    selectedDate &&
    selectedDate >= enabledStartDate &&
    (!enabledEndDate || selectedDate <= enabledEndDate),
  );

  // ── Duration state ──────────────────────────────────────────────────────────
  const [durationBlocks, setDurationBlocks] = useState(() => {
    // Derive initial duration from existing timeSlot if present
    if (selectedTimeSlot) {
      const [startStr, endStr] = selectedTimeSlot.split(" - ");
      if (startStr && endStr) {
        const base = new Date();
        const s = parse(startStr.trim(), "hh:mm a", base);
        const e = parse(endStr.trim(), "hh:mm a", base);
        const blocks = Math.ceil((e.getTime() - s.getTime()) / 1000 / 60 / 15);
        if (blocks >= 1 && blocks <= 4) return blocks;
      }
    }
    return 2; // Default to 30 min
  });

  // ── Date strip state ────────────────────────────────────────────────────────
  const [stripOffset, setStripOffset] = useState(0);

  const allDates = useMemo(() => {
    if (!enabledEndDate)
      return eachDayOfInterval({
        start: enabledStartDate,
        end: addDays(enabledStartDate, 13),
      });
    return eachDayOfInterval({ start: enabledStartDate, end: enabledEndDate });
  }, [enabledStartDate, enabledEndDate]);

  const VISIBLE_DATES = 7;
  const canScrollLeft = stripOffset > 0;
  const canScrollRight = stripOffset + VISIBLE_DATES < allDates.length;
  const dateStripTranslateX =
    allDates.length > 0 ? -(stripOffset / allDates.length) * 100 : 0;

  // ── Availability per date ───────────────────────────────────────────────────
  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : "";

  const selectedDateAvailabilitySlots = useMemo(() => {
    if (!selectedDate || !isSelectedDateWithinAvailabilityRange) return [];
    const slots = availabilityByDate?.[selectedDateKey]?.slots || [];
    return slots;
  }, [
    availabilityByDate,
    isSelectedDateWithinAvailabilityRange,
    selectedDate,
    selectedDateKey,
  ]);

  const isSelectedDateAvailabilityLoaded = Boolean(
    selectedDate && isSelectedDateWithinAvailabilityRange && availabilityByDate,
  );

  const selectedDateAvailabilityByTime =
    useMemo<TimeIntervalAvailability | null>(() => {
      if (!isSelectedDateAvailabilityLoaded) return null;
      return selectedDateAvailabilitySlots.reduce<TimeIntervalAvailability>(
        (lookup, slot) => {
          lookup[slot.time] = {
            availableDoctors: slot.available_doctors,
            maxConsecutiveSlots: slot.max_consecutive_slots,
            patientConflict: slot.patient_conflict === true,
            patientLimitsDuration: slot.patient_limits_duration === true,
          };
          return lookup;
        },
        {},
      );
    }, [isSelectedDateAvailabilityLoaded, selectedDateAvailabilitySlots]);

  // Drives the legend: is any visible time blocked because the patient already
  // holds an overlapping appointment? Only then is the amber note worth showing.
  const hasPatientConflictOnSelectedDate = useMemo(() => {
    if (!selectedDateAvailabilityByTime) return false;
    return Object.values(selectedDateAvailabilityByTime).some(
      (slot) => slot.patientConflict,
    );
  }, [selectedDateAvailabilityByTime]);

  // Companion legend line: a slot can be free and still not fit the chosen
  // duration because one of the patient's own appointments begins right after
  // it. Recomputed per duration, since a shorter booking may fit fine.
  const hasPatientDurationLimitOnSelectedDate = useMemo(() => {
    if (!selectedDateAvailabilityByTime) return false;
    return Object.values(selectedDateAvailabilityByTime).some(
      (slot) =>
        slot.patientLimitsDuration && slot.maxConsecutiveSlots < durationBlocks,
    );
  }, [selectedDateAvailabilityByTime, durationBlocks]);

  // ── Per-date availability indicator (does this date have any available slots?) ──
  const dateHasAvailability = useCallback(
    (date: Date) => {
      if (!availabilityByDate) return false;
      const key = format(date, "yyyy-MM-dd");
      const dayData = availabilityByDate[key];
      if (!dayData?.slots) return false;
      return dayData.slots.some((s) => s.available_doctors > 0);
    },
    [availabilityByDate],
  );

  // ── Past-time filter ────────────────────────────────────────────────────────
  const disabledIntervals = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const now = new Date();
    if (!isSameDay(selectedDate, now)) return new Set<string>();
    return new Set(
      ALL_INTERVALS.filter((interval) => {
        const slotStart = parse(interval, "hh:mm a", selectedDate);
        return slotStart <= now;
      }),
    );
  }, [selectedDate]);

  // ── Slot availability checks ────────────────────────────────────────────────
  const canStartSelection = useCallback(
    (interval: string) => {
      const slot = selectedDateAvailabilityByTime?.[interval];
      const result = Boolean(
        slot &&
        slot.availableDoctors > 0 &&
        slot.maxConsecutiveSlots >= durationBlocks,
      );
      return result;
    },
    [selectedDateAvailabilityByTime, durationBlocks],
  );

  const isSlotSelectable = useCallback(
    (interval: string) => {
      return (
        !!selectedDate &&
        isSelectedDateAvailabilityLoaded &&
        !isAvailabilityLoading &&
        !disabledIntervals.has(interval) &&
        canStartSelection(interval)
      );
    },
    [
      selectedDate,
      isSelectedDateAvailabilityLoaded,
      isAvailabilityLoading,
      disabledIntervals,
      canStartSelection,
    ],
  );

  // ── Currently selected start interval ───────────────────────────────────────
  const selectedStartInterval = useMemo(() => {
    if (!selectedTimeSlot) return "";
    return selectedTimeSlot.split(" - ")[0]?.trim() || "";
  }, [selectedTimeSlot]);

  // ── Time grid: generate slots at stepped intervals based on duration ────────
  const timeGridGroups = useMemo(() => {
    // For durations > 15 min, show every slot (not just every durationBlocks slots)
    // because availability varies per slot
    return TIME_GROUPS.map((group) => {
      const periods = ALL_INTERVALS.slice(group.range[0], group.range[1]);
      return {
        ...group,
        periods,
      };
    });
  }, []);

  // ── Is selected time valid & available? ─────────────────────────────────────
  const isSelectedTimeValid =
    !!selectedDate &&
    isSelectedDateWithinAvailabilityRange &&
    !!selectedTimeSlot &&
    !!selectedStartInterval &&
    (!isSameDay(selectedDate, today) ||
      !disabledIntervals.has(selectedStartInterval));

  const isSelectedTimeAvailable = Boolean(
    selectedTimeSlot &&
    isSelectedDateAvailabilityLoaded &&
    !isAvailabilityLoading &&
    isSlotSelectable(selectedStartInterval),
  );

  const isSameAsOriginalRescheduleSlot = Boolean(
    isReschedule &&
    selectedDateValue &&
    selectedTimeSlot &&
    originalSelectedDate &&
    originalTimeSlot &&
    selectedDateValue === originalSelectedDate &&
    selectedTimeSlot === originalTimeSlot,
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelectDay = (date: Date) => {
    if (
      isBefore(date, enabledStartDate) ||
      (enabledEndDate && isAfter(date, enabledEndDate))
    ) {
      return;
    }

    const nextSelectedDate = formatSelectedDate(date);
    const isDifferentDate = nextSelectedDate !== selectedDateValue;

    setValue("selectedDate", nextSelectedDate, { shouldValidate: true });

    if (selectedTimeSlot && isDifferentDate) {
      setValue("timeSlot", "", { shouldValidate: true });
    }
  };

  const handleSelectTime = (interval: string) => {
    if (!isSlotSelectable(interval)) return;

    const endTime = getEndTimeByBlocks(interval, durationBlocks);
    const slotValue = `${interval} - ${endTime}`;

    if (selectedDate) {
      setValue("selectedDate", formatSelectedDate(selectedDate), {
        shouldValidate: true,
      });
    }
    setValue("timeSlot", slotValue, { shouldValidate: true });
  };

  const handleDurationChange = (blocks: number) => {
    setDurationBlocks(blocks);
    // Clear current time slot when duration changes since it may no longer be valid
    if (selectedTimeSlot) {
      setValue("timeSlot", "", { shouldValidate: true });
    }
  };

  const canContinue = Boolean(
    selectedDate &&
    isSelectedDateWithinAvailabilityRange &&
    isSelectedTimeValid &&
    isSelectedTimeAvailable &&
    !isSameAsOriginalRescheduleSlot,
  );

  // ── Effect: clear invalid selections ────────────────────────────────────────
  useEffect(() => {
    if (selectedDate && !isSelectedDateWithinAvailabilityRange) {
      setValue("selectedDate", "", { shouldValidate: true });
      setValue("timeSlot", "", { shouldValidate: true });
      return;
    }

    if (
      selectedTimeSlot &&
      isSelectedDateAvailabilityLoaded &&
      !isAvailabilityLoading &&
      !isSelectedTimeAvailable
    ) {
      setValue("timeSlot", "", { shouldValidate: true });
    }
  }, [
    isAvailabilityLoading,
    isSelectedDateWithinAvailabilityRange,
    isSelectedDateAvailabilityLoaded,
    isSelectedTimeAvailable,
    selectedDate,
    selectedTimeSlot,
    setValue,
  ]);

  // ── Doctor availability check (reschedule flow) ─────────────────────────────
  const parseTimeSlot = (slot: string) => {
    const parts = slot.split(" - ");
    if (parts.length !== 2)
      return {
        startHour: 9,
        startMinute: 0,
        durationMinutes: 30 as 15 | 30 | 45 | 60,
      };

    const parseTime = (t: string) => {
      const [time, meridian] = t.trim().split(" ");
      // eslint-disable-next-line prefer-const
      let [hours, minutes] = time.split(":").map(Number);
      if (meridian?.toUpperCase() === "PM" && hours !== 12) hours += 12;
      if (meridian?.toUpperCase() === "AM" && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const start = parseTime(parts[0]);
    const end = parseTime(parts[1]);
    const diff =
      end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
    const clamp = (m: number): 15 | 30 | 45 | 60 => {
      if (m <= 15) return 15;
      if (m <= 30) return 30;
      if (m <= 45) return 45;
      return 60;
    };

    return {
      startHour: start.hours,
      startMinute: start.minutes,
      durationMinutes: clamp(diff),
    };
  };

  const doctorId = watch("doctorId");

  const availabilityCheck = useMutation({
    mutationFn: () => {
      if (!selectedDate || !selectedTimeSlot || !doctorId) {
        return Promise.reject(new Error("Missing required fields"));
      }
      const { durationMinutes } = parseTimeSlot(selectedTimeSlot);
      const timeZone = getBrowserTimeZone();
      const startStr = selectedTimeSlot.split(" - ")[0];
      const naiveDate = parse(startStr.trim(), "hh:mm a", selectedDate);

      return checkDoctorAvailabilityReq(doctorId, {
        datetime_local: formatLocalDateTime(naiveDate),
        timezone: timeZone,
        duration: String(durationMinutes),
      });
    },
    onSuccess: (response) => {
      const data = response.data;
      if (!data) return;

      if (data.available) {
        setValue("suggestedDoctorId", undefined);
        setValue("suggestedDoctorName", undefined);
        setValue("suggestedDoctorSpecialty", undefined);
        setValue("suggestedTimeSlot", undefined);
        setValue("suggestedDate", undefined);
        setValue("isQueueing", false);
        onNext();
        return;
      }

      // A clash with the patient's own appointment is not a "find another
      // doctor" problem — no other doctor can solve it. Stay on this step and
      // say why. Every other reason (doctor busy, blackout, out of hours) is
      // about the doctor, so it still routes to FindDoctor.
      if (data.reason_code === "PATIENT_BOOKED") {
        toast.warning(
          data.reason || "You already have an appointment at that time.",
        );
        return;
      }

      setValue("suggestedDoctorId", undefined);
      setValue("suggestedDoctorName", undefined);
      setValue("suggestedDoctorSpecialty", undefined);
      setValue("suggestedTimeSlot", undefined);
      setValue("suggestedDate", undefined);
      setValue("isQueueing", false);
      onDoctorUnavailable?.();
    },
    onError: (error: RejectedPayload) => {
      toast.warning(
        error.message ||
          "Could not verify doctor availability. Please try again.",
      );
    },
  });

  const handleBook = () => {
    if (!canContinue) return;

    if (selectedDate) {
      setValue("selectedDate", formatSelectedDate(selectedDate), {
        shouldValidate: true,
      });
    }

    if (isReschedule) {
      availabilityCheck.mutate();
    } else {
      onNext();
    }
  };

  // ── Count available slots per group for the selected date ───────────────────
  // `bookable` drives the header badge; `patientExplained` counts the slots the
  // patient can be told something useful about (their own clash, or their own
  // appointment capping the length). Either keeps the group's grid visible, so
  // a period that is entirely blocked by the patient's own diary still explains
  // itself instead of collapsing to a bare "No available slots".
  const groupSlotCounts = useMemo(() => {
    return TIME_GROUPS.map((group) => {
      const periods = ALL_INTERVALS.slice(group.range[0], group.range[1]);
      let bookable = 0;
      let patientExplained = 0;
      for (const p of periods) {
        const slot = selectedDateAvailabilityByTime?.[p];
        if (!slot || disabledIntervals.has(p)) continue;

        if (
          slot.availableDoctors > 0 &&
          slot.maxConsecutiveSlots >= durationBlocks
        ) {
          bookable++;
        } else if (slot.patientConflict || slot.patientLimitsDuration) {
          patientExplained++;
        }
      }
      return { bookable, patientExplained };
    });
  }, [selectedDateAvailabilityByTime, durationBlocks, disabledIntervals]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Consultation Type Pills ─────────────────────────────────────── */}
      {/* <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5 text-primary" />
          Consultation Type
        </label>
        <Controller
          name="consultationType"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {CONSULTATION_TYPES.map((type) => {
                const isActive = field.value === type.value;
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      "relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-primary/5",
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                    {isActive && (
                      <motion.div
                        layoutId="consultation-type-active"
                        className="absolute inset-0 bg-primary rounded-full -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.consultationType && (
          <p className="text-xs text-destructive mt-1">
            {errors.consultationType.message}
          </p>
        )}
      </div> */}

      {/* ── Horizontal Date Strip ───────────────────────────────────────── */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          Select Date
        </label>
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/20 p-2.5">
          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canScrollLeft}
              onClick={() =>
                setStripOffset(Math.max(0, stripOffset - VISIBLE_DATES))
              }
              className={cn(
                "shrink-0 flex items-center justify-center size-8 rounded-lg border transition-all duration-200",
                canScrollLeft
                  ? "border-border hover:bg-primary/5 hover:border-primary/30 text-foreground cursor-pointer"
                  : "border-transparent text-muted-foreground/30 cursor-not-allowed",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <motion.div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${allDates.length}, minmax(0, 1fr))`,
                  width: `${(allDates.length / VISIBLE_DATES) * 100}%`,
                }}
                animate={{ x: `${dateStripTranslateX}%` }}
                transition={{ type: "spring", stiffness: 380, damping: 34 }}
              >
                {allDates.map((date) => {
                  const isSelected = selectedDate
                    ? isSameDay(date, selectedDate)
                    : false;
                  const isToday = isSameDay(date, today);
                  const hasAvailability = dateHasAvailability(date);
                  const dayName = format(date, "EEE");
                  const dayNum = format(date, "d");
                  const monthName = format(date, "MMM");

                  return (
                    <motion.button
                      key={date.toISOString()}
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelectDay(date)}
                      className={cn(
                        "relative z-0 flex cursor-pointer flex-col items-center rounded-xl border px-1 py-2 transition-colors duration-200",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : isToday
                            ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                            : "border-transparent hover:border-border hover:bg-background",
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-date"
                          className="absolute inset-0 -z-10 rounded-xl bg-primary"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 28,
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wider",
                          isSelected
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {dayName}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-bold leading-tight mt-0.5",
                          isSelected
                            ? "text-primary-foreground"
                            : "text-foreground",
                        )}
                      >
                        {dayNum}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          isSelected
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {monthName}
                      </span>
                      {/* Availability dot */}
                      <div className="mt-1 h-1.5">
                        {hasAvailability && !isAvailabilityLoading ? (
                          <div
                            className={cn(
                              "size-1.5 rounded-full",
                              isSelected
                                ? "bg-primary-foreground/80"
                                : "bg-emerald-500",
                            )}
                          />
                        ) : isAvailabilityLoading ? (
                          <div className="size-1.5 rounded-full bg-muted-foreground/20 animate-pulse" />
                        ) : null}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            </div>

            <button
              type="button"
              disabled={!canScrollRight}
              onClick={() =>
                setStripOffset(
                  Math.min(
                    allDates.length - VISIBLE_DATES,
                    stripOffset + VISIBLE_DATES,
                  ),
                )
              }
              className={cn(
                "shrink-0 flex items-center justify-center size-8 rounded-lg border transition-all duration-200",
                canScrollRight
                  ? "border-border hover:bg-primary/5 hover:border-primary/30 text-foreground cursor-pointer"
                  : "border-transparent text-muted-foreground/30 cursor-not-allowed",
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        {errors.selectedDate && (
          <p className="text-xs text-destructive mt-1 text-center">
            {errors.selectedDate.message}
          </p>
        )}
      </div>

      {/* ── Duration Picker ─────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Session Duration
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((opt) => {
            const isActive = durationBlocks === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleDurationChange(opt.value)}
                className={cn(
                  "relative z-0 rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="duration-active"
                    className="absolute inset-0 -z-10 rounded-xl border border-primary/30 bg-primary/10"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Time Grid ───────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          Available Start Times
        </label>

        {!selectedDate ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center">
            <CalendarDays className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              Select a date above to see available times
            </p>
          </div>
        ) : isAvailabilityLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/20 py-10 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              Loading available times…
            </p>
          </div>
        ) : (
          <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1">
            {timeGridGroups.map((group, groupIdx) => {
              const { bookable, patientExplained } = groupSlotCounts[groupIdx];
              const renderSlots = bookable > 0 || patientExplained > 0;
              const Icon = group.icon;

              let countLabel = "No slots";
              if (bookable > 0) {
                countLabel = `${bookable} slot${bookable !== 1 ? "s" : ""}`;
              } else if (patientExplained > 0) {
                countLabel = "Not available";
              }

              return (
                <div
                  key={group.title}
                  className={cn(
                    "rounded-xl border p-3 transition-all duration-200",
                    group.borderColor,
                    renderSlots
                      ? "bg-gradient-to-r " + group.gradient
                      : "opacity-50",
                  )}
                >
                  {/* Group header */}
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("h-3.5 w-3.5", group.iconColor)} />
                      <span className="text-xs font-medium uppercase tracking-wide text-foreground">
                        {group.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {countLabel}
                    </span>
                  </div>

                  {/* Slots grid */}
                  {renderSlots ? (
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
                      {group.periods.map((interval) => {
                        const selectable = isSlotSelectable(interval);
                        const isSelected =
                          selectable && selectedStartInterval === interval;

                        if (!selectable) {
                          const slotInfo =
                            selectedDateAvailabilityByTime?.[interval];
                          // Past times stay muted — neither the appointment
                          // clash nor a shortened run is why they cannot be
                          // picked.
                          const isPatientConflict =
                            slotInfo?.patientConflict === true &&
                            !disabledIntervals.has(interval);
                          // Free, doctor available, but the patient's own
                          // appointment caps the run below what the chosen
                          // duration needs. Amber with a dashed edge: the same
                          // "it is your diary" colour, a different remedy.
                          const isPatientDurationLimited =
                            !isPatientConflict &&
                            slotInfo?.patientLimitsDuration === true &&
                            !disabledIntervals.has(interval);

                          if (isPatientConflict) {
                            // Distinct from a generic busy slot: the patient
                            // can act on this one by picking another time.
                            return (
                              <button
                                key={interval}
                                type="button"
                                disabled
                                title="You already have an appointment at this time"
                                aria-label={`${interval} — you already have an appointment at this time`}
                                className="h-8 cursor-not-allowed rounded-md border border-amber-200 bg-amber-50 text-[11px] font-medium text-amber-700/80"
                              >
                                {interval}
                              </button>
                            );
                          }

                          if (isPatientDurationLimited) {
                            const freeMinutes =
                              (slotInfo?.maxConsecutiveSlots ?? 0) * 15;
                            const freeUntil = getEndTimeByBlocks(
                              interval,
                              slotInfo?.maxConsecutiveSlots ?? 1,
                            );
                            const explanation = `starting here leaves only ${freeMinutes} min before your appointment at ${freeUntil}`;
                            return (
                              <button
                                key={interval}
                                type="button"
                                disabled
                                title={`Starting here leaves only ${freeMinutes} min before your appointment at ${freeUntil}`}
                                aria-label={`${interval} — ${explanation}`}
                                className="h-8 cursor-not-allowed rounded-md border border-dashed border-amber-300 bg-amber-50/60 text-[11px] font-medium text-amber-700/80"
                              >
                                {interval}
                              </button>
                            );
                          }

                          // Show unavailable slots but collapsed
                          return (
                            <button
                              key={interval}
                              type="button"
                              disabled
                              className="h-8 cursor-not-allowed rounded-md border border-transparent bg-muted/40 text-[11px] font-medium text-muted-foreground/40"
                            >
                              {interval}
                            </button>
                          );
                        }

                        return (
                          <motion.button
                            key={interval}
                            type="button"
                            onClick={() => handleSelectTime(interval)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className={cn(
                              "relative z-0 h-9 rounded-lg border text-[11px] font-semibold transition-all duration-200",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                                : "border-border/60 bg-white/80 text-foreground hover:border-primary/40 hover:bg-white hover:shadow-sm",
                            )}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="active-time-slot"
                                className="absolute inset-0 -z-10 rounded-lg bg-primary"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 28,
                                }}
                              />
                            )}
                            <span className="flex items-center justify-center gap-1">
                              {isSelected && <Check className="h-3 w-3" />}
                              {interval}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 py-1">
                      No available slots for this period
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {(hasPatientConflictOnSelectedDate ||
          hasPatientDurationLimitOnSelectedDate) && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-amber-700">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Amber start times are affected by appointments you already have.
              {hasPatientDurationLimitOnSelectedDate && (
                <>
                  {" "}
                  Dashed ones are free, but starting there leaves less than{" "}
                  {durationBlocks * 15} min before your next appointment — start
                  earlier or pick a shorter session.
                </>
              )}
            </span>
          </p>
        )}

        {errors.timeSlot && (
          <p className="text-xs text-destructive mt-2">
            {errors.timeSlot.message}
          </p>
        )}
      </div>

      {/* ── Selection Summary Bar ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDate && selectedTimeSlot && isSelectedTimeAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {format(selectedDate, "EEEE, MMM d")}
                </p>
                <p className="text-xs text-primary">
                  {selectedTimeSlot}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({durationBlocks * 15} min)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10">
              <Check className="h-3 w-3 text-emerald-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reschedule same-slot warning ─────────────────────────────────── */}
      {isSameAsOriginalRescheduleSlot && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Choose a different date or time to reschedule this appointment.</p>
        </div>
      )}

      {/* ── Reschedule info banner ──────────────────────────────────────── */}

      <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3.5 py-3 text-sm text-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-medium">Info</p>
          <p className="text-muted-foreground">
            Your selected consultation slot will only be guaranteed once you
            complete your booking and payment. Please proceed with payment to
            confirm and secure your appointment.
          </p>
        </div>
      </div>

      {/* ── Action buttons ──────────────────────────────────────────────── */}
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
          onClick={handleBook}
          type="button"
          disabled={!canContinue || availabilityCheck.isPending}
        >
          {availabilityCheck.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isReschedule ? (
            "Reschedule appointment"
          ) : (
            "Book appointments"
          )}
        </MotionButton>
      </div>
    </div>
  );
};

export default ChooseTimeSlot;
