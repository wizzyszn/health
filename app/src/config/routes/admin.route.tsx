import { lazy } from "react";
import { Navigate, RouteObject } from "react-router-dom";
import DashLayout from "@/shared/components/layouts/dash.layout.component";
import MedicineBottleIcon from "@/shared/components/svgs/icons/medicine-bottle.icon";
import SendIcon from "@/shared/components/svgs/icons/send.icon";
import { createLucideNavIcon } from "@/shared/components/svgs/icons/lucide-nav-icon.shared";
import { SideNavOption } from "@/lib/types";
import { House } from "lucide-react";

const LoginAdmin = lazy(() => import("@/auth/admin/login.admin.auth"));
const AdminDashboard = lazy(() => import("@/admin/pages/dashboard.page.admin"));
const AdminPatients = lazy(() => import("@/admin/pages/patients.page.admin"));
const AdminPatientDetail = lazy(
  () => import("@/admin/pages/patient-detail.page.admin"),
);
const AdminAddDoctor = lazy(
  () => import("@/admin/pages/add-doctor.page.admin"),
);

const sideNavOptions: SideNavOption[] = [
  {
    url: "",
    title: "Home",
    Icon: createLucideNavIcon(House),
  },
  {
    url: "patients",
    title: "Patients",
    Icon: MedicineBottleIcon,
  },
  {
    url: "doctors/add",
    title: "Add Doctor",
    Icon: SendIcon,
  },
];

const admin_routes: RouteObject[] = [
  {
    index: true,
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "login",
    element: <LoginAdmin />,
  },

  {
    path: "dashboard",
    element: (
      <DashLayout
        sideNavOptions={sideNavOptions}
        redirectPath="/admin/dashboard"
      />
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: "patients",

        children: [
          {
            index: true,
            element: <AdminPatients />,
          },
          {
            path: ":id",
            element: <AdminPatientDetail />,
          },
        ],
      },
      {
        path: "doctors/add",
        element: <AdminAddDoctor />,
      },
    ],
  },
];

export default admin_routes;
