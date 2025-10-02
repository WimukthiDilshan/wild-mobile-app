@echo off
echo 🔧 Fixing Google Maps Integration for React Native 0.72.6
echo ==================================================

echo 📦 Installing dependencies...
call npm install

echo 🧹 Cleaning Android build...
cd android
call gradlew clean
cd ..

echo 🗑️ Clearing Metro cache...
start /B npx react-native start --reset-cache
timeout /t 5 /nobreak > nul
taskkill /F /IM node.exe 2>nul

echo 📱 Building Android app...
call npx react-native run-android

echo ✅ Google Maps fix complete!
echo.
echo 🔍 If you still see errors:
echo 1. Check that your device has Google Play Services installed
echo 2. Verify your internet connection
echo 3. Make sure the API key is correct in AndroidManifest.xml
echo 4. Try running: adb logcat ^| findstr /i maps

pause
