# Backend Migration to Local Development

This guide covers migrating the backend from Replit to a local dev environment.

## Quick Start (Emulator Mode) - Option B

This is the recommended way to run the backend locally without needing cloud credentials.

### Prerequisites
- **Node.js 20 LTS** recommended
- **Java** (required for Firebase Emulators)
- **firebase-tools**: `npm install -g firebase-tools`

### 1. Setup Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure your `.env` has the following emulator configuration (should be default in `.env.example`):
```env
# Emulator Config
GCLOUD_PROJECT=miximixology-dev
FIREBASE_PROJECT_ID=miximixology-dev
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
```

### 2. Install Dependencies
```bash
npm install
```
*Note: If `concurrently` is missing, run `npm install -D concurrently`.*

### 3. Run the Stack
Start both the Firebase Emulators and the API Server with one command:
```bash
npm run dev:local
```

This will:
1.  Start Firestore Emulator on `:8080`
2.  Start Auth Emulator on `:9099`
3.  Start Emulator UI on `:4000` (Visit http://localhost:4000)
4.  Start API Server on `:5050`

### 4. Connect Mobile App
Your API is running on `0.0.0.0:5050`.
- **Mobile API URL**: `http://192.168.50.2:5050`

The API acts as a gateway:
`Mobile -> API (:5050) -> Local Emulators (localhost:8080/9099)`

Your mobile app **does not** need to connect to the emulators directly.

---

## Troubleshooting

### Emulators fail to start
- Ensure Java is installed/available in PATH.
- Check if ports 8080, 9099, or 4000 are already in use.

### "Command not found: firebase"
- Install the CLI: `npm install -g firebase-tools`

### API cannot connect to Firestore
- Ensure `FIRESTORE_EMULATOR_HOST` is set in `.env`.
- Check server logs for `🔥 Using Firebase Emulator`.
