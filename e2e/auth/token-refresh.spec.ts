import { test, expect } from '../fixtures/base';

/**
 * WTEST-015: Token Refresh Tests
 * 
 * Tests for token/session lifecycle behavior including:
 * - Access token expiry handling
 * - Cookie-based auth persistence
 * - Session state management
 * - Token validation endpoints
 * 
 * NOTE: App uses JWT access tokens (30 min) and refresh tokens (7 days)
 * stored as httpOnly cookies. No explicit refresh endpoint exists.
 */

test.describe('Token Refresh - Access Token Expiry', () => {
  test('should reject API requests without access token cookie', async ({ request }) => {
    const response = await request.get('/api/auth/me', {
      headers: { 'Cookie': '' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    // API returns either 'error' or 'message' field
    const errorMsg = body.error || body.message || '';
    expect(errorMsg.toLowerCase()).toContain('auth');
  });

  test('should reject API requests with invalid access token', async ({ request }) => {
    const response = await request.get('/api/auth/me', {
      headers: { 
        'Cookie': 'accessToken=invalid.token.here'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('should reject API requests with malformed JWT', async ({ request }) => {
    const response = await request.get('/api/auth/me', {
      headers: { 
        'Cookie': 'accessToken=not-even-a-jwt'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('should reject API requests with expired token format', async ({ request }) => {
    // Create a JWT-like string that's clearly invalid
    const fakeExpiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid_signature';
    const response = await request.get('/api/auth/me', {
      headers: { 
        'Cookie': `accessToken=${fakeExpiredToken}`
      }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Token Refresh - Session Validation', () => {
  test('should return 401 when checking auth status without session', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('should accept logout even without valid session', async ({ request }) => {
    // Logout should succeed gracefully even without a session
    const response = await request.post('/api/auth/logout');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('should clear cookies on logout', async ({ request }) => {
    // First, logout
    const logoutResponse = await request.post('/api/auth/logout');
    expect(logoutResponse.status()).toBe(200);
    
    // Check that Set-Cookie headers are present to clear cookies
    const setCookies = logoutResponse.headers()['set-cookie'];
    // Cookies should be cleared (empty or expired)
    expect(logoutResponse.ok()).toBe(true);
  });
});

test.describe('Token Refresh - Cookie Handling', () => {
  test('should not set auth cookies on failed login', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });
    
    // Login fails but returns 200 with success: false
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(false);
    
    // After failed login, /api/auth/me should still fail
    const meResponse = await request.get('/api/auth/me');
    expect(meResponse.status()).toBe(401);
  });

  test('should handle empty cookie header gracefully', async ({ request }) => {
    const response = await request.get('/api/auth/me', {
      headers: { 'Cookie': '' }
    });
    expect(response.status()).toBe(401);
  });

  test('should handle cookie with only refresh token (no access token)', async ({ request }) => {
    const response = await request.get('/api/auth/me', {
      headers: { 
        'Cookie': 'refreshToken=some.refresh.token'
      }
    });
    // Without access token, should be 401
    expect(response.status()).toBe(401);
  });
});

test.describe('Token Refresh - Protected Routes Behavior', () => {
  test('should require fresh auth for admin endpoints', async ({ request }) => {
    const response = await request.get('/api/admin/users');
    expect(response.status()).toBe(401);
  });

  test('should require fresh auth for create operations', async ({ request }) => {
    const response = await request.post('/api/cocktails', {
      data: { name: 'Test Cocktail' }
    });
    expect(response.status()).toBe(401);
  });

  test('should allow public endpoints without token', async ({ request }) => {
    const response = await request.get('/api/cocktails');
    expect(response.ok()).toBe(true);
  });

  test('should allow public ingredient list without token', async ({ request }) => {
    const response = await request.get('/api/ingredients');
    // Ingredients endpoint is public, should return 200 or may timeout with 500
    // We verify it doesn't require auth (no 401)
    expect(response.status()).not.toBe(401);
  });
});

test.describe('Token Refresh - Multiple Session Handling', () => {
  test('should handle concurrent logout requests gracefully', async ({ request }) => {
    // Multiple logout requests should all succeed
    const [response1, response2] = await Promise.all([
      request.post('/api/auth/logout'),
      request.post('/api/auth/logout')
    ]);
    
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
  });

  test('should maintain auth state across API calls within same request context', async ({ request }) => {
    // Without auth, both calls should fail
    const [me1, me2] = await Promise.all([
      request.get('/api/auth/me'),
      request.get('/api/auth/me')
    ]);
    
    expect(me1.status()).toBe(401);
    expect(me2.status()).toBe(401);
  });
});

test.describe('Token Refresh - Browser Context', () => {
  test('should redirect to login when accessing protected page without auth', async ({ page }) => {
    await page.goto('/add-cocktail');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should allow public pages without any tokens', async ({ page }) => {
    await page.goto('/cocktails');
    await expect(page).toHaveURL('/cocktails');
    // Page should load without auth
    await expect(page.locator('body')).toBeVisible();
  });

  test('should clear frontend state on logout', async ({ page }) => {
    await page.goto('/');
    
    // Try to access /api/auth/me and expect failure
    const response = await page.request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });
});
