import { SideNavOption } from "@/lib/types";
import type { IconProps } from "@/shared/components/svgs/icons/icon.types";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./logo.component.shared";
import logo from "../../assets/images/profile-image.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, Cog } from "lucide-react";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDispatch } from "react-redux";
import { logout } from "@/config/stores/slices/auth.slice";
import { Storages } from "@/lib/helpers";
import { type ComponentType, useState } from "react";

const SIDE_NAV_ICON_SIZE = 18;

function SideNavIcon({
  Icon,
  isActive,
}: {
  Icon: ComponentType<IconProps>;
  isActive: boolean;
}) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center [&_svg]:block [&_svg]:size-[18px]">
      <Icon
        size={SIDE_NAV_ICON_SIZE}
        color={isActive ? "#5164E8" : "#969696"}
        className="shrink-0"
      />
    </span>
  );
}

interface SidenavProps {
  navOptions?: SideNavOption[];
  className?: string;
  redirectPath?: string;
  isExpanded?: boolean;
  toggleSidebar?: () => void;
  onNavigate?: () => void;
}

function SideNav({
  className,
  navOptions,
  redirectPath = "",
  isExpanded = true,
  toggleSidebar,
  onNavigate,
}: SidenavProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleLogout = () => {
    Storages.clearStorage("local");
    dispatch(logout());
    const baseRolePath = redirectPath.replace("/dashboard", "");
    navigate(`${baseRolePath}/login`);
  };

  return (
    <aside
      className={`col-span-1 row-span-full bg-[#fff] flex flex-col h-full ${className} shadow-sm transition-all duration-300 ${isExpanded ? "w-[210px] p-6" : "w-[68px] items-center p-2"}`}
    >
      <div
        className={`group/top flex items-center w-full ${isExpanded ? "justify-between" : "justify-center mt-2 cursor-pointer"}`}
        onClick={!isExpanded && toggleSidebar ? toggleSidebar : undefined}
      >
        {isExpanded ? (
          <>
            <div className=" relative">
              <Logo
                isBackground={false}
                isExpanded={isExpanded}
                className="absolute left-[-18px] top-[-32px]"
              />
            </div>

            {toggleSidebar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="p-1.5 hover:bg-gray-100 active:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700 active:text-gray-800 transition-all duration-200 active:scale-90"
              >
                <GoSidebarCollapse
                  size={18}
                  className="transition-transform duration-300"
                />
              </button>
            )}
          </>
        ) : (
          <div className="relative flex h-9 w-9 cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95">
            <div className="absolute transition-all duration-300 group-hover/top:opacity-0 group-hover/top:scale-75 group-hover/top:-rotate-12 pointer-events-none">
              <Logo isBackground={false} isExpanded={isExpanded} />
            </div>
            <div className="absolute opacity-0 scale-75 rotate-12 transition-all duration-300 group-hover/top:opacity-100 group-hover/top:scale-100 group-hover/top:rotate-0 text-gray-500 bg-gray-100 p-2 rounded-md pointer-events-none group-hover/top:text-gray-700">
              <GoSidebarExpand size={18} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex w-full flex-1 flex-col gap-3 overflow-y-auto">
        {navOptions &&
          navOptions.map(({ Icon, title, url }) => {
            return (
              <NavLink
                to={url}
                end={url === ""}
                onClick={() => {
                  onNavigate?.();
                  if (window.innerWidth < 768 && toggleSidebar) {
                    toggleSidebar();
                  }
                }}
                title={!isExpanded ? title : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center overflow-hidden rounded-md transition-colors duration-200 ${isExpanded ? "gap-2.5 px-2 py-2.5" : "justify-center p-2"} ${
                    isActive
                      ? "bg-muted shadow-sm ring-1 ring-black/5"
                      : "text-[#2a2a2a] hover:bg-gray-100/80 active:bg-gray-200"
                  }`
                }
                key={url}
              >
                {({ isActive }) => (
                  <>
                    <SideNavIcon Icon={Icon} isActive={isActive} />
                    {isExpanded && (
                      <span
                        className={`whitespace-nowrap text-[13px] leading-none transition-colors duration-200 ${isActive ? "font-medium text-[#1f2937]" : "font-normal text-[#969696] group-hover:text-[#2a2a2a]"}`}
                      >
                        {title}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
      </div>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div
            className={`mt-auto flex cursor-pointer items-center rounded-full bg-[#F0F0F0] transition-colors duration-200 hover:bg-[#E5E5E5] ${isExpanded ? "w-fit gap-2 pr-2.5" : "mx-auto h-9 w-9 justify-center p-1"}`}
          >
            <Avatar className="size-7 shrink-0">
              <AvatarImage src={logo} sizes="sm" />
              <AvatarFallback>E</AvatarFallback>
            </Avatar>
            {isExpanded && <Menu size={16} className="shrink-0 text-[#555]" />}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-40 p-2 rounded-xl bg-[#232323] shadow-lg shadow-black/20 border-none"
          align="start"
          sideOffset={8}
        >
          <div className="flex flex-col space-y-0.5">
            {!redirectPath.includes("admin") && (
              <NavLink
                to={`${redirectPath}/profile`}
                onClick={() => {
                  setIsPopoverOpen(false);
                  onNavigate?.();
                  if (window.innerWidth < 768 && toggleSidebar) {
                    toggleSidebar();
                  }
                }}
                className="flex items-center text-[#F4F4F4] gap-2 p-2.5 hover:bg-[#333333] active:bg-[#3d3d3d] rounded-md transition-all duration-200 text-sm font-normal hover:-translate-x-1 active:scale-95 group/menu"
              >
                <Cog
                  size={20}
                  className="text-[#969696] transition-colors duration-200 group-hover/menu:text-[#F4F4F4]"
                />
                <span>Profile</span>
              </NavLink>
            )}
            <button
              onClick={() => {
                setIsPopoverOpen(false);
                handleLogout();
                if (window.innerWidth < 768 && toggleSidebar) {
                  toggleSidebar();
                }
              }}
              className="flex items-center gap-2 p-2.5 hover:bg-red-600/80 active:bg-red-700 text-[#F4F4F4] rounded-md transition-all duration-200 text-sm font-normal w-full hover:-translate-x-1 active:scale-95 group/menu"
            >
              <LogOut
                size={20}
                className="text-[#969696] transition-colors duration-200 group-hover/menu:text-white"
              />
              <span>Logout</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </aside>
  );
}

export default SideNav;
