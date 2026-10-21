/**
 * Booking captures two free-text fields that are stored on the appointment:
 *
 * - "Reason for Appointment (visit)" -> `reason_for_visit`
 * - "Complaint Details" -> `complaint_details`
 *
 * The booking request still posts `reason_for_appointment`, so that alias is
 * accepted as a fallback for responses/older records that use it. The
 * appointment endpoints populate `reason_for_visit`, which is why reading only
 * the request-side field left the details pages showing "No reason provided".
 */
export type AppointmentBookingFields = {
  reason_for_visit?: string | null;
  reason_for_appointment?: string | null;
  complaint_details?: string | null;
  booking_profile_snapshot?: {
    reason_for_appointment?: string | null;
  } | null;
};

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

export function getBookingReasonForAppointment(
  appointment?: AppointmentBookingFields | null,
) {
  return (
    clean(appointment?.reason_for_visit) ||
    clean(appointment?.reason_for_appointment) ||
    clean(appointment?.booking_profile_snapshot?.reason_for_appointment)
  );
}

export function getBookingComplaintDetails(
  appointment?: AppointmentBookingFields | null,
) {
  return clean(appointment?.complaint_details);
}
