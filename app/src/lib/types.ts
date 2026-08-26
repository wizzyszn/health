import { IconProps } from "@/shared/components/svgs/icons/icon.types";

export enum StorageKeysEnum {
  token = "health_token",
  refresh_token = "refresh_token",
  isLoggedIn = "health_logged_in",
  role = "health_role",
  user = "health_user",
  registerState = "health_register_state",
  bookingState = "health_booking_state",
  timezone = "health_timezone",
}
interface Admin {
  _id: string;
  email: string;
  role: string;
}

interface AdminLoginResponse {
  access_token?: string;
  accessToken?: string;
  token?: string;
  refresh_token?: string;
  refreshToken?: string;
  admin?: Admin;
  role?: string;
}

type UserType = Patient | Doctor | Admin | AdminLoginResponse;
interface SideNavOption {
  Icon: React.ComponentType<IconProps>;
  title: string;
  url: string;
  exactMatch?: string;
  iconProps?: React.SVGAttributes<SVGElement>;
}
interface BaseUser {
  _id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  active?: boolean;
  provider: "local" | "google" | "facebook";
  createdAt: string;
  updatedAt: string;
  token?: string;
  refresk_token: string;
  phone_number?: string;
  verified: boolean;
  terms_accepted: boolean;
}
// All possible user roles
type UserRole = "admin" | "doctor" | "patient" | undefined;

interface Patient {
  role?: UserRole;
  token?: string;
  user?: BaseUser & {
    allergies: [];
    previous_medical_conditions: [];
    medical_flags: [];
    mrn?: string;
  };
  refresh_token: string;
}
interface Doctor {
  doctor?: BaseUser & {
    doctor_no: string;
    license_no: string;
    specialization: string[];
  };
  role?: UserRole;
  token?: string;
  refresh_token?: string;
}
//consultation
interface Consultation {
  _id: string | number;
  type: "CHAT" | "AUDIO" | "VIDEO" | "MEETADOCTOR" | "HOMESERVICE";
  consoltation_for: "SELF" | "OTHERS";
  title: string;
  consultation_id?: string;
  details: string;
  session_start_date: string;
  session_end_date: string;
  patient_last_name: string;
  patient_first_name: string;
  patient_middle_name?: string;
  patient_age: number;
  patient_dob: string;
  patient_address: string;
  patient_marital_status: string;
  patient_gender: string;
  patient_occupation: string;
  treatment_plan?: string;
  status: "PENDING" | "COMPLETED" | "CANCELED" | "ACTIVE";
  updatedAt: string;
}
interface Consultations {
  consultation: Consultation[];
  meta: {
    page: number;
    lastPage: number;
    total: number;
  };
}
interface ConsultationReqBody {
  type: "CHAT" | "AUDIO" | "VIDEO" | "MEETADOCTOR" | "HOMESERVICE";
  consoltation_for: "SELF" | "OTHERS";
  title: string;
  details: string;
  session_start_date: string;
  session_end_date: string;
  patient_last_name: string;
  patient_first_name: string;
  patient_middle_name?: string;
  patient_age: number;
  patient_dob: string;
  patient_address: string;
  patient_marital_status?: string;
  patient_gender: string;
  patient_occupation?: string;
  treatment_plan?: string;
}
interface Diagnosis {
  _id: string;
  title: string;
  description: string;
  user_id: string;
  consultation_id: {
    _id: string;
    type: string;
    user_id: string;
    doctor_id: string;
    consoltation_for: string;
    title: string;
    details: string;
    session_duration: string;
    session_start_date: string;
    session_end_date: string;
    session_number: string;
    patient_last_name: string;
    patient_first_name: string;
    patient_age: number;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  doctor_id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Schedules {
  _id: string;
  type: "MEETADOCTOR";
  user_id: UserType;
  consoltation_for: "SELF" | "OTHER";
  title: string;
  details: string;
  session_duration: string;
  session_start_date: string; // ISO Date string
  session_end_date: string; // ISO Date string
  session_number: string;
  patient_last_name: string;
  patient_first_name: string;
  patient_middle_name: string;
  patient_age: number;
  patient_dob: string; // ISO Date string
  patient_address: string;
  patient_marital_status: "single" | "married" | "divorced" | "widowed";
  patient_gender: "male" | "female" | "other";
  patient_occupation: string;
  amount: number;
  treatment_plan: string;
  status: "PENDING" | "APPROVED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  __v: number;
}
type FullCalendarData =
  | {
      _id: string;
      title: string;
      date: string;
      start: string;
      end: string;
      endStr: string;
      startStr: string;
      details?: string;
      fullTitle?: string;
      patientName?: string;
      consultationId?: string;
      consultationType?: string;
      status?:
        | "PENDING"
        | "APPROVED"
        | "COMPLETED"
        | "CANCELLED"
        | "ACTIVE"
        | "CANCELED"
        | "CONFIRMED"
        | "NO_SHOW"
        | "FAILED"
        | "FORFEITED"
        | "RESCHEDULED"
        | "CONSULTATION_COMPLETED"
        | "BLACKOUT";
      display?: string;
      classNames?: string[];
      color?: string;
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
      groupId?: string;
    }[]
  | undefined;
interface Investigation {
  _id: string;
  name: string;
  user_id: string;
  consultation_id: {
    _id: string;
    type: string;
    user_id: string;
    doctor_id: string;
    consoltation_for: string;
    title: string;
    details: string;
    session_duration: string;
    session_start_date: string;
    session_end_date: string;
    session_number: string;
    patient_last_name: string;
    patient_first_name: string;
    patient_age: number;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  doctor_id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
interface Investigations {
  investigation: Investigation[];
  meta: {
    page: number;
    lastPage: number;
    total: number;
  };
}
interface GeneralReturnInt<T> {
  success: boolean;
  respons_code: string;
  response_description: string;
  data: T;
  request_id: string;
  path: string;
  timestamp: string;
}
type RejectedPayload = {
  success: boolean;
  response_code: string;
  response_description: string;
  message: string;
};
//Medications
type Formulation = "TABLET" | "SYRUP" | "CAPSULE" | "INJECTION";
type Interval = "DAILY" | "WEEKLY" | "MONTHLY" | "AS_NEEDED";
type DoseUnit =
  "MILLIGRAM" | "MICROGRAM" | "PUFFS" | "TAB" | "CAB" | "MLS" | "LITRE";
type DurationUnit = "MINUTE" | "HOUR" | "DAY" | "MONTH";
interface MedicationFormulation {
  formulation: Formulation;
  drug: string;
  dose_value: number;
  dose_unit: DoseUnit;
  dose?: string;
  interval: Interval;
  duration_value: number;
  duration_unit: DurationUnit;
  duration?: string;
}
interface MedicationFormulationInt {
  formulation: Formulation;
  drug: string;
  dose_value: number;
  dose_unit: DoseUnit;
  dose?: string;
  interval: Interval;
  duration_value: number;
  duration_unit: DurationUnit;
  duration?: string;
  status: "ACTIVE" | "PENDING" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}

interface PatientProfileInterface {
  _id: string;
  registration_no: string;
  mrn?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number?: string;
  gender?: "Male" | "Female" | "";
  marital_status?: "Single" | "Married" | "";
  occupation?: string;
  address?: string;
  profile_picture_url?: string;
  date_of_birth?: string;
  age?: string;
  allergies: string[];
  previous_medical_conditions: string[];
  medical_flags: string[];
  timezone?: string;
}

type UpdatePatientProfileBody = {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  occupation?: string;
  address?: string;
  profile_picture_url?: string;
  allergies?: string[];
  previous_medical_conditions?: string[];
  medical_flags?: string[];
};

interface MedicationDetail {
  _id: string;
  medication: string;
  formulary: Formulation;
  dose: number;
  unit: DoseUnit;
  interval: Interval;
  duration: number;
  duration_unit: DurationUnit;
  order_instruction?: string | null;
  start_date?: string | null;
  assign_to_patient: boolean;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  consultation_id: {
    _id: string;
    title: string;
    type: string;
    status: string;
    createdAt: string;
  };
  doctor_id: {
    _id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    specializations: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface Referral {
  _id: string;
  reference_number: string;
  consult_time: string;
  date: string;
  time: string;
  doctor_id: {
    _id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    specializations: string[];
  };
  reason: string;
  referred_to: string;
  priority: "Urgent" | "Routine";
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type {
  UserRole,
  Patient,
  GeneralReturnInt,
  RejectedPayload,
  SideNavOption,
  Consultation,
  Consultations,
  Doctor,
  Diagnosis,
  ConsultationReqBody,
  UserType,
  Schedules,
  FullCalendarData,
  Investigations,
  Investigation,
  Formulation,
  Interval,
  DoseUnit,
  DurationUnit,
  MedicationFormulation,
  MedicationFormulationInt,
  BaseUser,
  PatientProfileInterface,
  UpdatePatientProfileBody,
  Admin,
  AdminLoginResponse,
  MedicationDetail,
  Referral,
};
