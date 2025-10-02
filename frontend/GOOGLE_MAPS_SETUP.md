# Google Maps Integration Setup

This guide will help you set up Google Maps in your React Native wildlife tracking app.

## Prerequisites

- Google Cloud Platform account
- Google Maps API key (already provided: `AIzaSyCQmLcK0qWJY5NvG5kNTPBfnd_2IKBrVsA`)

## Installation Steps

### 1. Install Dependencies

The required dependencies have been added to `package.json`:

```bash
npm install react-native-maps
```

### 2. Android Setup

#### 2.1 API Key Configuration
The Google Maps API key has been added to `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="AIzaSyCQmLcK0qWJY5NvG5kNTPBfnd_2IKBrVsA" />
```

#### 2.2 Permissions
Required permissions have been added to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### 2.3 Dependencies
Google Play Services dependencies have been added to `android/app/build.gradle`:

```gradle
implementation 'com.google.android.gms:play-services-maps:18.1.0'
implementation 'com.google.android.gms:play-services-location:21.0.1'
```

### 3. iOS Setup (if needed)

For iOS, you would need to add the API key to `ios/YourApp/AppDelegate.mm`:

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"AIzaSyCQmLcK0qWJY5NvG5kNTPBfnd_2IKBrVsA"];
  // ... other code
}
```

## Features Implemented

### 1. WildlifeMapPicker Component
- **Google Maps Integration**: Native Google Maps instead of WebView/Leaflet
- **Wildlife Hotspots**: Pre-defined markers for major wildlife locations
- **GPS Location**: Real-time location detection
- **Interactive Selection**: Tap anywhere on map to select location
- **Custom Markers**: Emoji-based markers for wildlife hotspots
- **Location Naming**: Custom name input for selected locations

### 2. Map Features
- **Hybrid Map Type**: Satellite imagery with street names
- **User Location**: Shows current user location
- **Compass & Scale**: Built-in map controls
- **Smooth Animations**: Animated map transitions
- **Marker Customization**: Custom styled markers

### 3. Wildlife Hotspots
Pre-configured locations include:
- 🌳 Amazon Rainforest
- 🦁 Serengeti National Park
- 🐒 Borneo Rainforest
- 🐻 Yellowstone National Park
- 🦎 Madagascar
- 🐠 Great Barrier Reef
- 🦍 Congo Basin
- 🐆 Pantanal Wetlands
- 🐢 Galapagos Islands
- 🐻‍❄️ Arctic Tundra

## Usage

The `WildlifeMapPicker` component is used in the `InsertAnimalsScreen`:

```javascript
import WildlifeMapPicker from '../components/WildlifeMapPicker';

// In your component
<WildlifeMapPicker
  visible={showMapPicker}
  onClose={() => setShowMapPicker(false)}
  onLocationSelect={handleMapLocationSelect}
  initialLocation={locationData}
/>
```

## API Key Security

⚠️ **Important**: The API key is currently hardcoded in the Android manifest. For production:

1. Use environment variables
2. Restrict API key usage to your app's package name
3. Enable only required APIs (Maps SDK for Android)
4. Set up API key restrictions in Google Cloud Console

## Troubleshooting

### Common Issues

1. **Maps not loading**: Check API key and internet connection
2. **Location not found**: Ensure location permissions are granted
3. **Build errors**: Clean and rebuild the project

### Commands

```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android

# Reset Metro cache
npx react-native start --reset-cache
```

## Next Steps

1. Test the map functionality on a physical device
2. Customize map styling if needed
3. Add more wildlife hotspots
4. Implement offline map caching
5. Add route planning features

## Support

For issues with Google Maps integration, check:
- [React Native Maps Documentation](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Console](https://console.cloud.google.com/)
