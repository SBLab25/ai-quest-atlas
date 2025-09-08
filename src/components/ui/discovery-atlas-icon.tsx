import React from 'react';
import discoveryAtlasLogo from '@/assets/discovery-atlas-logo.png';

interface DiscoveryAtlasIconProps {
  className?: string;
}

const DiscoveryAtlasIcon: React.FC<DiscoveryAtlasIconProps> = ({ className = "h-5 w-5" }) => {
  return (
    <img 
      src={discoveryAtlasLogo} 
      alt="Discovery Atlas" 
      className={className}
    />
  );
};

export default DiscoveryAtlasIcon;