import { ReactNode } from "react";
import { Menu } from "lucide-react";
import Logo from "./logo.component.shared";
import { NotificationBell } from "@/shared/notifications/notification-bell.component";

interface Props {
  headerChild?: ReactNode;
  leftContent?: ReactNode;
  onMobileMenuClick?: () => void;
  isMobileSidebarOpen?: boolean;
}
function DashHeader({
  headerChild,
  leftContent,
  onMobileMenuClick,
  isMobileSidebarOpen,
}: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between gap- border-b border-[#E5E5E5] bg-white px-4 sm:px-5 md:h-16 md:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Logo - visible primarily on mobile where sidebar is hidden */}
        <div className="md:hidden flex items-center scale-90 origin-left">
          <Logo isBackground={false} isExpanded={false} />
        </div>
        {onMobileMenuClick && (
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-600 hover:text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileSidebarOpen}
          >
            <Menu className="size-5 sm:size-6" />
          </button>
        )}
        {leftContent && leftContent}
      </div>
      <div className="flex items-center gap-2.5 sm:gap-6">
        <div className="order-2 flex items-center md:order-1">
          <NotificationBell />
        </div>
        <div className="flex items-center order-1 md:order-2">
          {headerChild ? headerChild : null}
        </div>
      </div>
    </header>
  );
}

export default DashHeader;
