export type InvestigationDoctor = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

export type InvestigationAppointment = {
  scheduled_start_at_utc?: string;
  reason_for_visit?: string;
};

export type InvestigationConsultation = {
  _id?: string;
  type?: string;
  title?: string;
  doctor_id?: InvestigationDoctor;
  appointment_id?: InvestigationAppointment;
};

export type InvestigationRaw = {
  _id: string;
  name: string;
  category?: string | null;
  test_requested?: string | null;
  priority?: string;
  specimen?: string;
  consultation_id?: string;
  result_images?: string[];
  doctor_id?: InvestigationDoctor;
};

export type InvestigationGroup = {
  consultation?: InvestigationConsultation | null;
  investigation_count?: number;
  investigations?: InvestigationRaw[];
};

export type InvestigationPatientProfile = {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
};
