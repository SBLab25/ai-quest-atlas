import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LottieLoading } from './LottieLoading';

interface PageLoaderProps {
  delay?: number; // Delay in milliseconds before showing loader
  minDisplayTime?: number; // Minimum time to display loader (prevents flash)
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  delay = 200,
  minDisplayTime = 600 
}) => {
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const prevPathnameRef = useRef<string>(location.pathname);
  const isInitialLoadRef = useRef<boolean>(true);

  useEffect(() => {
    // Skip if auth is still loading (let ProtectedRoute/AuthRoute handle it)
    if (authLoading) {
      return;
    }

    // Skip initial load - only show on route changes
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevPathnameRef.current = location.pathname;
      return;
    }

    // Only show loader if pathname actually changed
    if (prevPathnameRef.current === location.pathname) {
      return;
    }

    let isMounted = true;
    prevPathnameRef.current = location.pathname;
    
    // Reset and show loader immediately for route changes
    setIsLoading(true);
    setShowLoader(false);

    // Show loader after short delay
    const delayTimer = setTimeout(() => {
      if (isMounted && !authLoading) {
        setShowLoader(true);
      }
    }, delay);

    // Hide loader after minimum display time
    const minDisplayTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
        setShowLoader(false);
      }
    }, delay + minDisplayTime);

    return () => {
      isMounted = false;
      clearTimeout(delayTimer);
      clearTimeout(minDisplayTimer);
    };
  }, [location.pathname, delay, minDisplayTime, authLoading]);

  // Don't show if auth is loading (let route guards handle it)
  if (authLoading || !showLoader || !isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <LottieLoading 
        size="lg" 
        message="Loading page..." 
      />
    </div>
  );
};

export default PageLoader;

