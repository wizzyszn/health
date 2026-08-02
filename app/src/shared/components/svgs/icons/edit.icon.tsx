import React from "react";

interface EditIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  [key: string]: unknown;
}

const EditIcon: React.FC<EditIconProps> = ({
  size = 20,
  color = "#969696",
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      {...props}
    >
      <path
        d="M3.33301 17.5H16.6663M4.72134 10.9892C4.36602 11.3453 4.16643 11.8278 4.16634 12.3308V15H6.85217C7.35551 15 7.83801 14.8 8.19384 14.4433L16.1105 6.52251C16.4657 6.16634 16.6652 5.68385 16.6652 5.18084C16.6652 4.67783 16.4657 4.19534 16.1105 3.83917L15.3288 3.05584C15.1526 2.87947 14.9432 2.73957 14.7129 2.64415C14.4825 2.54872 14.2355 2.49965 13.9862 2.49973C13.7368 2.4998 13.4899 2.54903 13.2596 2.6446C13.0292 2.74016 12.82 2.88019 12.6438 3.05667L4.72134 10.9892Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default EditIcon;
