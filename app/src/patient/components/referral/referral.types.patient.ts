export type ReferralDoctor = {
  _id: string;
  full_name: string;
  specializations: string[];
  profile_picture_url: string | null;
};

export type ReferralConsultation = {
  _id: string;
  title: string;
  type: string;
  consoltation_for: string;
  status: string;
  session_number: number;
  createdAt: string;
  updatedAt: string;
};

export type ReferralItem = {
  _id: string;
  specialist_name: string;
  /** Approved specialty value; null on legacy records. */
  specialty?: string | null;
  hospital: string;
  /** Address lines resolved from the approved-hospitals catalog. */
  hospital_address?: string[];
  /** Investigation-record ids whose uploads are attached to this referral. */
  attachment_investigation_ids?: string[];
  /** Free-text current medications; rendered verbatim on the letter. */
  current_medications?: string | null;
  referral_details: string;
  referred_doctor_name?: string;
  assign_to_patient?: boolean;
  consultation_id: string;
  user_id: string;
  doctor_id: ReferralDoctor;
  createdAt: string;
  updatedAt: string;
};

export type ReferralGroup = {
  consultation: ReferralConsultation;
  referrals: ReferralItem[];
};
