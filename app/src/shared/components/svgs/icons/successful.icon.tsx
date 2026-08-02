import React from "react";

interface VerifiedSuccessIconProps {
  size?: number | string;
  className?: string;
  [key: string]: unknown;
}

const VerifiedSuccessIcon: React.FC<VerifiedSuccessIconProps> = ({
  size = 48,
  className = "",
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 151 144"
      fill="none"
      className={className}
      {...props}
    >
      {/* Decorative curved lines (top-left) */}
      <path
        d="M1.49414 7.07249C1.99414 12.7392 4.29414 22.3725 9.49414 15.5725C15.9941 7.07249 14.4941 24.5725 10.9941 29.0725C7.49414 33.5725 14.9941 37.5725 20.9941 30.5725C25.7941 24.9725 27.3275 35.5725 27.4941 41.5725"
        stroke="#1DAA5F"
        strokeWidth="3"
      />

      {/* Decorative curved lines (bottom-left) */}
      <path
        d="M3.75781 123.652C9.43948 123.369 19.1539 121.44 12.5583 115.983C4.31376 109.162 21.7434 111.332 26.1059 115.002C30.4684 118.672 34.753 111.331 27.9882 105.067C22.5763 100.056 33.2273 98.93 39.2293 98.9935"
        stroke="#6D1DAA"
        strokeWidth="2"
      />

      {/* Decorative curved lines (bottom-right) */}
      <path
        d="M135.23 107.652C129.549 107.369 119.834 105.44 126.43 99.9834C134.675 93.1623 117.245 95.3321 112.882 99.0021C108.52 102.672 104.235 95.3309 111 89.0669C116.412 84.0558 105.761 82.93 99.759 82.9935"
        stroke="#4B70F5"
        strokeWidth="2"
      />

      {/* Main verified badge with checkmark */}
      <g filter="url(#filter0_dd_87_4584)">
        <rect
          x="35.4941"
          y="23.0725"
          width="80"
          height="80"
          rx="40"
          fill="url(#paint0_linear_87_4584)"
        />
        <path
          d="M60.4941 64.9058L69.8691 74.0725L90.4941 52.0725"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Small decorative strokes */}
      <path
        d="M124.066 14.5172C121.594 8.69589 135.466 7.7862 130.92 1.12767"
        stroke="#FFB657"
        strokeWidth="4"
      />
      <path
        d="M134.444 82.1999C136.712 76.2958 147.319 85.2816 148.677 77.3346"
        stroke="#6D1DAA"
        strokeWidth="4"
      />

      {/* Decorative ellipses / sparkles */}
      <ellipse
        cx="120.993"
        cy="126.072"
        rx="2.5"
        ry="12"
        transform="rotate(-36.1279 120.993 126.072)"
        fill="#3ED685"
      />
      <ellipse cx="61.9941" cy="140.572" rx="1.5" ry="2.5" fill="#FFA530" />
      <ellipse cx="13.9941" cy="84.5725" rx="1.5" ry="2.5" fill="#FFA530" />
      <ellipse
        cx="100.994"
        cy="109.572"
        rx="1.5"
        ry="3.5"
        transform="rotate(-46.6843 100.994 109.572)"
        fill="#3ED685"
      />
      <ellipse
        cx="50.3304"
        cy="123.868"
        rx="1.5"
        ry="2.48383"
        transform="rotate(-46.6843 50.3304 123.868)"
        fill="#6D1DAA"
      />
      <ellipse
        cx="98.3304"
        cy="123.868"
        rx="1.5"
        ry="2.48383"
        transform="rotate(-46.6843 98.3304 123.868)"
        fill="#6D1DAA"
      />
      <ellipse
        cx="74.3304"
        cy="126.868"
        rx="1.5"
        ry="2.48383"
        transform="rotate(-46.6843 74.3304 126.868)"
        fill="#1DAA5F"
      />
      <ellipse
        cx="138.33"
        cy="54.8678"
        rx="1.5"
        ry="2.48383"
        transform="rotate(-46.6843 138.33 54.8678)"
        fill="#4B70F5"
      />
      <ellipse
        cx="10.3304"
        cy="62.8678"
        rx="1.5"
        ry="2.48383"
        transform="rotate(-46.6843 10.3304 62.8678)"
        fill="#4B70F5"
      />

      {/* Definitions (gradient + filter) */}
      <defs>
        <filter
          id="filter0_dd_87_4584"
          x="19.4941"
          y="7.07249"
          width="112"
          height="112"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius="16"
            operator="dilate"
            in="SourceAlpha"
            result="effect1_dropShadow_87_4584"
          />
          <feOffset />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.808088 0 0 0 0 0.932664 0 0 0 0 0.862697 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_87_4584"
          />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="4" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0592504 0 0 0 0 0.353734 0 0 0 0 0.196676 0 0 0 0.24 0"
          />
          <feBlend
            mode="normal"
            in2="effect1_dropShadow_87_4584"
            result="effect2_dropShadow_87_4584"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect2_dropShadow_87_4584"
            result="shape"
          />
        </filter>

        <linearGradient
          id="paint0_linear_87_4584"
          x1="75.4941"
          y1="23.0725"
          x2="75.4941"
          y2="103.072"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#1CAD60" />
          <stop offset="1" stopColor="#1E9154" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default VerifiedSuccessIcon;
