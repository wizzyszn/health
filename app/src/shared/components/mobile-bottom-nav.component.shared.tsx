import { SideNavOption } from "@/lib/types";
import { Cog } from "lucide-react";
import { NavLink } from "react-router-dom";

interface MobileBottomNavProps {
  navOptions?: SideNavOption[];
  redirectPath?: string;
}

function MobileBottomNav({
  navOptions = [],
  redirectPath = "",
}: MobileBottomNavProps) {
  const shouldShowProfile = redirectPath && !redirectPath.includes("admin");
  const profileUrl = `${redirectPath}/profile`;
  const mobileNavOptions = shouldShowProfile
    ? [
        ...navOptions,
        {
          url: profileUrl,
          title: "Profile",
          Icon: Cog,
        },
      ]
    : navOptions;

  if (!mobileNavOptions.length) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-[#E5E5E5] bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex max-w-[520px] items-stretch gap-1 overflow-x-auto overscroll-x-contain">
        {mobileNavOptions.map(({ Icon, title, url }) => (
          <NavLink
            key={`${title}-${url}`}
            to={url}
            end={url === ""}
            className={({ isActive }) =>
              `group flex min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium leading-tight transition-all duration-200 ${
                isActive
                  ? "bg-muted text-[#1f2937]"
                  : "text-[#777] active:bg-gray-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="flex size-5 shrink-0 items-center justify-center [&_svg]:block [&_svg]:size-[18px]">
                  <Icon
                    size={18}
                    color={isActive ? "#5164E8" : "#969696"}
                    className="shrink-0"
                  />
                </span>
                <span className="max-w-full truncate">{title}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
