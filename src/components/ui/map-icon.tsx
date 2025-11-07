import React from 'react';

export const MapIcon = ({ className = "h-10 w-10" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Folded map background */}
      <path
        d="M3 6L9 3L15 6L21 3V18L15 21L9 18L3 21V6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Map fold lines */}
      <path
        d="M9 3V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Location pin on map */}
      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="hsl(var(--primary))"
      />
      <path
        d="M12 7C10.3431 7 9 8.34315 9 10C9 11.1046 10 13 12 14C14 13 15 11.1046 15 10C15 8.34315 13.6569 7 12 7Z"
        fill="hsl(var(--primary))"
        opacity="0.8"
      />
    </svg>
  );
};
