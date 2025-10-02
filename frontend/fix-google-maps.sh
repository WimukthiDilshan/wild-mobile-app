#!/bin/bash

echo "🔧 Fixing Google Maps Integration for React Native 0.72.6"
echo "=================================================="

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo "🗑️ Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!

echo "⏳ Waiting for Metro to start..."
sleep 5

echo "🛑 Stopping Metro..."
kill $METRO_PID

echo "📱 Building Android app..."
npx react-native run-android

echo "✅ Google Maps fix complete!"
echo ""
echo "🔍 If you still see errors:"
echo "1. Check that your device has Google Play Services installed"
echo "2. Verify your internet connection"
echo "3. Make sure the API key is correct in AndroidManifest.xml"
echo "4. Try running: adb logcat | grep -i maps"
