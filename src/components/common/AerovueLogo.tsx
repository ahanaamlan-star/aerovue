import React from 'react';

interface AerovueLogoProps {
  className?: string;
  size?: number;
}

export const AerovueLogo: React.FC<AerovueLogoProps> = ({ className = '', size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Outer precision aperture ring segments */}
      <circle cx="16" cy="16" r="14" stroke="#24364A" strokeWidth="1" strokeDasharray="3 3" />
      
      {/* Aerial scan diamond / FOV boundary */}
      <polygon
        points="16,3 29,16 16,29 3,16"
        stroke="#4DA3FF"
        strokeWidth="1.5"
        fill="rgba(77, 163, 255, 0.06)"
      />
      
      {/* UAV Wing / Gimbal Aperture Chevron */}
      <path
        d="M9 13L16 8L23 13L20 18L16 15L12 18L9 13Z"
        fill="#4DA3FF"
        fillOpacity="0.25"
        stroke="#4DA3FF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      
      {/* Optical Sensor Center Reticle */}
      <circle cx="16" cy="16" r="2.5" fill="#F4F7FA" />
      <circle cx="16" cy="16" r="5" stroke="#4DA3FF" strokeWidth="0.75" strokeDasharray="2 1" />
      
      {/* Calibration Tick Marks */}
      <line x1="16" y1="2" x2="16" y2="4.5" stroke="#4DA3FF" strokeWidth="1.5" />
      <line x1="16" y1="27.5" x2="16" y2="30" stroke="#4DA3FF" strokeWidth="1.5" />
      <line x1="2" y1="16" x2="4.5" y2="16" stroke="#4DA3FF" strokeWidth="1.5" />
      <line x1="27.5" y1="16" x2="30" y2="16" stroke="#4DA3FF" strokeWidth="1.5" />
    </svg>
  );
};
