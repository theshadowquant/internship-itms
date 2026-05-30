import React from 'react';
import { cn } from '../../utils/cn';

export const Spotlight = ({ className, fill }) => (
  <svg
    className={cn(
      "animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0",
      className
    )}
    viewBox="0 0 3787 2842"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter-spotlight)">
      <ellipse
        cx="1924.71"
        cy="273.501"
        rx="1924.71"
        ry="273.501"
        fill={fill || "white"}
        fillOpacity="0.21"
      />
    </g>
    <defs>
      <filter
        id="filter-spotlight"
        x="0.864197"
        y="-378.201"
        width="3847.69"
        height="1303.4"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
      </filter>
    </defs>
  </svg>
);
