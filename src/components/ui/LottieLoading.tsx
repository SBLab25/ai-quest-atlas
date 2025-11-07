import React, { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LottieLoading: React.FC<LottieLoadingProps> = ({ 
  className = '', 
  size = 'md',
  message 
}) => {
  // Lottie animation URL
  const animationUrl = 'https://lottie.host/b9230623-368a-4c9c-8d75-9ac44bc03ece/R4YgbDKnqM.lottie';
  const [showAnimation, setShowAnimation] = useState(false);

  // Add 2 second delay before showing the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {showAnimation ? (
          <DotLottieReact
            src={animationUrl}
            loop
            autoplay
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
      {message && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse text-center px-4">
          {message}
        </p>
      )}
    </div>
  );
};

export default LottieLoading;

