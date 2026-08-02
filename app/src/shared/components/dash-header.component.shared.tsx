import { ReactNode } from "react";
import { VscBell } from "react-icons/vsc";
import { Menu } from "lucide-react";
import Logo from "./logo.component.shared";

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
    <header className="sticky top-0 z-10 flex h-14 w-full items-center justify-between gap-2 border-b border-[#E5E5E5] bg-white px-4 sm:px-5 md:h-16 md:px-6">
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
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="order-2 flex items-center md:order-1">
          <button
            className="group relative flex size-9 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Notifications"
          >
            <VscBell size={18} color="#555" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full border border-white bg-red-500"></span>
          </button>
        </div>
        <div className="flex items-center order-1 md:order-2">
          {headerChild ? headerChild : null}
        </div>
      </div>
    </header>
  );
}

export default DashHeader;
