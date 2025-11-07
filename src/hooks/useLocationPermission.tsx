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
      
      // Try multiple times to get better accuracy (reject IP-based fallback)
      let bestPosition: GeolocationPosition | null = null;
      let bestAccuracy = Infinity;
      const ACCURACY_THRESHOLD = 3000; // Reject locations with accuracy > 3km (likely IP-based)
      
      // Try up to 3 times to get GPS-accurate location
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 20000, // Longer timeout for GPS to respond
              maximumAge: 0 // Force fresh location, no cache
            });
          });

          const accuracy = position.coords.accuracy || Infinity;
          console.log(`Location attempt ${attempt}: Accuracy ${accuracy}m`);
          
          // Keep the most accurate position
          if (accuracy < bestAccuracy) {
            bestPosition = position;
            bestAccuracy = accuracy;
          }
          
          // If we get very good accuracy (under 100m), use it immediately
          if (accuracy < 100) {
            console.log('High accuracy achieved, using this location');
            break;
          }
          
          // Wait briefly between attempts
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (attemptError) {
          console.log(`Attempt ${attempt} failed:`, attemptError);
          if (attempt === 3) throw attemptError; // Only throw on final attempt
        }
      }

      if (!bestPosition) {
        throw new Error('All location attempts failed');
      }

      // Validate accuracy - reject IP-based locations
      if (bestAccuracy > ACCURACY_THRESHOLD) {
        console.warn(`Location accuracy too poor (${Math.round(bestAccuracy)}m), likely IP-based. Opening location picker.`);
        toast({
          title: "GPS Location Unavailable",
          description: `Detected location accuracy is ±${Math.round(bestAccuracy)}m, which suggests IP-based location (off by 200-400km). Please select your location manually on the map.`,
          variant: "destructive",
          duration: 8000
        });
        
        // Set location data but don't save yet - let user confirm via picker
        const locationData: LocationData = {
          latitude: bestPosition.coords.latitude,
          longitude: bestPosition.coords.longitude,
          accuracy: bestAccuracy,
          address: `${bestPosition.coords.latitude.toFixed(4)}, ${bestPosition.coords.longitude.toFixed(4)}`
        };
        
        setLocation(locationData);
        setShowLocationPicker(true); // Open picker for manual confirmation
        setHasPermission(true);
        return false; // Return false to indicate manual selection needed
      }

      // Get readable address using reverse geocoding
      let address = `${bestPosition.coords.latitude.toFixed(4)}, ${bestPosition.coords.longitude.toFixed(4)}`;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${bestPosition.coords.latitude}&lon=${bestPosition.coords.longitude}&addressdetails=1`,
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
        latitude: bestPosition.coords.latitude,
        longitude: bestPosition.coords.longitude,
        accuracy: bestAccuracy,
        address
      };

      setLocation(locationData);
      setHasPermission(true);

      // Show confirmation before saving if accuracy is still moderate (100m-1000m)
      if (bestAccuracy > 100 && bestAccuracy <= 1000) {
        toast({
          title: "Location Detected",
          description: `Location: ${address}\nAccuracy: ±${Math.round(bestAccuracy)}m\nIf this looks wrong, use the location picker to correct it.`,
          duration: 6000
        });
      }

      // Save location to user profile if user is authenticated
      if (user) {
        await updateUserLocation(locationData);
      }

      toast({
        title: "Location updated",
        description: `Your location has been saved (accuracy: ±${Math.round(bestAccuracy)}m)`
      });

      return true;
    } catch (error: any) {
      console.error('Error getting location:', error);
      setHasPermission(false);
      
      let message = "Unable to get your location";
      let description = "Please use the location picker to select your location manually.";
      
      if (error.code === 1) {
        message = "Location access denied";
        description = "Please enable location permissions in your browser settings, or use the location picker to select manually.";
      } else if (error.code === 2) {
        message = "Location unavailable";
        description = "GPS is not available. This often happens on desktop computers or when using VPN. Please use the location picker to select your location manually.";
      } else if (error.code === 3) {
        message = "Location request timed out";
        description = "GPS took too long to respond. Please use the location picker to select your location manually.";
      }

      toast({
        title: message,
        description: description,
        variant: "destructive",
        duration: 8000
      });

      // Open location picker as fallback
      setShowLocationPicker(true);

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
    setShowLocationPicker(false); // Close picker after selection
    
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