import { SideNavOption } from "@/lib/types";
import { Outlet, useMatches, UIMatch } from "react-router-dom";

// import useCheckOnlineStatus from "@/shared/hooks/use-internet-connection";
import {
  Suspense,
  // useEffect,
  useState,
} from "react";
// import OnlineIndicator from "@/shared/components/online-indicator.component";
import Spinner from "@/shared/components/spinner.component";
import SideNav from "../sidenav.component.shared";
import DashHeader from "../dash-header.component.shared";
import MobileBottomNav from "../mobile-bottom-nav.component.shared";
import { useQuery } from "@tanstack/react-query";
import { refreshTokenReq } from "@/config/service/auth.service";
import { useSelector } from "react-redux";
import { RootState } from "@/config/stores/store";

const LoadingFallback = () => (
  <div className="grid h-svh w-full place-items-center">
    <Spinner />
  </div>
);

export type BreadcrumbHandle = {
  headerChild?: React.ReactNode;
};

function HeaderContent() {
  const matches = useMatches() as UIMatch<unknown, BreadcrumbHandle>[];
  // Find the deepest match that provides header content
  const currentMatch = matches
    .slice()
    .reverse()
    .find((match) => Boolean(match.handle?.headerChild));

  return currentMatch?.handle?.headerChild ?? null;
}

interface DashLayoutProps {
  sideNavOptions: SideNavOption[];
  redirectPath?: string;
}

function DashLayout({ sideNavOptions, redirectPath }: DashLayoutProps) {
  const { refreshToken, role } = useSelector((state: RootState) => state.auth);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const shouldRefresh = Boolean(refreshToken && role);

  useQuery({
    queryKey: ["refresh-auth"],
    queryFn: async () => {
      if (!refreshToken || !role) throw new Error("Missing token or role");
      return refreshTokenReq({ refreshToken, role });
    },
    enabled: shouldRefresh,
    retry: 1,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <div
      className={`h-svh max-w-[1920px] mx-auto bg-muted overflow-hidden flex flex-col md:grid ${isSidebarExpanded ? "md:grid-cols-[210px_1fr]" : "md:grid-cols-[68px_1fr]"} md:grid-rows-[auto_1fr] transition-[grid-template-columns] duration-300`}
    >
      {/* Desktop Sidebar */}
      <SideNav
        navOptions={sideNavOptions}
        redirectPath={redirectPath}
        isExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        className="hidden md:flex border-r border-[#E5E5E5] row-span-full z-10 sticky top-0 h-svh"
      />

      {/* Header always on top row */}
      <DashHeader headerChild={<HeaderContent />} />

      {/* Main content */}
      <div className="relative overflow-y-auto p-4 pb-24 sm:p-5 sm:pb-24 md:p-6">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
      <MobileBottomNav
        navOptions={sideNavOptions}
        redirectPath={redirectPath}
      />
    </div>
  );
}

export default DashLayout;
