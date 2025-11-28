# Capacitor Native Mobile App Setup

## ✅ What's Been Configured

Your Discovery Atlas app is now ready for native mobile development with:

- **Capacitor Core** - Framework for building native iOS and Android apps
- **Native Camera** - Full camera integration with photo capture and gallery access
- **Native Geolocation** - Advanced GPS tracking with high accuracy
- **Push Notifications** - Native push notification support
- **Hot Reload** - Development mode with live updates from Lovable

## 📱 Components Added

### 1. Native Camera Hook (`useNativeCamera`)
```typescript
const { takePicture, isLoading, isNative } = useNativeCamera();
```
- Take photos with native camera
- Choose from photo library
- Automatic permission handling
- High-quality image capture (1920x1920)
- Web fallback for testing

### 2. Native Geolocation Hook (`useNativeGeolocation`)
```typescript
const { position, getCurrentPosition, isNative } = useNativeGeolocation({
  enableHighAccuracy: true,
  watchPosition: true // Optional: continuous tracking
});
```
- High-accuracy GPS tracking
- Continuous position updates (watch mode)
- Altitude, heading, speed data
- Web fallback for browser testing

### 3. Ready-to-Use Components
- `<NativeCameraButton />` - Capture/choose photos
- `<NativeLocationButton />` - Get current location

## 🚀 How to Build and Run

### Prerequisites
- **For iOS**: Mac with Xcode installed
- **For Android**: Android Studio installed
- Git and Node.js installed

### Step 1: Export to GitHub
1. In Lovable, click **GitHub** → **Connect to GitHub**
2. Authorize the Lovable GitHub App
3. Click **Create Repository** to export your project

### Step 2: Clone and Setup
```bash
# Clone your repository
git clone <your-repo-url>
cd ai-quest-atlas

# Install dependencies
npm install

# Initialize Capacitor (already configured)
npx cap init

# Add iOS and/or Android platforms
npx cap add ios      # For iOS development
npx cap add android  # For Android development

# Update native dependencies
npx cap update ios
npx cap update android
```

### Step 3: Build and Sync
```bash
# Build the web app
npm run build

# Sync to native platforms
npx cap sync
```

### Step 4: Run on Device/Emulator
```bash
# For Android
npx cap run android

# For iOS (Mac only)
npx cap run ios
```

## 🔄 Development Workflow

### During Development in Lovable:
1. Make changes in Lovable
2. Changes auto-sync to GitHub
3. Pull changes: `git pull`
4. Run: `npx cap sync`
5. App updates with hot reload

### After Making Changes Locally:
1. Make changes in your IDE
2. Push to GitHub: `git push`
3. Changes auto-sync to Lovable
4. Run: `npx cap sync`

## 📸 Using Native Features

### Camera in Your Components:
```typescript
import { NativeCameraButton } from '@/components/native/NativeCameraButton';

<NativeCameraButton 
  onCapture={(imageUri) => {
    // Handle captured image
    console.log('Photo:', imageUri);
  }}
  source="camera" // or "gallery"
/>
```

### GPS in Your Components:
```typescript
import { NativeLocationButton } from '@/components/native/NativeLocationButton';

<NativeLocationButton 
  onLocation={(lat, lng) => {
    // Handle location
    console.log('Location:', lat, lng);
  }}
/>
```

### Direct Hook Usage:
```typescript
import { useNativeCamera } from '@/hooks/useNativeCamera';
import { useNativeGeolocation } from '@/hooks/useNativeGeolocation';

const { takePicture } = useNativeCamera();
const { position, getCurrentPosition } = useNativeGeolocation();

// Take a photo
const photo = await takePicture('camera');

// Get location
await getCurrentPosition();
console.log(position.latitude, position.longitude);
```

## 🔐 Permissions

The app will automatically request:
- **Camera** - For taking photos
- **Photo Library** - For choosing existing photos
- **Location** - For GPS tracking

### iOS (Info.plist)
Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Take photos for quest submissions</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Choose photos from your library</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Track your location for quests</string>
```

### Android (AndroidManifest.xml)
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

## 📱 Platform-Specific Configuration

### iOS Signing (Required for Physical Devices)
1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the App target
3. Go to Signing & Capabilities
4. Select your Team
5. Xcode will automatically create provisioning profiles

### Android Signing (Required for Release)
1. Generate keystore: 
   ```bash
   keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add to `android/app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file('my-release-key.keystore')
           storePassword 'your-password'
           keyAlias 'my-key-alias'
           keyPassword 'your-password'
       }
   }
   ```

## 🎯 What This Enables

✅ **Full Camera Control**
- Native camera with flash, zoom, focus
- Front/rear camera switching
- Photo editing before capture
- Save to device gallery
- EXIF metadata preservation

✅ **Advanced GPS Tracking**
- High-accuracy positioning (<10m)
- Continuous background tracking
- Altitude, heading, speed data
- Battery-efficient location updates
- Works offline

✅ **Native Performance**
- Faster than web version
- Smooth 60fps animations
- Native UI components
- Better battery life
- Offline-first capabilities

✅ **App Store Distribution**
- Publish to Apple App Store
- Publish to Google Play Store
- Professional app experience
- Push notifications
- In-app purchases (future)

## 🐛 Troubleshooting

### Build Errors
```bash
# Clean and rebuild
npm run build
npx cap sync
```

### iOS Issues
```bash
# Update CocoaPods
cd ios/App
pod install --repo-update
cd ../..
```

### Android Issues
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
```

### Permission Issues
- Check Info.plist (iOS) has usage descriptions
- Check AndroidManifest.xml (Android) has permissions
- Uninstall and reinstall the app

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)
- [Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)

## 🎉 Next Steps

1. **Export to GitHub** and clone locally
2. **Add iOS/Android** platforms with `npx cap add`
3. **Build** with `npm run build`
4. **Sync** with `npx cap sync`
5. **Run** on emulator/device with `npx cap run`
6. **Test** camera and GPS features
7. **Configure** app icons and splash screens
8. **Submit** to app stores when ready!

For detailed guidance, read this blog post: https://capacitorjs.com/blog/how-to-build-capacitor-app-in-lovable
