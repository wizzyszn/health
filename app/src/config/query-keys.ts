export const queryKeys = {
  patientProfile: ["patient-profile"] as const,
  doctorAvailability: ["doctor-availability"] as const,
  consultationInvestigations: (consultationId: string) =>
    ["consultation-investigations", consultationId] as const,
  consultationMedications: (consultationId: string) =>
    ["consultation-medications", consultationId] as const,
};
