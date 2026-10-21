import { Patient } from "@/lib/types";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { RootState } from "@/config/stores/store";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import {
  BookUser,
  FlaskConical,
  Pill,
  Stethoscope,
  Copy,
  Check,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useState } from "react";
import { toast } from "sonner";
import { MetricCard } from "../components/metric-card.component.patient";
import { ConsultationAndAppointmentList } from "../components/consultation-and-appointment-list.component.patient";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import {
  PatientDashMetrics,
  getPatientDashMetrics,
  getPatientProfileReq,
  getWeeklyAppointmentsReq,
} from "@/config/service/patient.service";
import SEO from "@/shared/components/seo.component";
import { normalizeMrn } from "@/lib/mrn";

const METRICS_MAPPER = {
  consultations: {
    icon: Stethoscope,
    gradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    textAccent: "text-blue-600",
    subtitle: "Not yet completed or canceled",
  },
  appointments: {
    icon: BookUser,
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    textAccent: "text-emerald-600",
    subtitle: "Upcoming and yet to be attended",
  },
  investigations: {
    icon: FlaskConical,
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    textAccent: "text-amber-600",
    subtitle: "Awaiting result uploads",
  },
  medications: {
    icon: Pill,
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textAccent: "text-violet-600",
    subtitle: "Assigned in open consultations",
  },
} as const;

const METRIC_ORDER: (keyof PatientDashMetrics)[] = [
  "consultations",
  "investigations",
  "medications",
  "appointments",
];

const DEFAULT_METRICS: PatientDashMetrics = {
  consultations: 0,
  medications: 0,
  investigations: 0,
  appointments: 0,
};

function CopyableMRN({ mrn }: { mrn: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mrn);
      setCopied(true);
      toast.success("MRN copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.warning("Failed to copy MRN");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
      title="Click to copy MRN"
    >
      MRN: {mrn}
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </button>
  );
}

function PatientDash() {
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Patient>;

  const { data, isLoading } = useQuery({
    queryKey: ["patient-dash-metrics"],
    queryFn: () => getPatientDashMetrics(),
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.patientProfile,
    queryFn: getPatientProfileReq,
  });

  useQuery({
    queryKey: ["patient-weekly-appointments"],
    queryFn: async () => {
      const response = await getWeeklyAppointmentsReq();
      console.log("patient weekly appointments", response);
      return response;
    },
  });

  const metrics = data?.data ?? DEFAULT_METRICS;
  const mrn = normalizeMrn(profileData?.data?.mrn ?? user?.user?.mrn);

  const values = METRIC_ORDER.map((k) => {
    return {
      ...METRICS_MAPPER[k],
      label: k.charAt(0).toUpperCase() + k.slice(1),
      value: metrics[k],
    };
  });

  return (
    <>
      <SEO
        title="Patient Dashboard"
        description="View your consultations, appointments, medications, and health metrics on your Carelexa patient dashboard."
        canonicalPath="/patient/dashboard"
      />
      <div className="space-y-5">
        <div>
          <MainPageHeader
            heading={`Welcome, ${user?.user && user.user.first_name + " " + user?.user?.last_name}👋🏼`}
            subHeading="Connect with trusted medical practitioners anytime, anywhere, and get the care you deserve."
          />
          {mrn && (
            <div className="mt-2 ml-0.5">
              <CopyableMRN mrn={mrn} />
            </div>
          )}
        </div>

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {values.map((m, index) => (
              <MetricCard key={index} {...m} isLoading={isLoading} />
            ))}
          </div>
        </section>

        <section>
          <ConsultationAndAppointmentList />
        </section>
      </div>
    </>
  );
}

export default PatientDash;
