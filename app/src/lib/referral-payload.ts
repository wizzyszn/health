import type { ReferralFormValues } from "@/lib/validation-schemas";

/**
 * Referral form values → request body.
 *
 * Used by both the create and the update call, so every field the form
 * collects has to be copied here explicitly. `current_medications` was missing:
 * the doctor could type a regimen, the letter renderer could print one, and the
 * value still never reached the API — the patient's downloaded letter silently
 * fell back to the medication list derived from the consultation.
 */
export function mapReferralFormToPayload(
  values: ReferralFormValues,
  assignToPatient: boolean,
) {
  return {
    specialty: values.specialty?.trim() || undefined,
    specialist_name: values.specialist_name,
    hospital: values.hospital,
    hospital_address:
      values.hospital_address && values.hospital_address.length > 0
        ? values.hospital_address
        : undefined,
    attachment_investigation_ids:
      values.attachment_investigation_ids &&
      values.attachment_investigation_ids.length > 0
        ? values.attachment_investigation_ids
        : undefined,
    referral_details: values.referral_details,
    // Always sent, empty string included: undefined means "leave unchanged"
    // on update, so clearing the box has to travel as an explicit value or
    // the previously saved regimen would survive the edit.
    current_medications: values.current_medications?.trim() ?? "",
    assign_to_patient: assignToPatient,
  };
}
