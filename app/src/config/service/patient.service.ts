import {
  Consultation,
  ConsultationReqBody,
  Consultations,
  GeneralReturnInt,
  Patient,
  PatientProfileInterface,
  Schedules,
  UpdatePatientProfileBody,
  MedicationDetail,
} from "@/lib/types";
import { options, requestHandler, urlGenerator } from "./config";

type PatientAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED";

type PatientAppointmentProfileSnapshot = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  reason_for_appointment?: string;
};

type PatientAppointmentPatient = {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  full_name: string;
  gender: string;
  marital_status: string;
  occupation: string;
  profile_picture_url?: string;
};

type PatientAppointmentRescheduledHistoryItem = {
  _id: string;
  appointment_number: string;
  patient_id: PatientAppointmentPatient;
  doctor_id: {
    _id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    specializations: string[];
    profile_picture_url?: string;
  };
  scheduled_start_at_utc: string;
  scheduled_end_at_utc: string;
  timezone_snapshot: string;
  status: PatientAppointmentStatus;
  reason_for_visit: string;
  reason_for_appointment?: string;
  complaint_details?: string;
  Medical_conditions?: string[];
  allergies?: string[];
  booking_profile_snapshot: PatientAppointmentProfileSnapshot;
  createdAt: string;
  updatedAt: string;
  __v: number;
  cancelled_by?: string;
  cancelled_reason?: string;
};

// Initiate Patient Registration to get OTP for email verification
export const initiatePatientRegistration = (data: { email: string }) => {
  const url = urlGenerator("auth", "patients/register/initiate", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

// Verify OTP after initialization
export const verifyOTP = (data: { email: string; otp: string }) => {
  const url = urlGenerator("auth", "patients/register/verify-otp", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

// Resend OTP
export const resendOTP = (data: { email: string }) => {
  const url = urlGenerator("auth", "patients/register/resend-otp", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

// Complete registration
export const registration = (data: {
  registration_token: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  phone_number: string;
  password: string;
}) => {
  const url = urlGenerator("auth", "patients/register/complete", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

// Initialize reset password
export const initializeRestPassword = (data: { email: string }) => {
  const url = urlGenerator("auth", "forgot-password/initiate", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

export const verifyOtpForForgotPassowrd = (data: {
  email: string;
  otp: string;
}) => {
  const url = urlGenerator("auth", "forgot-password/verify-otp", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

export const resetPassword = (data: {
  reset_token: string;
  password: string;
  confirm_password: string;
}) => {
  const url = urlGenerator("auth", "forgot-password/reset", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, false),
  );
};

// Register Patient with Credentials
export const signUpPatientReq = (data: {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  password: string;
}) => {
  const url = urlGenerator("auth", "patients/signup", false);
  return requestHandler<GeneralReturnInt<Patient>>(url, options("POST", data));
};

// Login Patient with credentials
export const signInPatienReq = ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const url = urlGenerator("auth", "patients/login", false);
  return requestHandler<GeneralReturnInt<Patient>>(
    url,
    options("POST", { email, password }),
  );
};

// Consult a medical practitioner
export const consultADoctor = (data: ConsultationReqBody) => {
  const url = urlGenerator("patients", "consultations", false);
  return requestHandler<GeneralReturnInt<Consultation>>(
    url,
    options("POST", data, true),
  );
};
export enum ConsultationStatusEnum {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  ACTIVE = "ACTIVE",
  RESCHEDULED = "RESCHEDULED",
}
// Get consultations for a patient
export const getAllConsultations = (
  page: number = 1,
  perPage: number = 5,
  startDate?: string | undefined,
  endDate?: string | undefined,
  q?: string,
) => {
  let param = `page=${page}&perPage=${perPage}&q=${q}`;

  if (startDate && endDate) {
    param += `&startDate=${startDate}&endDate=${endDate}`;
  }

  const url = urlGenerator("patients", "consultations", false, param);
  return requestHandler<GeneralReturnInt<Consultations>>(
    url,
    options("GET", null, true),
  );
};

export const getAllConsultationsForPatient = (
  page: number = 1,
  perPage: number = 3,
  startDate?: string | undefined,
  endDate?: string | undefined,
  q?: string,
) => {
  const params = {
    page: page.toString(),
    perPage: perPage.toString(),
    startDate: startDate ?? "",
    endDate: endDate ?? "",
    q: q ?? "",
  };
  const url = urlGenerator(
    "patients",
    "consultations/all",
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      consultation: Array<{
        _id: string;
        appointment_id: {
          _id: string;
          appointment_number: string;
          scheduled_start_at_utc: string;
          scheduled_end_at_utc: string;
          timezone_snapshot: string;
          status:
            | "PENDING"
            | "CONFIRMED"
            | "ACTIVE"
            | "COMPLETED"
            | "CANCELED"
            | "NO_SHOW"
            | "FAILED"
            | "FORFEITED"
            | "RESCHEDULED";
          reason_for_visit: string;
        };
        type: "VIDEO" | "AUDIO" | "IN_PERSON";
        user_id: string;
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          specializations: string[];
          id: string;
        };
        consoltation_for: "SELF" | "OTHER";
        consultation_id: string;
        title: string;
        details: string;
        status: ConsultationStatusEnum;
        createdAt: string;
        updatedAt: string;
      }>;
      meta: {
        total: number;
        page: number;
        lastPage: number;
      };
    }>
  >(url, options("GET", null, true));
};

// Get a particular consultation
export const getAConsultation = (consultationId: string) => {
  const url = urlGenerator(
    "patients",
    `consultations/${consultationId}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      appointment_id: {
        _id: string;
        appointment_number: string;
        scheduled_start_at_utc: string;
        scheduled_end_at_utc: string;
        timezone_snapshot: string;
        status: string;
        reason_for_visit: string;
        reason_for_appointment?: string;
        complaint_details?: string;
        booking_profile_snapshot?: {
          reason_for_appointment?: string;
        };
      };
      type: "VIDEO" | "CHAT" | "AUDIO" | "MEETADOCTOR" | "HOMESERVICE";
      user_id: string;
      doctor_id: {
        _id: string;
        doctor_no: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        phone_number: string;
        active: boolean;
        specializations: string[];
        license_no: string;
        createdAt: string;
        updatedAt: string;
        id: string;
      };
      consoltation_for: "SELF" | "OTHERS";
      consultation_id: string;
      title: string;
      details: string;
      status:
        | "PENDING"
        | "CONFIRMED"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELED"
        | "NO_SHOW"
        | "FAILED"
        | "FORFEITED"
        | "RESCHEDULED";
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("GET", null, true));
};

// Consolidated clinical summary of one consultation: reason for visit, the
// recorded diagnoses, the doctor's treatment plan, and roll-ups of the
// medications, investigations and referrals released to the patient.
export const getConsultationSummaryReq = (consultationId: string) => {
  const url = urlGenerator(
    "patients",
    `consultations/${consultationId}/summary`,
    false,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return requestHandler<GeneralReturnInt<any>>(url, options("GET", null, true));
};

// Edit a particular consultation
export const editAConsultation = (
  consultationId: string,
  data: ConsultationReqBody,
) => {
  const url = urlGenerator(
    "patients",
    `consultations/n${consultationId}`,
    false,
  );
  return requestHandler<GeneralReturnInt<Consultation>>(
    url,
    options("POST", data, true),
  );
};

// Get all schedules for a patient
export const getAllSchedulesForPatient = () => {
  const url = urlGenerator(
    "patients",
    "consultations/consultation/weekly",
    false,
  );
  return requestHandler<GeneralReturnInt<Schedules[]>>(
    url,
    options("GET", null, true),
  );
};

// Get medications for a consultation
export const getMedicationsForConsultation = (consultationId: string) => {
  const url = urlGenerator(
    "patients",
    `consultations/medication/${consultationId}`,
    false,
  );
  return requestHandler<GeneralReturnInt<[]>>(url, options("GET", null, true));
};

// Get all medications for a patient
export const getPatientMedicationHistory = (query?: string) => {
  const param = query && query !== "all" ? `query=${query}` : "";
  const url = urlGenerator(
    "patients",
    "consultations/medications",
    false,
    param,
  );
  return requestHandler<GeneralReturnInt<MedicationDetail[]>>(
    url,
    options("GET", null, true),
  );
};

// Get active medications for a patient
export const getPatientActiveMedicationHistory = () => {
  const url = urlGenerator("patients", "medications/active", false);
  return requestHandler<GeneralReturnInt<MedicationDetail[]>>(
    url,
    options("GET", null, true),
  );
};

// Get a single medication detail
export const getSingleMedicationReq = (id: string) => {
  const url = urlGenerator(
    "patients",
    `consultations/medications/${id}`,
    false,
  );
  return requestHandler<GeneralReturnInt<MedicationDetail>>(
    url,
    options("GET", null, true),
  );
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getPatientProfileReq = () => {
  // Use the full profile: the lightweight /patients/me summary omits medical
  // fields and is not sufficient for the profile page or referral PDFs.
  const url = urlGenerator("patients", "me/profile", false);
  return requestHandler<GeneralReturnInt<PatientProfileInterface>>(
    url,
    options("GET", null, true),
  );
};

/**
 * Keys the backend accepts on PATCH /patients/me/profile. Anything else is
 * rejected with a 400 that fails the WHOLE request, so outbound patches must
 * be sanitized first — see {@link sanitizeProfilePatch}.
 */
const PROFILE_PATCH_ALLOWED_KEYS = new Set([
  "first_name",
  "last_name",
  "middle_name",
  "phone_number",
  "date_of_birth",
  "gender",
  "marital_status",
  "occupation",
  "address",
  "allergies",
  "previous_medical_conditions",
  "medical_flags",
  "profile_picture_url",
]);

/** Strips server-only keys (mrn, _id, registration_no, …) from an outbound
 *  profile patch and drops undefined entries while keeping empty arrays
 *  (explicit clear). Values are never transformed or split. */
export function sanitizeProfilePatch(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!PROFILE_PATCH_ALLOWED_KEYS.has(key)) continue;
    if (value === undefined) continue;
    result[key] = value;
  }
  return result;
}

// Update profile fields only (no image) — sends JSON
export const updatePatientProfileReq = (
  data: UpdatePatientProfileBody & {
    profile_picture_url?: string | null; // pass "" or null to clear the photo
  },
) => {
  const url = urlGenerator("patients", "me/profile", false);
  return requestHandler<GeneralReturnInt<PatientProfileInterface>>(
    url,
    options(
      "PATCH",
      sanitizeProfilePatch(data) as UpdatePatientProfileBody,
      true,
    ),
  );
};

// Update profile with image — sends multipart/form-data
// Uses options() 4th formData param — handles Bearer token + omits Content-Type for correct boundary
/** Append a string-array field as repeated multipart parts.
 *  - undefined → leave untouched (field absent from request)
 *  - [] → append single empty string to explicitly clear
 *  - ["a","b"] → append each as its own part */
function appendList(
  formData: FormData,
  field: string,
  values: string[] | null | undefined,
) {
  if (values == null) return; // absent or null → leave untouched
  if (values.length === 0) {
    formData.append(field, ""); // explicit clear
    return;
  }
  for (const value of values) formData.append(field, value);
}

export const updatePatientProfilePictureReq = (data: {
  file: File;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  occupation?: string;
  address?: string;
  allergies?: string[] | null;
  previous_medical_conditions?: string[] | null;
  medical_flags?: string[] | null;
}) => {
  const url = urlGenerator("patients", "me/profile", false);

  const formData = new FormData();
  formData.append("file", data.file); // ✅ field name is "file" per API docs

  if (data.first_name) formData.append("first_name", data.first_name);
  if (data.last_name) formData.append("last_name", data.last_name);
  if (data.phone_number) formData.append("phone_number", data.phone_number);
  if (data.date_of_birth) formData.append("date_of_birth", data.date_of_birth);
  if (data.gender) formData.append("gender", data.gender);
  if (data.marital_status)
    formData.append("marital_status", data.marital_status);
  if (data.occupation) formData.append("occupation", data.occupation);
  if (data.address) formData.append("address", data.address);

  appendList(formData, "allergies", data.allergies);
  appendList(
    formData,
    "previous_medical_conditions",
    data.previous_medical_conditions,
  );
  appendList(formData, "medical_flags", data.medical_flags);

  return requestHandler<GeneralReturnInt<PatientProfileInterface>>(
    url,
    options("PATCH", undefined, true, formData),
  );
};

// Update patient timezone
export const updatePatientTimezoneReq = (data: { timezone: string }) => {
  const url = urlGenerator("patients", "me/timezone", false);
  return requestHandler<GeneralReturnInt<{ timezone: string }>>(
    url,
    options("PATCH", data, true),
  );
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const getAppointmentsReq = (param: {
  status?:
    | "PENDING"
    | "CONFIRMED"
    | "ACTIVE"
    | "COMPLETED"
    | "CANCELED"
    | "NO_SHOW"
    | "FAILED"
    | "FORFEITED"
    | "RESCHEDULED";
  from?: string;
  to?: string;
  page?: string;
  perPage?: string;
  q?: string;
}) => {
  const params = new URLSearchParams(param);
  const url = urlGenerator(
    "booking",
    "patients/appointments",
    false,
    params.toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      items: {
        _id: string;
        appointment_number: string;
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          specializations: string[];
        };
        patient_id: string;
        scheduled_start_at_utc: string;
        scheduled_end_at_utc: string;
        timezone_snapshot: string;
        reason_for_visit: string;
        reason_for_appointment?: string;
        complaint_details?: string;
        booking_profile_snapshot: {
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          marital_status: string;
          occupation: string;
          reason_for_appointment?: string;
        };
        consultation_id: string;
        status: PatientAppointmentStatus;
        rescheduled_history: PatientAppointmentRescheduledHistoryItem[];
      }[];
      pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
      };
    }>
  >(url, options("GET", null, true));
};

export type BookingAvailabilitySlot = {
  time: string;
  available_doctors: number;
  max_consecutive_slots: number;
  /**
   * True when this slot overlaps an appointment the requesting patient already
   * holds. Backend-computed and role-scoped, so it is only ever true for a
   * patient caller: it is the difference between "no doctors free" and "you are
   * already booked", which the picker surfaces differently.
   */
  patient_conflict?: boolean;
  /**
   * True when this slot is free, but one of the patient's own appointments sits
   * just past it, so the longest booking that fits here is shorter than the
   * maximum duration the picker offers. Lets the picker explain a slot that is
   * offered time-wise yet too short for the chosen duration, rather than
   * greying it out alongside genuine "no doctors free" slots.
   */
  patient_limits_duration?: boolean;
};

export type BookingAvailabilityByDate = Record<
  string,
  {
    slots: BookingAvailabilitySlot[];
  }
>;

export const getWeeklyAppointmentsReq = (params?: {
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  days_ahead?: number | string;
  timezone?: string;
}) => {
  const supportedParams = {
    startDate: params?.startDate,
    endDate: params?.endDate,
    from: params?.from,
    to: params?.to,
    days_ahead: params?.days_ahead,
    timezone: params?.timezone,
  };
  const query = new URLSearchParams(
    Object.entries(supportedParams)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  const url = urlGenerator(
    "booking",
    "slots/availability",
    false,
    query || undefined,
  );

  return requestHandler<GeneralReturnInt<BookingAvailabilityByDate>>(
    url,
    options("GET", null, true),
  );
};

export const getSingleAppointmentReq = (id: string) => {
  const url = urlGenerator("booking", `patients/appointments/${id}`, false);

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      appointment_number: string;
      patient_id: PatientAppointmentPatient;
      doctor_id: {
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        specializations: string[];
        profile_picture_url?: string;
      };
      scheduled_start_at_utc: string;
      scheduled_end_at_utc: string;
      timezone_snapshot: string;
      status: PatientAppointmentStatus;
      reason_for_visit: string;
      reason_for_appointment?: string;
      complaint_details?: string;
      booking_profile_snapshot: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        gender: string;
        marital_status: string;
        occupation: string;
        reason_for_appointment?: string;
      };
      consultation_id: {
        _id: string;
        appointment_id: string;
        type: "VIDEO" | "CHAT" | "AUDIO" | "MEETADOCTOR" | "HOMESERVICE";
        consultation_id: string;
        title: string;
        details: string;
        status: PatientAppointmentStatus;
      };
      rescheduled_from_appointment_id?: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
      daily_room_expires_at?: string;
      daily_room_name?: string;
      daily_room_url?: string;
      rescheduled_history: PatientAppointmentRescheduledHistoryItem[];
    }>
  >(url, options("GET", null, true));
};

export const searchDoctorsReq = (params: {
  q?: string;
  specialization?: string;
  date?: string;
  page?: string;
  perPage?: string;
}) => {
  const param = new URLSearchParams(params);
  const url = urlGenerator(
    "booking",
    `doctors/search`,
    false,
    param.toString(),
  );

  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        profile_picture_url: string;
        specializations: string[];
        active: boolean;
        availability: {
          timezone: string;
          weekly_slots: {
            day_of_week: number;
            start_time: string;
            end_time: string;
            slot_duration_minutes: 15 | 30 | 45 | 60;
            is_active: boolean;
          }[];
          effective_from: string;
          effective_to?: string;
        };
      }>
    >
  >(url, options("GET", null, true));
};

export const lookupAvailableDoctorsReq = (params: {
  q?: string;
  specialization?: string;
  date?: string;
  page?: string;
  perPage?: string;
}) => {
  const url = urlGenerator(
    "booking",
    "doctors/available",
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        profile_picture_url: string;
        specializations: string[];
        active: boolean;
        availability: {
          timezone: string;
          weekly_slots: {
            day_of_week: number;
            start_time: string;
            end_time: string;
            slot_duration_minutes: 15 | 30 | 45 | 60;
            is_active: boolean;
          }[];
          effective_from: string;
          effective_to?: string;
        };
      }>
    >
  >(url, options("GET", null, true));
};

export const optimalLookupAvailableDoctorsReq = (params: {
  datetime_local?: string;
  timezone?: string;
  specialization?: string;
  duration?: string;
}) => {
  const url = urlGenerator(
    "booking",
    "doctors/find-optimal",
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      found: boolean;
      doctor: {
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        specializations: [];
      };
      slot: {
        start_at_utc: string;
        end_at_utc: string;
        duration_minutes: number;
        timezone: string;
      };
    }>
  >(url, options("GET", null, true));
};

export const checkDoctorAvailabilityReq = (
  doctorId: string,
  params: { datetime_local: string; timezone: string; duration: string },
) => {
  const url = urlGenerator(
    "booking",
    `doctors/${doctorId}/check-availability`,
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      available: boolean;
      /** Stable discriminator — prefer this over matching on `reason`. */
      reason_code?:
        | "PATIENT_BOOKED"
        | "NO_DOCTOR_AVAILABILITY"
        | "OUTSIDE_EFFECTIVE_RANGE"
        | "NO_SLOT_AT_TIME"
        | "DURATION_MISALIGNED"
        | "DURATION_EXCEEDS_WINDOW"
        | "BLACKOUT"
        | "DOCTOR_BOOKED";
      reason?: string;
      doctor?: {
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        specializations: string[];
      };
      slot?: {
        start_at_utc: string;
        end_at_utc: string;
        duration_minutes: number;
        timezone?: string;
      };
    }>
  >(url, options("GET", null, true));
};

export const bookAnAppointmentReq = (data: {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  reason_for_appointment: string;
  doctor_id: string;
  scheduled_start_local: string;
  timezone: string;
  requested_duration_minutes: 15 | 30 | 45 | 60;
  confirm_appointment: boolean;
  consultation_type?:
    | "VIDEO"
    | "CHAT"
    | "AUDIO"
    | "MEETADOCTOR"
    | "HOMESERVICE";
  complaint_details?: string;
  Medical_conditions?: string[]; // examples ["Hypertension","Asthma"],
  allergies?: string[];
}) => {
  const url = urlGenerator("booking", "patients/appointments", false);

  const formattedData = {
    ...data,
    date_of_birth: data.date_of_birth.split("T")[0],
  };

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      appointment_number: string;
      patient_id: string;
      doctor_id: string;
      scheduled_start_at_utc: string;
      scheduled_end_at_utc: string;
      timezone_snapshot: string;
      status:
        | "PENDING"
        | "CONFIRMED"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELED"
        | "NO_SHOW"
        | "FAILED"
        | "FORFEITED"
        | "RESCHEDULED";
      reason_for_visit: string;
      reason_for_appointment?: string;
      complaint_details?: string;
      booking_profile_snapshot: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        gender: string;
        marital_status: string;
        occupation: string;
        reason_for_appointment?: string;
      };
    }>
  >(url, options("POST", formattedData, true));
};

export const cancelAppointmentReq = (id: string, data: { reason: string }) => {
  const url = urlGenerator(
    "booking",
    `patients/appointments/${id}/cancel`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      status:
        | "PENDING"
        | "CONFIRMED"
        | "ACTIVE"
        | "COMPLETED"
        | "CANCELED"
        | "NO_SHOW"
        | "FAILED"
        | "FORFEITED"
        | "RESCHEDULED";
      cancelled_by: string;
      cancelled_reason: string;
    }>
  >(url, options("PATCH", data, true));
};

// reschedule an appointment

export const rescheduleAppointment = (
  data: {
    scheduled_start_local: string; // example "2026-03-26T10:00:00"
    timezone: string; // example "America/Edmonton"
    requested_duration_minutes: number;
    reason: string; // example "Need a different time due to schedule conflict"
    requested_specialization: string;
  },
  appointmentId: string,
) => {
  const url = urlGenerator(
    "booking",
    `patients/appointments/${appointmentId}/reschedule`,
    false,
  );

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("PATCH", data, true),
  );
};

//Returns all investigation list items assigned to the authenticated patient, grouped by consultation. Paginated by number of consultation groups. Sorted by most recent first.
export const getPatientInvestigationListReq = (params: {
  page: string;
  perPage: string;
}) => {
  const url = urlGenerator(
    "patients",
    "consultations/investigations/grouped",
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      groups: {
        consultation: {
          _id: string;
          title: string;
          type: string;
          consoltation_for: string;
          status: string;
          session_number: string;
          consultation_id: string;
          doctor_id: {
            _id: string;
            first_name: string;
            last_name: string;
            full_name: string;
            email: string;
            specializations: string[];
            profile_picture_url: string | null;
          };
          appointment_id: {
            appointment_number: string;
            scheduled_start_at_utc: string;
            scheduled_end_at_utc: string;
            status: string;
            reason_for_visit: string;
          };
        } | null;
        investigation_count: number;
        investigations: {
          _id: string;
          name: string;
          category?: string | null;
          test_requested?: string | null;
          priority?: string;
          specimen?: string;
          assign_to_patient: boolean;
          user_id: string;
          consultation_id: string;
          createdAt?: string;
          updatedAt?: string;
          /** Uploaded result images (filled once the patient/doctor uploads). */
          result_images?: string[];
          doctor_id: {
            _id: string;
            first_name: string;
            last_name: string;
            full_name: string;
            email: string;
            specializations: string[];
            profile_picture_url: string | null;
          };
        }[];
      }[];
      pagination: {
        total: number;
        page: number;
        perPage: number;
        total_pages: number;
      };
    }>
  >(url, options("GET", null, true));
};

export const uploadInvestigationResultImageReq = (id: string, file: File[]) => {
  const formData = new FormData();

  file.forEach((f) => {
    formData.append("files", f);
  });
  const url = urlGenerator(
    "patients",
    `consultations/investigation-list/${id}/upload`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      name: string;
      assign_to_patient: boolean;
      user_id: string;
      consultation_id: {
        _id: string;
        consoltation_for: string;
        createdAt: string;
        status: string;
        title: string;
        type: string;
        updatedAt: string;
      };
      doctor_id: {
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        specializations: string[];
        profile_picture_url: string;
        id: string;
      };
      createdAt: string;
      updatedAt: string;
      __v: number;
      result_images: string[];
    }>
  >(url, options("PATCH", undefined, true, formData));
};

// ─── Patient Referrals ────────────────────────────────────────────────────────

export const getSingleReferralForPatientReq = (referral_id: string) => {
  const url = urlGenerator(
    "patients",
    `consultations/referrals/${referral_id}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      specialist_name: string;
      specialty?: string | null;
      hospital: string;
      hospital_address?: string[];
      attachment_investigation_ids?: string[];
      current_medications?: string | null;
      referral_details: string;
      referred_doctor_name?: string;
      assign_to_patient?: boolean;
      consultation_id: {
        _id: string;
        title: string;
        type: string;
        status: string;
        createdAt: string;
      };
      user_id: string;
      doctor_id: {
        _id: string;
        full_name: string;
        specializations: string[];
      };
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("GET", null, true));
};
export const listReferralsForPatientConsultationReq = (
  consultation_id: string,
) => {
  const url = urlGenerator(
    "patients",
    `consultations/${consultation_id}/referrals`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        specialist_name: string;
        specialty?: string | null;
        hospital: string;
        hospital_address?: string[];
        attachment_investigation_ids?: string[];
        current_medications?: string | null;
        referral_details: string;
        referred_doctor_name?: string;
        assign_to_patient?: boolean;
        consultation_id: string;
        user_id: string;
        doctor_id: {
          _id: string;
          full_name: string;
          specializations: string[];
        };
        createdAt: string;
        updatedAt: string;
      }>
    >
  >(url, options("GET", null, true));
};

export type GroupedConsultationMedicationItem = Pick<
  MedicationDetail,
  | "_id"
  | "formulary"
  | "medication"
  | "dose"
  | "unit"
  | "interval"
  | "duration"
  | "duration_unit"
  | "order_instruction"
  | "start_date"
  | "status"
>;

export interface GroupedConsultationMedicationGroup {
  formulary: GroupedConsultationMedicationItem["formulary"];
  count: number;
  medications: GroupedConsultationMedicationItem[];
}

export interface GroupedConsultationMedicationsResponse {
  consultation_id: string;
  total: number;
  groups: GroupedConsultationMedicationGroup[];
}

export interface ConsultationInvestigationsConsultation {
  _id: string;
  consoltation_for: string;
  createdAt: string;
  status: string;
  title: string;
  type: string;
  updatedAt: string;
}

export interface ConsultationInvestigationsDoctor {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  specializations: string[];
  profile_picture_url: string | null;
}

export interface ConsultationInvestigationsItem {
  _id: string;
  name: string;
  category?: string | null;
  test_requested?: string | null;
  priority?: string;
  specimen?: string;
  assign_to_patient: boolean;
  user_id: string;
  consultation_id: ConsultationInvestigationsConsultation;
  doctor_id: ConsultationInvestigationsDoctor;
  result_images: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ConsultationInvestigationsResponse {
  consultation: ConsultationInvestigationsConsultation | null;
  investigation_count: number;
  investigations: ConsultationInvestigationsItem[];
}

export interface PatientReferralDoctorSummary {
  _id: string;
  full_name: string;
  specializations: string[];
  profile_picture_url: string | null;
}

export interface PatientReferralConsultationSummary {
  _id: string;
  title: string;
  type: string;
  consoltation_for: string;
  status: string;
  session_number: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatientReferralItem {
  _id: string;
  specialist_name: string;
  hospital: string;
  referral_details: string;
  referred_doctor_name?: string;
  assign_to_patient?: boolean;
  consultation_id: string | PatientReferralConsultationSummary;
  user_id: string;
  doctor_id: {
    _id: string;
    full_name: string;
    specializations: string[];
    profile_picture_url?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const getGroupedMedicationsForConsultationsReq = (
  consultation_id: string,
) => {
  const url = urlGenerator(
    "patients",
    `consultations/${consultation_id}/medications/grouped`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<GroupedConsultationMedicationsResponse>
  >(url, options("GET", null, true));
};

export const getInvestigationsForConsultationReq = (
  consultation_id: string,
) => {
  const url = urlGenerator(
    "patients",
    `consultations/${consultation_id}/investigation-list`,
    false,
  );

  return requestHandler<GeneralReturnInt<ConsultationInvestigationsResponse>>(
    url,
    options("GET", null, true),
  );
};
export const getReferralListReq = () => {
  const url = urlGenerator("patients", "consultations/referrals", false);

  return requestHandler<GeneralReturnInt<PatientReferralItem[]>>(
    url,
    options("GET", null, true),
  );
};

export const getGroupMedicationsByConsultation = (params: {
  page: string;
  perPage: string;
}) => {
  const url = urlGenerator(
    "patients",
    "consultations/medications/grouped-by-consultation",
    false,
    new URLSearchParams(params).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      groups: {
        consultation: {
          _id: string;
          appointment_id: {
            _id: string;
            appointment_number: string;
            scheduled_start_at_utc: string;
            scheduled_end_at_utc: string;
            timezone_snapshot: string;
            status: string;
            reason_for_visit: string;
          };
          createdAt: string;
          status: string;
          title: string;
          type: string;
          updatedAt: string;
        };
        medication_count: number;
        medications: {
          _id: string;
          formulary: string;
          medication: string;
          dose: number;
          unit: string;
          interval: string;
          duration: number;
          duration_unit: string;
          assign_to_patient: boolean;
          user_id: string;
          consultation_id: {
            _id: string;
            appointment_id: {
              _id: string;
              appointment_number: string;
              scheduled_start_at_utc: string;
              scheduled_end_at_utc: string;
              timezone_snapshot: string;
              status: string;
              reason_for_visit: string;
            };
            createdAt: string;
            status: string;
            title: string;
            type: string;
            updatedAt: string;
          };
          doctor_id: {
            _id: string;
            first_name: string;
            last_name: string;
            full_name: string;
            email: string;
            specializations: string[];
            profile_picture_url: string;
          };
          status: string;
          createdAt: string;
          updatedAt: string;
          __v?: number;
        }[];
      }[];
      pagination: {
        total: number;
        page: number;
        perPage: number;
        total_pages: number;
      };
    }>
  >(url, options("GET", undefined, true));
};

export const getGroupedReferralsForConsultationsReq = () => {
  const url = urlGenerator(
    "patients",
    "consultations/referrals/grouped",
    false,
  );

  return requestHandler<
    GeneralReturnInt<
      {
        consultation: {
          _id: string;
          title: string;
          type: string;
          consoltation_for: string;
          status: string;
          session_number: number;
          createdAt: string;
          updatedAt: string;
        };
        referrals: {
          _id: string;
          specialist_name: string;
          specialty?: string | null;
          hospital: string;
          hospital_address?: string[];
          attachment_investigation_ids?: string[];
          current_medications?: string | null;
          referral_details: string;
          referred_doctor_name?: string;
          assign_to_patient?: boolean;
          consultation_id: string;
          user_id: string;
          doctor_id: {
            _id: string;
            full_name: string;
            specializations: string[];
            profile_picture_url: string | null;
          };
          createdAt: string;
          updatedAt: string;
        }[];
      }[]
    >
  >(url, options("GET", undefined, true));
};

export type PatientDashMetrics = {
  consultations: number;
  medications: number;
  investigations: number;
  appointments: number;
};

export const getPatientDashMetrics = () => {
  const url = urlGenerator("patients", "me/metrics", false);

  return requestHandler<GeneralReturnInt<PatientDashMetrics>>(
    url,
    options("GET", undefined, true),
  );
};
