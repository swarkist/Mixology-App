// Environment configuration for Miximixology
// This file documents the environment variables needed for different environments

export interface EnvironmentConfig {
  isProduction: boolean;
  environment: 'development' | 'production';
  firebaseServiceAccountKey: string;
  appName: string;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';
  
  return {
    isProduction,
    environment: isProduction ? 'production' : 'development',
    firebaseServiceAccountKey: isProduction ? 'FIREBASE_SERVICE_ACCOUNT_JSON_PROD' : 'FIREBASE_SERVICE_ACCOUNT_JSON',
    appName: isProduction ? 'miximixology-prod' : 'miximixology-dev'
  };
}

/*
REQUIRED ENVIRONMENT VARIABLES:

Development Environment:
- FIREBASE_SERVICE_ACCOUNT_JSON: Current dev Firebase service account JSON
- NODE_ENV: 'development' (or omit for default)

Production Environment:
- FIREBASE_SERVICE_ACCOUNT_JSON_PROD: Production Firebase service account JSON
- NODE_ENV: 'production' OR ENVIRONMENT: 'production'

Additional Production Variables:
- OPENROUTER_API_KEY: AI integration
- SITE_NAME: Application name
- SITE_URL: Production domain
*/