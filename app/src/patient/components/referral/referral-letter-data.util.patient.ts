import type {
  ReferralLetterAttachment,
  ReferralLetterData,
} from "@/patient/components/referral/referral-letter-data.types.patient";

/**
 * Shared mapper that turns API referral records plus patient data into the
 * branded PDF generator's {@link ReferralLetterData} shape. Used by both the
 * doctor-side download flow and the patient-side regeneration so both sides
 * render identical letters (plan Task 6).
 *
 * Medical history and current medications are derived from persisted records
 * only (profile lists + consultation medications) — never from free-form
 * form state — because anything outside the backend's whitelisted referral
 * fields cannot survive a save.
 */
export interface ReferralLetterSourceReferral {
  /** Approved specialty value; null/undefined on legacy records. */
  specialty?: string | null;
  specialist_name: string;
  hospital: string;
  /** Address lines resolved from the approved-hospitals catalog. */
  hospital_address?: string[];
  referral_details: string;
  /**
   * Free-text current medications typed by the doctor (one per line or
   * semicolon-separated). When present it replaces the auto-derived
   * consultation medication list on the letter.
   */
  current_medications?: string | null;
}

export interface ReferralLetterSourcePatient {
  fullName: string;
  mrn?: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  allergies?: string[];
  previous_medical_conditions?: string[];
}

/** Minimal medication-record slice needed to describe therapy on the letter. */
export interface ReferralLetterSourceMedication {
  medication: string;
  dose: number;
  unit: string;
  interval: string;
  duration: number;
  duration_unit: string;
  status?: string;
}

const INTERVAL_LABELS: Record<string, string> = {
  DAILY: "once daily",
  TWICE_DAILY: "twice daily",
  THREE_TIMES_DAILY: "three times daily",
  FOUR_TIMES_DAILY: "four times daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
  AS_NEEDED: "as needed",
  STAT: "immediately",
};

function describeInterval(interval: string): string {
  return (
    INTERVAL_LABELS[interval] ?? interval.toLowerCase().split("_").join(" ")
  );
}

function describeDuration(duration: number, unit: string): string {
  if (!Number.isFinite(duration) || duration <= 0) return "";
  const unitLabel =
    duration === 1 ? unit.toLowerCase() : `${unit.toLowerCase()}s`;
  return ` for ${duration} ${unitLabel}`;
}

export function describeMedication(
  record: ReferralLetterSourceMedication,
): string {
  return [
    record.medication,
    `${record.dose}${record.unit}`,
    `${describeInterval(record.interval)}${describeDuration(record.duration, record.duration_unit)}`,
  ].join(" ");
}

/** Splits the doctor's free-text medications into clean letter lines. */
export function parseFreeTextMedications(
  raw: string | null | undefined,
): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function buildReferralLetterData(params: {
  referral: ReferralLetterSourceReferral;
  patient: ReferralLetterSourcePatient;
  referringDoctorFullName: string;
  referralDate: Date;
  /** Medication records of the referral's consultation (both roles can read them). */
  consultationMedications?: ReferralLetterSourceMedication[];
}): ReferralLetterData {
  const {
    referral,
    patient,
    referringDoctorFullName,
    referralDate,
    consultationMedications = [],
  } = params;

  return {
    patient: {
      fullName: patient.fullName,
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
    },
    referralDate,
    recipient: {
      name: referral.specialist_name,
      specialty: referral.specialty ?? null,
      hospital: referral.hospital,
      addressLines: referral.hospital_address ?? [],
    },
    clinical: {
      summary: referral.referral_details,
      history: patient.previous_medical_conditions ?? [],
      // The doctor's typed free-text wins over the auto-derived list.
      medications:
        parseFreeTextMedications(referral.current_medications).length > 0
          ? parseFreeTextMedications(referral.current_medications)
          : consultationMedications.map(describeMedication),
      allergies: patient.allergies ?? [],
    },
    investigations: [],
    attachments: [],
    referringDoctor: { fullName: referringDoctorFullName },
  };
}

/** Every selected attachment renders as an already-checked row. */
export function buildAttachmentChecklist(
  labels: string[],
): ReferralLetterAttachment[] {
  return labels.map((label) => ({ label, checked: true }));
}
