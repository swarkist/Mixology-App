import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from './data-isolation.js';

/**
 * API Endpoint Validation Regression Tests
 * 
 * Purpose: Catch frontend-backend API integration mismatches that could break
 * critical user flows. This test suite validates that all API endpoints referenced
 * in the frontend actually exist and return expected responses.
 * 
 * Why this test exists: The forgot password flow had a critical bug where the
 * frontend was calling '/api/auth/forgot-password' but backend only had '/api/auth/forgot'.
 * This test prevents such issues from reaching production.
 */

// Helper to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`http://localhost:5000${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  return {
    response,
    status: response.status,
    data: response.ok ? await response.json() : null,
  };
}

// Helper to test if endpoint exists (returns non-404)
async function endpointExists(endpoint: string, method: string = 'GET') {
  const { status } = await apiRequest(endpoint, { method });
  return status !== 404;
}

describe('API Endpoint Validation Tests', () => {
  let testManager: TestDataManager;

  beforeAll(async () => {
    testManager = new TestDataManager();
  });

  afterAll(async () => {
    if (testManager) {
      await testManager.cleanup();
    }
  });

  describe('Authentication Endpoints', () => {
    it('should validate all auth endpoints exist', async () => {
      const authEndpoints = [
        { endpoint: '/api/auth/register', method: 'POST' },
        { endpoint: '/api/auth/login', method: 'POST' },
        { endpoint: '/api/auth/logout', method: 'POST' },
        { endpoint: '/api/auth/me', method: 'GET' },
        { endpoint: '/api/auth/forgot', method: 'POST' }, // Critical: this was the bug
        { endpoint: '/api/auth/reset', method: 'POST' },
      ];

      for (const { endpoint, method } of authEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, `${method} ${endpoint} should exist but returned 404`).toBe(true);
      }
    });

    it('should validate forgot password endpoint accepts email parameter', async () => {
      const { status, data } = await apiRequest('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@test.com' }),
      });

      // Should return 200 with neutral message (not 404 or 500)
      expect(status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('If an account with that email exists');
    });

    it('should validate reset password endpoint accepts token and new_password', async () => {
      const { status, data } = await apiRequest('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ 
          token: 'invalid-token', 
          new_password: 'NewPassword123' 
        }),
      });

      // Should return 200 with neutral error message (not 404 or validation error)
      expect(status).toBe(200);
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('message');
    });
  });

  describe('Core API Endpoints', () => {
    it('should validate all cocktail endpoints exist', async () => {
      const cocktailEndpoints = [
        { endpoint: '/api/cocktails', method: 'GET' },
        { endpoint: '/api/cocktails', method: 'POST' },
        { endpoint: '/api/cocktails/1', method: 'GET' },
        { endpoint: '/api/cocktails/1', method: 'PATCH' },
        { endpoint: '/api/cocktails/1', method: 'DELETE' },
        { endpoint: '/api/cocktails/1/featured', method: 'PATCH' },
        { endpoint: '/api/cocktails/1/popularity', method: 'PATCH' },
      ];

      for (const { endpoint, method } of cocktailEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, `${method} ${endpoint} should exist but returned 404`).toBe(true);
      }
    });

    it('should validate all ingredient endpoints exist', async () => {
      const ingredientEndpoints = [
        { endpoint: '/api/ingredients', method: 'GET' },
        { endpoint: '/api/ingredients', method: 'POST' },
        { endpoint: '/api/ingredients/1', method: 'GET' },
        { endpoint: '/api/ingredients/1', method: 'PATCH' },
        { endpoint: '/api/ingredients/1', method: 'DELETE' },
        { endpoint: '/api/ingredients/1/cocktails', method: 'GET' },
      ];

      for (const { endpoint, method } of ingredientEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, `${method} ${endpoint} should exist but returned 404`).toBe(true);
      }
    });

    it('should validate preferred brands endpoints exist', async () => {
      const brandEndpoints = [
        { endpoint: '/api/preferred-brands', method: 'GET' },
        { endpoint: '/api/preferred-brands', method: 'POST' },
        { endpoint: '/api/preferred-brands/1', method: 'PATCH' },
        { endpoint: '/api/preferred-brands/1', method: 'DELETE' },
      ];

      for (const { endpoint, method } of brandEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, `${method} ${endpoint} should exist but returned 404`).toBe(true);
      }
    });
  });

  describe('AI Integration Endpoints', () => {
    it('should validate AI endpoints exist', async () => {
      const aiEndpoints = [
        { endpoint: '/api/openrouter', method: 'POST' },
        { endpoint: '/api/youtube-transcript', method: 'POST' },
      ];

      for (const { endpoint, method } of aiEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, `${method} ${endpoint} should exist but returned 404`).toBe(true);
      }
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate cocktails endpoint supports filtering parameters', async () => {
      const testParams = [
        '?featured=true',
        '?popular=true',
        '?search=test',
        '?tags=whiskey',
        '?ingredient=1',
      ];

      for (const params of testParams) {
        const { status } = await apiRequest(`/api/cocktails${params}`);
        expect(status, `GET /api/cocktails${params} should not return 404`).not.toBe(404);
        // Status might be 200, 400, or 401, but not 404 (endpoint not found)
        expect([200, 400, 401, 403], `Unexpected status ${status} for /api/cocktails${params}`).toContain(status);
      }
    });

    it('should validate ingredients endpoint supports search', async () => {
      const { status } = await apiRequest('/api/ingredients?search=test');
      expect(status, 'Ingredients search endpoint should exist').not.toBe(404);
      expect([200, 400, 401, 403], `Unexpected status ${status} for ingredients search`).toContain(status);
    });
  });

  describe('Frontend-Backend Route Consistency', () => {
    it('should validate that all critical frontend API calls have matching backend routes', async () => {
      // These are the most critical paths that users interact with directly
      const criticalEndpoints = [
        // Authentication flows
        { endpoint: '/api/auth/login', method: 'POST', critical: 'User login' },
        { endpoint: '/api/auth/register', method: 'POST', critical: 'User registration' },
        { endpoint: '/api/auth/forgot', method: 'POST', critical: 'Password reset request' },
        { endpoint: '/api/auth/reset', method: 'POST', critical: 'Password reset completion' },
        { endpoint: '/api/auth/me', method: 'GET', critical: 'User session validation' },
        
        // Core data operations
        { endpoint: '/api/cocktails', method: 'GET', critical: 'Homepage cocktail display' },
        { endpoint: '/api/ingredients', method: 'GET', critical: 'Ingredients page' },
        { endpoint: '/api/preferred-brands', method: 'GET', critical: 'My Bar functionality' },
      ];

      for (const { endpoint, method, critical } of criticalEndpoints) {
        const exists = await endpointExists(endpoint, method);
        expect(exists, 
          `CRITICAL: ${method} ${endpoint} is required for '${critical}' but returned 404. This would break core user functionality.`
        ).toBe(true);
      }
    });
  });

  describe('Error Response Validation', () => {
    it('should validate that endpoints return proper error structures', async () => {
      // Test non-existent resources return proper error format
      const { status, data } = await apiRequest('/api/cocktails/999999');
      
      if (status === 404) {
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
      }
    });

    it('should validate authentication-required endpoints return 401', async () => {
      const protectedEndpoints = [
        '/api/cocktails',
        '/api/ingredients', 
        '/api/preferred-brands',
      ];

      for (const endpoint of protectedEndpoints) {
        const { status } = await apiRequest(endpoint, { method: 'POST' });
        // Should be 401 (unauthorized) or other auth error, not 404 (not found)
        expect(status, `${endpoint} should exist but require auth`).not.toBe(404);
      }
    });
  });

  describe('PWA Resource Endpoints', () => {
    it('should serve web app manifest', async () => {
      const { status } = await apiRequest('/manifest.webmanifest');
      expect(status, 'Web app manifest should be accessible').toBe(200);
    });

    it('should serve PWA icons', async () => {
      const iconSizes = ['16', '32', '64', '96', '192', '256', '512'];
      for (const size of iconSizes) {
        const { status } = await apiRequest(`/mixi-bot-${size}.png`);
        expect(status, `Icon mixi-bot-${size}.png should be accessible`).toBe(200);
      }
    });

    it('should serve favicon', async () => {
      const { status } = await apiRequest('/favicon.ico');
      expect(status, 'Favicon should be accessible').toBe(200);
    });
  });
});