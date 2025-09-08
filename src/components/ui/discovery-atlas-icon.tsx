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
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Gradient definitions for light theme */}
          <radialGradient id="globeGradientLight" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(180, 100%, 85%)" stopOpacity="0.9" />
            <stop offset="30%" stopColor="hsl(200, 80%, 70%)" stopOpacity="0.8" />
            <stop offset="60%" stopColor="hsl(280, 60%, 65%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(320, 70%, 60%)" stopOpacity="0.6" />
          </radialGradient>
          
          {/* Gradient definitions for dark theme */}
          <radialGradient id="globeGradientDark" cx="0.3" cy="0.3" r="0.8">
            <stop offset="0%" stopColor="hsl(180, 100%, 60%)" stopOpacity="0.9" />
            <stop offset="30%" stopColor="hsl(220, 100%, 65%)" stopOpacity="0.8" />
            <stop offset="60%" stopColor="hsl(280, 80%, 70%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(320, 90%, 75%)" stopOpacity="0.6" />
          </radialGradient>

          {/* Ring gradients */}
          <linearGradient id="ringGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(200, 80%, 60%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(280, 70%, 65%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(320, 80%, 70%)" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="ringGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(180, 100%, 70%)" stopOpacity="0.8" />
            <stop offset="50%" stopColor="hsl(280, 80%, 75%)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(320, 90%, 80%)" stopOpacity="0.4" />
          </linearGradient>

          {/* Compass gradient */}
          <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.7" />
          </linearGradient>

          {/* Reflection gradient */}
          <linearGradient id="reflectionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "hsl(180, 100%, 60%)" : "hsl(200, 60%, 70%)"} stopOpacity="0.3" />
            <stop offset="50%" stopColor={isDark ? "hsl(280, 80%, 70%)" : "hsl(280, 50%, 60%)"} stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main globe */}
        <circle 
          cx="50" 
          cy="40" 
          r="20" 
          fill={isDark ? "url(#globeGradientDark)" : "url(#globeGradientLight)"}
          filter="url(#glow)"
        />

        {/* Globe continents shadow */}
        <g opacity="0.4">
          {/* North America */}
          <path d="M35 32 Q38 30 42 32 Q45 30 48 33 Q50 35 48 38 Q45 40 42 38 Q40 42 37 40 Q34 38 35 35 Z" fill="rgba(0,0,0,0.6)" />
          {/* Europe/Africa suggestion */}
          <path d="M52 35 Q55 33 58 36 Q60 39 57 42 Q54 44 52 42 Q50 40 52 38 Z" fill="rgba(0,0,0,0.5)" />
        </g>

        {/* Orbital rings */}
        <ellipse 
          cx="50" 
          cy="40" 
          rx="32" 
          ry="8" 
          fill="none" 
          stroke={isDark ? "url(#ringGradientDark)" : "url(#ringGradientLight)"} 
          strokeWidth="1.5"
          opacity="0.7"
        />
        <ellipse 
          cx="50" 
          cy="40" 
          rx="28" 
          ry="12" 
          fill="none" 
          stroke={isDark ? "url(#ringGradientDark)" : "url(#ringGradientLight)"} 
          strokeWidth="1"
          opacity="0.5"
          transform="rotate(45 50 40)"
        />

        {/* Compass star */}
        <g transform="translate(50,40)" filter="url(#glow)">
          {/* Main compass points */}
          <path d="M0,-12 L2,-2 L0,12 L-2,-2 Z" fill="url(#compassGradient)" opacity="0.9" />
          <path d="M-12,0 L-2,2 L12,0 L-2,-2 Z" fill="url(#compassGradient)" opacity="0.9" />
          {/* Center circle */}
          <circle cx="0" cy="0" r="2" fill="url(#compassGradient)" opacity="0.9" />
        </g>

        {/* Sparkle stars */}
        <g opacity="0.8">
          <circle cx="25" cy="25" r="1" fill={isDark ? "#FFFFFF" : "#6366F1"} opacity="0.8" />
          <circle cx="78" cy="30" r="0.8" fill={isDark ? "#FFFFFF" : "#8B5CF6"} opacity="0.6" />
          <circle cx="30" cy="55" r="0.6" fill={isDark ? "#FFFFFF" : "#06B6D4"} opacity="0.7" />
          <circle cx="72" cy="52" r="1" fill={isDark ? "#FFFFFF" : "#8B5CF6"} opacity="0.5" />
        </g>

        {/* Reflection */}
        <ellipse 
          cx="50" 
          cy="90" 
          rx="25" 
          ry="8" 
          fill="url(#reflectionGradient)"
          opacity="0.4"
        />
        
        {/* Reflection globe outline */}
        <ellipse 
          cx="50" 
          cy="85" 
          rx="18" 
          ry="5" 
          fill="none" 
          stroke="url(#reflectionGradient)"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
    </div>
  );
};

export default DiscoveryAtlasIcon;