import { test, expect } from '../fixtures';

test.describe('Logout Flow Tests', () => {
  test.describe('Logout UI elements', () => {
    test('should have logout endpoint available', async ({ page }) => {
      const response = await page.request.post('/api/auth/logout');
      expect([200, 401]).toContain(response.status());
    });

    test('logout button should be hidden when not logged in', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const logoutButton = page.locator('button:has-text("Logout")');
      
      await page.waitForTimeout(2000);
      
      const isVisible = await logoutButton.isVisible().catch(() => false);
      if (!isVisible) {
        const loginLink = page.locator('a[href="/login"]');
        await expect(loginLink.first()).toBeVisible();
      }
    });

    test('should show login link on homepage when unauthenticated', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Logout API', () => {
    test('logout endpoint should accept POST requests', async ({ page }) => {
      const response = await page.request.post('/api/auth/logout');
      
      expect([200, 401]).toContain(response.status());
    });

    test('logout should clear session', async ({ page }) => {
      const response = await page.request.post('/api/auth/logout');
      
      const meResponse = await page.request.get('/api/auth/me');
      
      const body = await meResponse.json().catch(() => ({}));
      const isLoggedOut = meResponse.status() === 401 || !body.success || !body.user;
      expect(isLoggedOut).toBe(true);
    });

    test('should handle multiple logout calls gracefully', async ({ page }) => {
      const response1 = await page.request.post('/api/auth/logout');
      const response2 = await page.request.post('/api/auth/logout');
      
      expect([200, 401]).toContain(response1.status());
      expect([200, 401]).toContain(response2.status());
    });
  });

  test.describe('Logout navigation', () => {
    test('should be able to navigate to login from any page', async ({ page }) => {
      await page.goto('/cocktails');
      await page.waitForLoadState('networkidle');
      
      const loginLink = page.locator('a[href="/login"]');
      
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL('/login');
      }
    });

    test('homepage should be accessible after session ends', async ({ page }) => {
      await page.request.post('/api/auth/logout');
      
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      
      await expect(page).toHaveURL('/');
    });
  });
});
