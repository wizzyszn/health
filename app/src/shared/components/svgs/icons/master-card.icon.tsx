import React from "react";

interface MasterCardProps {
  size?: number | string;
  className?: string;
  [key: string]: unknown;
}

const MasterCardIcon: React.FC<MasterCardProps> = ({
  size = 30,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={(size as number) * (18 / 30)} // preserves ~1.67 aspect ratio
      viewBox="0 0 30 18"
      fill="none"
      className={className}
      {...props}
    >
      {/* Largest / back layer – red */}
      <path
        d="M20.7695 0C25.7627 0 29.8105 3.99985 29.8105 8.93359C29.8104 13.8672 25.7626 17.8662 20.7695 17.8662C18.5311 17.8662 16.4842 17.061 14.9053 15.7295C13.3264 17.061 11.2795 17.8662 9.04102 17.8662C4.04794 17.8662 0.000142922 13.8672 0 8.93359C0 3.99985 4.04785 0 9.04102 0C11.2794 2.32863e-05 13.3264 0.80536 14.9053 2.13672C16.4841 0.805355 18.5312 3.60719e-05 20.7695 0Z"
        fill="#ED0006"
      />

      {/* Middle layer – orange */}
      <path
        d="M20.7705 0C25.7637 0 29.8115 3.99985 29.8115 8.93359C29.8114 13.8672 25.7636 17.8662 20.7705 17.8662C18.5321 17.8662 16.4852 17.061 14.9062 15.7295C16.8492 14.091 18.0829 11.6554 18.083 8.93359C18.083 6.2116 16.8494 3.77525 14.9062 2.13672C16.4851 0.805358 18.5322 2.96795e-05 20.7705 0Z"
        fill="#F9A000"
      />

      {/* Front / center layer – yellow */}
      <path
        d="M14.9043 2.13708C16.8475 3.77554 18.0809 6.21104 18.0811 8.93298C18.0811 11.6549 16.8474 14.0904 14.9043 15.7289C12.9617 14.0904 11.7285 11.6545 11.7285 8.93298C11.7286 6.21143 12.9616 3.77553 14.9043 2.13708Z"
        fill="#FF5E00"
      />
    </svg>
  );
};

export default MasterCardIcon;
