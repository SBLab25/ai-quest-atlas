import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativeGeolocation } from "@/hooks/useNativeGeolocation";
import { toast } from "@/hooks/use-toast";

interface NativeLocationButtonProps {
  onLocation: (latitude: number, longitude: number) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const NativeLocationButton = ({ 
  onLocation,
  variant = 'outline',
  size = 'default',
  className 
}: NativeLocationButtonProps) => {
  const { position, isLoading, getCurrentPosition, isNative } = useNativeGeolocation();

  const handleGetLocation = async () => {
    await getCurrentPosition();
    if (position.latitude && position.longitude) {
      onLocation(position.latitude, position.longitude);
      toast({
        title: "Location Retrieved",
        description: `Accuracy: ${position.accuracy?.toFixed(0)}m`,
      });
    }
  };

  return (
    <Button
      onClick={handleGetLocation}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <MapPin className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'Getting Location...' : 'Use My Location'}
      {isNative && <span className="ml-2 text-xs">(Native)</span>}
    </Button>
  );
};
