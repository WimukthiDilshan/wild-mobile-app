# 🔑 Firebase Service Account Key Setup

## IMPORTANT: You need to complete this step to make the backend work!

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com/project/forest-animals-app/settings/serviceaccounts/adminsdk
2. Or go to your Firebase project → Settings (gear icon) → Service accounts

### Step 2: Generate Private Key
1. Click "Generate new private key"
2. A dialog will appear - click "Generate key"
3. A JSON file will download automatically

### Step 3: Place the Key File
1. Rename the downloaded file to: `serviceAccountKey.json`
2. Move it to: `C:\Users\Wimukthi Dilshan\Desktop\mobapp\forest-app\backend\config\serviceAccountKey.json`

### Step 4: Verify File Structure
Your backend/config folder should contain:
```
config/
├── serviceAccountKey.json          ← Your downloaded file (REQUIRED)
└── serviceAccountKey.json.example  ← Template file (ignore this)
```

### ⚠️ Security Note
- NEVER commit serviceAccountKey.json to version control
- It's already in .gitignore for your safety
- Keep this file secure - it has admin access to your Firebase project

### Next Steps After Placing the File:
```bash
cd backend
npm run seed    # Add sample data to Firestore
npm run dev     # Start the backend server
```