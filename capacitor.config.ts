import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4884f03e6a51437b9bbf89131514f0a7',
  appName: 'ai-quest-atlas',
  webDir: 'dist',
  server: {
    url: 'https://4884f03e-6a51-437b-9bbf-89131514f0a7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      quality: 90,
      allowEditing: true,
      resultType: 'uri',
      saveToGallery: true
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
