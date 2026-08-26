import React from "react";
import { IconProps } from "./icon.types";

const SendIcon: React.FC<IconProps> = ({
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
        d="M17.5384 2.5441C15.7234 0.589463 2.07076 5.37766 2.08204 7.12583C2.09482 9.10824 7.41377 9.71808 8.88803 10.1317C9.77461 10.3804 10.012 10.6354 10.2164 11.5651C11.1423 15.7754 11.6071 17.8696 12.6665 17.9163C14.3552 17.991 19.3098 4.45166 17.5384 2.5441Z"
        fill={color}
        stroke={color}
        strokeWidth={1.5}
      />
      <path
        d="M9.58203 10.4167L12.4987 7.5"
        stroke="white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default SendIcon;
