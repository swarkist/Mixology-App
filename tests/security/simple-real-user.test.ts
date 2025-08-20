import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Simple Real User Data Isolation Test', () => {
  let userOneCookies = '';
  let userTwoCookies = '';
  let userOneBrandId: number;
  let userTwoBrandId: number;

  const userOne = { email: 'isolation.user1@test.com', password: 'TestPass123!' };
  const userTwo = { email: 'isolation.user2@test.com', password: 'TestPass123!' };

  // Helper function for API requests
  async function apiCall(endpoint: string, method = 'GET', body?: any, cookies = ''): Promise<any> {
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (cookies) {
      headers['Cookie'] = cookies;
      // Test request with authentication
    } else {
      // Test request without authentication
    }

    if (method === 'POST' || method === 'PATCH') {
      headers['x-admin-key'] = 'dev-admin-key-2024';
    }

    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    return { status: response.status, data: parsedData, response };
  }

  beforeAll(async () => {
    console.log('🔧 Setting up two users for isolation testing...');
    
    // Clean up any existing brands for test users first
    try {
      await apiCall('/auth/login', 'POST', userOne);
      const existingBrands = await apiCall('/preferred-brands', 'GET', null, userOneCookies);
      if (existingBrands.data && Array.isArray(existingBrands.data)) {
        for (const brand of existingBrands.data) {
          await apiCall(`/preferred-brands/${brand.id}`, 'DELETE', null, userOneCookies);
        }
      }
    } catch (e) {
      // User might not exist yet - ignore cleanup errors
    }
    
    // Register and login user one
    await apiCall('/auth/register', 'POST', userOne);
    const loginOne = await apiCall('/auth/login', 'POST', userOne);
    
    // Register and login user two  
    await apiCall('/auth/register', 'POST', userTwo);
    const loginTwo = await apiCall('/auth/login', 'POST', userTwo);
    
    // Debug cookie extraction
    console.log('Login one headers:', loginOne.response.headers);
    console.log('Login two headers:', loginTwo.response.headers);
    
    // Extract all Set-Cookie headers
    const extractAllCookies = (response: any) => {
      const cookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      if (cookieHeaders.length === 0) {
        // Fallback - try getting single set-cookie header
        const singleHeader = response.headers.get('set-cookie');
        if (singleHeader) return [singleHeader];
      }
      return cookieHeaders;
    };
    
    const userOneCookieHeaders = extractAllCookies(loginOne.response);
    const userTwoCookieHeaders = extractAllCookies(loginTwo.response);
    
    console.log('User one cookies:', userOneCookieHeaders);
    console.log('User two cookies:', userTwoCookieHeaders);
    
    userOneCookies = userOneCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    userTwoCookies = userTwoCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    
    console.log('Final user one cookies:', userOneCookies);
    console.log('Final user two cookies:', userTwoCookies);
    
    console.log('✅ Both users created and authenticated');
  });

  it('should allow each user to create their own preferred brands', async () => {
    // User one creates a brand
    const brandOneResult = await apiCall('/preferred-brands', 'POST', {
      name: 'User One Brand',
      proof: 40
    }, userOneCookies);

    expect(brandOneResult.status).toBe(201);
    expect(brandOneResult.data.name).toBe('User One Brand');
    userOneBrandId = brandOneResult.data.id;

    // User two creates a brand
    const brandTwoResult = await apiCall('/preferred-brands', 'POST', {
      name: 'User Two Brand', 
      proof: 50
    }, userTwoCookies);

    expect(brandTwoResult.status).toBe(201);
    expect(brandTwoResult.data.name).toBe('User Two Brand');
    userTwoBrandId = brandTwoResult.data.id;

    console.log('✅ Both users created their own brands successfully');
  });

  it('should show data isolation between users', async () => {
    // User one gets their brands
    const userOneBrands = await apiCall('/preferred-brands', 'GET', null, userOneCookies);
    
    expect(userOneBrands.status).toBe(200);
    expect(Array.isArray(userOneBrands.data)).toBe(true);
    expect(userOneBrands.data).toHaveLength(1);
    expect(userOneBrands.data[0].name).toBe('User One Brand');
    expect(userOneBrands.data[0].user_id).toBeDefined();

    // User two gets their brands
    const userTwoBrands = await apiCall('/preferred-brands', 'GET', null, userTwoCookies);
    
    expect(userTwoBrands.status).toBe(200);
    expect(Array.isArray(userTwoBrands.data)).toBe(true);
    expect(userTwoBrands.data).toHaveLength(1);
    expect(userTwoBrands.data[0].name).toBe('User Two Brand');
    expect(userTwoBrands.data[0].user_id).toBeDefined();

    // Verify users cannot see each other's brands
    expect(userOneBrands.data.some((b: any) => b.name === 'User Two Brand')).toBe(false);
    expect(userTwoBrands.data.some((b: any) => b.name === 'User One Brand')).toBe(false);

    console.log('✅ Data isolation verified - users can only see their own brands');
  });

  it('should prevent unauthenticated access', async () => {
    const unauthorizedAccess = await apiCall('/preferred-brands', 'GET');
    
    expect(unauthorizedAccess.status).toBe(401);
    expect(unauthorizedAccess.data.error || unauthorizedAccess.data.message).toContain('Authentication required');
    
    console.log('✅ Unauthorized access properly blocked');
  });
});