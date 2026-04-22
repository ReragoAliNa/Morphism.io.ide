import React from 'react';
import useIDEStore from '../store/useIDEStore';

const Logo = ({ size = 28, className = '' }) => {
  const theme = useIDEStore(state => state.theme);
  const isBrutalist = theme === 'brutalist';

  // Theme-aware colors
  const bgFill = isBrutalist ? '#1E293B' : '#141416';
  const strokeColor = '#71717A'; // Zinc 500
  const greenColor = '#22C55E'; // Emerald 500
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main 'M' Path — Exactly matching the user's provided design */}
      <path
        d="M 25 65 C 25 40, 35 35, 40 35 C 45 35, 48 45, 50 50 C 52 45, 55 35, 60 35 C 65 35, 75 40, 75 65"
        stroke={strokeColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom Dashed Arc */}
      <path
        d="M 25 65 C 30 85, 70 85, 75 65"
        stroke={strokeColor}
        strokeWidth="3"
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Nodes */}
      <circle cx="25" cy="65" r="5" fill={strokeColor} />
      <circle cx="50" cy="50" r="6" fill={greenColor} />
      <circle cx="75" cy="65" r="5" fill={strokeColor} />
      
      {/* Brutalist Glow (Optional) */}
      {isBrutalist && (
        <defs>
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      )}
    </svg>
  );
};

export default Logo;
