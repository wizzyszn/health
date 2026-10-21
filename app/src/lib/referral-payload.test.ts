import { describe, expect, it } from "vitest";
import { mapReferralFormToPayload } from "./referral-payload";
import { referralFormSchema } from "./validation-schemas";
import type { ReferralFormValues } from "./validation-schemas";

const baseValues = (
  over: Partial<ReferralFormValues> = {},
): ReferralFormValues => ({
  specialist_name: "Dr. Okoh",
  specialty: "Cardiologist",
  hospital: "Lagos University Teaching Hospital",
  referral_details: "Persistent chest pain.",
  ...over,
});

describe("mapReferralFormToPayload", () => {
  it("sends the doctor-typed current medications, trimmed", () => {
    // The value reached the form and the letter renderer but not this mapper,
    // so it never left the browser — the letter then fell back to the
    // medication list derived from the consultation.
    const payload = mapReferralFormToPayload(
      baseValues({
        current_medications:
          "  Amlodipine 5mg once daily\nMetformin 500mg twice daily  ",
      }),
      true,
    );

    expect(payload.current_medications).toBe(
      "Amlodipine 5mg once daily\nMetformin 500mg twice daily",
    );
  });

  it("sends an explicit empty string so an update can clear the override", () => {
    // undefined would be read by the API as "leave unchanged", making the
    // field impossible to clear once set.
    const payload = mapReferralFormToPayload(
      baseValues({ current_medications: "" }),
      true,
    );

    expect(payload.current_medications).toBe("");
  });

  it("keeps specialist_name optional", () => {
    const payload = mapReferralFormToPayload(
      baseValues({ specialist_name: "  " }),
      true,
    );

    expect(payload.specialist_name).toBe("");
  });

  it("requires specialty but allows a missing specialist name", () => {
    const required = {
      specialty: "Dermatologist",
      hospital: "Lagos University Teaching Hospital",
      referral_details: "Persistent rash.",
    };

    expect(referralFormSchema.safeParse(required).success).toBe(true);
    expect(
      referralFormSchema.safeParse({ ...required, specialty: "" }).success,
    ).toBe(false);
  });

  it("keeps the other field mappings unchanged", () => {
    const payload = mapReferralFormToPayload(
      baseValues({
        specialty: "  Cardiologist ",
        hospital_address: [],
        attachment_investigation_ids: [],
      }),
      false,
    );

    expect(payload.specialty).toBe("Cardiologist");
    expect(payload.hospital_address).toBeUndefined();
    expect(payload.attachment_investigation_ids).toBeUndefined();
    expect(payload.assign_to_patient).toBe(false);
  });
});
