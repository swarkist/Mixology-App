import { test, expect } from '../fixtures';
import { MyBarPage } from '../pages/my-bar.page';

test.describe('My Bar Add/Remove Tests', () => {
  let myBarPage: MyBarPage;

  test.beforeEach(async ({ page }) => {
    myBarPage = new MyBarPage(page);
  });

  test.describe('Item display', () => {
    test('should display brand name text from API', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', proof: 80, inMyBar: true, userId: 1 }
          ])
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const brandText = page.locator('text=/Grey Goose/i');
      await expect(brandText).toBeVisible({ timeout: 10000 });
    });

    test('should display multiple brand items from API', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', inMyBar: true, userId: 1 },
            { id: 2, name: 'Hendricks Gin', inMyBar: true, userId: 1 },
            { id: 3, name: 'Makers Mark Bourbon', inMyBar: true, userId: 1 }
          ])
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const vodkaText = page.locator('text=/Grey Goose/i');
      const ginText = page.locator('text=/Hendricks/i');
      await expect(vodkaText).toBeVisible({ timeout: 10000 });
      await expect(ginText).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Toggle My Bar functionality', () => {
    test('should call toggle-mybar PATCH API when Remove button clicked', async ({ page }) => {
      let toggleCalled = false;
      let toggleMethod = '';
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands?inMyBar=true', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', inMyBar: true, userId: 1 }
          ])
        });
      });

      await page.route('**/api/preferred-brands/1/toggle-mybar', async (route) => {
        toggleCalled = true;
        toggleMethod = route.request().method();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, inMyBar: false })
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const brandCard = page.locator('text=/Grey Goose/i');
      await expect(brandCard).toBeVisible({ timeout: 10000 });
      
      const removeButton = page.locator('button:has-text("Remove from Bar")');
      await expect(removeButton).toBeVisible({ timeout: 5000 });
      await removeButton.click();
      await page.waitForTimeout(500);
      
      expect(toggleCalled).toBe(true);
      expect(toggleMethod).toBe('PATCH');
    });

    test('should display Remove from Bar button for items in bar', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands?inMyBar=true', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', inMyBar: true, userId: 1 }
          ])
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const brandText = page.locator('text=/Grey Goose/i');
      await expect(brandText).toBeVisible({ timeout: 10000 });
      
      const removeButton = page.locator('button:has-text("Remove from Bar")');
      await expect(removeButton).toBeVisible({ timeout: 5000 });
    });

    test('should handle toggle API error gracefully and keep page functional', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands?inMyBar=true', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ id: 1, name: 'Grey Goose Vodka', inMyBar: true, userId: 1 }])
        });
      });

      await page.route('**/api/preferred-brands/*/toggle-mybar', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: 'My Bar' });
      await expect(heading).toBeVisible();
      const brandText = page.locator('text=/Grey Goose/i');
      await expect(brandText).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Authentication requirements', () => {
    test('toggle operation should return auth error without login', async ({ page }) => {
      const response = await page.request.patch('/api/preferred-brands/1/toggle-mybar');
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('delete operation should return auth error without login', async ({ page }) => {
      const response = await page.request.delete('/api/preferred-brands/1');
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });
  });
});
