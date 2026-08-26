/**
 * Master list of specialty names (what a provider practises — "Cardiologist",
 * "Dentist", …). Single source of truth:
 *   - the referral form's Specialty select consumes it via
 *     REFERRAL_SPECIALTIES (shared/constants/referral-catalogs.constants.ts)
 *   - the backend's REFERRAL_SPECIALTIES enum mirrors it
 */
export const MEDICAL_SPECIALTY_OPTIONS = [
  "Anaesthetist",
  "Cardiologist",
  "Clinical Psychologist",
  "Dentist",
  "Dermatologist",
  "Dietitian",
  "Endocrinologist",
  "ENT Specialist",
  "Gastroenterologist",
  "General Surgeon",
  "Geriatrician",
  "Gynaecologist",
  "Haematologist",
  "Infectious Disease Specialist",
  "Nephrologist",
  "Neurologist",
  "Neurosurgeon",
  "Obstetrician",
  "Oncologist",
  "Ophthalmologist",
  "Orthodontist",
  "Orthopaedic Surgeon",
  "Otolaryngologist",
  "Paediatrician",
  "Physiotherapist",
  "Plastic Surgeon",
  "Psychiatrist",
  "Pulmonologist",
  "Radiologist",
  "Respiratory Physician",
  "Rheumatologist",
  "Urologist",
  "Vascular Surgeon",
] as const;

export type MedicalSpecialtyOption = (typeof MEDICAL_SPECIALTY_OPTIONS)[number];

export function filterMedicalSpecialties(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...MEDICAL_SPECIALTY_OPTIONS];

  return MEDICAL_SPECIALTY_OPTIONS.filter((specialty) =>
    specialty.toLowerCase().includes(normalized),
  );
}
