import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const useLocationPermission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setLocation(locationData);
      setHasPermission(true);

      // Save location to user profile if user is authenticated
      if (user) {
        await updateUserLocation(locationData);
      }

      toast({
        title: "Location updated",
        description: "Your location has been saved for personalized quests"
      });

      return true;
    } catch (error: any) {
      console.error('Error getting location:', error);
      setHasPermission(false);
      
      let message = "Unable to get your location";
      if (error.code === 1) {
        message = "Location access denied. Please enable location permissions in your browser settings.";
      } else if (error.code === 2) {
        message = "Location unavailable. Please check your GPS settings.";
      } else if (error.code === 3) {
        message = "Location request timed out. Please try again.";
      }

      toast({
        title: "Location Error",
        description: message,
        variant: "destructive"
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserLocation = async (locationData: LocationData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          location_last_updated: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user location:', error);
      }
    } catch (error) {
      console.error('Error saving location to profile:', error);
    }
  };

  const checkLocationPermission = async () => {
    if (!navigator.permissions) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setHasPermission(permission.state === 'granted');
      
      // Listen for permission changes
      permission.onchange = () => {
        setHasPermission(permission.state === 'granted');
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  useEffect(() => {
    checkLocationPermission();
  }, []);

  return {
    location,
    loading,
    hasPermission,
    requestLocationPermission,
    updateUserLocation
  };
};