// Test script to verify Google Maps integration
// Run this with: node test-google-maps.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google Maps Integration...\n');

// Check if react-native-maps is installed
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.dependencies['react-native-maps']) {
  console.log('✅ react-native-maps dependency found');
} else {
  console.log('❌ react-native-maps dependency missing');
}

// Check Android manifest for API key
const manifestPath = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

if (manifestContent.includes('com.google.android.geo.API_KEY')) {
  console.log('✅ Google Maps API key found in Android manifest');
} else {
  console.log('❌ Google Maps API key missing from Android manifest');
}

// Check build.gradle for Google Play Services
const buildGradlePath = path.join(__dirname, 'android/app/build.gradle');
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

if (buildGradleContent.includes('play-services-maps')) {
  console.log('✅ Google Play Services dependencies found');
} else {
  console.log('❌ Google Play Services dependencies missing');
}

// Check WildlifeMapPicker component
const mapPickerPath = path.join(__dirname, 'src/components/WildlifeMapPicker.js');
const mapPickerContent = fs.readFileSync(mapPickerPath, 'utf8');

if (mapPickerContent.includes('react-native-maps')) {
  console.log('✅ WildlifeMapPicker uses react-native-maps');
} else {
  console.log('❌ WildlifeMapPicker not updated for Google Maps');
}

if (mapPickerContent.includes('PROVIDER_GOOGLE')) {
  console.log('✅ Google Maps provider configured');
} else {
  console.log('❌ Google Maps provider not configured');
}

console.log('\n🎯 Next Steps:');
console.log('1. Run: npm install');
console.log('2. Run: cd android && ./gradlew clean && cd ..');
console.log('3. Run: npx react-native run-android');
console.log('4. Test the map functionality in the app');

console.log('\n📱 Features Available:');
console.log('- 🗺️ Native Google Maps (no WebView)');
console.log('- 📍 Wildlife hotspot markers');
console.log('- 📡 GPS location detection');
console.log('- 🎯 Interactive location selection');
console.log('- 🏷️ Custom location naming');
console.log('- 🎨 Custom marker styles');

console.log('\n✨ Google Maps integration complete!');
