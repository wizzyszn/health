import { Doctor } from "@/lib/types";
import { AuthState } from "@/config/stores/slices/auth.slice";
import { RootState } from "@/config/stores/store";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { Activity, Clock, Users, BarChart3 } from "lucide-react";
import { useSelector } from "react-redux";
import { MetricCard } from "../components/metric-card.component.doctor";
import { DoctorConsultationAndAppointmentList } from "../components/consultation-and-appointment-list.component.doctor";
import { useQuery } from "@tanstack/react-query";
import {
  DoctorDashMetrics,
  getDoctorDashMetrics,
} from "@/config/service/doctor.service";
import SEO from "@/shared/components/seo.component";

const METRICS_MAPPER = {
  consultations: {
    icon: Activity,
    gradient: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    textAccent: "text-blue-600",
    subtitle: "Not yet completed",
  },
  medications: {
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    textAccent: "text-violet-600",
    subtitle: "Awaiting assignment to patient",
  },
  investigations: {
    icon: Users,
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    textAccent: "text-amber-600",
    subtitle: "Awaiting assignment to patient",
  },
  appointments: {
    icon: Clock,
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    textAccent: "text-emerald-600",
    subtitle: "Upcoming and yet to be attended",
  },
} as const;

const METRIC_ORDER: (keyof DoctorDashMetrics)[] = [
  "consultations",
  "investigations",
  "medications",
  "appointments",
];

const DEFAULT_METRICS: DoctorDashMetrics = {
  consultations: 0,
  medications: 0,
  investigations: 0,
  appointments: 0,
};

function DoctorDash() {
  const { user } = useSelector(
    (state: RootState) => state.auth,
  ) as AuthState<Doctor>;

  const { data, isLoading } = useQuery({
    queryKey: ["dash-metrics"],
    queryFn: () => getDoctorDashMetrics(),
  });

  const metrics = data?.data ?? DEFAULT_METRICS;

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
        title="Doctor Dashboard"
        description="View your consultations, appointments, patients, and activity metrics on your Carelexa doctor dashboard."
        canonicalPath="/doctor/dashboard"
      />
      <div className="space-y-8">
        <MainPageHeader
          heading={`Welcome, Dr. ${user?.doctor ? user.doctor.first_name + " " + user.doctor.last_name : "User"}👋🏽`}
          userId={
            user?.doctor && (
              <p className="mt-1 text-sm text-[#6C6C6C] font-medium">
                Doctor ID: {user.doctor.doctor_no}
              </p>
            )
          }
        />

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {values.map((m, index) => (
              <MetricCard key={index} {...m} isLoading={isLoading} />
            ))}
          </div>
        </section>

        <section>
          <DoctorConsultationAndAppointmentList />
        </section>
      </div>
    </>
  );
}

export default DoctorDash;
