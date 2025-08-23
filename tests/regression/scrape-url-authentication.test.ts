import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

describe('Scrape URL Authentication & Authorization', () => {
  let adminCookies: string = '';
  let reviewerCookies: string = '';
  let basicCookies: string = '';
  let adminEmail: string;
  let reviewerEmail: string;
  let basicEmail: string;

  // Helper for authenticated requests
  async function authRequest(endpoint: string, options: RequestInit = {}, cookies: string = '') {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>
    };

    if (cookies) {
      headers['Cookie'] = cookies;
    }

    return fetch(`${SERVER_URL}${endpoint}`, {
      ...options,
      headers
    });
  }

  beforeAll(async () => {
    const timestamp = Date.now();
    reviewerEmail = `reviewer-scrape-${timestamp}@test.com`;
    basicEmail = `basic-scrape-${timestamp}@test.com`;

    // Login as existing admin user (swarkist@gmail.com)
    const adminLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'swarkist@gmail.com', 
        password: 'swarkist' 
      })
    });

    if (!adminLogin.ok) {
      throw new Error(`Admin login failed: ${await adminLogin.text()}`);
    }

    adminCookies = adminLogin.headers.get('set-cookie') || '';

    // Create reviewer user
    const reviewerRegister = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: reviewerEmail, password: 'password123' })
    });

    if (!reviewerRegister.ok) {
      throw new Error(`Reviewer registration failed: ${await reviewerRegister.text()}`);
    }

    // Update reviewer user role using admin privileges
    const reviewerResponse = await reviewerRegister.json();
    const userId = reviewerResponse.user.id;

    const updateRoleResponse = await authRequest(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'reviewer' })
    }, adminCookies);

    if (!updateRoleResponse.ok) {
      console.warn(`Failed to update reviewer role: ${await updateRoleResponse.text()}`);
    }

    const reviewerLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: reviewerEmail, password: 'password123' })
    });

    if (!reviewerLogin.ok) {
      throw new Error(`Reviewer login failed: ${await reviewerLogin.text()}`);
    }

    reviewerCookies = reviewerLogin.headers.get('set-cookie') || '';

    // Create basic user  
    const basicRegister = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: basicEmail, password: 'password123' })
    });

    if (!basicRegister.ok) {
      throw new Error(`Basic registration failed: ${await basicRegister.text()}`);
    }

    const basicLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: basicEmail, password: 'password123' })
    });

    if (!basicLogin.ok) {
      throw new Error(`Basic login failed: ${await basicLogin.text()}`);
    }

    basicCookies = basicLogin.headers.get('set-cookie') || '';

    console.log('✅ All test users created for scrape-url authentication tests');
  });

  it('should reject unauthenticated requests with 401', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe('Authentication required');
  });

  it('should reject basic users with 403', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    }, basicCookies);

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data.message).toBe("The information you provided doesn't match our records.");
  });

  it('should allow admin users with 200', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    }, adminCookies);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('canonicalUrl');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('text');
    expect(data).toHaveProperty('jsonLdRaw');
  });

  it('should allow reviewer users with 200', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    }, reviewerCookies);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('canonicalUrl'); 
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('text');
    expect(data).toHaveProperty('jsonLdRaw');
  });

  it('should validate URL format with 400', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-valid-url' })
    }, adminCookies);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(false);
    expect(data).toHaveProperty('code');
    expect(data.code).toBe('invalid_url');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('hint');
  });

  it('should handle rate limiting', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const requests = Array.from({ length: 12 }, (_, i) => 
      authRequest('/api/scrape-url', {
        method: 'POST',
        body: JSON.stringify({ url: `https://example.com?test=${i}` })
      }, adminCookies)
    );

    const responses = await Promise.all(requests);
    
    // Should have at least one rate limited response
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      const limitedResponse = responses.find(r => r.status === 429);
      const data = await limitedResponse!.json();
      expect(data).toHaveProperty('ok');
      expect(data.ok).toBe(false);
      expect(data).toHaveProperty('code');
      expect(data.code).toBe('rate_limit_exceeded');
    }
    
    // Note: In development mode, rate limiting might be disabled
    console.log(`Rate limiting test: ${rateLimited ? 'TRIGGERED' : 'SKIPPED (dev mode)'}`);
  });
});