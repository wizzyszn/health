export type MedicationDoctor = {
  _id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  specializations: string[];
  profile_picture_url: string;
};

export type MedicationAppointment = {
  _id: string;
  appointment_number: string;
  scheduled_start_at_utc: string;
  scheduled_end_at_utc: string;
  timezone_snapshot: string;
  status: string;
  reason_for_visit: string;
};

export type MedicationConsultation = {
  _id: string;
  appointment_id: MedicationAppointment;
  createdAt: string;
  status: string;
  title: string;
  type: string;
  updatedAt: string;
};

export type MedicationItem = {
  _id: string;
  formulary: string;
  medication: string;
  dose: number;
  unit: string;
  interval: string;
  duration: number;
  duration_unit: string;
  order_instruction?: string | null;
  start_date?: string | null;
  assign_to_patient: boolean;
  user_id: string;
  consultation_id: MedicationConsultation;
  doctor_id: MedicationDoctor;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

export type MedicationGroup = {
  consultation: MedicationConsultation;
  medication_count: number;
  medications: MedicationItem[];
};

export type MedicationPatientProfile = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
};
