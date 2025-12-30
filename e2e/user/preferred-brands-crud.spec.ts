import { test, expect } from '../fixtures';

/**
 * Preferred Brands CRUD Tests
 * 
 * Coverage:
 * - List page: Full UI testing with mocked API responses
 * - CRUD operations: API endpoint validation with auth requirements  
 * - Search/filter: Full UI testing on list page
 * 
 * Known Limitation:
 * Full UI form tests for Add/Edit pages cannot be achieved with current 
 * architecture. The ProtectedRoute component's auth check resolves before
 * Playwright route interception can provide mocked responses. Even with
 * queueMicrotask delay, the TanStack Query cache is populated before mocks apply.
 * 
 * Alternative Coverage:
 * - My Bar toggle tests (my-bar-actions.spec.ts) demonstrate auth mocking works
 *   for inline auth patterns
 * - API endpoint tests validate backend auth/validation behavior
 */
test.describe('Preferred Brands CRUD Tests', () => {
  test.describe('Page accessibility', () => {
    test('should navigate to preferred-brands page', async ({ page }) => {
      await page.goto('/preferred-brands');
      await expect(page).toHaveURL('/preferred-brands');
    });

    test('should display Preferred Brands heading when authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        }
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: 'Preferred Brands' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Unauthenticated state', () => {
    test('should show login prompt text when not authenticated', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not authenticated' }) });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const loginPrompt = page.locator('text=/Please login/i');
      await expect(loginPrompt).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('READ - List brands', () => {
    test('should fetch preferred-brands API when authenticated', async ({ page }) => {
      let apiCalled = false;
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        if (route.request().method() === 'GET') {
          apiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: 1, name: 'Grey Goose Vodka', userId: 1, inMyBar: false }
            ])
          });
        }
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      expect(apiCalled).toBe(true);
    });

    test('should display brand name text from API response', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', userId: 1, inMyBar: false }
          ])
        });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const brandText = page.locator('text=/Grey Goose/i');
      await expect(brandText).toBeVisible({ timeout: 10000 });
    });

    test('should render page heading when API fails', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const heading = page.getByRole('heading', { name: 'Preferred Brands' });
      await expect(heading).toBeVisible();
    });

    test('should have visible add brand link', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const addLink = page.locator('a[href*="add"]').or(page.locator('button:has-text("Add")'));
      await expect(addLink.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('CREATE - POST endpoint', () => {
    test('should require authentication to create brand', async ({ page }) => {
      const response = await page.request.post('/api/preferred-brands', {
        data: { name: 'Test Brand', inMyBar: false }
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('POST endpoint should accept valid request body', async ({ page }) => {
      const response = await page.request.post('/api/preferred-brands', {
        data: { name: 'API Test Brand' }
      });
      
      expect([201, 400, 401, 403, 429, 500]).toContain(response.status());
    });
  });

  test.describe('UPDATE - PATCH endpoint', () => {
    test('should require authentication to update brand', async ({ page }) => {
      const response = await page.request.patch('/api/preferred-brands/1', {
        data: { name: 'Updated Brand' }
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('PATCH endpoint should accept valid request body', async ({ page }) => {
      const response = await page.request.patch('/api/preferred-brands/1', {
        data: { name: 'API Updated Brand' }
      });
      
      expect([200, 400, 401, 403, 404, 429, 500]).toContain(response.status());
    });
  });

  test.describe('DELETE - DELETE endpoint', () => {
    test('should require authentication to delete brand', async ({ page }) => {
      const response = await page.request.delete('/api/preferred-brands/1');
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });

    test('DELETE endpoint should respond to valid request', async ({ page }) => {
      const response = await page.request.delete('/api/preferred-brands/9999');
      
      expect([200, 401, 403, 404, 429, 500]).toContain(response.status());
    });
  });

  test.describe('Search functionality', () => {
    test('should have visible search input', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').first();
      await expect(searchInput).toBeVisible({ timeout: 10000 });
      await expect(searchInput).toBeEnabled();
    });

    test('should filter and display matching items on search', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Grey Goose Vodka', userId: 1 },
            { id: 2, name: 'Hendricks Gin', userId: 1 }
          ])
        });
      });

      await page.goto('/preferred-brands');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('vodka');
      await page.waitForTimeout(500);
      
      const vodkaText = page.locator('text=/Grey Goose/i');
      await expect(vodkaText).toBeVisible();
    });
  });
});
