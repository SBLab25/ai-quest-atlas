import React from 'react';
import { useTheme } from 'next-themes';

interface DiscoveryAtlasIconProps {
  className?: string;
}

const DiscoveryAtlasIcon: React.FC<DiscoveryAtlasIconProps> = ({ className = "h-8 w-8" }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Earth gradient for light theme */}
          <radialGradient id="earthGradientLight" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(200, 90%, 75%)" />
            <stop offset="40%" stopColor="hsl(210, 80%, 60%)" />
            <stop offset="80%" stopColor="hsl(220, 70%, 45%)" />
            <stop offset="100%" stopColor="hsl(230, 60%, 35%)" />
          </radialGradient>
          
          {/* Earth gradient for dark theme */}
          <radialGradient id="earthGradientDark" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(180, 100%, 70%)" />
            <stop offset="40%" stopColor="hsl(200, 90%, 60%)" />
            <stop offset="80%" stopColor="hsl(220, 80%, 50%)" />
            <stop offset="100%" stopColor="hsl(240, 70%, 40%)" />
          </radialGradient>

          {/* Compass gradient */}
          <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "hsl(50, 100%, 90%)" : "hsl(45, 100%, 95%)"} />
            <stop offset="100%" stopColor={isDark ? "hsl(40, 90%, 75%)" : "hsl(35, 80%, 70%)"} />
          </linearGradient>

          {/* Compass needle gradient */}
          <linearGradient id="needleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(0, 80%, 60%)" />
            <stop offset="100%" stopColor="hsl(10, 70%, 45%)" />
          </linearGradient>

          {/* Reflection gradient */}
          <linearGradient id="reflectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "hsl(200, 80%, 60%)" : "hsl(210, 70%, 70%)"} stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Main Earth globe */}
        <circle 
          cx="50" 
          cy="50" 
          r="28" 
          fill={isDark ? "url(#earthGradientDark)" : "url(#earthGradientLight)"}
        />

        {/* Continents - simplified landmasses */}
        <g opacity="0.6">
          {/* North America */}
          <path d="M30 35 Q35 32 40 35 Q45 33 50 38 Q52 42 48 45 Q43 47 38 44 Q32 42 30 38 Z" 
                fill={isDark ? "hsl(120, 40%, 25%)" : "hsl(120, 50%, 20%)"} />
          
          {/* Europe/Africa */}
          <path d="M52 40 Q57 38 62 42 Q65 46 62 50 Q58 53 54 50 Q50 47 52 43 Z" 
                fill={isDark ? "hsl(120, 40%, 25%)" : "hsl(120, 50%, 20%)"} />
          
          {/* Asia */}
          <path d="M55 25 Q62 22 68 28 Q70 32 67 36 Q63 38 58 35 Q54 32 55 28 Z" 
                fill={isDark ? "hsl(120, 40%, 25%)" : "hsl(120, 50%, 20%)"} />
        </g>

        {/* Compass outer ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="32" 
          fill="none" 
          stroke="url(#compassGradient)" 
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Compass cardinal points */}
        <g transform="translate(50,50)" opacity="0.9">
          {/* North */}
          <path d="M0,-35 L3,-25 L0,-30 L-3,-25 Z" fill="url(#compassGradient)" />
          <text x="0" y="-38" textAnchor="middle" fontSize="8" 
                fill={isDark ? "hsl(50, 100%, 85%)" : "hsl(220, 60%, 30%)"}>N</text>
          
          {/* East */}
          <path d="M35,0 L25,3 L30,0 L25,-3 Z" fill="url(#compassGradient)" />
          <text x="38" y="3" textAnchor="middle" fontSize="8" 
                fill={isDark ? "hsl(50, 100%, 85%)" : "hsl(220, 60%, 30%)"}>E</text>
          
          {/* South */}
          <path d="M0,35 L-3,25 L0,30 L3,25 Z" fill="url(#compassGradient)" />
          <text x="0" y="43" textAnchor="middle" fontSize="8" 
                fill={isDark ? "hsl(50, 100%, 85%)" : "hsl(220, 60%, 30%)"}>S</text>
          
          {/* West */}
          <path d="M-35,0 L-25,-3 L-30,0 L-25,3 Z" fill="url(#compassGradient)" />
          <text x="-38" y="3" textAnchor="middle" fontSize="8" 
                fill={isDark ? "hsl(50, 100%, 85%)" : "hsl(220, 60%, 30%)"}>W</text>
        </g>

        {/* Compass needle pointing North */}
        <g transform="translate(50,50)">
          <path d="M0,-15 L4,0 L0,2 L-4,0 Z" fill="url(#needleGradient)" />
          <circle cx="0" cy="0" r="3" fill="url(#compassGradient)" />
        </g>

        {/* Discovery stars around the globe */}
        <g opacity="0.7">
          <circle cx="20" cy="20" r="1.5" fill={isDark ? "hsl(50, 100%, 80%)" : "hsl(45, 90%, 60%)"} />
          <circle cx="80" cy="25" r="1" fill={isDark ? "hsl(200, 100%, 70%)" : "hsl(200, 80%, 50%)"} />
          <circle cx="25" cy="75" r="1" fill={isDark ? "hsl(280, 90%, 70%)" : "hsl(280, 70%, 50%)"} />
          <circle cx="75" cy="70" r="1.5" fill={isDark ? "hsl(320, 100%, 70%)" : "hsl(320, 80%, 50%)"} />
        </g>
      </svg>
    </div>
  );
};

export default DiscoveryAtlasIcon;