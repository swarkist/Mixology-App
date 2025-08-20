import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDataManager } from '../regression/data-isolation.js';

// API request helper function
async function apiRequest(endpoint: string, options: RequestInit = {}, cookies?: string): Promise<any> {
  const response = await fetch(`http://localhost:5000/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies || '',
      ...options.headers,
    },
    ...options,
  });

  // For testing, we need to check both success and failure cases
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return {
    status: response.status,
    data,
    headers: response.headers
  };
}

describe('Real User Data Isolation Tests', () => {
  let testManager: TestDataManager;
  let basicUserCookies: string;
  let reviewerUserCookies: string;
  let adminUserCookies: string;
  
  // Test user credentials for each role
  const testUsers = {
    basic: { email: 'basic.user@test.com', password: 'TestPass123!' },
    reviewer: { email: 'reviewer.user@test.com', password: 'TestPass123!' },
    admin: { email: 'admin.user@test.com', password: 'TestPass123!' }
  };

  beforeAll(async () => {
    testManager = new TestDataManager();
    await testManager.init();
    
    // Register and authenticate users for each role
    console.log('🔧 Setting up real test users for isolation testing...');
    
    // Register basic user
    const basicRegister = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUsers.basic)
    });
    
    // Register reviewer user  
    const reviewerRegister = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUsers.reviewer)
    });
    
    // Register admin user
    const adminRegister = await apiRequest('/auth/register', {
      method: 'POST', 
      body: JSON.stringify(testUsers.admin)
    });
    
    // Login and get cookies for each user
    const basicLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(testUsers.basic)
    });
    
    const reviewerLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(testUsers.reviewer)
    });
    
    const adminLogin = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(testUsers.admin)
    });
    
    // Extract cookies from Set-Cookie headers
    basicUserCookies = extractCookies(basicLogin.headers);
    reviewerUserCookies = extractCookies(reviewerLogin.headers);
    adminUserCookies = extractCookies(adminLogin.headers);
    
    console.log('✅ All test users created and authenticated');
  });

function extractCookies(headers: Headers): string {
  const cookieHeader = headers.get('set-cookie');
  if (!cookieHeader) return '';
  
  // Handle multiple cookies in a single header
  const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

  afterAll(async () => {
    console.log('🧹 Cleaning up test users...');
    await testManager.cleanupAllTestData();
  });

  describe('Preferred Brands Isolation', () => {
    let basicUserBrandId: number;
    let reviewerUserBrandId: number;
    let adminUserBrandId: number;

    it('should allow each user to create their own preferred brands', async () => {
      // Basic user creates a preferred brand
      const basicBrandResponse = await apiRequest('/preferred-brands', {
        method: 'POST',
        headers: { 'x-admin-key': process.env.ADMIN_KEY || 'dev-admin-key-2024' },
        body: JSON.stringify({
          name: 'Basic User Brand',
          proof: 40
        })
      }, basicUserCookies);
      
      expect(basicBrandResponse.status).toBe(201);
      basicUserBrandId = basicBrandResponse.data.id;
      
      // Reviewer creates a preferred brand
      const reviewerBrandResponse = await apiRequest('/preferred-brands', {
        method: 'POST',
        headers: { 'x-admin-key': process.env.ADMIN_KEY || 'dev-admin-key-2024' },
        body: JSON.stringify({
          name: 'Reviewer User Brand', 
          proof: 50
        })
      }, reviewerUserCookies);
        
      expect(reviewerBrandResponse.status).toBe(201);
      reviewerUserBrandId = reviewerBrandResponse.data.id;
      
      // Admin creates a preferred brand
      const adminBrandResponse = await apiRequest('/preferred-brands', {
        method: 'POST',
        headers: { 'x-admin-key': process.env.ADMIN_KEY || 'dev-admin-key-2024' },
        body: JSON.stringify({
          name: 'Admin User Brand',
          proof: 60
        })
      }, adminUserCookies);
        
      expect(adminBrandResponse.status).toBe(201);
      adminUserBrandId = adminBrandResponse.data.id;
      
      console.log('✅ Each user successfully created their own preferred brand');
    });

    it('should isolate preferred brands data between users', async () => {
      // Basic user should only see their brand
      const basicBrandsResponse = await apiRequest('/preferred-brands', {}, basicUserCookies);
        
      expect(basicBrandsResponse.status).toBe(200);
      const basicBrands = basicBrandsResponse.data;
      expect(basicBrands).toHaveLength(1);
      expect(basicBrands[0].name).toBe('Basic User Brand');
      expect(basicBrands.some((b: any) => b.name === 'Reviewer User Brand')).toBe(false);
      expect(basicBrands.some((b: any) => b.name === 'Admin User Brand')).toBe(false);
      
      // Reviewer should only see their brand
      const reviewerBrandsResponse = await apiRequest('/preferred-brands', {}, reviewerUserCookies);
        
      expect(reviewerBrandsResponse.status).toBe(200);
      const reviewerBrands = reviewerBrandsResponse.data;
      expect(reviewerBrands).toHaveLength(1);
      expect(reviewerBrands[0].name).toBe('Reviewer User Brand');
      expect(reviewerBrands.some((b: any) => b.name === 'Basic User Brand')).toBe(false);
      expect(reviewerBrands.some((b: any) => b.name === 'Admin User Brand')).toBe(false);
      
      // Admin should only see their brand
      const adminBrandsResponse = await apiRequest('/preferred-brands', {}, adminUserCookies);
        
      expect(adminBrandsResponse.status).toBe(200);
      const adminBrands = adminBrandsResponse.data;
      expect(adminBrands).toHaveLength(1);
      expect(adminBrands[0].name).toBe('Admin User Brand');
      expect(adminBrands.some((b: any) => b.name === 'Basic User Brand')).toBe(false);
      expect(adminBrands.some((b: any) => b.name === 'Reviewer User Brand')).toBe(false);
      
      console.log('✅ Preferred brands data is properly isolated between users');
    });

    it('should prevent cross-user preferred brand access', async () => {
      // Basic user tries to access reviewer's brand
      const crossAccessResponse = await request(app)
        .get(`/api/preferred-brands/${reviewerUserBrandId}`)
        .set('Cookie', basicUserCookies);
        
      // Should either be 404 (brand not found for this user) or 403 (forbidden)
      expect([404, 403]).toContain(crossAccessResponse.status);
      
      // Reviewer tries to access admin's brand
      const reviewerCrossAccessResponse = await request(app)
        .get(`/api/preferred-brands/${adminUserBrandId}`)
        .set('Cookie', reviewerUserCookies);
        
      expect([404, 403]).toContain(reviewerCrossAccessResponse.status);
      
      console.log('✅ Cross-user preferred brand access is properly blocked');
    });
  });

  describe('My Bar Isolation', () => {
    let testIngredientId: number;

    beforeAll(async () => {
      // Create a test ingredient that all users can add to their My Bar
      const ingredientResponse = await request(app)
        .post('/api/ingredients')
        .set('Cookie', adminUserCookies)
        .set('x-admin-key', process.env.ADMIN_KEY || 'dev-admin-key-2024')
        .send({
          name: 'Test Isolation Ingredient',
          category: 'spirits',
          subCategory: 'vodka'
        });
        
      expect(ingredientResponse.status).toBe(201);
      testIngredientId = ingredientResponse.body.id;
    });

    it('should allow each user to manage their own My Bar independently', async () => {
      // Basic user adds ingredient to My Bar
      const basicAddResponse = await request(app)
        .post('/api/my-bar')
        .set('Cookie', basicUserCookies)
        .set('x-admin-key', process.env.ADMIN_KEY || 'dev-admin-key-2024')
        .send({
          type: 'ingredient',
          ref_id: testIngredientId
        });
        
      expect(basicAddResponse.status).toBe(201);
      
      // Reviewer does NOT add the ingredient to their My Bar
      // Admin adds the same ingredient to their My Bar
      const adminAddResponse = await request(app)
        .post('/api/my-bar')
        .set('Cookie', adminUserCookies)
        .set('x-admin-key', process.env.ADMIN_KEY || 'dev-admin-key-2024')
        .send({
          type: 'ingredient',
          ref_id: testIngredientId
        });
        
      expect(adminAddResponse.status).toBe(201);
      
      console.log('✅ Users can independently manage their My Bar items');
    });

    it('should isolate My Bar data between users', async () => {
      // Check Basic user's My Bar - should have the ingredient
      const basicMyBarResponse = await request(app)
        .get('/api/my-bar')
        .set('Cookie', basicUserCookies);
        
      expect(basicMyBarResponse.status).toBe(200);
      const basicMyBar = basicMyBarResponse.body;
      expect(basicMyBar.some((item: any) => item.ref_id === testIngredientId && item.type === 'ingredient')).toBe(true);
      
      // Check Reviewer's My Bar - should NOT have the ingredient
      const reviewerMyBarResponse = await request(app)
        .get('/api/my-bar')
        .set('Cookie', reviewerUserCookies);
        
      expect(reviewerMyBarResponse.status).toBe(200);
      const reviewerMyBar = reviewerMyBarResponse.body;
      expect(reviewerMyBar.some((item: any) => item.ref_id === testIngredientId && item.type === 'ingredient')).toBe(false);
      
      // Check Admin's My Bar - should have the ingredient
      const adminMyBarResponse = await request(app)
        .get('/api/my-bar')
        .set('Cookie', adminUserCookies);
        
      expect(adminMyBarResponse.status).toBe(200);
      const adminMyBar = adminMyBarResponse.body;
      expect(adminMyBar.some((item: any) => item.ref_id === testIngredientId && item.type === 'ingredient')).toBe(true);
      
      console.log('✅ My Bar data is properly isolated between users of different roles');
    });

    it('should show correct My Bar status in ingredients list for each user', async () => {
      // Check ingredients list for each user - My Bar status should be different
      const basicIngredientsResponse = await request(app)
        .get('/api/ingredients')
        .set('Cookie', basicUserCookies);
        
      expect(basicIngredientsResponse.status).toBe(200);
      const basicIngredients = basicIngredientsResponse.body;
      const basicTestIngredient = basicIngredients.find((ing: any) => ing.id === testIngredientId);
      expect(basicTestIngredient?.inMyBar).toBe(true);
      
      // Reviewer should see inMyBar as false
      const reviewerIngredientsResponse = await request(app)
        .get('/api/ingredients')
        .set('Cookie', reviewerUserCookies);
        
      expect(reviewerIngredientsResponse.status).toBe(200);
      const reviewerIngredients = reviewerIngredientsResponse.body;
      const reviewerTestIngredient = reviewerIngredients.find((ing: any) => ing.id === testIngredientId);
      expect(reviewerTestIngredient?.inMyBar).toBe(false);
      
      // Admin should see inMyBar as true
      const adminIngredientsResponse = await request(app)
        .get('/api/ingredients')
        .set('Cookie', adminUserCookies);
        
      expect(adminIngredientsResponse.status).toBe(200);
      const adminIngredients = adminIngredientsResponse.body;
      const adminTestIngredient = adminIngredients.find((ing: any) => ing.id === testIngredientId);
      expect(adminTestIngredient?.inMyBar).toBe(true);
      
      console.log('✅ My Bar status in ingredients list correctly reflects each user\'s personal data');
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication for all user-specific endpoints', async () => {
      // Test preferred brands endpoint without auth
      const brandsResponse = await request(app)
        .get('/api/preferred-brands');
        
      expect(brandsResponse.status).toBe(401);
      expect(brandsResponse.body).toMatchObject({ error: 'Authentication required' });
      
      // Test My Bar endpoint without auth
      const myBarResponse = await request(app)
        .get('/api/my-bar');
        
      expect(myBarResponse.status).toBe(401);
      
      // Test creating preferred brand without auth
      const createBrandResponse = await request(app)
        .post('/api/preferred-brands')
        .set('x-admin-key', process.env.ADMIN_KEY || 'dev-admin-key-2024')
        .send({ name: 'Unauthorized Brand', proof: 40 });
        
      expect(createBrandResponse.status).toBe(401);
      
      console.log('✅ All user-specific endpoints properly require authentication');
    });

    it('should allow global content access without authentication', async () => {
      // Test cocktails endpoint - should work without auth
      const cocktailsResponse = await request(app)
        .get('/api/cocktails');
        
      expect(cocktailsResponse.status).toBe(200);
      
      // Test ingredients endpoint - should work without auth
      const ingredientsResponse = await request(app)
        .get('/api/ingredients');
        
      expect(ingredientsResponse.status).toBe(200);
      
      console.log('✅ Global content endpoints work without authentication');
    });
  });
});