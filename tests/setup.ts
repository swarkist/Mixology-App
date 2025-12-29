import { vi, beforeEach, afterEach } from 'vitest';
import * as React from 'react';
import '@testing-library/jest-dom';

// Make React available globally for JSX in jsdom environment
(globalThis as any).React = React;

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-secret-key-for-testing';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'test-key-id',
  private_key: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: 'test-client-id',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token'
});

// Setup and cleanup
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Mock window.location for frontend tests
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      hostname: 'localhost',
      port: '3000',
      protocol: 'http:',
      origin: 'http://localhost:3000',
    },
    writable: true,
  });
}

// Mock Web APIs for frontend tests
if (typeof global !== 'undefined') {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Enable React 18 act() environment
  (global as any).IS_REACT_ACT_ENVIRONMENT = true;

  // Mock scrollIntoView for jsdom
  Element.prototype.scrollIntoView = vi.fn();
}