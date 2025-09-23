# 🌲 Forest Animals Monitoring App - Complete Setup Guide

A comprehensive React Native mobile application with Node.js backend for monitoring forest animals using Firebase Firestore database.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Setup](#firebase-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

### Features
- 📱 **React Native Mobile App** with modern UI
- 🔥 **Firebase Firestore** for real-time database
- 🚀 **Node.js Express API** with comprehensive endpoints
- 📊 **Analytics Dashboard** with charts and statistics
- 🦁 **Animal Management** with detailed information
- 📈 **Real-time Data Visualization**

### Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Native   │    │   Node.js API   │    │   Firebase      │
│   Frontend      │◄──►│    Backend      │◄──►│   Firestore     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Prerequisites

### System Requirements
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: Latest version

### Mobile Development Tools

#### For Android Development:
- **Android Studio**: Latest version
- **Android SDK**: API Level 28 or higher
- **Java Development Kit (JDK)**: Version 11

#### For iOS Development (macOS only):
- **Xcode**: Latest version
- **CocoaPods**: Latest version
- **iOS Simulator**: iOS 13.0 or higher

### Development Environment Setup

1. **Install Node.js and npm:**
   - Download from [Node.js official website](https://nodejs.org/)
   - Verify installation: `node --version` && `npm --version`

2. **Install React Native CLI:**
   ```bash
   npm install -g react-native-cli
   ```

3. **Set up Android Development Environment:**
   - Install Android Studio
   - Set up Android SDK
   - Create Android Virtual Device (AVD)

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console:**
   - Visit [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"

2. **Project Configuration:**
   - **Project name**: `forest-animals-app`
   - **Enable Google Analytics**: Optional
   - **Choose location**: Select closest region

### Step 2: Enable Firestore Database

1. **Navigate to Firestore:**
   - In Firebase Console → "Firestore Database"
   - Click "Create database"

2. **Security Rules:**
   - Choose "Start in test mode" for development
   - **Production**: Configure proper security rules

3. **Database Location:**
   - Select region closest to your users

### Step 3: Generate Service Account Key

1. **Project Settings:**
   - Click gear icon → "Project settings"
   - Navigate to "Service accounts" tab

2. **Generate Key:**
   - Click "Generate new private key"
   - Download the JSON file
   - **Important**: Keep this file secure and never commit to version control

3. **File Placement:**
   - Save as `serviceAccountKey.json` in `backend/config/` folder

### Step 4: Get Project Configuration

1. **Note your Project ID:**
   - Found in Project Settings → General tab
   - Format: `forest-animals-app-xxxxx`

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd forest-app/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Configuration

1. **Copy environment template:**
   ```bash
   copy .env.example .env
   ```

2. **Update `.env` file:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY=./config/serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-firebase-project-id
   PORT=3000
   NODE_ENV=development
   ```

### Step 4: Firebase Service Account Setup

1. **Place service account key:**
   - Copy downloaded `serviceAccountKey.json` to `backend/config/`
   - Ensure file permissions are secure

2. **Verify configuration:**
   - Double-check project ID in `.env` file
   - Ensure JSON file path is correct

### Step 5: Database Seeding

```bash
# Seed database with sample animal data
npm run seed
```

Expected output:
```
🌱 Starting to seed the database with sample animal data...
✅ Added Tiger with ID: doc_id_1
✅ Added Elephant with ID: doc_id_2
...
🎉 Successfully seeded the database with sample data!
📊 Total animals added: 12
```

### Step 6: Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

Server should start at `http://localhost:3000`

### Step 7: Test API Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Get all animals
curl http://localhost:3000/api/animals

# Get analytics
curl http://localhost:3000/api/analytics
```

## 📱 Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd ../frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Platform-Specific Setup

#### Android Setup

1. **Start Android Emulator:**
   - Open Android Studio
   - Start AVD Manager
   - Launch an emulator

2. **Or Connect Physical Device:**
   - Enable Developer Options
   - Enable USB Debugging
   - Connect via USB

#### iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### Step 4: Configuration Updates

1. **API Endpoint Configuration:**
   - Edit `src/services/ApiService.js`
   - Update `BASE_URL` if needed:

   ```javascript
   // For Android Emulator
   const BASE_URL = 'http://10.0.2.2:3000/api';
   
   // For physical device (use your computer's IP)
   const BASE_URL = 'http://192.168.1.100:3000/api';
   
   // For iOS Simulator
   const BASE_URL = 'http://localhost:3000/api';
   ```

## 🚀 Running the Application

### Method 1: Using npm scripts

1. **Start Metro Bundler:**
   ```bash
   npm start
   ```

2. **Run on Android:**
   ```bash
   # In a new terminal
   npm run android
   ```

3. **Run on iOS (macOS only):**
   ```bash
   npm run ios
   ```

### Method 2: Using React Native CLI

```bash
# Start Metro
npx react-native start

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

## 🧪 Testing

### Backend API Testing

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Get Animals:**
   ```bash
   curl http://localhost:3000/api/animals
   ```

3. **Get Analytics:**
   ```bash
   curl http://localhost:3000/api/analytics
   ```

### Frontend Testing

1. **App Launch:** Verify app opens without errors
2. **Home Screen:** Check animal list loads
3. **Analytics Button:** Navigate to analytics screen
4. **Charts Display:** Verify charts render correctly
5. **Animal Details:** Tap animal to view details

## 📦 Deployment

### Backend Deployment

#### Option 1: Heroku
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create forest-animals-api

# Set environment variables
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

#### Option 2: Google Cloud Platform
```bash
# Install gcloud CLI
# Deploy using App Engine
gcloud app deploy
```

### Frontend Deployment

#### Android APK Build
```bash
cd android
./gradlew assembleRelease
```

#### iOS Archive (macOS only)
1. Open `ios/ForestApp.xcworkspace` in Xcode
2. Product → Archive
3. Follow App Store Connect guidelines

## 🔧 Troubleshooting

### Common Backend Issues

#### 1. Firebase Connection Error
```
Error: Error initializing Firebase Admin
```
**Solution:**
- Verify service account key path
- Check Firebase project ID
- Ensure Firestore is enabled

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution:**
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Or use different port
PORT=3001 npm run dev
```

### Common Frontend Issues

#### 1. Metro Bundler Issues
```bash
# Reset Metro cache
npx react-native start --reset-cache

# Clear node modules
rm -rf node_modules && npm install
```

#### 2. Android Build Errors
```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Reset Android project
npx react-native run-android --reset-cache
```

#### 3. iOS Build Errors
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && pod deintegrate && pod install && cd ..
```

#### 4. Network Connection Issues
- **Check backend URL** in ApiService.js
- **Use correct IP address** for physical devices
- **Verify firewall settings**

### Firebase Issues

#### 1. Firestore Permission Denied
**Solution:**
- Check Firestore security rules
- Verify service account permissions
- Ensure proper authentication

#### 2. Quota Exceeded
**Solution:**
- Monitor Firebase usage in console
- Optimize queries
- Consider Firebase pricing plans

## 📝 Additional Resources

### Documentation Links
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Express.js Documentation](https://expressjs.com/)

### Sample Data Structure
```json
{
  "animals": [
    {
      "name": "Tiger",
      "location": "Amazon Rainforest",
      "count": 15,
      "habitat": "Dense forest",
      "status": "Endangered"
    }
  ]
}
```

### API Endpoints Summary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/animals` | Get all animals |
| GET | `/api/animals/:id` | Get animal by ID |
| GET | `/api/animals/location/:location` | Get animals by location |
| GET | `/api/analytics` | Get analytics data |
| POST | `/api/animals` | Add new animal |

---

## 🎉 Success Checklist

- [ ] Firebase project created and configured
- [ ] Backend server running on localhost:3000
- [ ] Database seeded with sample data
- [ ] React Native app building successfully
- [ ] Analytics charts displaying correctly
- [ ] All navigation working properly

Congratulations! Your Forest Animals Monitoring App is now ready for development and testing.

For support or questions, refer to the individual README files in backend and frontend directories.