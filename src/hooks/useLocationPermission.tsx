import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export const useLocationPermission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

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

      // Get readable address using reverse geocoding
      let address = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'LocationPicker/1.0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            address = data.display_name;
          }
        }
      } catch (error) {
        console.log('Reverse geocoding not available, using coordinates');
      }

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        address
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
          location: locationData.address,
          updated_at: new Date().toISOString()
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

  const setManualLocation = (locationData: LocationData) => {
    setLocation(locationData);
    setHasPermission(true);
    
    if (user) {
      updateUserLocation(locationData);
    }
    
    toast({
      title: "Location updated",
      description: "Your location has been saved for personalized quests"
    });
  };

  return {
    location,
    loading,
    hasPermission,
    requestLocationPermission,
    updateUserLocation,
    setManualLocation,
    showLocationPicker,
    setShowLocationPicker
  };
};