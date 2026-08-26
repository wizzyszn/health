/**
 * Shared letter-data contract for the carelexa-branded referral-letter PDF.
 * Lives in its own module so the mapper util and the jsPDF generator can both
 * import it without a runtime dependency cycle.
 */

export interface ReferralLetterPatient {
  fullName: string;
  mrn?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;
  phone?: string;
  email?: string;
}

export interface ReferralLetterRecipient {
  name: string;
  specialty?: string | null;
  hospital: string;
  addressLines: string[];
}

export interface ReferralLetterClinical {
  summary: string;
  history: string[];
  medications: string[];
  allergies: string[];
}

export interface ReferralLetterInvestigation {
  name: string;
  result?: string;
  date?: string;
}

export interface ReferralLetterAttachment {
  label: string;
  checked: boolean;
}

/** One attachment page image (resolved investigation result upload). */
export interface ReferralLetterImage {
  url: string;
  label: string;
}

export interface ReferralLetterData {
  patient: ReferralLetterPatient;
  referralDate: Date;
  recipient: ReferralLetterRecipient;
  clinical: ReferralLetterClinical;
  investigations: ReferralLetterInvestigation[];
  attachments: ReferralLetterAttachment[];
  referringDoctor: { fullName: string };
}
