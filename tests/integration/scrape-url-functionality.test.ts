import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

describe('Scrape URL Functionality Integration', () => {
  let adminCookies: string = '';
  let adminEmail: string;

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
    // Login as existing admin user (swarkist@gmail.com)
    const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'swarkist@gmail.com', 
        password: 'swarkist' 
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${await loginResponse.text()}`);
    }

    // Extract cookies for subsequent requests
    adminCookies = loginResponse.headers.get('set-cookie') || '';
    console.log('✅ Admin user logged in for functionality tests');
  });

  it('should successfully scrape example.com and return structured data', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com' })
    }, adminCookies);

    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('canonicalUrl');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('text');
    expect(data).toHaveProperty('jsonLdRaw');
    
    // Verify data types and content
    expect(typeof data.canonicalUrl).toBe('string');
    expect(typeof data.title).toBe('string');
    expect(typeof data.text).toBe('string');
    expect(Array.isArray(data.jsonLdRaw)).toBe(true);
    
    // Verify basic content extraction
    expect(data.title).toContain('Example');
    expect(data.text.length).toBeGreaterThan(10);
    expect(data.canonicalUrl).toMatch(/^https?:\/\//);
  });

  it('should handle unsupported content types with 415', async () => {
    // Test with a PDF URL that should return unsupported content type
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' })
    }, adminCookies);

    // Might be 415 for unsupported content type or 424 if blocked
    expect([415, 424].includes(response.status)).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(false);
    expect(data).toHaveProperty('code');
    expect(['unsupported_content_type', 'fetch_failed'].includes(data.code)).toBe(true);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('hint');
  });

  it('should handle non-existent domains with appropriate error', async () => {
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://this-domain-should-not-exist-12345.com' })
    }, adminCookies);

    expect([408, 424].includes(response.status)).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(false);
    expect(data).toHaveProperty('code');
    expect(['timeout', 'fetch_failed', 'blocked_by_origin'].includes(data.code)).toBe(true);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('hint');
  });

  it('should implement caching for identical URLs', async () => {
    const url = `https://example.com?cache-test=${Date.now()}`;
    
    // First request
    const start1 = Date.now();
    const response1 = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    }, adminCookies);
    const duration1 = Date.now() - start1;

    expect(response1.status).toBe(200);
    const data1 = await response1.json();

    // Second request (should be cached and faster)
    const start2 = Date.now();
    const response2 = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url })
    }, adminCookies);
    const duration2 = Date.now() - start2;

    expect(response2.status).toBe(200);
    const data2 = await response2.json();

    // Verify same data returned
    expect(data2).toEqual(data1);
    
    // Cache should make second request faster (with some tolerance)
    expect(duration2).toBeLessThan(duration1 * 0.8);
    
    console.log(`Cache performance: First request ${duration1}ms, Second request ${duration2}ms`);
  });

  it('should extract OpenGraph data when available', async () => {
    // Test with a URL that likely has OpenGraph tags
    const response = await authRequest('/api/scrape-url', {
      method: 'POST',
      body: JSON.stringify({ url: 'https://github.com' })
    }, adminCookies);

    // GitHub might block automated requests, so handle both success and failure
    if (response.status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('ok');
      expect(data.ok).toBe(true);
      
      // If OpenGraph data exists, verify structure
      if (data.og) {
        expect(typeof data.og).toBe('object');
        if (data.og.title) expect(typeof data.og.title).toBe('string');
        if (data.og.image) expect(typeof data.og.image).toBe('string');
      }
    } else {
      // Blocked request - verify error structure
      const data = await response.json();
      expect(data).toHaveProperty('ok');
      expect(data.ok).toBe(false);
      expect(data).toHaveProperty('code');
    }
  });
});