export type ConsultationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "CANCELLED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "CANCELLED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED";

export interface BaseItem {
  id: string;
  first_name: string;
  last_name: string;
  patientName: string;
  ref: string;
  refLabel?: string;
  type: string;
  date: { day: number; month: string };
  time: string;
  profile_picture_url?: string;
}

export interface Consultation extends BaseItem {
  status: ConsultationStatus;
  appointmentId?: string;
}

export interface Appointment extends BaseItem {
  status: AppointmentStatus;
  hasRescheduledHistory?: boolean;
}

// Raw API shape from /doctors/consultations (list)
export interface RawDoctorConsultation {
  _id: string;
  consultation_id: string;
  type: "VIDEO" | "AUDIO" | "IN_PERSON";
  status: ConsultationStatus;
  title: string;
  details: string;
  consoltation_for: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth?: string;
    full_name?: string;
    gender?: string;
    phone_number?: string;
    profile_picture_url?: string;
    id?: string;
  };
  doctor_id: {
    _id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
    phone_number?: string;
    specializations?: string[];
    profile_picture_url?: string;
    id?: string;
  };
  appointment_id: {
    _id: string;
    appointment_number: string;
    scheduled_start_at_utc: string;
    scheduled_end_at_utc: string;
    timezone_snapshot: string;
    status: AppointmentStatus;
    reason_for_visit: string;
    reason_for_appointment?: string;
    complaint_details?: string;
  };
}

export interface ConsultationBookingProfileSnapshot {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  occupation: string;
  reason_for_appointment: string;
}

export interface ConsultationAppointmentPerson {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  mrn?: string;
  profile_picture_url?: string;
  id?: string;
}

export interface ConsultationAppointmentDoctor extends ConsultationAppointmentPerson {
  specializations?: string[];
}

export interface RawDoctorConsultationAppointment {
  _id: string;
  appointment_number: string;
  patient_id: ConsultationAppointmentPerson;
  doctor_id: ConsultationAppointmentDoctor;
  scheduled_start_at_utc: string;
  scheduled_end_at_utc: string;
  timezone_snapshot: string;
  status: AppointmentStatus;
  reason_for_visit: string;
  reason_for_appointment?: string;
  complaint_details?: string;
  Medical_conditions?: string[];
  allergies?: string[];
  booking_profile_snapshot?: ConsultationBookingProfileSnapshot;
  daily_room_expires_at?: string;
  daily_room_name?: string;
  daily_room_url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawDoctorConsultationDetail {
  _id: string;
  type: "VIDEO" | "AUDIO" | "IN_PERSON";
  status: ConsultationStatus;
  title: string;
  consoltation_for: string;
  doctor_id: string;
  createdAt: string;
  updatedAt: string;
  user_id: {
    _id: string;
    registration_no?: string;
    mrn?: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    full_name: string;
    email: string;
    phone_number?: string;
    gender?: string;
    date_of_birth?: string;
    marital_status?: string;
    occupation?: string;
    address?: string;
    allergies?: string[];
    previous_medical_conditions?: string[];
    medical_flags?: string[];
    terms_accepted?: boolean;
    provider?: string;
    verified?: boolean;
    profile_picture_url?: string;
    timezone?: string;
    id?: string;
  };
  appointment_id: RawDoctorConsultationAppointment;
  diagnosis_id?: string[];
  investigation_id?: string[];
  medication_id?: string[];
  referral_id?: string[];
  history_taking_id?: string;
  physical_exam_id?: string;
  investigation_result_id?: string;
  diagnosis_form_id?: string;
  treatment_plan_id?: string;
}
