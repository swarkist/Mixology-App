# How to Run the Backend Locally

This guide explains how to run the Mixology backend API on your local machine and access it from mobile devices on the same WiFi.

## Prerequisites
- **Node.js** (v20+ recommended)
- **npm** (usually comes with Node.js)
- **Firebase Service Account JSON** (Development credentials)

## 1. Environment Setup

1.  **Create .env file**
    Copy the example file to a new file named `.env`:
    ```bash
    cp .env.example .env
    ```

2.  **Configure Secrets**
    Open `.env` and fill in the required values:
    - `FIREBASE_SERVICE_ACCOUNT_JSON`: Paste the entire minified JSON string of your Firebase Admin SDK service account.
    - `JWT_SECRET`: Set to a random string (e.g., "local-dev-secret").
    - `REFRESH_SECRET`: Set to a random string.
    - `ADMIN_API_KEY`: Set to a random string (e.g., "local-admin").

3.  **Verify CORS & Network**
    Ensure `CORS_ORIGINS` in `.env` includes your LAN IP if it's different from `192.168.50.2`.
    The default listener is configured to bind to `0.0.0.0` (all interfaces) on port `5000`.

## 2. Installation

Install project dependencies:
```bash
npm install
```

## 3. Running the Server

Start the development server with hot-reload:
```bash
npm run dev
```

The server should output:
```
serving on port 5000
```

## 4. Accessing from Mobile (Expo/LAN)

From your phone (connected to the same WiFi `192.168.50.x`):
- **API Health Check**: `http://192.168.50.2:5000/api/health`
- **Frontend (if handled by server)**: `http://192.168.50.2:5000`

If the connection fails:
1.  **Check Firewall**: Ensure your laptop's firewall allows incoming connections on port `5000`.
2.  **Check IP**: Run `ipconfig` or `ifconfig` to verify your laptop's IP is indeed `192.168.50.2`.

## 5. Deployment / Migration Notes

### Changes from Replit
- The server now explicitly binds to `0.0.0.0` to ensure visibility on LAN (Replit usually handles this via proxy).
- `PORT` defaults to `5000` but respects the `PORT` env var.
- CORS has been updated to explicitly allow `http://192.168.50.2:*`.

### Common Issues
- **Firebase Auth Error**: Ensure the `FIREBASE_SERVICE_ACCOUNT_JSON` is exactly right. If it contains newlines, ensure they are properly escaped or that the environment loader handles it (dotenv usually supports multiline if quoted).
- **"Command not found: npm"**: Ensure Node.js is installed and in your PATH.
