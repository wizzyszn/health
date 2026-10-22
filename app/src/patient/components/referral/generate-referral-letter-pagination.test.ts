/**
 * Regression guard for the referral-letter page count.
 *
 * One referral must stay a one-page letter. The signature block used to be as
 * tall as 48mm, so a letter with an investigations table pushed only the
 * signature onto page 2. This renders a representative full letter in Node and
 * inspects the PDF page objects.
 */
import { describe, expect, it } from "vitest";
import { createReferralLetterPdf } from "./generate-referral-letter-pdf.patient";
import {
  applyReferralAttachments,
  buildReferralLetterData,
  type ReferralLetterSourceInvestigation,
} from "./referral-letter-data.util.patient";

async function pageCount(blob: Blob): Promise<number> {
  const text = Buffer.from(await blob.arrayBuffer()).toString("latin1");
  return (text.match(/\/Type\s*\/Page\b/g) ?? []).length;
}

const investigations: ReferralLetterSourceInvestigation[] = [
  {
    _id: "inv-1",
    name: "Peripheral Smear",
    createdAt: "2026-10-20T10:00:00.000Z",
    result_images: ["https://cdn.example/smear.jpg"],
  },
];

describe("referral letter pagination", () => {
  it("keeps a complete referral with investigations on one page", async () => {
    const letter = buildReferralLetterData({
      referral: {
        specialty: "Dentist",
        specialist_name: "Dr. Jane Okafor",
        hospital: "Lagos State University Teaching Hospital",
        hospital_address: [
          "1-5 Oba Akinjobi Way",
          "Ikeja",
          "Lagos State",
          "Nigeria",
        ],
        referral_details:
          "Persistent pain in the lower left molar with swelling; please assess and manage.",
      },
      patient: {
        fullName: "Wisdom Adedoyin Olubayo",
        mrn: "C-JQZKYY",
        dateOfBirth: "2000-01-05T00:00:00.000Z",
        gender: "male",
        phone: "+234 800 000 0000",
        email: "wizzywizpad@gmail.com",
        allergies: ["Ibuprofen", "Shellfish", "Rice"],
        previous_medical_conditions: ["Diabetes", "Urticaria"],
      },
      referringDoctorFullName: "Emeka Okafor",
      referralDate: new Date("2026-10-20T10:00:00.000Z"),
    });
    applyReferralAttachments(letter, ["inv-1"], investigations);

    const file = await createReferralLetterPdf(letter);

    expect(await pageCount(file.blob)).toBe(1);
    expect(file.fileName).toBe("referral-olubayo-20261020.pdf");
  });

  it("suffixes the filename for grouped exports", async () => {
    const letter = buildReferralLetterData({
      referral: {
        specialty: "Cardiologist",
        specialist_name: "Dr Henry",
        hospital: "Ekiti State University Teaching Hospital",
        referral_details: "Chest pain.",
      },
      patient: {
        fullName: "Wisdom Olubayo",
        dateOfBirth: "2000-01-05T00:00:00.000Z",
        gender: "male",
        allergies: [],
        previous_medical_conditions: [],
      },
      referringDoctorFullName: "Emeka Okafor",
      referralDate: new Date("2026-10-21T10:00:00.000Z"),
    });

    const file = await createReferralLetterPdf(letter, {
      fileNameSuffix: "Cardiologist",
    });

    expect(file.fileName).toBe("referral-olubayo-cardiologist-20261021.pdf");
  });
});
