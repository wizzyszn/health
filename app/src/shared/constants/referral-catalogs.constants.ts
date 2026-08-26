/**
 * Referral catalogs — single source of truth for the doctor's referral form.
 *
 * REFERRAL_SPECIALTIES lists **specialty names** — the branch of medicine the
 * referred provider practices ("Cardiologist", "Dentist", …) — not person
 * names or consultant titles. The backend enum
 * (health-app/src/consultations/dto/create-referral.dto.ts) mirrors this list;
 * keep both sides in sync.
 *
 * APPROVED_HOSPITALS is hydrated from hospitals.catalog.json so stakeholders
 * can expand the hospital list without touching code.
 */
import hospitalCatalog from "./hospitals.catalog.json";
import { MEDICAL_SPECIALTY_OPTIONS } from "./medical-specialty.constant";

/** Specialty names for the referral form — derived from the master list. */
export const REFERRAL_SPECIALTIES = MEDICAL_SPECIALTY_OPTIONS;
export type ReferralSpecialty = (typeof REFERRAL_SPECIALTIES)[number];

const SPECIALTY_LOOKUP = new Map(
  MEDICAL_SPECIALTY_OPTIONS.map((specialty) => [
    specialty.toLowerCase(),
    specialty,
  ]),
);

/**
 * Maps persisted specialty values onto the current name-based list.
 * Older drafts/saves may hold consultant titles ("Consultant Cardiologist");
 * the title prefix is stripped when the remainder matches the master list
 * (case-insensitively, returning the canonical spelling), and anything
 * unrecognised becomes "" so the user re-picks.
 */
export function normalizeLegacySpecialty(value?: string | null): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return (
    SPECIALTY_LOOKUP.get(trimmed.toLowerCase()) ??
    SPECIALTY_LOOKUP.get(
      trimmed
        .replace(/^consultant\s+/i, "")
        .trim()
        .toLowerCase(),
    ) ??
    ""
  );
}

/** An approved referral destination with its full postal address. */
export interface ApprovedHospital {
  id: string;
  name: string;
  state: string;
  type: string;
  addressLines: string[];
  phone?: string;
}

/**
 * Stakeholder-approved referral destinations. Addresses are rendered verbatim
 * on the letter — keep them complete in the catalog.
 */
export const APPROVED_HOSPITALS: ApprovedHospital[] = hospitalCatalog.map(
  (hospital) => ({ ...hospital }),
);

export function findApprovedHospital(id: string): ApprovedHospital | undefined {
  return APPROVED_HOSPITALS.find((hospital) => hospital.id === id);
}
