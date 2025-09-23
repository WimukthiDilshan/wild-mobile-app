# Forest Backend API

Node.js Express server with Firebase integration for the Forest Animals Monitoring App.

## Prerequisites

- Node.js (v16 or higher)
- Firebase project with Firestore enabled
- Firebase service account key

## Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Create a project"
   - Enter project name: `forest-animals-app`
   - Enable Google Analytics (optional)

2. **Enable Firestore Database:**
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for development
   - Select a location closest to you

3. **Generate Service Account Key:**
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Save the JSON file as `serviceAccountKey.json` in the `config/` folder

4. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your Firebase project details:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY=./config/serviceAccountKey.json
   FIREBASE_PROJECT_ID=your-firebase-project-id
   PORT=3000
   NODE_ENV=development
   ```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```

3. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/animals` | Get all animals |
| GET | `/api/animals/:id` | Get animal by ID |
| GET | `/api/animals/location/:location` | Get animals by location |
| GET | `/api/analytics` | Get analytics data |
| POST | `/api/animals` | Add new animal |

### Sample API Responses

**GET /api/animals**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_id",
      "name": "Tiger",
      "location": "Amazon Rainforest",
      "count": 15,
      "habitat": "Dense forest",
      "status": "Endangered"
    }
  ],
  "count": 12
}
```

**GET /api/analytics**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSpecies": 12,
      "totalCount": 297,
      "locationsCount": 7
    },
    "locationStats": {
      "Amazon Rainforest": {
        "animals": 4,
        "count": 97
      }
    },
    "speciesStats": {
      "Tiger": {
        "count": 15,
        "locations": ["Amazon Rainforest"]
      }
    }
  }
}
```

## Database Structure

### Animals Collection

```javascript
{
  name: String,          // Animal species name
  location: String,      // Forest location
  count: Number,         // Population count
  habitat: String,       // Habitat description
  status: String,        // Conservation status
  createdAt: Timestamp,  // Creation time
  updatedAt: Timestamp   // Last update time
}
```

## Security Features

- CORS enabled for cross-origin requests
- Helmet for security headers
- Input validation
- Error handling middleware
- Environment variables for sensitive data

## Development

- **Auto-reload:** Use `npm run dev` for development
- **Logging:** Console logs for debugging
- **Error Handling:** Comprehensive error responses
- **Validation:** Input validation for API endpoints

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use proper Firebase security rules
3. Enable authentication if needed
4. Use HTTPS in production
5. Set appropriate CORS origins

## Troubleshooting

- Ensure Firebase service account key is properly configured
- Check Firebase project ID matches your project
- Verify Firestore is enabled in Firebase Console
- Check network connectivity for Firebase API calls