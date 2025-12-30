import { test, expect } from '../fixtures';
import { MyBarPage } from '../pages/my-bar.page';

test.describe('My Bar View Tests', () => {
  let myBarPage: MyBarPage;

  test.beforeEach(async ({ page }) => {
    myBarPage = new MyBarPage(page);
  });

  test.describe('Page accessibility', () => {
    test('should navigate to my-bar page', async ({ page }) => {
      await myBarPage.goto();
      await expect(page).toHaveURL('/my-bar');
    });

    test('should display My Bar heading when authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: 'My Bar' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Unauthenticated state', () => {
    test('should show login prompt with text when not authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const loginPrompt = page.locator('text=/Please login/i');
      await expect(loginPrompt).toBeVisible({ timeout: 10000 });
    });

    test('should have clickable login link when not authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const loginButton = page.locator('a[href="/login"]').first();
      await expect(loginButton).toBeVisible({ timeout: 10000 });
      await expect(loginButton).toBeEnabled();
    });
  });

  test.describe('Authenticated view with API data', () => {
    test('should fetch preferred-brands API and display brand names', async ({ page }) => {
      let apiCalled = false;
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        apiCalled = true;
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
      
      expect(apiCalled).toBe(true);
      const brandText = page.locator('text=/Grey Goose/i');
      await expect(brandText).toBeVisible({ timeout: 10000 });
    });

    test('should handle API error and still render page', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: 'My Bar' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Search functionality', () => {
    test('should have visible search input when authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').first();
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await expect(searchInput).toBeEnabled();
    });

    test('should filter and show matching items on search', async ({ page }) => {
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
            { id: 2, name: 'Hendricks Gin', inMyBar: true, userId: 1 }
          ])
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('vodka');
      await page.waitForTimeout(500);
      
      const vodkaText = page.locator('text=/Grey Goose/i');
      await expect(vodkaText).toBeVisible();
    });
  });

  test.describe('Category filtering', () => {
    test('should have multiple category filter buttons', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(1);
    });
  });

  test.describe('Navigation elements', () => {
    test('should have visible add brand link', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'basic' } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const addLink = page.locator('a[href*="add"]').or(page.locator('button:has-text("Add")'));
      await expect(addLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have Ask Mixi link for cocktail suggestions', async ({ page }) => {
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
          body: JSON.stringify([{ id: 1, name: 'Test Brand', inMyBar: true, userId: 1 }])
        });
      });

      await myBarPage.goto();
      await page.waitForLoadState('networkidle');
      
      const mixiLink = page.locator('text=/What can I make/i');
      await expect(mixiLink).toBeVisible({ timeout: 10000 });
    });
  });
});
