import {
  //Consultation,
  Consultations,
  Diagnosis,
  Doctor,
  GeneralReturnInt,
  Investigation,
  Investigations,
  Schedules,
} from "@/lib/types";
import { RawDoctorConsultationDetail } from "@/doctor/types/consultation.types";
import { options, requestHandler, urlGenerator } from "./config";

type DoctorAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED";

type DoctorAppointmentProfileSnapshot = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  reason_for_appointment: string;
};

type DoctorAppointmentPatient = {
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

type DoctorAppointmentDoctor = {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  specializations: string[];
  profile_picture_url?: string;
};

type DoctorAppointmentRescheduledHistoryItem = {
  _id: string;
  appointment_number: string;
  patient_id: DoctorAppointmentPatient;
  doctor_id: DoctorAppointmentDoctor;
  scheduled_start_at_utc: string;
  scheduled_end_at_utc: string;
  timezone_snapshot: string;
  status: DoctorAppointmentStatus;
  reason_for_visit: string;
  Medical_conditions?: unknown[];
  allergies?: unknown[];
  booking_profile_snapshot: DoctorAppointmentProfileSnapshot;
  createdAt: string;
  updatedAt: string;
  __v: number;
  cancelled_by?: string;
  cancelled_reason?: string;
};

// Login Doctor with creds
export const loginDoctor = (data: { email: string; password: string }) => {
  const url = urlGenerator("auth", "doctors/login", false);
  return requestHandler<GeneralReturnInt<Doctor>>(
    url,
    options("POST", data, true),
  );
};

// get all consultations for a doctor
export const getAllConsultationsForDoc = (
  page: number = 1,
  perPage: number = 5,
  startDate?: string | undefined,
  endDate?: string | undefined,
  searchTerm?: string | undefined,
) => {
  let param = `page=${page}&perPage=${perPage}`;

  if (startDate && endDate) {
    param += `&startDate=${startDate}&endDate=${endDate}`;
  }

  if (searchTerm) {
    param += `&search=${searchTerm}`;
  }

  const url = urlGenerator("doctors", "consultations", false, param);
  return requestHandler<GeneralReturnInt<Consultations>>(
    url,
    options("GET", null, true),
  );
};

export enum ConsultationStatusEnum {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
  ACTIVE = "ACTIVE",
  RESCHEDULED = "RESCHEDULED",
}
// get paginated consultations for a doctor

export const getDoctorConsultationsReq = (param?: {
  page?: string;
  perPage?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  q?: string;
}) => {
  const url = urlGenerator(
    "doctors",
    "consultations",
    false,
    new URLSearchParams(param).toString(),
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
          status: "PENDING" | "CONFIRMED" | "RESCHEDULED";
          reason_for_visit: string;
        };
        type: "VIDEO" | "AUDIO";
        user_id: {
          _id: string;
          first_name: string;
          last_name: string;
          email: string;
          date_of_birth: string;
          full_name: string;
          gender: string;
          phone_number: string;
          profile_picture_url: string;
          id: string;
        };
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          phone_number: string;
          specializations: string[];
          profile_picture_url: string;
          id: string;
        };
        consoltation_for: "SELF";
        consultation_id: string;
        title: string;
        details: string;
        status: ConsultationStatusEnum;
      }>;
      meta: {
        total: number;
        page: number;
        lastPage: number;
      };
    }>
  >(url, options("GET", null, true));
};

// get all patients for doctor with search and pagination
export const getDoctorPatientsReq = (param?: {
  q?: string;
  page?: string;
  limit?: string;
}) => {
  const query = new URLSearchParams({
    q: param?.q || "",
    page: param?.page || "1",
    limit: param?.limit || "20",
  }).toString();

  const url = urlGenerator("doctors", "patients", false, query);

  return requestHandler<
    GeneralReturnInt<{
      patients: Array<{
        _id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        phone_number: string;
        registration_no?: string;
        mrn?: string;
        has_consultation_with_doctor: boolean;
      }>;
      meta: {
        total: number;
        page: number;
        lastPage: number;
        perPage: number;
      };
    }>
  >(url, options("GET", null, true));
};

// get a single consultation for a doctor
export const getAConsultationsForDoc = (consultationId: string) => {
  const url = urlGenerator("doctors", `consultations/${consultationId}`, false);
  return requestHandler<GeneralReturnInt<RawDoctorConsultationDetail>>(
    url,
    options("GET", null, true),
  );
};

// ─── Appointment actions ─────────────────────────────────────────────────────

// Accept appointment (doctor accepts)
export const acceptAppointmentReq = (appointmentId: string) => {
  const url = urlGenerator(
    "booking",
    `doctors/me/appointments/${appointmentId}/accept`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};

// Confirm appointment
export const confirmAppointmentReq = (appointmentId: string) => {
  const url = urlGenerator(
    "booking",
    `appointments/${appointmentId}/confirm`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};

// Complete appointment
export const completeAppointmentReq = (appointmentId: string) => {
  const url = urlGenerator(
    "booking",
    `appointments/${appointmentId}/complete`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};

// Mark appointment as no-show
export const noShowAppointmentReq = (appointmentId: string) => {
  const url = urlGenerator(
    "booking",
    `appointments/${appointmentId}/no-show`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", {}, true),
  );
};

// Cancel appointment (general)
export const cancelAppointmentReq = (
  appointmentId: string,
  data: { reason: string },
) => {
  const url = urlGenerator(
    "booking",
    `appointments/${appointmentId}/cancel`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", data, true),
  );
};

// Cancel doctor appointment (doctor-specific cancel)
export const cancelDoctorAppointmentReq = (
  appointmentId: string,
  data: { reason: string },
) => {
  const url = urlGenerator(
    "booking",
    `doctors/me/appointments/${appointmentId}/cancel`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", data, true),
  );
};

// Reschedule doctor appointment
export const rescheduleDoctorAppointmentReq = (
  appointmentId: string,
  data: {
    scheduled_start_local: string;
    timezone: string;
    requested_duration_minutes: 15 | 30 | 45 | 60;
  },
) => {
  const url = urlGenerator(
    "booking",
    `doctors/me/appointments/${appointmentId}/reschedule`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("PATCH", data, true),
  );
};

// ─── Appointments ────────────────────────────────────────────────────────────

export const getDoctorAppointmentsReq = (param: {
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
    "doctors/me/appointments",
    false,
    params.toString(),
  );
  return requestHandler<
    GeneralReturnInt<{
      items: {
        _id: string;
        appointment_number: string;
        doctor_id: string;
        patient_id: string;
        scheduled_start_at_utc: string;
        scheduled_end_at_utc: string;
        timezone_snapshot: string;
        status: DoctorAppointmentStatus;
        reason_for_visit: string;
        booking_profile_snapshot?: {
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          marital_status: string;
          occupation: string;
          reason_for_appointment: string;
        };
        consultation_id?: string;
        rescheduled_from_appointment_id?: string;
        rescheduled_history?: DoctorAppointmentRescheduledHistoryItem[];
      }[];
      pagination: {
        page: number;
        total: number;
        lastPage: number;
        totalPages: number;
      };
    }>
  >(url, options("GET", null, true));
};

// Get a single appointment for a doctor
export const getSingleDoctorAppointmentReq = (appointmentId: string) => {
  const url = urlGenerator(
    "booking",
    `doctors/me/appointments/${appointmentId}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      appointment_number: string;
      patient_id: {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        full_name: string;
        gender: string;
        marital_status: string;
        occupation: string;
        mrn?: string;
        profile_picture_url: string;
      };
      doctor_id: string;
      scheduled_start_at_utc: string;
      scheduled_end_at_utc: string;
      timezone_snapshot: string;
      status: DoctorAppointmentStatus;
      reason_for_visit: string;
      reason_for_appointment?: string;
      complaint_details?: string;
      Medical_conditions?: unknown[];
      allergies?: unknown[];
      booking_profile_snapshot: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        gender: string;
        marital_status: string;
        occupation: string;
        reason_for_appointment: string;
      };
      consultation_id?: {
        _id: string;
        appointment_id: string;
        type: "VIDEO" | "CHAT" | "AUDIO" | "MEETADOCTOR" | "HOMESERVICE";
        consultation_id: string;
        title: string;
        details: string;
        status: DoctorAppointmentStatus;
      };
      rescheduled_from_appointment_id?: string;
      createdAt: string;
      updatedAt: string;
      __v: number;
      daily_room_expires_at?: string;
      daily_room_name?: string;
      daily_room_url?: string;
      rescheduled_history: DoctorAppointmentRescheduledHistoryItem[];
    }>
  >(url, options("GET", null, true));
};

export const getAllDoctorAppointmentsReq = () => {
  const url = urlGenerator("booking", "doctors/me/appointments/all", false);
  return requestHandler<
    GeneralReturnInt<
      Array<{
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
        booking_profile_snapshot: {
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: string;
          marital_status: string;
          occupation: string;
          reason_for_appointment: string;
        };
        consultation_id: {
          _id: string;
          appointment_id: string;
          type: "VIDEO" | "CHAT" | "AUDIO" | "MEETADOCTOR" | "HOMESERVICE";
          consultation_id: string;
          title: string;
          details: string;
          status: DoctorAppointmentStatus;
          rescheduled_history: DoctorAppointmentRescheduledHistoryItem[];
        };
      }>
    >
  >(url, options("GET", null, true));
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getDoctorProfileReq = () => {
  const url = urlGenerator("doctors", "me", false);
  return requestHandler<
    GeneralReturnInt<{
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
      profile_picture_url?: string;
      createdAt: string;
      updatedAt: string;
      id: string;
      timezone?: string;
    }>
  >(url, options("GET", null, true));
};

// Update profile fields only (no image) — sends JSON
export const updateDoctorProfileReq = (data: {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture_url?: string | null; // pass "" or null to clear the photo
}) => {
  const url = urlGenerator("doctors", "me/profile", false);
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("PATCH", data, true),
  );
};

// Update profile with image — sends multipart/form-data
// Uses options() 4th formData param — handles Bearer token + omits Content-Type for correct boundary
export const updateDoctorProfilePictureReq = (data: {
  file: File;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}) => {
  const url = urlGenerator("doctors", "me/profile", false);

  const formData = new FormData();
  formData.append("file", data.file);

  if (data.first_name) formData.append("first_name", data.first_name);
  if (data.last_name) formData.append("last_name", data.last_name);
  if (data.phone_number) formData.append("phone_number", data.phone_number);

  return requestHandler<GeneralReturnInt<{ profile_picture_url?: string }>>(
    url,
    options("PATCH", undefined, true, formData),
  );
};

// Update doctor timezone
export const updateDoctorTimezoneReq = (data: { timezone: string }) => {
  const url = urlGenerator("doctors", "me/timezone", false);
  return requestHandler<GeneralReturnInt<{ timezone: string }>>(
    url,
    options("PATCH", data, true),
  );
};

// ─── Availability ─────────────────────────────────────────────────────────────

// Set doctor's availability slots
export const setDoctorAvailabilitySlotReq = (data: {
  timezone: string; // "Africa/Lagos"
  weekly_slots: {
    day_of_week: number;
    start_time: string; // "09:00"
    end_time: string; // "10:00"
    slot_duration_minutes: number;
    is_active: boolean; // default true
  }[];
  effective_from: string; // "2026-03-20"
  effective_to: string; // "2026-12-31"
}) => {
  const url = urlGenerator("booking", "doctors/me/availability", false);
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      doctor_id: string;
      timezone: string;
      weekly_slots: {
        day_of_week: number;
        start_time: string;
        end_time: string;
        slot_duration_minutes: 15 | 30 | 45 | 60;
        is_active: boolean;
      }[];
    }>
  >(url, options("PUT", data, true));
};

// Get doctor's availability slots
export const getDoctorAvailabilitySlotReq = () => {
  const url = urlGenerator("booking", "doctors/me/availability", false);
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      doctor_id: string;
      timezone: string;
      weekly_slots: {
        day_of_week: number;
        start_time: string; // "09:00"
        end_time: string; // "13:00"
        slot_duration_minutes: number;
        is_active: true;
      }[];
    }>
  >(url, options("GET", null, true));
};

// ─── Existing endpoints ──────────────────────────────────────────────────────

export const conductDiagnosis = (
  consultationId: string,
  data: { title: string; description: string },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/diagnosis`,
    false,
  );
  return requestHandler<GeneralReturnInt<Diagnosis>>(
    url,
    options("POST", data, true),
  );
};

export const investigateConsultation = (
  consultationId: string,
  data: { name: string[] },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/investigation`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("POST", data, true),
  );
};

export const getAllSchedulesForDoctor = () => {
  const url = urlGenerator(
    "doctors",
    "consultations/consultation/weekly",
    false,
  );
  return requestHandler<GeneralReturnInt<Schedules[]>>(
    url,
    options("GET", null, true),
  );
};

export const getAllInvestigationsForDoc = (
  page = 1,
  perPage = 5,
  startDate?: string,
  endDate?: string,
) => {
  let params = `page=${page}&perPage=${perPage}`;
  if (startDate && endDate)
    params += `&startDate=${startDate}&endDate=${endDate}`;

  const url = urlGenerator(
    "doctors",
    "consultations/investigation/list",
    false,
    params,
  );
  return requestHandler<GeneralReturnInt<Investigations>>(
    url,
    options("GET", null, true),
  );
};

export const getAllDiagnosis = () => {
  const url = urlGenerator("doctors", "consultations/diagnosis/list", false);
  return requestHandler<GeneralReturnInt<Diagnosis[]>>(
    url,
    options("GET", null, true),
  );
};

export const getDiagnosisForConsultation = (consultationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/diagnosis`,
    false,
  );
  return requestHandler<GeneralReturnInt<Diagnosis[]>>(
    url,
    options("GET", null, true),
  );
};

export const getInvestigationForConsultation = (consultationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/investigation`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ data: Investigation[] }>>(
    url,
    options("GET", null, true),
  );
};

// CRUD consultation Medication Endpoints

export const getSingleMedicationRecordReq = (medicationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/medication/${medicationId}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      prescriptions: Array<{
        formulary: string;
        medication: string;
        dose: number;
        unit: string;
        interval: string;
        duration: number;
        duration_unit: string;
      }>;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("GET", null, true));
};

export const updateMedicationRecordReq = (
  data: {
    formulary?: "TABLET" | "SYRUP" | "CAPSULE" | "INJECTION";
    medication?: string;
    dose?: number;
    unit?:
      | "MILLIGRAM"
      | "MICROGRAM"
      | "PUFFS"
      | "TAB"
      | "CAB"
      | "MLS"
      | "LITRE";

    interval?: "DAILY" | "WEEKLY" | "MONTHLY" | "AS_NEEDED";

    duration?: number;
    duration_unit?: "MINUTE" | "HOUR" | "DAY" | "MONTH";
    start_date?: string;
    order_instruction?: string;
    assign_to_patient: boolean;
  },
  id: string,
) => {
  const url = urlGenerator("doctors", `consultations/medication/${id}`, false);

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      prescriptions: Array<{
        formulary: string;
        medication: string;
        dose: number;
        unit: string;
        interval: string;
        duration: number;
        duration_unit: string;
      }>;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
      status: string;
    }>
  >(url, options("PATCH", data, true));
};
export const deleteMedicationRecordReq = (id: string) => {
  const url = urlGenerator("doctors", `consultations/medication/${id}`, false);

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("DELETE", {}, true),
  );
};
export const getMedicationsForConsultation = (consultationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/medication`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        formulary: string;
        medication: string;
        dose: number;
        unit: string;
        interval: string;
        duration: number;
        duration_unit: string;
        start_date?: string;
        order_instruction?: string;
        assign_to_patient: boolean;
        user_id: {
          medical_flags: string[];
          terms_accepted: boolean;
          _id: string;
          first_name: string;
          middle_name: string;
          last_name: string;
          email: string;
          verified: boolean;
          provider: string;
          createdAt: string;
          updatedAt: string;
          address: string;
          allergies: string[];
          date_of_birth: string;
          full_name: string;
          gender: string;
          marital_status: string;
          occupation: string;
          phone_number: string;
          previous_medical_conditions: string[];
          profile_picture_url: string;
          id: string;
        };
        consultation_id: {
          _id: string;
          appointment_id: string;
          __v: number;
          consoltation_for: string;
          createdAt: string;
          diagnosis_id: string[];
          doctor_id: string;
          investigation_id: string[];
          medication_id: string[];
          status: string;
          title: string;
          type: string;
          updatedAt: string;
          user_id: string;
          diagnosis_form_id: string;
        };
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
          profile_picture_url: string;
          id: string;
        };
        status: string;
      }>
    >
  >(url, options("GET", null, true));
};

export const createMedicationForConsultationReq = (
  consultationId: string,
  data: {
    medications: {
      formulary: "TABLET" | "SYRUP" | "CAPSULE" | "INJECTION";
      medication: string;
      unit:
        | "MILLIGRAM"
        | "MICROGRAM"
        | "PUFFS"
        | "TAB"
        | "CAB"
        | "MLS"
        | "LITRE";
      dose?: number;
      interval: "DAILY" | "WEEKLY" | "MONTHLY" | "AS_NEEDED";
      duration_unit: "MINUTE" | "HOUR" | "DAY" | "MONTH";
      duration?: number;
      start_date?: string;
      order_instruction?: string;
      assign_to_patient: boolean;
    }[];
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/medication`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      prescriptions: Array<{
        formulary: string;
        medication: string;
        dose: number;
        unit: string;
        interval: string;
        duration: number;
        duration_unit: string;
      }>;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
      status: string;
    }>
  >(url, options("POST", data, true));
};

// CRUD Investigation List Endpoints

export type InvestigationListItemPayload = {
  category: string;
  test_requested: string;
  priority: string;
  specimen?: string;
};

export type InvestigationListRecord = {
  _id: string;
  name: string;
  category?: string | null;
  test_requested?: string | null;
  priority?: string;
  specimen?: string;
  assign_to_patient: boolean;
  result_images?: string[];
  consultation_id: string;
  createdAt?: string;
  user_id?: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string;
    full_name: string;
    gender: string;
    phone_number: string;
    profile_picture_url: string;
    id: string;
  };
  doctor_id?: {
    _id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    specializations: string[];
    profile_picture_url: string;
    id: string;
  };
};

export const createInvestigationListForConsultationReq = (
  id: string,
  data: {
    investigations: InvestigationListItemPayload[];
    assign_to_patient: boolean;
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/investigation-list`,
    false,
  );

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, true),
  );
};
export const updateInvestigationListForConsultationReq = (
  id: string,
  data: Partial<InvestigationListItemPayload> & {
    assign_to_patient?: boolean;
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/investigation-list/${id}`,
    false,
  );

  return requestHandler<GeneralReturnInt<InvestigationListRecord>>(
    url,
    options("PATCH", data, true),
  );
};

export const getInvestigationListForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/investigation-list`,
    false,
  );

  return requestHandler<GeneralReturnInt<InvestigationListRecord[]>>(
    url,
    options("GET", {}, true),
  );
};

export const deleteInvestigationListForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/investigation-list/${id}`,
    false,
  );

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("DELETE", {}, true),
  );
};
export const getSingleInvestigationListRecordForConsultationReq = (
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/investigation-list/${id}`,
    false,
  );

  return requestHandler<GeneralReturnInt<InvestigationListRecord>>(
    url,
    options("GET", {}, true),
  );
};

export const getDoctorSchedules = (param: {
  weekly: string; //ISO week number (1-53). Returns schedule for that specific week with week metadata. Omit to fetch everything.
  year: string; //Year used with weekly. Defaults to current UTC year.
}) => {
  const url = urlGenerator(
    "booking",
    "doctors/me/schedule",
    false,
    new URLSearchParams(param).toString(),
  );

  return requestHandler<
    GeneralReturnInt<{
      appointments: {
        _id: string;
        appointment_number: string;
        patient_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          email: string;
          mrn?: string;
        };
        scheduled_start_at_utc: string;
        scheduled_end_at_utc: string;
        timezone_snapshot?: string;
        status: "PENDING" | "CONFIRMED" | "RESCHEDULED";
        reason_for_visit: string;
        consultation_id: {
          _id: string;
          type: string;
          consultation_id: string;
          title: string;
          status: string;
        };
      }[];
      blackouts: {
        _id: string;
        start_at_utc: string;
        end_at_utc: string;
        timezone?: string;
        reason: string;
        reccuring: boolean;
        recurring_rule_id: string;
      }[];
    }>
  >(url, options("GET", null, true));
};

export const setDoctorBlackoutSlotReq = (data: {
  blackouts: {
    start_local: string; //"2026-03-25T08:00:00";
    end_local: string; //"2026-03-25T17:00:00"
    timezone: string;
    reason: string;
    reccuring: boolean;
  }[];
}) => {
  const url = urlGenerator("booking", "doctors/me/blackouts", false);

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("POST", data, true),
  );
};

export const getDoctorBlackoutsReq = () => {
  const url = urlGenerator("booking", "doctors/me/blackouts", false);

  return requestHandler<
    GeneralReturnInt<
      {
        _id: string;
        doctor_id: string;
        start_at_utc: string; //"2026-03-30T08:00:00.000Z"
        end_at_utc: string; ///"2026-03-30T16:00:00.000Z"
        reason: string;
        timezone?: string;
        reccuring: boolean;
        day_of_week: number;
        start_time_minutes: number; //480
        end_time_minutes: number; //960
      }[]
    >
  >(url, options("GET", null, true));
};

export const deleteDoctorBlackoutsReq = (id: string) => {
  const url = urlGenerator("booking", `doctors/me/blackouts/${id}`, false);

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("DELETE", {}, true),
  );
};

export const getConsultationSpaceDetailsReq = (id: string) => {
  const url = urlGenerator("doctors", `consultations/${id}`, false);

  return requestHandler<
    GeneralReturnInt<{
      medication_id: string[];
      investigation_id: string[];
      diagnosis_id: string[];
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
      type: string;
      user_id: {
        medical_flags: string[];
        terms_accepted: boolean;
        _id: string;
        first_name: string;
        middle_name: string;
        last_name: string;
        email: string;
        verified: boolean;
        provider: string;
        createdAt: string;
        updatedAt: string;
        refresh_token: string;
        address: string;
        allergies: string[];
        date_of_birth: string;
        full_name: string;
        gender: string;
        marital_status: string;
        occupation: string;
        phone_number: string;
        previous_medical_conditions: string[];
        profile_picture_url: string;
        id: string;
      };
      doctor_id: string;
      consoltation_for: string;
      consultation_id: string;
      title: string;
      details: string;
      status: string;
    }>
  >(url, options("GET", null, true));
};

// Consultation Space Stages Endpoints
export const createPhysicalExamForConsultationReq = (
  data: {
    general_physical: string;
    nervous_system: string;
    respiratory_system: string;
    cardiovascular_system: string;
    gastrointestinal_system: string;
    genitourinary_system: string;
    musculoskeletal_system: string;
    ENT: string;
    obstetric_gynaecological: string;
    others: string;
    status: "COMPLETED" | "INCOMPLETE";
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/physical-exam`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      general_physical: string;
      nervous_system: string;
      respiratory_system: string;
      cardiovascular_system: string;
      gastrointestinal_system: string;
      genitourinary_system: string;
      musculoskeletal_system: string;
      ENT: string;
      obstetric_gynaecological: string;
      others: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("POST", data, true));
};

export const getPhysicalExamForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/physical-exam`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      general_physical: string;
      nervous_system: string;
      respiratory_system: string;
      cardiovascular_system: string;
      gastrointestinal_system: string;
      genitourinary_system: string;
      musculoskeletal_system: string;
      ENT: string;
      obstetric_gynaecological: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("GET", null, true));
};

export const updatePhysicalExamForConsultationReq = (
  data: {
    general_physical?: string;
    nervous_system?: string;
    respiratory_system?: string;
    cardiovascular_system?: string;
    gastrointestinal_system?: string;
    genitourinary_system?: string;
    musculoskeletal_system?: string;
    ENT?: string;
    obstetric_gynaecological?: string;
    others?: string;
    status?: "COMPLETED" | "INCOMPLETE";
  },
  physical_exam_id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/physical-exam/${physical_exam_id}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      general_physical: string;
      nervous_system: string;
      respiratory_system: string;
      cardiovascular_system: string;
      gastrointestinal_system: string;
      genitourinary_system: string;
      musculoskeletal_system: string;
      ENT: string;
      obstetric_gynaecological: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("PATCH", data, true));
};

export const deletePhysicalExamForConsultationReq = (
  physical_exam_id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/physical-exam/${physical_exam_id}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      message: string;
    }>
  >(url, options("DELETE", {}, true));
};

export const createHistoryTakingForConsultationReq = (
  data: {
    reason_for_appointment: string;
    history_of_presenting_complaint: string;
    past_medical_surgical_history: string;
    medication_history: string;
    allergy_history: string[];
    family_history: string;
    travel_history: string;
    occupation: string;
    social_history: string;
    obstetric_gynaecological_history: string;
    status: "COMPLETED" | "INCOMPLETE";
    others: string;
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/history-taking`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      reason_for_appointment: string;
      history_of_presenting_complaint: string;
      past_medical_surgical_history: string;
      medication_history: string;
      allergy_history: string[];
      family_history: string;
      travel_history: string;
      occupation: string;
      social_history: string;
      obstetric_gynaecological_history: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("POST", data, true));
};

export const getHistoryTakingForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/history-taking`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      reason_for_appointment: string;
      history_of_presenting_complaint: string;
      past_medical_surgical_history: string;
      medication_history: string;
      allergy_history: string[];
      family_history: string;
      travel_history: string;
      occupation: string;
      social_history: string;
      obstetric_gynaecological_history: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("GET", null, true));
};

export const updateHistoryTakingForConsultationReq = (
  data: {
    reason_for_appointment?: string;
    history_of_presenting_complaint?: string;
    past_medical_surgical_history?: string;
    medication_history?: string;
    allergy_history?: string[];
    family_history?: string;
    travel_history?: string;
    occupation?: string;
    social_history?: string;
    obstetric_gynaecological_history?: string;
    status?: "COMPLETED" | "INCOMPLETE";
    others?: string;
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/history-taking/${id}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      reason_for_appointment: string;
      history_of_presenting_complaint: string;
      past_medical_surgical_history: string;
      medication_history: string;
      allergy_history: string[];
      family_history: string;
      travel_history: string;
      occupation: string;
      social_history: string;
      obstetric_gynaecological_history: string;
      others: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("PATCH", data, true));
};

export const deleteHistoryTakingForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/history-taking/${id}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      message: string;
    }>
  >(url, options("DELETE", {}, true));
};

export const createInvestigationForConsultationReq = (
  data: {
    blood_test: string;
    microbiology: string;
    radiology: string;
    cardiovascular: string;
    procedures: string;
    others: string;
    status: "COMPLETED" | "INCOMPLETE";
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/investigation-result`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      blood_test: string;
      microbiology: string;
      radiology: string;
      cardiovascular: string;
      procedures: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("POST", data, true));
};

export const getInvestigationForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/investigation-result`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      blood_test: string;
      microbiology: string;
      radiology: string;
      cardiovascular: string;
      procedures: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("GET", null, true));
};

export const updateInvestigationForConsultationReq = (
  data: {
    blood_test?: string;
    microbiology?: string;
    radiology?: string;
    cardiovascular?: string;
    procedures?: string;
    others?: string;
    status?: "COMPLETED" | "INCOMPLETE";
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/investigation-result/${id}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      blood_test: string;
      microbiology: string;
      radiology: string;
      cardiovascular: string;
      procedures: string;
      others: string;
      status: "COMPLETED" | "INCOMPLETE";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("PATCH", data, true));
};

export const deleteInvestigationForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/investigation-result/${id}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      message: string;
    }>
  >(url, options("DELETE", {}, true));
};

export const createTreatmentPlanForConsultationReq = (
  data: {
    treatment_plan_details: string;
    status: "COMPLETED" | "INCOMPLETE";
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/treatment-plan`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      treatment_plan_details: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("POST", data, true));
};
export const getTreatmentPlanForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${id}/treatment-plan`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      treatment_plan_details: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("GET", {}, true));
};
export const updateTreatmentPlanForConsultationReq = (
  data: {
    treatment_plan_details: string;
    status: "COMPLETED" | "INCOMPLETE";
  },
  id: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/treatment-plan/${id}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      treatment_plan_details: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("PATCH", data, true));
};
export const deleteTreatmentPlanForConsultationReq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/treatment-plan/${id}`,
    false,
  );
  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      treatment_plan_details: string;
      status: string;
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("DELETE", {}, true));
};

export const createDiagnosisForConsultationReq = (
  consultationId: string,
  data: {
    provisional_diagnosis: string[];
    final_diagnosis: string[];
    status: "COMPLETED" | "INCOMPLETE";
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/diagnosis-form`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      provisional_diagnosis: string[];
      final_diagnosis: string[];
      status: "INCOMPLETE" | "COMPLETED";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("POST", data, true));
};
export const getDiagnosisForConsultationReq = (consultationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultationId}/diagnosis-form`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      provisional_diagnosis: string[];
      final_diagnosis: string[];
      status: "INCOMPLETE" | "COMPLETED";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("GET", {}, true));
};
export const updateDiagnosisForConsultationReq = (
  consultationId: string,
  data: {
    provisional_diagnosis: string[];
    final_diagnosis: string[];
    status: "COMPLETED" | "INCOMPLETE";
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/diagnosis-form/${consultationId}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      _id: string;
      provisional_diagnosis: string[];
      final_diagnosis: string[];
      status: "INCOMPLETE" | "COMPLETED";
      user_id: string;
      consultation_id: string;
      doctor_id: string;
    }>
  >(url, options("PATCH", data, true));
};

export const deleteDiagnosisForConsultationReq = (consultationId: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/diagnosis-form/${consultationId}`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<{
      message: string;
    }>
  >(url, options("DELETE", {}, true));
};

export const markConsultationAsCompleted = (consultation_id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultation_id}/complete`,
    false,
  );

  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("PATCH", {}, true),
  );
};

export const getPatientMedicalHistoryReq = (patient_id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/patients/${patient_id}/history`,
    false,
  );
  return requestHandler<GeneralReturnInt<unknown>>(
    url,
    options("GET", null, true),
  );
};

export const getPatientConsultationHistoryreq = (
  id: string,
  params?: { limit?: string },
) => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit);

  const url = urlGenerator(
    "doctors",
    `consultations/patients/${id}/history/consultations`,
    false,
    searchParams.toString() || undefined,
  );

  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        title: string;
        type: string;
        consoltation_for: string;
        status: string;
        session_number: string;
        createdAt: string;
        updatedAt: string;
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          specializations: string[];
          profile_picture_url: string;
        };
        appointment_id: {
          _id: string;
          appointment_number: string;
          scheduled_start_at_utc: string;
          scheduled_end_at_utc: string;
          status: string;
          reason_for_visit: string;
        };
      }>
    >
  >(url, options("GET", null, true));
};

export const getPatientMedicationHistoryreq = (
  id: string,
  params?: { limit?: string },
) => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit);

  const url = urlGenerator(
    "doctors",
    `consultations/patients/${id}/history/medications`,
    false,
    searchParams.toString() || undefined,
  );

  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        formulary: string;
        medication: string;
        dose: number;
        unit: string;
        interval: string;
        duration: number;
        duration_unit: string;
        assign_to_patient: boolean;
        status: string;
        createdAt: string;
        updatedAt: string;
        consultation_id: {
          _id: string;
          title: string;
          type: string;
          status: string;
          createdAt: string;
        };
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          specializations: string[];
          profile_picture_url: string;
        };
      }>
    >
  >(url, options("GET", null, true));
};

export const getPatientInvestigationHistoryReq = (
  patientId: string,
  params?: { page?: string; perPage?: string },
) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", params.page);
  if (params?.perPage) searchParams.set("perPage", params.perPage);

  const url = urlGenerator(
    "doctors",
    `consultations/patients/${patientId}/history/investigations`,
    false,
    searchParams.toString() || undefined,
  );

  return requestHandler<
    GeneralReturnInt<{
      groups: Array<{
        consultation: {
          _id: string;
          title: string;
          type: string;
          consoltation_for?: string;
          status: string;
          session_number?: string;
          consultation_id?: string;
          createdAt?: string;
          doctor_id?: {
            _id: string;
            first_name: string;
            last_name: string;
            full_name: string;
            specializations?: string[];
            profile_picture_url?: string;
          };
          appointment_id?: {
            appointment_number: string;
            scheduled_start_at_utc: string;
            scheduled_end_at_utc: string;
            status: string;
            reason_for_visit: string;
          };
        } | null;
        investigation_count: number;
        investigations: InvestigationListRecord[];
      }>;
      pagination: {
        total: number;
        page: number;
        perPage: number;
        total_pages: number;
      };
    }>
  >(url, options("GET", null, true));
};

export const getPatientMedicationDiagnosisreq = (id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/patients/${id}/history/diagnoses`,
    false,
  );

  return requestHandler<
    GeneralReturnInt<
      Array<{
        _id: string;
        title: string;
        description: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        consultation_id: {
          _id: string;
          title: string;
          type: string;
          status: string;
          createdAt: string;
        };
        doctor_id: {
          _id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          specializations: string[];
          profile_picture_url: string;
        };
      }>
    >
  >(url, options("GET", null, true));
};

// ─── Referrals ───────────────────────────────────────────────────────────────

export const createReferralForConsultationReq = (
  consultation_id: string,
  data: {
    /**
     * Optional, matching `CreateReferralDto` on the backend (`@IsOptional()`)
     * and the form schema, which lets a referral name only a specialty or a
     * hospital. Declaring it required — as the response shape legitimately
     * does — made every payload built from form values unassignable.
     */
    specialist_name?: string;
    specialty?: string;
    hospital: string;
    hospital_address?: string[];
    attachment_investigation_ids?: string[];
    current_medications?: string;
    referral_details: string;
    referred_doctor_name?: string;
    assign_to_patient?: boolean;
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultation_id}/referral`,
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
      consultation_id: string;
      user_id: string;
      doctor_id: string;
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("POST", data, true));
};

export const listReferralsForConsultationReq = (consultation_id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/${consultation_id}/referral`,
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
        user_id: string | null;
        doctor_id: string;
        createdAt: string;
        updatedAt: string;
      }>
    >
  >(url, options("GET", null, true));
};

export interface PatientReferralHistoryConsultation {
  _id: string;
  title: string;
  type: string;
  consoltation_for?: string;
  status: string;
  session_number?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientReferralHistoryDoctor {
  _id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  specializations?: string[];
  profile_picture_url?: string | null;
}

export interface PatientReferralHistoryRecord {
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
  consultation_id: string | PatientReferralHistoryConsultation | null;
  user_id: string | null;
  doctor_id: string | PatientReferralHistoryDoctor;
  createdAt: string;
  updatedAt: string;
}

export const getPatientReferralHistoryreq = (
  patientId: string,
  params?: { limit?: string },
) => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit);

  const url = urlGenerator(
    "doctors",
    `consultations/patients/${patientId}/history/referrals`,
    false,
    searchParams.toString() || undefined,
  );
  return requestHandler<GeneralReturnInt<PatientReferralHistoryRecord[]>>(
    url,
    options("GET", null, true),
  );
};

export const getPatientReferralHistoryRecordReq = (
  patientId: string,
  referralId: string,
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/patients/${patientId}/history/referrals/${referralId}`,
    false,
  );
  return requestHandler<GeneralReturnInt<PatientReferralHistoryRecord>>(
    url,
    options("GET", null, true),
  );
};

export const getReferralRecordReq = (referral_id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/referral/${referral_id}`,
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
      consultation_id: string;
      user_id: string;
      doctor_id: string;
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("GET", null, true));
};

export const updateReferralRecordReq = (
  referral_id: string,
  data: {
    specialist_name?: string;
    specialty?: string;
    hospital?: string;
    hospital_address?: string[];
    attachment_investigation_ids?: string[];
    current_medications?: string;
    referral_details?: string;
    referred_doctor_name?: string;
    assign_to_patient?: boolean;
  },
) => {
  const url = urlGenerator(
    "doctors",
    `consultations/referral/${referral_id}`,
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
      consultation_id: string;
      user_id: string;
      doctor_id: string;
      createdAt: string;
      updatedAt: string;
    }>
  >(url, options("PATCH", data, true));
};

export const deleteReferralRecordReq = (referral_id: string) => {
  const url = urlGenerator(
    "doctors",
    `consultations/referral/${referral_id}`,
    false,
  );
  return requestHandler<GeneralReturnInt<{ message: string }>>(
    url,
    options("DELETE", {}, true),
  );
};

export type DoctorDashMetrics = {
  consultations: number;
  medications: number;
  investigations: number;
  appointments: number;
};

export const getDoctorDashMetrics = () => {
  const url = urlGenerator("doctors", "me/metrics", false);

  return requestHandler<GeneralReturnInt<DoctorDashMetrics>>(
    url,
    options("GET", undefined, true),
  );
};
