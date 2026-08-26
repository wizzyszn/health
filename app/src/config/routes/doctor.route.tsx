import ProtectedRoute from "@/shared/components/protected-route.component";
import { SideNavOption } from "@/lib/types";
import DashLayout from "@/shared/components/layouts/dash.layout.component";

import { Bell, BookUser, Clock, House, Stethoscope, Users } from "lucide-react";
import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import { createLucideNavIcon } from "@/shared/components/svgs/icons/lucide-nav-icon.shared";
// import MedicineBottleIcon from "@/shared/components/svgs/icons/medicine-bottle.icon";

const LoginDoctor = lazy(
  () => import("@/auth/doctor/pages/login.doctor.page.auth"),
);
const DoctorSignUp = lazy(
  () => import("@/auth/doctor/pages/register.doctor.page.auth"),
);
const DoctorForgotPassword = lazy(
  () => import("@/auth/doctor/pages/forgot-password.page.auth"),
);

const DoctorDashboard = lazy(
  () => import("@/doctor/pages/dashbord.page.doctor"),
);
const DoctorSchedules = lazy(
  () => import("@/doctor/pages/schedules.page.doctor"),
);
const DoctorConsultations = lazy(
  () => import("@/doctor/pages/consultation.page.doctor"),
);
const ConsultationSpace = lazy(
  () => import("@/doctor/pages/view-consultation-space.page.doctor"),
);
const DoctorAppointmentDetails = lazy(
  () => import("@/doctor/pages/appointment-detail.page.doctor"),
);
const DoctorPatients = lazy(
  () => import("@/doctor/pages/patients.page.doctor"),
);
// const Investigations = lazy(
//   () => import("@/doctor/pages/investigation.page.doctor"),
// );
const Diagnosis = lazy(() => import("@/doctor/pages/diagnosis.page.doctor"));

const DoctorProfile = lazy(() => import("@/doctor/pages/profile.page.doctor"));
const DoctorNotificationsFeed = lazy(
  () => import("@/shared/notifications/notifications-feed.page.shared"),
);
const Appointment = lazy(
  () => import("@/doctor/pages/appointment.page.doctor"),
);

const sideNavOptions: SideNavOption[] = [
  {
    url: "",
    title: "Home",
    Icon: createLucideNavIcon(House),
  },
  {
    url: "schedules",
    title: "Schedules",
    Icon: createLucideNavIcon(Clock),
  },
  {
    url: "appointments",
    title: "Appointments",
    Icon: createLucideNavIcon(BookUser),
  },
  {
    url: "consultations",
    title: "Consultations",
    Icon: createLucideNavIcon(Stethoscope),
  },
  {
    url: "patients",
    title: "Patients",
    Icon: createLucideNavIcon(Users),
  },
  {
    url: "notifications",
    title: "Notifications",
    Icon: createLucideNavIcon(Bell),
  },
  // {
  //   url: "investigations",
  //   title: "Investigations",
  //   Icon: MedicineBottleIcon,
  // },
];
const doctor_routes: RouteObject[] = [
  {
    path: "login",
    element: <LoginDoctor />,
  },
  {
    path: "sign-up",
    element: <DoctorSignUp />,
  },
  {
    path: "forgot-password",
    element: <DoctorForgotPassword />,
  },
  {
    path: "dashboard",
    element: (
      <ProtectedRoute>
        <DashLayout
          sideNavOptions={sideNavOptions}
          redirectPath="/doctor/dashboard"
        />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        path: "",
        element: <DoctorDashboard />,
      },
      {
        path: "schedules",
        element: <DoctorSchedules />,
      },
      {
        path: "consultations",

        children: [
          {
            index: true,
            element: <DoctorConsultations />,
          },
          {
            path: ":id",
            element: <ConsultationSpace />,
          },
        ],
      },
      {
        path: "appointments",

        children: [
          {
            index: true,
            element: <Appointment />,
          },
          {
            path: ":id",
            element: <DoctorAppointmentDetails />,
          },
        ],
      },
      {
        path: "patients",
        element: <DoctorPatients />,
      },
      // {
      //   path: "investigations",
      //   element: <Investigations />,
      // },
      {
        path: "diagnosis",
        element: <Diagnosis />,
      },
      {
        path: "profile",
        element: <DoctorProfile />,
      },
      {
        path: "notifications",
        element: <DoctorNotificationsFeed />,
      },
    ],
  },
];

export default doctor_routes;
