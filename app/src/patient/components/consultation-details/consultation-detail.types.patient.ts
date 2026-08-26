import {
  getGroupedMedicationsForConsultationsReq,
  getInvestigationsForConsultationReq,
  listReferralsForPatientConsultationReq,
} from "@/config/service/patient.service";
import jsPDF from "jspdf";
import {
  Video,
  Monitor,
  Headphones,
  MapPin,
  Home,
  UserRound,
} from "lucide-react";

export type ConsultationType =
  "VIDEO" | "CHAT" | "AUDIO" | "MEETADOCTOR" | "HOMESERVICE";

export type ReferralItem = NonNullable<
  Awaited<ReturnType<typeof listReferralsForPatientConsultationReq>>["data"]
>[number];

export type InvestigationItem = NonNullable<
  Awaited<ReturnType<typeof getInvestigationsForConsultationReq>>["data"]
>["investigations"][number];

export type GroupedMedicationItem = NonNullable<
  Awaited<ReturnType<typeof getGroupedMedicationsForConsultationsReq>>["data"]
>["groups"][number]["medications"][number];

export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export const CONSULTATION_CONFIG: Record<
  ConsultationType,
  {
    label: string;
    icon: typeof Video;
    platformLabel: string;
    platformIcon: typeof Monitor;
  }
> = {
  VIDEO: {
    label: "Video Call",
    icon: Video,
    platformLabel: "Carelexa",
    platformIcon: Monitor,
  },
  AUDIO: {
    label: "Audio Call",
    icon: Headphones,
    platformLabel: "Phone Call",
    platformIcon: Headphones,
  },
  CHAT: {
    label: "Chat Session",
    icon: Monitor,
    platformLabel: "In-App Chat",
    platformIcon: Monitor,
  },
  MEETADOCTOR: {
    label: "Meet a Doctor",
    icon: UserRound,
    platformLabel: "In-Person Visit",
    platformIcon: MapPin,
  },
  HOMESERVICE: {
    label: "Home Service",
    icon: Home,
    platformLabel: "Doctor Visit",
    platformIcon: Home,
  },
};
