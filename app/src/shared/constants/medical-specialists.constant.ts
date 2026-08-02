export const MEDICAL_SPECIALIST_OPTIONS = [
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

export type MedicalSpecialistOption =
  (typeof MEDICAL_SPECIALIST_OPTIONS)[number];

export function filterMedicalSpecialists(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...MEDICAL_SPECIALIST_OPTIONS];

  return MEDICAL_SPECIALIST_OPTIONS.filter((specialist) =>
    specialist.toLowerCase().includes(normalized),
  );
}
