import Spinner from "@/shared/components/spinner.component";
import { Suspense, lazy } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import admin_routes from "./admin.route";
import doctor_routes from "./doctor.route";
import patient_routes from "./patient.route";
import AppEntry from "@/shared/pages/app-entry.page";
import { TooltipProvider } from "@/components/ui/tooltip";
const GoogleOauth = lazy(() => import("@/auth/google-oauth.auth"));
const NotFound = lazy(() => import("@/shared/pages/not-found.page"));
const router = createBrowserRouter([
  {
    path: "",
    element: <AppEntry />,
  },
  {
    path: "/auth/google",
    element: <GoogleOauth />,
  },
  {
    path: "/admin",
    children: admin_routes,
  },
  {
    path: "/doctor",
    children: doctor_routes,
  },
  {
    path: "/patient",
    children: patient_routes,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const LoadingFallback = () => (
  <div className="h-svh w-full flex flex-col justify-center items-center">
    <Spinner />
  </div>
);
const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </Suspense>
  );
};

export default AppRouter;
