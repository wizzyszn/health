import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoveLeft } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  addDays,
  differenceInMinutes,
  format,
  parse,
  startOfToday,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { toast } from "sonner";
import AppointmentConfirmed from "../booking/appointment-confirmed.booking.component.patient";
import StepSidebar from "../booking/step-sidebar.booking.component.patient";
import PersonalDetails from "../booking/personal-details.booking.component.patient";
import FindDoctor from "../booking/find-doctor.booking.component.patient";
import ChooseTimeSlot from "../booking/choose-time-slot.booking.component.patient";
// import ChoosePayment from "../booking/choose-payment.booking.component.patient";
import ConfirmAppointment from "../booking/confirm-appointment.booking.component.patient";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { Storages } from "@/lib/helpers";
import {
  StorageKeysEnum,
  type Patient,
  type RejectedPayload,
} from "@/lib/types";
import {
  bookAnAppointmentReq,
  getWeeklyAppointmentsReq,
  getSingleAppointmentReq,
  rescheduleAppointment,
  type BookingAvailabilityByDate,
} from "@/config/service/patient.service";
import type { AuthState } from "@/config/stores/slices/auth.slice";
import type { RootState } from "@/config/stores/store";
import {
  bookingSchema,
  BookingFormData,
  STEP_FIELDS,
} from "@/patient/lib/schemas";
import { formatLocalDateTime, getBrowserTimeZone } from "@/lib/utils";

const STEP_TITLES = [
  "Personal Details",
  "Choose a time slot",
  "Find a Doctor",
  // "Select Payment Method",
  "Confirm Appointment",
];

const MAX_UI_BLOCKS = 4;
const AVAILABILITY_RANGE_DAYS = 14;

const DEFAULT_VALUES: BookingFormData = {
  firstName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  gender: "",
  maritalStatus: "",
  occupation: "",
  reasonForAppointment: "",
  complaintDetails: "",
  medicalConditions: [],
  allergies: [],
  doctorId: "",
  doctorName: "",
  doctorSpecialty: "",
  originalDoctorId: "",
  originalDoctorName: "",
  originalDoctorSpecialty: "",
  consultationType: "VIDEO",
  selectedDate: "",
  timeSlot: "",
  originalSelectedDate: "",
  originalTimeSlot: "",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

// ─── Transform fetched appointment into BookingFormData ─────────────────────
const MONTHS_LIST = [
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

const appointmentToFormData = (
  raw: Awaited<ReturnType<typeof getSingleAppointmentReq>>,
): BookingFormData => {
  const data = raw.data;

  const timeZone = getBrowserTimeZone();
  const startZoned = toZonedTime(
    new Date(data.scheduled_start_at_utc),
    timeZone,
  );
  const endZoned = toZonedTime(new Date(data.scheduled_end_at_utc), timeZone);

  const selectedDate = format(startZoned, "d MMMM yyyy");
  const timeSlot =
    data.scheduled_start_at_utc && data.scheduled_end_at_utc
      ? `${format(startZoned, "hh:mm a")} - ${format(endZoned, "hh:mm a")}`
      : "";
  const dobParts = data.booking_profile_snapshot?.date_of_birth
    ?.split("T")[0]
    ?.split("-") || ["", "", ""];

  const parsedDay = parseInt(dobParts[2] || "", 10);
  const dobDay = isNaN(parsedDay) ? "" : parsedDay.toString();

  const parsedMonth = parseInt(dobParts[1] || "", 10);
  const dobMonth =
    isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12
      ? ""
      : MONTHS_LIST[parsedMonth - 1];

  return {
    firstName: data.booking_profile_snapshot?.first_name || "",
    lastName: data.booking_profile_snapshot?.last_name || "",
    dobYear: dobParts[0] || "",
    dobMonth,
    dobDay,
    gender: data.booking_profile_snapshot?.gender || "",
    maritalStatus: data.booking_profile_snapshot?.marital_status || "",
    occupation: data.booking_profile_snapshot?.occupation || "",
    reasonForAppointment: data.reason_for_visit || "",
    complaintDetails: "",
    medicalConditions: [],
    allergies: [],
    doctorId: data.doctor_id?._id || "",
    doctorName: data.doctor_id?.full_name || "",
    doctorSpecialty: data.doctor_id?.specializations?.[0] || "",
    originalDoctorId: data.doctor_id?._id || "",
    originalDoctorName: data.doctor_id?.full_name || "",
    originalDoctorSpecialty: data.doctor_id?.specializations?.[0] || "",
    consultationType: data.consultation_id?.type || "VIDEO",
    selectedDate,
    timeSlot,
    originalSelectedDate: selectedDate,
    originalTimeSlot: timeSlot,
  };
};

const getDefaultAvailabilityRange = () => {
  const anchorDate = startOfToday();
  const endDate = addDays(anchorDate, AVAILABILITY_RANGE_DAYS);

  return {
    start: anchorDate,
    end: endDate,
    startDate: format(anchorDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
};

const getSelectedSlotBlocks = (timeSlot: string) => {
  const [startTimeStr, endTimeStr] = timeSlot.split(" - ");
  if (!startTimeStr || !endTimeStr) return 0;

  const baseDate = new Date();
  const start = parse(startTimeStr.trim(), "hh:mm a", baseDate);
  const end = parse(endTimeStr.trim(), "hh:mm a", baseDate);
  const duration = differenceInMinutes(end, start);

  return Math.ceil(duration / 15);
};

const findAvailabilitySlot = (
  availability: BookingAvailabilityByDate | undefined,
  selectedDate: string,
  timeSlot: string,
) => {
  const selectedDateKey = format(
    parse(selectedDate, "d MMMM yyyy", new Date()),
    "yyyy-MM-dd",
  );
  const startTime = timeSlot.split(" - ")[0]?.trim();
  return availability?.[selectedDateKey]?.slots.find(
    (slot) => slot.time === startTime,
  );
};

const canSelectDurationFromStart = (
  availability: BookingAvailabilityByDate | undefined,
  selectedDate: string,
  timeSlot: string,
) => {
  const startSlot = findAvailabilitySlot(availability, selectedDate, timeSlot);
  const requestedBlocks = getSelectedSlotBlocks(timeSlot);

  return Boolean(
    startSlot &&
    startSlot.available_doctors > 0 &&
    requestedBlocks >= 1 &&
    requestedBlocks <= MAX_UI_BLOCKS &&
    requestedBlocks <= startSlot.max_consecutive_slots,
  );
};

/** Build the API payload from the form data */
const buildPayload = (data: BookingFormData) => {
  // Build date_of_birth as YYYY-MM-DD
  // dobMonth is stored as a month name (e.g. "March"), so convert to a number
  const monthNum = MONTHS_LIST.indexOf(data.dobMonth) + 1;
  const dob = `${data.dobYear}-${String(monthNum).padStart(2, "0")}-${data.dobDay.padStart(2, "0")}`;
  // //  const dobDate = new Date(
  //     Date.UTC(
  //       parseInt(data.dobYear),
  //       parseInt(data.dobMonth) - 1,
  //       parseInt(data.dobDay)
  //     )
  //   );
  //   const dob = dobDate.toISOString();

  // Build scheduled_start_local from selectedDate + timeSlot
  const timeZone = getBrowserTimeZone();
  const [startTimeStr, endTimeStr] = data.timeSlot.split(" - ");

  const naiveBaseDate = parse(data.selectedDate, "d MMMM yyyy", new Date());
  const naiveStart = parse(startTimeStr.trim(), "hh:mm a", naiveBaseDate);

  const naiveEnd = parse(endTimeStr.trim(), "hh:mm a", naiveBaseDate);
  const rawDuration = differenceInMinutes(naiveEnd, naiveStart);
  const durationMinutes: 15 | 30 | 45 | 60 =
    rawDuration <= 15
      ? 15
      : rawDuration <= 30
        ? 30
        : rawDuration <= 45
          ? 45
          : 60;

  return {
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: dob,
    gender: data.gender,
    marital_status: data.maritalStatus,
    occupation: data.occupation,
    reason_for_appointment: data.reasonForAppointment,
    complaint_details: data.complaintDetails || undefined,
    Medical_conditions: data.medicalConditions?.length
      ? data.medicalConditions
      : undefined,
    allergies: data.allergies?.length ? data.allergies : undefined,
    doctor_id: data.doctorId,
    scheduled_start_local: formatLocalDateTime(naiveStart),
    timezone: timeZone,
    requested_duration_minutes: durationMinutes,
    reason_for_visit: data.reasonForAppointment,
    confirm_appointment: true as const,
    consultation_type: data.consultationType as
      | "VIDEO"
      | "CHAT"
      | "AUDIO"
      | "MEETADOCTOR"
      | "HOMESERVICE",
  };
};

const getRejectedMessage = (error: RejectedPayload) =>
  error.message || error.response_description || "";

const shouldReturnToTimeSlotStep = (error: RejectedPayload) => {
  const message = getRejectedMessage(error).toLowerCase();

  return (
    message.includes("cannot book a past timeslot") ||
    message.includes("selected slot is already booked") ||
    // The patient already holds an appointment overlapping the one they picked,
    // so send them back to choose a different time.
    message.includes("already have an appointment")
  );
};

// ─── Response type from the API ─────────────────────────────────────────────
export type BookingResponse = {
  _id: string;
  appointment_number: string;
  patient_id: string;
  doctor_id: string;
  scheduled_start_at_utc: string;
  scheduled_end_at_utc: string;
  timezone_snapshot: string;
  status: string;
  reason_for_visit: string;
  booking_profile_snapshot: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    marital_status: string;
    occupation: string;
    reason_for_appointment: string;
  };
};

// ─── Component ──────────────────────────────────────────────────────────────

const Booking = () => {
  const { getParam, updateParam, deleteParams } = useUrlSearchParams();
  const queryClient = useQueryClient();
  const urlStep = parseInt(getParam("step") || "0", 10);
  const appointmentId = getParam("appointmentId");
  const isReschedule = !!appointmentId;

  const savedState = useMemo(() => {
    return (
      Storages.getStorage<{ step: number; formData: BookingFormData }>(
        "session",
        StorageKeysEnum.bookingState,
      ) || { step: 0, formData: DEFAULT_VALUES }
    );
  }, []);

  const [currentStep, setCurrentStep] = useState(
    !isNaN(urlStep) ? urlStep : savedState.step,
  );
  const [confirmed, setConfirmed] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const defaultFormValues = useMemo(() => {
    const base = { ...DEFAULT_VALUES, ...savedState.formData };
    if (isReschedule) {
      base.timeSlot = "";
      base.selectedDate = "";
    }
    return base;
  }, [savedState.formData, isReschedule]);

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultFormValues,
    mode: "onTouched",
  });

  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Patient>;
  const timeZone = getBrowserTimeZone();
  const availabilityRange = useMemo(() => getDefaultAvailabilityRange(), []);
  const availabilityQuerySessionIdRef = useRef(Date.now());

  const availabilityQueryKey = useMemo(
    () => [
      "booking-slots-availability",
      availabilityQuerySessionIdRef.current,
      availabilityRange.startDate,
      availabilityRange.endDate,
      timeZone,
    ],
    [availabilityRange.endDate, availabilityRange.startDate, timeZone],
  );

  const { data: bookingAvailability, isFetching: isAvailabilityFetching } =
    useQuery({
      queryKey: availabilityQueryKey,
      queryFn: () =>
        getWeeklyAppointmentsReq({
          startDate: availabilityRange.startDate,
          endDate: availabilityRange.endDate,
          timezone: timeZone,
        }),
      select: (response) => response.data,
      gcTime: 0,
      refetchOnMount: "always",
      staleTime: 0,
    });

  useEffect(() => {
    const subscription = methods.watch((values) => {
      Storages.setStorage("session", StorageKeysEnum.bookingState, {
        step: currentStep,
        formData: values,
      });
    });
    return () => subscription.unsubscribe();
  }, [methods, currentStep]);

  // ── Fetch + populate when editing an existing appointment ──────────
  const hasPopulatedRef = useRef(false);

  const { data: appointmentFormData } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => getSingleAppointmentReq(appointmentId ?? ""),
    enabled: !!appointmentId,
    select: appointmentToFormData,
  });

  // Populate the form once when the query resolves
  if (appointmentFormData && !hasPopulatedRef.current) {
    hasPopulatedRef.current = true;
    // In reschedule mode, clear time fields so the user must pick new ones
    if (isReschedule) {
      methods.reset({ ...appointmentFormData, timeSlot: "", selectedDate: "" });
    } else {
      methods.reset(appointmentFormData);
    }
  }

  // ── Auto-fill current user's name for fresh bookings ──────────────
  const hasAutoFilledUserRef = useRef(false);

  if (
    !hasAutoFilledUserRef.current &&
    !appointmentId &&
    savedState.formData.firstName === "" &&
    savedState.formData.lastName === "" &&
    user?.user
  ) {
    hasAutoFilledUserRef.current = true;
    methods.setValue("firstName", user.user.first_name || "");
    methods.setValue("lastName", user.user.last_name || "");
  }

  const syncStep = (step: number) => {
    updateParam("step", String(step), { replace: true });
    Storages.setStorage("session", StorageKeysEnum.bookingState, {
      step,
      formData: methods.getValues(),
    });
  };

  const clearBookingQueryParams = () => {
    deleteParams(["appointmentId", "mode"], { replace: true });
  };

  // ─── Booking mutation ───────────────────────────────────────────────────
  const bookingMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof buildPayload>) =>
      bookAnAppointmentReq(payload),
    onSuccess: (response) => {
      toast.success(
        response.response_description || "Appointment booked successfully!",
      );
      setBookingResult(response.data);
      setConfirmed(true);
      Storages.setStorage("session", StorageKeysEnum.bookingState, null);
      clearBookingQueryParams();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
    onError: (error: RejectedPayload) => {
      toast.warning(
        getRejectedMessage(error) ||
          "Failed to book appointment. Please try again.",
      );
      if (shouldReturnToTimeSlotStep(error)) {
        setCurrentStep(1);
        syncStep(1);
      }
      clearBookingQueryParams();
    },
  });

  // ─── Reschedule mutation ────────────────────────────────────────────────
  const rescheduleMutation = useMutation({
    mutationFn: (payload: {
      scheduled_start_local: string;
      timezone: string;
      requested_duration_minutes: number;
      reason: string;
      requested_specialization: string;
    }) => rescheduleAppointment(payload, appointmentId ?? ""),
    onSuccess: () => {
      toast.success("Appointment rescheduled successfully!");
      setConfirmed(true);
      Storages.setStorage("session", StorageKeysEnum.bookingState, null);
      clearBookingQueryParams();
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
    onError: (error: RejectedPayload) => {
      toast.warning(
        getRejectedMessage(error) ||
          "Failed to reschedule appointment. Please try again.",
      );
      if (shouldReturnToTimeSlotStep(error)) {
        methods.setValue("timeSlot", "", { shouldValidate: true });
        methods.setValue("suggestedTimeSlot", undefined);
        methods.setValue("suggestedDate", undefined);
        setCurrentStep(1);
        syncStep(1);
        return;
      }
      clearBookingQueryParams();
    },
  });

  const activeMutation = isReschedule ? rescheduleMutation : bookingMutation;

  const refetchAndValidateSelectedSlot = async (data: BookingFormData) => {
    const targetTimeSlot = data.suggestedTimeSlot || data.timeSlot;
    const targetDate = data.suggestedDate || data.selectedDate;

    const latestAvailability = await queryClient.fetchQuery({
      queryKey: [
        "booking-slots-availability",
        availabilityQuerySessionIdRef.current,
        availabilityRange.startDate,
        availabilityRange.endDate,
        timeZone,
      ],
      queryFn: () =>
        getWeeklyAppointmentsReq({
          startDate: availabilityRange.startDate,
          endDate: availabilityRange.endDate,
          timezone: timeZone,
        }),
    });

    if (
      !canSelectDurationFromStart(
        latestAvailability.data,
        targetDate,
        targetTimeSlot,
      )
    ) {
      const targetSlot = findAvailabilitySlot(
        latestAvailability.data,
        targetDate,
        targetTimeSlot,
      );

      let unavailableReason =
        "That time is no longer available. Please choose another slot.";
      if (targetSlot?.patient_conflict) {
        unavailableReason =
          "You already have an appointment at that time. Please choose another slot.";
      } else if (targetSlot?.patient_limits_duration) {
        unavailableReason =
          "Only part of that time is free because of an appointment you already have. Please choose a different time or a shorter duration.";
      }

      toast.warning(unavailableReason);
      methods.setValue("timeSlot", "", { shouldValidate: true });
      methods.setValue("suggestedTimeSlot", undefined);
      methods.setValue("suggestedDate", undefined);
      setCurrentStep(1);
      syncStep(1);
      return false;
    }

    return true;
  };

  const releaseSubmitLock = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const goNext = async () => {
    // Validate only the fields for the current step before advancing
    const fieldsToValidate = STEP_FIELDS[currentStep];
    if (fieldsToValidate) {
      const isValid = await methods.trigger(fieldsToValidate);
      if (!isValid) return;
    }

    if (currentStep === 3) {
      if (isSubmittingRef.current || activeMutation.isPending) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        const allData = methods.getValues();
        const hasFreshAvailability =
          await refetchAndValidateSelectedSlot(allData);
        if (!hasFreshAvailability) return;

        if (isReschedule) {
          const targetTimeSlot = allData.suggestedTimeSlot || allData.timeSlot;
          const targetDate = allData.suggestedDate || allData.selectedDate;

          const timeZone = getBrowserTimeZone();
          const [startTimeStr, endTimeStr] = targetTimeSlot.split(" - ");

          const naiveBaseDate = parse(targetDate, "d MMMM yyyy", new Date());
          const naiveStart = parse(
            startTimeStr.trim(),
            "hh:mm a",
            naiveBaseDate,
          );

          const naiveEnd = parse(endTimeStr.trim(), "hh:mm a", naiveBaseDate);
          const rawDuration = differenceInMinutes(naiveEnd, naiveStart);
          const durationMinutes: 15 | 30 | 45 | 60 =
            rawDuration <= 15
              ? 15
              : rawDuration <= 30
                ? 30
                : rawDuration <= 45
                  ? 45
                  : 60;
          await rescheduleMutation.mutateAsync({
            scheduled_start_local: formatLocalDateTime(naiveStart),
            timezone: timeZone,
            requested_duration_minutes: durationMinutes,
            reason: allData.reasonForAppointment || "Rescheduled by patient",
            requested_specialization:
              allData.suggestedDoctorSpecialty || allData.doctorSpecialty,
          });
        } else {
          const payload = buildPayload(allData);
          await bookingMutation.mutateAsync(payload);
        }
      } catch {
        // Errors are surfaced via each mutation's onError handler.
      } finally {
        releaseSubmitLock();
      }

      return;
    } else {
      const nextStep = isReschedule && currentStep === 1 ? 3 : currentStep + 1;
      setCurrentStep(nextStep);
      syncStep(nextStep);
    }
  };

  const goBack = () => {
    const prevStep =
      isReschedule && currentStep === 3 ? 1 : Math.max(0, currentStep - 1);
    setCurrentStep(prevStep);
    syncStep(prevStep);
  };

  const reset = () => {
    setCurrentStep(0);
    methods.reset(DEFAULT_VALUES);
    setConfirmed(false);
    setBookingResult(null);
    updateParam("step", "0", { replace: true });
    clearBookingQueryParams();
    Storages.setStorage("session", StorageKeysEnum.bookingState, null);
  };

  if (confirmed) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <AppointmentConfirmed
          data={methods.getValues()}
          appointmentResponse={bookingResult}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-[minmax(0,210px)_minmax(0,1fr)] gap-0 overflow-hidden">
        <div className="hidden md:block h-full overflow-y-auto hidden-scrollbar px-1">
          <StepSidebar currentStep={currentStep} />
        </div>
        <div className="min-w-0 md:border-l border-border flex flex-col h-full overflow-hidden">
          <div className="flex-none flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {STEP_TITLES[currentStep]}
            </h2>
            {currentStep > 0 && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back"
                className="text-muted-foreground hover:text-foreground flex shrink-0 justify-center items-center bg-muted rounded-full size-8 transition-colors duration-200 hover:bg-muted/70"
              >
                <MoveLeft className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1 relative px-5 pb-5 pt-4 overflow-y-auto hidden-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className=""
              >
                {currentStep === 0 && (
                  <PersonalDetails
                    onNext={goNext}
                    isReschedule={isReschedule}
                  />
                )}
                {currentStep === 1 && (
                  <ChooseTimeSlot
                    onNext={goNext}
                    onBack={goBack}
                    onDoctorUnavailable={() => {
                      setCurrentStep(2);
                      syncStep(2);
                    }}
                    isReschedule={isReschedule}
                    availabilityByDate={bookingAvailability}
                    isAvailabilityLoading={isAvailabilityFetching}
                    availabilityStartDate={availabilityRange.start}
                    availabilityEndDate={availabilityRange.end}
                  />
                )}
                {currentStep === 2 && (
                  <FindDoctor onNext={goNext} onBack={goBack} />
                )}
                {/* {currentStep === 3 && (
                  <ChoosePayment onNext={goNext} onBack={goBack} />
                )} */}
                {currentStep === 3 && (
                  <ConfirmAppointment
                    onNext={goNext}
                    onBack={goBack}
                    isPending={isSubmitting || activeMutation.isPending}
                    isReschedule={isReschedule}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default Booking;
