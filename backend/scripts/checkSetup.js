const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Firebase Setup...\n');

// Check if service account key exists
const serviceKeyPath = path.join(__dirname, '../config/serviceAccountKey.json');
const serviceKeyExists = fs.existsSync(serviceKeyPath);

console.log('📁 File Checks:');
console.log(`   Service Account Key: ${serviceKeyExists ? '✅ Found' : '❌ Missing'}`);

if (!serviceKeyExists) {
  console.log('\n🚨 MISSING SERVICE ACCOUNT KEY!');
  console.log('📝 Steps to fix:');
  console.log('1. Go to: https://console.firebase.google.com/project/forest-animals-app/settings/serviceaccounts/adminsdk');
  console.log('2. Click "Generate new private key"');
  console.log('3. Download the JSON file');
  console.log('4. Rename it to: serviceAccountKey.json');
  console.log('5. Place it in: backend/config/serviceAccountKey.json');
  console.log('\n🔄 Then run: npm run seed');
  process.exit(1);
}

// Check environment variables
const projectId = process.env.FIREBASE_PROJECT_ID;
console.log(`   Project ID: ${projectId || '❌ Not set'}`);

// Try to parse the service account key
try {
  const serviceKey = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
  console.log(`   Service Key Project: ${serviceKey.project_id}`);
  
  if (serviceKey.project_id === 'forest-animals-app') {
    console.log('\n✅ Firebase configuration looks good!');
    console.log('🌱 Ready to seed database with: npm run seed');
  } else {
    console.log('\n⚠️  Project ID mismatch!');
    console.log(`   Expected: forest-animals-app`);
    console.log(`   Found: ${serviceKey.project_id}`);
  }
} catch (error) {
  console.log(`   Service Key: ❌ Invalid JSON - ${error.message}`);
}

console.log('\n📋 Next Steps:');
console.log('1. Ensure service account key is properly placed');
console.log('2. Run: npm run seed (to add sample data)');
console.log('3. Run: npm run dev (to start server)');
console.log('4. Test: curl http://localhost:3000/health');