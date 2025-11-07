import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Target, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
}

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData | null;
}

// Component for handling map clicks
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation
}) => {
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(currentLocation);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    currentLocation ? [currentLocation.latitude, currentLocation.longitude] : [51.505, -0.09]
  );

  useEffect(() => {
    if (currentLocation) {
      setMapCenter([currentLocation.latitude, currentLocation.longitude]);
      setSelectedLocation(currentLocation);
    }
  }, [currentLocation]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LocationPicker/1.0'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLoading(true);
    
    try {
      const address = await reverseGeocode(lat, lng);
      const location: LocationData = {
        latitude: lat,
        longitude: lng,
        address
      };
      
      setSelectedLocation(location);
      setMapCenter([lat, lng]);
    } catch (error) {
      console.error('Error selecting location:', error);
      toast({
        title: "Error",
        description: "Failed to process location selection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPosition = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Try multiple times to get better accuracy
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

      const { latitude, longitude, accuracy } = bestPosition.coords;
      
      // Warn if accuracy is poor (likely IP-based)
      if (accuracy > ACCURACY_THRESHOLD) {
        toast({
          title: "Low Accuracy Warning",
          description: `Location accuracy is ±${Math.round(accuracy)}m. This suggests IP-based location (can be off by 200-400km). Please verify the location on the map and adjust if needed.`,
          variant: "destructive",
          duration: 8000
        });
      } else if (accuracy > 100) {
        toast({
          title: "Location Found",
          description: `Accuracy: ±${Math.round(accuracy)}m. Please verify the location is correct on the map.`,
          duration: 5000
        });
      } else {
        toast({
          title: "Location Found",
          description: `Accuracy: ±${Math.round(accuracy)}m`
        });
      }
      
      const address = await reverseGeocode(latitude, longitude);
      
      const location: LocationData = {
        latitude,
        longitude,
        address,
        accuracy
      };
      
      setSelectedLocation(location);
      setMapCenter([latitude, longitude]);
    } catch (error: any) {
      console.error('Geolocation error:', error);
      
      let message = "Unable to get your location";
      let description = "Please search for your location or click on the map to select it.";
      
      if (error.code === 1) {
        message = "Location access denied";
        description = "Please enable location permissions in your browser settings, or search/click on the map to select your location.";
      } else if (error.code === 2) {
        message = "Location unavailable";
        description = "GPS is not available. This often happens on desktop computers or when using VPN. Please search for your location or click on the map.";
      } else if (error.code === 3) {
        message = "Location request timed out";
        description = "GPS took too long to respond. Please search for your location or click on the map to select it.";
      }

      toast({
        title: message,
        description: description,
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LocationPicker/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        await handleLocationSelect(lat, lng);
      } else {
        toast({
          title: "Location not found",
          description: "Please try a different search term",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for location",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Your Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and GPS Controls */}
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
              />
              <Button onClick={searchLocation} disabled={loading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={getCurrentPosition} disabled={loading} variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Use GPS
            </Button>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div className="w-full h-96 rounded-lg border overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                className="w-full h-full"
                key={`${mapCenter[0]}-${mapCenter[1]}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                {selectedLocation && (
                  <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
                )}
              </MapContainer>
            </div>
            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">Selected Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.address || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                      {selectedLocation.accuracy && ` (±${Math.round(selectedLocation.accuracy)}m)`}
                    </p>
                  </div>
                  <Button onClick={() => setSelectedLocation(null)} variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedLocation}>
              Confirm Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};