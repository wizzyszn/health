export type ConsultationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED"
  | "CANCELLED";
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELED"
  | "NO_SHOW"
  | "FAILED"
  | "FORFEITED"
  | "RESCHEDULED";

export interface BaseItem {
  id: string;
  doctorName: string;
  specialty: string;
  ref: string;
  type: string;
  date: { day: number; month: string };
  time: string;
}

export interface Consultation extends BaseItem {
  status: ConsultationStatus;
}

export interface Appointment extends BaseItem {
  status: AppointmentStatus;
  hasRescheduledHistory?: boolean;
}
