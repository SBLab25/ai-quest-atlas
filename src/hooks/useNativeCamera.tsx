import { useState } from 'react';
// @ts-ignore - Capacitor packages installed natively
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// @ts-ignore - Capacitor packages installed natively
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';

export const useNativeCamera = () => {
  const [isLoading, setIsLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const takePicture = async (source: 'camera' | 'gallery' = 'camera') => {
    if (!isNative) {
      toast({
        title: "Native Camera Not Available",
        description: "This feature requires the native mobile app. Using web fallback.",
        variant: "default",
      });
      return null;
    }

    try {
      setIsLoading(true);
      
      // Request permissions
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        const requestResult = await Camera.requestPermissions();
        if (requestResult.camera !== 'granted' || requestResult.photos !== 'granted') {
          toast({
            title: "Permission Denied",
            description: "Camera and photo library access is required.",
            variant: "destructive",
          });
          return null;
        }
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        saveToGallery: source === 'camera',
        correctOrientation: true,
        width: 1920,
        height: 1920,
      });

      return {
        uri: image.webPath!,
        format: image.format,
        path: image.path,
      };
    } catch (error) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to capture photo",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    takePicture,
    isLoading,
    isNative,
  };
};
