# 🔥 Complete Firebase Setup Guide for Forest Animals App

This guide will walk you through creating a Firebase account, setting up Firestore database, and integrating it with your project.

## 📋 Step-by-Step Firebase Setup

### Step 1: Create a Google Account (if you don't have one)

1. **Go to Google Account Creation:**
   - Visit: https://accounts.google.com/signup
   - Fill in your details
   - Verify your email and phone number

### Step 2: Access Firebase Console

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Sign in with your Google account
   - You'll see the Firebase welcome screen

### Step 3: Create a New Firebase Project

1. **Click "Create a project"**

2. **Project Setup - Step 1 (Project Name):**
   ```
   Project name: forest-animals-app
   ```
   - You can use any name you prefer
   - Firebase will suggest a unique Project ID

3. **Project Setup - Step 2 (Google Analytics):**
   - Choose "Enable Google Analytics for this project" (recommended)
   - Or skip if you prefer

4. **Project Setup - Step 3 (Analytics Account):**
   - If you enabled Analytics, select "Default Account for Firebase"
   - Click "Create project"

5. **Wait for project creation** (usually takes 30-60 seconds)

6. **Click "Continue"** when setup is complete

### Step 4: Enable Firestore Database

1. **In Firebase Console, click "Firestore Database"** (in the left sidebar)

2. **Click "Create database"**

3. **Choose Security Rules:**
   ```
   Start in test mode
   ```
   - This allows read/write access for 30 days
   - We'll secure it later for production

4. **Choose Database Location:**
   - Select the region closest to your users
   - Example: `us-central1` (United States) or `europe-west1` (Europe)
   - **Important:** This cannot be changed later

5. **Click "Done"**

### Step 5: Generate Service Account Key

1. **Go to Project Settings:**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

2. **Navigate to Service Accounts:**
   - Click the "Service accounts" tab

3. **Generate Private Key:**
   - You'll see "Firebase Admin SDK" section
   - Click "Generate new private key"

4. **Download the Key:**
   - A popup will appear with security warning
   - Click "Generate key"
   - A JSON file will download (keep this safe!)

5. **Note Your Project ID:**
   - Still in Project Settings, go to "General" tab
   - Copy your "Project ID" (you'll need this later)

### Step 6: Secure the Downloaded JSON File

1. **Rename the file:**
   ```
   Original name: forest-animals-app-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
   Rename to: serviceAccountKey.json
   ```

2. **Move to correct location:**
   ```
   Move to: forest-app/backend/config/serviceAccountKey.json
   ```

3. **Set secure permissions:**
   - Right-click the file → Properties → Security
   - Ensure only you have access to this file

## ⚙️ Integrate Firebase with Your Project

### Step 1: Update Backend Environment Variables

1. **Navigate to backend folder:**
   ```bash
   cd C:\Users\Wimukthi Dilshan\Desktop\mobapp\forest-app\backend
   ```

2. **Create environment file:**
   ```bash
   copy .env.example .env
   ```

3. **Edit the .env file** with your Firebase details:
   ```env
   FIREBASE_SERVICE_ACCOUNT_KEY=./config/serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-actual-project-id
   PORT=3000
   NODE_ENV=development
   ```

   Replace `your-actual-project-id` with the Project ID from Step 5.5

### Step 2: Verify Firebase Integration

1. **Start the backend server:**
   ```bash
   npm run dev
   ```

2. **Look for success message:**
   ```
   Firebase Admin initialized successfully
   🌲 Forest API server is running on port 3000
   ```

3. **If you see errors:**
   - Double-check the file path in .env
   - Ensure serviceAccountKey.json is in the correct location
   - Verify the Project ID is correct

### Step 3: Seed the Database with Sample Data

1. **Run the seeding script:**
   ```bash
   npm run seed
   ```

2. **Expected output:**
   ```
   🌱 Starting to seed the database with sample animal data...
   ✅ Added Tiger with ID: doc_id_1
   ✅ Added Elephant with ID: doc_id_2
   ✅ Added Leopard with ID: doc_id_3
   ... (and so on)
   🎉 Successfully seeded the database with sample data!
   📊 Total animals added: 12
   ```

### Step 4: Verify Data in Firebase Console

1. **Go back to Firebase Console**
2. **Click "Firestore Database"**
3. **You should see:**
   - Collection: `animals`
   - Documents: 12 animal documents
   - Each document with fields: name, location, count, habitat, status

### Step 5: Test API Endpoints

1. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test animals endpoint:**
   ```bash
   curl http://localhost:3000/api/animals
   ```

3. **Test analytics endpoint:**
   ```bash
   curl http://localhost:3000/api/analytics
   ```

## 🔒 Security Best Practices

### For Development:
1. **Never commit serviceAccountKey.json to Git**
2. **Use test mode security rules**
3. **Monitor Firebase usage in console**

### For Production:
1. **Update Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read access to animals collection
       match /animals/{document} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. **Set up Authentication** (optional for future)
3. **Monitor and set budget alerts**

## 🐛 Troubleshooting Common Issues

### Issue 1: "Service account key not found"
**Solution:**
- Check file path in .env file
- Ensure serviceAccountKey.json exists in backend/config/
- Verify file permissions

### Issue 2: "Project ID not found"
**Solution:**
- Double-check Project ID in Firebase Console
- Ensure no typos in .env file
- Project ID is different from Project Name

### Issue 3: "Permission denied" in Firestore
**Solution:**
- Verify Firestore is in "test mode"
- Check if database was created successfully
- Ensure service account has proper permissions

### Issue 4: "Network error" when seeding
**Solution:**
- Check internet connection
- Verify Firebase project is active
- Ensure Firestore database location is set

## 📊 Understanding Your Firebase Project

### What We Created:
1. **Firebase Project:** Container for all Firebase services
2. **Firestore Database:** NoSQL document database
3. **Service Account:** Allows your backend to access Firebase
4. **Animals Collection:** Stores all forest animal data

### Data Structure:
```javascript
animals/{documentId} {
  name: "Tiger",
  location: "Amazon Rainforest", 
  count: 15,
  habitat: "Dense forest",
  status: "Endangered",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Firebase Console Navigation:
- **Authentication:** User management (for future use)
- **Firestore Database:** Your animal data
- **Storage:** File uploads (for future use)
- **Functions:** Serverless functions (for future use)
- **Analytics:** Usage statistics

## ✅ Verification Checklist

- [ ] Firebase account created
- [ ] Project "forest-animals-app" created
- [ ] Firestore database enabled
- [ ] Service account key downloaded
- [ ] serviceAccountKey.json placed in backend/config/
- [ ] .env file updated with correct Project ID
- [ ] Backend server starts without errors
- [ ] Database seeded with 12 animals
- [ ] API endpoints return data
- [ ] Data visible in Firebase Console

## 🎯 Next Steps

Once Firebase is set up successfully:

1. **Start the React Native app:**
   ```bash
   cd ../frontend
   npm install
   npm start
   npm run android  # or npm run ios
   ```

2. **Test the Analytics button** in the mobile app

3. **Explore the data** in Firebase Console

Your Firebase setup is now complete! The backend will automatically sync with your Firestore database, and the mobile app will display real-time data from Firebase.

## 💡 Tips for Success

1. **Keep your serviceAccountKey.json secure** - never share or commit it
2. **Monitor Firebase usage** in the console to avoid unexpected charges
3. **Start with test mode** and secure later for production
4. **Use Firebase CLI** for advanced features: `npm install -g firebase-tools`

Need help? Check the troubleshooting section or review the error messages in your terminal.