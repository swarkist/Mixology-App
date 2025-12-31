# Local Development Guide (Non-Replit)

This guide explains how to run the Miximixology API server locally outside of Replit for native mobile app development.

---

## 1. Installation & Running

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Install Dependencies

```bash
git clone <your-repo-url>
cd miximixology

npm install
```

### Start the Server

```bash
npm run dev
```

### Default Port

The server runs on **port 5000** by default.

- Local access: `http://localhost:5000`
- LAN access (for mobile devices): `http://192.168.50.2:5000`

To access from a physical device on the same Wi-Fi network, use your machine's local IP address.

---

## 2. Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# ===========================================
# FIREBASE CONFIGURATION (Required)
# ===========================================
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# ===========================================
# AUTHENTICATION (Required)
# ===========================================
JWT_SECRET=your-jwt-secret-min-32-chars
REFRESH_SECRET=your-refresh-secret-min-32-chars
SESSION_SECRET=your-session-secret

# ===========================================
# CORS CONFIGURATION (Required for Mobile)
# ===========================================
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:8081,http://192.168.50.2:5000,exp://192.168.50.2:8081

# ===========================================
# OPTIONAL SERVICES
# ===========================================
# OpenRouter API for AI features (recipe parsing, chat)
OPENROUTER_API_KEY=your-openrouter-api-key

# Admin API key for bulk operations
ADMIN_API_KEY=your-admin-api-key

# Email service for password reset
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com

# ===========================================
# ENVIRONMENT
# ===========================================
NODE_ENV=development
PORT=5000
```

> **IMPORTANT:** Never commit real secrets to version control. Use `.env.example` with placeholder values.

---

## 3. Firebase Connection

### SDK Used

The API uses the **Firebase Admin SDK** (server-side) to connect to Firestore. This provides full read/write access without client-side authentication rules.

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID (e.g., `miximixology-dev`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON content of your service account key file |

### Getting Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Copy the entire JSON content into `FIREBASE_SERVICE_ACCOUNT_JSON`

### Connection Code Reference

The Firebase connection is initialized in `server/storage/firebase.ts`:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore();
```

---

## 4. CORS Configuration for Expo/React Native

### Default Allowed Origins

The server allows these origins by default:

- `https://www.miximixology.com` (production)
- `https://miximixology.com` (production)
- `http://localhost:5173` (Vite dev)
- `http://localhost:5000` (API dev)

### Adding Mobile App Origins

For Expo/React Native development, add your origins to `CORS_ORIGINS`:

```env
CORS_ORIGINS=http://localhost:8081,http://192.168.50.2:5000,exp://192.168.50.2:8081,http://192.168.50.2:8081
```

**Common Expo Origins:**
- `exp://192.168.50.2:8081` - Expo Go app
- `http://192.168.50.2:8081` - Expo dev client
- `http://localhost:8081` - Expo web

### CORS Behavior

- Requests without an `Origin` header (curl, Postman) are always allowed
- Credentials (cookies) are supported with `credentials: true`
- Preflight requests (OPTIONS) are handled automatically

### Troubleshooting CORS

If you see CORS errors:

1. Check that your device's request includes the correct `Origin` header
2. Verify the origin is in `CORS_ORIGINS` environment variable
3. Restart the server after changing environment variables
4. For Expo, ensure you're using the correct IP address

---

## 5. Health Check Endpoint

### GET /api/health

Returns server status information.

**Request:**
```bash
curl http://192.168.50.2:5000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "env": "development",
  "version": "1.0.0",
  "timestamp": "2025-12-30T22:00:00.000Z"
}
```

**Fields:**
| Field | Description |
|-------|-------------|
| `status` | Server health status (`ok`) |
| `env` | Current environment (`development`, `production`) |
| `version` | Package version from package.json |
| `timestamp` | Current server time (ISO 8601) |

---

## 6. Example curl Commands

Replace `192.168.50.2` with your machine's local IP address.

### Health Check

```bash
curl http://192.168.50.2:5000/api/health
```

### List All Cocktails

```bash
curl http://192.168.50.2:5000/api/cocktails
```

### Get Featured Cocktails

```bash
curl http://192.168.50.2:5000/api/cocktails?featured=true
```

### Get Popular Cocktails

```bash
curl http://192.168.50.2:5000/api/cocktails?popular=true
```

### Get Cocktail Details (with ingredients, instructions, tags)

```bash
curl http://192.168.50.2:5000/api/cocktails/1754355116391
```

### Search Cocktails

```bash
curl "http://192.168.50.2:5000/api/cocktails?search=margarita"
```

### List All Ingredients

```bash
curl http://192.168.50.2:5000/api/ingredients
```

### Get Ingredient Details

```bash
curl http://192.168.50.2:5000/api/ingredients/1754352312497
```

### Register a New User

```bash
curl -X POST http://192.168.50.2:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://192.168.50.2:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Current User (Authenticated)

```bash
curl http://192.168.50.2:5000/api/auth/me \
  -b cookies.txt
```

---

## 7. Mobile App Integration Notes

### Authentication Flow

The API uses HTTP-only cookies for authentication. For React Native:

1. **Use a cookie-aware HTTP client** (e.g., `fetch` with `credentials: 'include'`)
2. **Store cookies automatically** - The native networking layer handles cookie storage
3. **Include credentials in all requests**:

```javascript
fetch('http://192.168.50.2:5000/api/auth/me', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Image Handling

Images may be returned as:
- HTTP URLs (external images)
- Base64 data URIs (`data:image/png;base64,...`)
- `null` (no image)

For React Native, handle both formats:

```javascript
const imageSource = imageUrl 
  ? imageUrl.startsWith('data:') 
    ? { uri: imageUrl }
    : { uri: imageUrl }
  : require('./placeholder.png');
```

### Rate Limiting

The API has rate limiting enabled:
- 300 requests per 15-minute window per IP
- Auth endpoints: 5 requests per minute
- Password reset: 3 requests per hour

---

## 8. Troubleshooting

### "Firebase quota exceeded" Error

This occurs when the Firestore daily read quota is exhausted. Solutions:
1. Wait for the quota to reset (daily)
2. Upgrade to a paid Firebase plan
3. Use a separate development Firebase project

### "CORS blocked" Error

1. Add your origin to `CORS_ORIGINS` in `.env`
2. Restart the server
3. Verify the origin header matches exactly

### Connection Refused

1. Check the server is running (`npm run dev`)
2. Verify you're using the correct IP address
3. Ensure port 5000 is not blocked by firewall
4. On macOS, check System Preferences → Security → Firewall

### Cannot Connect from Physical Device

1. Ensure both device and computer are on the same Wi-Fi network
2. Find your computer's local IP: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)
3. Try pinging the IP from the device
4. Temporarily disable firewall to test

---

## 9. Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| HTTPS | Not required | Required |
| CORS | Liberal | Strict allowlist |
| Rate Limiting | Enabled | Enabled |
| Error Details | Verbose | Minimal |
| CSP | Relaxed | Strict |

---

*Last updated: December 30, 2025*
