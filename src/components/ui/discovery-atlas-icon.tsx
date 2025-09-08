import React from 'react';

interface DiscoveryAtlasIconProps {
  className?: string;
}

const DiscoveryAtlasIcon: React.FC<DiscoveryAtlasIconProps> = ({ className = "h-5 w-5" }) => {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Globe wireframe */}
        <circle 
          cx="12" 
          cy="12" 
          r="9" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1.5" 
          fill="none"
          opacity="0.6"
        />
        <path 
          d="M12 3C8 3 5 7 5 12s3 9 7 9" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1.2" 
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M12 3c4 0 7 4 7 9s-3 9-7 9" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1.2" 
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M3 12h18" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1.2" 
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M5 8h14" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1" 
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M5 16h14" 
          stroke="hsl(var(--primary))" 
          strokeWidth="1" 
          fill="none"
          opacity="0.3"
        />
        
        {/* Compass needle */}
        <g transform="translate(12,12)" opacity="0.9">
          <path 
            d="M0,-6 L2,0 L0,6 L-2,0 Z" 
            fill="hsl(var(--quest-secondary))"
            stroke="hsl(var(--quest-secondary))" 
            strokeWidth="0.5"
          />
          <circle 
            cx="0" 
            cy="0" 
            r="1.5" 
            fill="hsl(var(--primary))" 
            stroke="hsl(var(--background))" 
            strokeWidth="0.5"
          />
        </g>
        
        {/* Accent dots */}
        <circle cx="12" cy="3" r="1" fill="hsl(var(--quest-secondary))" opacity="0.8" />
        <circle cx="21" cy="12" r="0.8" fill="hsl(var(--quest-accent))" opacity="0.6" />
        <circle cx="12" cy="21" r="0.8" fill="hsl(var(--quest-secondary))" opacity="0.6" />
        <circle cx="3" cy="12" r="0.8" fill="hsl(var(--quest-accent))" opacity="0.6" />
      </svg>
    </div>
  );
};

export default DiscoveryAtlasIcon;