/**
 * Node-side smoke test for the referral-letter generator internals.
 *
 * The generator itself needs a browser (fetch/FileReader/jsPDF canvas), so
 * these tests exercise the pure helpers via the shared letter-data mapper and
 * verify the module's public surface + palette contract. Run: npm run test
 */
import { describe, expect, it } from "vitest";
import {
  buildReferralLetterData,
  buildAttachmentChecklist,
  describeMedication,
  parseFreeTextMedications,
} from "@/patient/components/referral/referral-letter-data.util.patient";
import { REFERRAL_PALETTE } from "@/shared/constants/company.constants";
import { normalizeLegacySpecialty } from "@/shared/constants/referral-catalogs.constants";

const basePatient = {
  fullName: "Ada Obi",
  mrn: "C-4KD9PX",
  dateOfBirth: "1994-03-12T00:00:00.000Z",
  gender: "female",
  phone: "+234 800 000 0000",
  email: "ada@example.com",
  allergies: ["Penicillin"],
  previous_medical_conditions: ["Hypertension", "Type 2 Diabetes"],
};

const baseReferral = {
  specialty: "Cardiologist",
  specialist_name: "Dr. Jane Okafor",
  hospital: "Lagos University Teaching Hospital",
  hospital_address: ["Idi-Araba", "Surulere", "Lagos State", "Nigeria"],
  referral_details: "Persistent chest pain; rule out cardiac involvement.",
};

describe("referral letter data mapper", () => {
  it("maps patient identity fields verbatim", () => {
    const data = buildReferralLetterData({
      referral: baseReferral,
      patient: basePatient,
      referringDoctorFullName: "Dr. Emeka Okafor",
      referralDate: new Date("2026-08-24T10:00:00.000Z"),
    });

    expect(data.patient.fullName).toBe("Ada Obi");
    expect(data.patient.mrn).toBe("C-4KD9PX");
    expect(data.recipient.name).toBe("Dr. Jane Okafor");
    expect(data.recipient.specialty).toBe("Cardiologist");
    expect(data.recipient.addressLines).toEqual([
      "Idi-Araba",
      "Surulere",
      "Lagos State",
      "Nigeria",
    ]);
    expect(data.referringDoctor.fullName).toBe("Dr. Emeka Okafor");
  });

  it("falls back to profile lists for history and flags allergies", () => {
    const data = buildReferralLetterData({
      referral: baseReferral,
      patient: basePatient,
      referringDoctorFullName: "Dr. Emeka Okafor",
      referralDate: new Date(),
    });

    expect(data.clinical.history).toEqual(["Hypertension", "Type 2 Diabetes"]);
    expect(data.clinical.allergies).toEqual(["Penicillin"]);
    // No consultation medications supplied → generator prints fallback text.
    expect(data.clinical.medications).toEqual([]);
  });

  it("describes medications in prescription phrasing", () => {
    const label = describeMedication({
      medication: "Lisinopril",
      dose: 10,
      unit: "MILLIGRAM",
      interval: "TWICE_DAILY",
      duration: 14,
      duration_unit: "DAY",
    });
    expect(label).toBe("Lisinopril 10MILLIGRAM twice daily for 14 days");

    const unknownInterval = describeMedication({
      medication: "Paracetamol",
      dose: 500,
      unit: "MILLIGRAM",
      interval: "AS_NEEDED",
      duration: 3,
      duration_unit: "DAY",
    });
    expect(unknownInterval).toContain("as needed");
  });

  it("treats legacy referrals (no specialty/address) without throwing", () => {
    const legacy = buildReferralLetterData({
      referral: {
        specialist_name: "Dr. Old Record",
        hospital: "Some Clinic",
        referral_details: "Legacy referral.",
      },
      patient: {
        fullName: "Unknown Patient",
        allergies: [],
        previous_medical_conditions: [],
      },
      referringDoctorFullName: "Dr. X",
      referralDate: new Date(),
    });

    expect(legacy.recipient.specialty).toBeNull();
    expect(legacy.recipient.addressLines).toEqual([]);
    expect(legacy.clinical.history).toEqual([]);
  });

  it("builds an all-checked attachment checklist from labels", () => {
    const checklist = buildAttachmentChecklist(["FBC", "Urinalysis"]);
    expect(checklist).toHaveLength(2);
    expect(checklist.every((row) => row.checked)).toBe(true);
    expect(checklist.map((row) => row.label)).toEqual(["FBC", "Urinalysis"]);
  });
});

describe("free-text current medications", () => {
  it("splits lines and semicolons, trimming blanks", () => {
    expect(
      parseFreeTextMedications(
        "Lisinopril 10mg once daily\nAspirin 75mg once daily; Metformin 500mg",
      ),
    ).toEqual([
      "Lisinopril 10mg once daily",
      "Aspirin 75mg once daily",
      "Metformin 500mg",
    ]);
    expect(parseFreeTextMedications("  \n  \n")).toEqual([]);
    expect(parseFreeTextMedications(null)).toEqual([]);
  });

  it("lets the doctor's typed medications override recorded ones", () => {
    const data = buildReferralLetterData({
      referral: {
        ...baseReferral,
        current_medications: "Amlodipine 5mg once daily",
      },
      patient: basePatient,
      referringDoctorFullName: "Dr. Emeka Okafor",
      referralDate: new Date(),
      consultationMedications: [
        {
          medication: "Lisinopril",
          dose: 10,
          unit: "MILLIGRAM",
          interval: "DAILY",
          duration: 30,
          duration_unit: "DAY",
        },
      ],
    });
    expect(data.clinical.medications).toEqual(["Amlodipine 5mg once daily"]);
  });

  it("falls back to recorded medications when the field is blank", () => {
    const data = buildReferralLetterData({
      referral: { ...baseReferral, current_medications: "   " },
      patient: basePatient,
      referringDoctorFullName: "Dr. Emeka Okafor",
      referralDate: new Date(),
      consultationMedications: [
        {
          medication: "Lisinopril",
          dose: 10,
          unit: "MILLIGRAM",
          interval: "DAILY",
          duration: 30,
          duration_unit: "DAY",
        },
      ],
    });
    expect(data.clinical.medications).toEqual([
      "Lisinopril 10MILLIGRAM once daily for 30 days",
    ]);
  });
});

describe("referral palette contract", () => {
  it("keeps the carelexa purple/teal tokens used by the PDF", () => {
    expect(REFERRAL_PALETTE.primary).toEqual([91, 45, 142]);
    expect(REFERRAL_PALETTE.accent).toEqual([43, 181, 160]);
  });
});

describe("legacy specialty normalization", () => {
  it("passes current name-based values through", () => {
    expect(normalizeLegacySpecialty("Cardiologist")).toBe("Cardiologist");
    expect(normalizeLegacySpecialty("Dentist")).toBe("Dentist");
  });

  it("strips consultant titles from legacy records", () => {
    expect(normalizeLegacySpecialty("Consultant Cardiologist")).toBe(
      "Cardiologist",
    );
    expect(normalizeLegacySpecialty("consultant  psychiatrist")).toBe(
      "Psychiatrist",
    );
  });

  it("blanks unknown or empty values so the user re-picks", () => {
    expect(normalizeLegacySpecialty("Chief Wizard of Cardiology")).toBe("");
    expect(normalizeLegacySpecialty("   ")).toBe("");
    expect(normalizeLegacySpecialty(null)).toBe("");
    expect(normalizeLegacySpecialty(undefined)).toBe("");
  });
});
