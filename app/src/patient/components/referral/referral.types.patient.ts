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
  hospital: string;
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
