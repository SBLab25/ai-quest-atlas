import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNativeCamera } from "@/hooks/useNativeCamera";
import { toast } from "@/hooks/use-toast";

interface NativeCameraButtonProps {
  onCapture: (imageUri: string) => void;
  source?: 'camera' | 'gallery';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const NativeCameraButton = ({ 
  onCapture, 
  source = 'camera',
  variant = 'default',
  size = 'default',
  className 
}: NativeCameraButtonProps) => {
  const { takePicture, isLoading, isNative } = useNativeCamera();

  const handleCapture = async () => {
    const result = await takePicture(source);
    if (result?.uri) {
      onCapture(result.uri);
      toast({
        title: "Photo Captured",
        description: "Your photo has been successfully captured.",
      });
    }
  };

  return (
    <Button
      onClick={handleCapture}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <Camera className="w-4 h-4 mr-2" />
      {isLoading ? 'Capturing...' : source === 'camera' ? 'Take Photo' : 'Choose Photo'}
      {isNative && <span className="ml-2 text-xs">(Native)</span>}
    </Button>
  );
};
