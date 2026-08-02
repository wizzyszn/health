import { Patient } from "@/lib/types";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { RootState } from "@/config/stores/store";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { BookUser, FlaskConical, Pill, Stethoscope } from "lucide-react";
import { useSelector } from "react-redux";
import { MetricCard } from "../components/metric-card.component.patient";
import { ConsultationAndAppointmentList } from "../components/consultation-and-appointment-list.component.patient";
import { useQuery } from "@tanstack/react-query";
import {
  PatientDashMetrics,
  getPatientDashMetrics,
  getWeeklyAppointmentsReq,
} from "@/config/service/patient.service";

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

const DEFAULT_METRICS: PatientDashMetrics = {
  consultations: 0,
  medications: 0,
  investigations: 0,
  appointments: 0,
};

function PatientDash() {
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Patient>;

  const { data, isLoading } = useQuery({
    queryKey: ["patient-dash-metrics"],
    queryFn: () => getPatientDashMetrics(),
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

  const values = Object.entries(metrics).map(([key, value]) => {
    const k = key as keyof typeof METRICS_MAPPER;

    return {
      ...METRICS_MAPPER[k],
      label: k.charAt(0).toUpperCase() + k.slice(1),
      value,
    };
  });

  return (
    <div className="space-y-5">
      <MainPageHeader
        heading={`Welcome, ${user?.user && user.user.first_name + " " + user?.user?.last_name}👋🏼`}
        subHeading="Connect with trusted medical practitioners anytime, anywhere, and get the care you deserve."
      />

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
  );
}

export default PatientDash;
