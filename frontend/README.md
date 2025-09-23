# Forest React Native Frontend

React Native mobile application for monitoring forest animals with real-time analytics.

## Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install iOS dependencies (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

## Running the App

### Android

1. **Start Metro bundler:**
   ```bash
   npm start
   ```

2. **Run on Android device/emulator:**
   ```bash
   npm run android
   ```

### iOS (macOS only)

1. **Start Metro bundler:**
   ```bash
   npm start
   ```

2. **Run on iOS device/simulator:**
   ```bash
   npm run ios
   ```

## Project Structure

```
src/
├── screens/           # App screens
│   ├── HomeScreen.js  # Main dashboard
│   ├── AnalystScreen.js # Analytics dashboard
│   └── AnimalDetailsScreen.js # Animal details
├── services/          # API services
│   └── ApiService.js  # Backend API communication
└── components/        # Reusable components
```

## Features

### 🏠 Home Screen
- **Animal List:** Browse all forest animals
- **Quick Stats:** Total species, animals, and locations
- **Analytics Button:** Navigate to analytics dashboard
- **Pull-to-Refresh:** Update data in real-time

### 📊 Analytics Screen
- **Summary Cards:** Key metrics overview
- **Bar Chart:** Animals distribution by location
- **Pie Chart:** Top species distribution
- **Location Breakdown:** Detailed location statistics
- **Species Information:** Individual species data

### 🦁 Animal Details Screen
- **Detailed Information:** Complete animal profile
- **Conservation Status:** Color-coded status badges
- **Population Data:** Current count and trends
- **Habitat Information:** Environment details

## API Integration

The app communicates with the backend API at `http://localhost:3000/api`:

- `GET /animals` - Fetch all animals
- `GET /animals/:id` - Get specific animal
- `GET /analytics` - Get analytics data
- `POST /animals` - Add new animal

## Charts and Visualization

Using `react-native-chart-kit` for data visualization:

- **Bar Charts:** Location-based distribution
- **Pie Charts:** Species population breakdown
- **Progress Bars:** Comparative statistics

## UI/UX Features

- **Material Design:** Modern, clean interface
- **Color-Coded Status:** Conservation status indicators
- **Responsive Layout:** Works on all screen sizes
- **Loading States:** Smooth loading animations
- **Error Handling:** User-friendly error messages

## Configuration

### API Endpoint

Update the API base URL in `src/services/ApiService.js`:

```javascript
const BASE_URL = 'http://your-backend-url:3000/api';
```

### Network Configuration

For Android development, ensure your backend is accessible:

1. Use your computer's IP address instead of localhost
2. Or use Android emulator with `10.0.2.2:3000`

## Development

### Hot Reload

React Native supports hot reloading for faster development:
- Save files to see changes instantly
- Shake device/use Ctrl+M for dev menu

### Debugging

- **Chrome DevTools:** Enable remote JS debugging
- **Flipper:** Advanced debugging and profiling
- **Console Logs:** Use `console.log()` for debugging

## Building for Production

### Android

1. **Generate signed APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **APK location:**
   `android/app/build/outputs/apk/release/app-release.apk`

### iOS

1. **Archive in Xcode:**
   - Open `ios/ForestApp.xcworkspace`
   - Product → Archive

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **Android build errors:**
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

3. **iOS build errors:**
   ```bash
   cd ios && pod install && cd ..
   ```

### Network Issues

- Ensure backend server is running
- Check firewall settings
- Use correct IP address for device testing

## Dependencies

### Core Dependencies
- `react-native`: Mobile framework
- `@react-navigation/native`: Navigation
- `react-native-chart-kit`: Charts and graphs
- `react-native-vector-icons`: Icons

### Optional Firebase (if direct connection needed)
- `@react-native-firebase/app`: Firebase core
- `@react-native-firebase/firestore`: Firestore database

## Performance

- **Optimized Images:** Use appropriate image formats
- **Lazy Loading:** Load data as needed
- **Memoization:** Prevent unnecessary re-renders
- **Bundle Size:** Monitor and optimize bundle size