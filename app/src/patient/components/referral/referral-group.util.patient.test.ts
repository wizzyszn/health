import { describe, expect, it } from "vitest";

import {
  getReferralGroupSpecialties,
  getReferralGroupTitle,
} from "@/patient/components/referral/referral-group.util.patient";
import type { ReferralGroup } from "@/patient/components/referral/referral.types.patient";

function makeGroup(
  specialties: Array<string | null | undefined>,
): ReferralGroup {
  return {
    consultation: {
      _id: "consultation-1",
      title: "Video Consultation",
      type: "video",
      consoltation_for: "specialist",
      status: "completed",
      session_number: 1,
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    },
    referrals: specialties.map((specialty, index) => ({
      _id: `referral-${index}`,
      specialist_name: `Specialist ${index + 1}`,
      specialty,
      hospital: "General Hospital",
      referral_details: "Referral details",
      consultation_id: "consultation-1",
      user_id: "patient-1",
      doctor_id: {
        _id: "doctor-1",
        full_name: "Dr. Jane Okafor",
        specializations: ["Dermatology"],
        profile_picture_url: null,
      },
      createdAt: "2026-08-24T10:00:00.000Z",
      updatedAt: "2026-08-24T10:00:00.000Z",
    })),
  };
}

describe("referral group title", () => {
  it("uses the referral specialty instead of the consultation title", () => {
    expect(getReferralGroupTitle(makeGroup(["Dermatologist"]))).toBe(
      "Dermatologist",
    );
  });

  it("deduplicates specialties and joins multiple specialties", () => {
    const group = makeGroup(["Dermatologist", "dermatologist", "Cardiologist"]);

    expect(getReferralGroupSpecialties(group)).toEqual([
      "Dermatologist",
      "Cardiologist",
    ]);
    expect(getReferralGroupTitle(group)).toBe("Dermatologist, Cardiologist");
  });

  it("falls back to a generic label for legacy referrals without specialties", () => {
    expect(getReferralGroupTitle(makeGroup([null, undefined, "  "]))).toBe(
      "Referral",
    );
  });
});
