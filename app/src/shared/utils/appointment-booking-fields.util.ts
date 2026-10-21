/**
 * Booking captures two free-text fields that are stored on the appointment:
 *
 * - "Reason for Appointment (visit)" -> `reason_for_appointment`
 * - "Complaint Details" -> `complaint_details`
 */
export type AppointmentBookingFields = {
  reason_for_appointment?: string | null;
  complaint_details?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() ?? "";
}

export function getBookingReasonForAppointment(
  appointment?: AppointmentBookingFields | null,
) {
  return clean(appointment?.reason_for_appointment);
}

export function getBookingComplaintDetails(
  appointment?: AppointmentBookingFields | null,
) {
  return clean(appointment?.complaint_details);
}
