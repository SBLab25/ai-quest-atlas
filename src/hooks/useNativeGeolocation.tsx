import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
}

export const useNativeGeolocation = (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}) => {
  const [position, setPosition] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    timestamp: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const getCurrentPosition = async () => {
    if (!isNative) {
      // Fallback to web geolocation
      try {
        setIsLoading(true);
        const webPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: options?.enableHighAccuracy ?? true,
            timeout: options?.timeout ?? 10000,
            maximumAge: options?.maximumAge ?? 0,
          });
        });

        setPosition({
          latitude: webPosition.coords.latitude,
          longitude: webPosition.coords.longitude,
          accuracy: webPosition.coords.accuracy,
          altitude: webPosition.coords.altitude,
          heading: webPosition.coords.heading,
          speed: webPosition.coords.speed,
          timestamp: webPosition.timestamp,
        });
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
        setError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // Check permissions
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const requestResult = await Geolocation.requestPermissions();
        if (requestResult.location !== 'granted') {
          throw new Error('Location permission denied');
        }
      }

      const nativePosition = await Geolocation.getCurrentPosition({
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      });

      updatePosition(nativePosition);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePosition = (pos: Position) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude ?? null,
      heading: pos.coords.heading ?? null,
      speed: pos.coords.speed ?? null,
      timestamp: pos.timestamp,
    });
  };

  useEffect(() => {
    if (options?.watchPosition && isNative) {
      let watchId: string;
      
      const startWatching = async () => {
        try {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') {
            await Geolocation.requestPermissions();
          }

          watchId = await Geolocation.watchPosition(
            {
              enableHighAccuracy: options?.enableHighAccuracy ?? true,
              timeout: options?.timeout ?? 10000,
              maximumAge: options?.maximumAge ?? 0,
            },
            (position, err) => {
              if (err) {
                setError(err.message);
                return;
              }
              if (position) {
                updatePosition(position);
                setError(null);
              }
            }
          );
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to watch position');
        }
      };

      startWatching();

      return () => {
        if (watchId) {
          Geolocation.clearWatch({ id: watchId });
        }
      };
    }
  }, [options?.watchPosition, options?.enableHighAccuracy, options?.timeout, options?.maximumAge, isNative]);

  return {
    position,
    isLoading,
    error,
    getCurrentPosition,
    isNative,
  };
};
