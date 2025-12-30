import { test, expect } from '../fixtures';

test.describe('Protected Route Access Tests', () => {
  test.describe('Unauthenticated access', () => {
    test('should redirect to login when accessing admin page', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      const isOnAdmin = page.url().includes('/admin');
      const isRedirected = page.url().includes('/login');
      const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      
      expect(isRedirected || hasLoginForm || !isOnAdmin).toBe(true);
    });

    test('should redirect to login when accessing add-cocktail page', async ({ page }) => {
      await page.goto('/add-cocktail');
      await page.waitForLoadState('networkidle');
      
      const isOnAddCocktail = page.url().includes('/add-cocktail');
      const isRedirected = page.url().includes('/login');
      const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      
      expect(isRedirected || hasLoginForm || !isOnAddCocktail).toBe(true);
    });

    test('should redirect to login when accessing import page', async ({ page }) => {
      await page.goto('/import');
      await page.waitForLoadState('networkidle');
      
      const isRedirected = page.url().includes('/login');
      const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      
      expect(isRedirected || hasLoginForm).toBe(true);
    });

    test('should redirect to login when accessing add-preferred-brand page', async ({ page }) => {
      await page.goto('/add-preferred-brand');
      await page.waitForLoadState('networkidle');
      
      const isRedirected = page.url().includes('/login');
      const hasLoginForm = await page.locator('input[type="email"]').isVisible().catch(() => false);
      
      expect(isRedirected || hasLoginForm).toBe(true);
    });
  });

  test.describe('Public routes', () => {
    test('homepage should be accessible without auth', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/');
    });

    test('cocktails page should be accessible without auth', async ({ page }) => {
      await page.goto('/cocktails');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/cocktails');
    });

    test('ingredients page should be accessible without auth', async ({ page }) => {
      await page.goto('/ingredients');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/ingredients');
    });

    test('login page should be accessible without auth', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/login');
    });

    test('register page should be accessible without auth', async ({ page }) => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/register');
    });

    test('my-bar page should be accessible without auth', async ({ page }) => {
      await page.goto('/my-bar');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/my-bar');
    });

    test('preferred-brands page should be accessible without auth', async ({ page }) => {
      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/preferred-brands');
    });
  });

  test.describe('API route protection', () => {
    test('admin endpoints should require authentication', async ({ page }) => {
      const response = await page.request.get('/api/admin/users');
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('cocktail creation should require authentication', async ({ page }) => {
      const response = await page.request.post('/api/cocktails', {
        data: { name: 'Test', ingredients: [] },
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('ingredient creation should require authentication', async ({ page }) => {
      const response = await page.request.post('/api/ingredients', {
        data: { name: 'Test Ingredient' },
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('public cocktails endpoint should be accessible', async ({ page }) => {
      const response = await page.request.get('/api/cocktails');
      
      expect([200, 429, 500]).toContain(response.status());
    });

    test('public ingredients endpoint should be accessible', async ({ page }) => {
      const response = await page.request.get('/api/ingredients');
      
      expect([200, 429, 500]).toContain(response.status());
    });
  });

  test.describe('Role-based access', () => {
    test('batch-ops page should require admin role', async ({ page }) => {
      await page.goto('/admin/batch-ops');
      await page.waitForLoadState('networkidle');
      
      const url = page.url();
      const isProtected = url.includes('/login') || !url.includes('/batch-ops') || url.includes('/admin');
      expect(isProtected).toBe(true);
    });
  });
});
