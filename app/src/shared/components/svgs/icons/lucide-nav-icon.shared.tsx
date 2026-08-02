import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { IconProps } from "./icon.types";

export function createLucideNavIcon(
  Icon: LucideIcon,
): ComponentType<IconProps> {
  const NavIcon = ({
    size = 18,
    color = "#969696",
    className,
    ...props
  }: IconProps) => (
    <Icon
      size={size}
      color={color}
      stroke={color}
      fill="none"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    />
  );

  NavIcon.displayName = `NavIcon(${Icon.displayName ?? "Lucide"})`;
  return NavIcon;
}
