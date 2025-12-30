import { test, expect } from '../fixtures';

/**
 * Preferred Brands CRUD Tests
 * 
 * Tests full CRUD operations for Preferred Brands feature:
 * - List page UI with mocked API responses
 * - Add form UI and POST submission
 * - Edit form UI and PATCH submission
 * - Delete confirmation and API call
 * - Search/filter functionality
 * 
 * Uses window.__E2E_MODE__ to bypass ProtectedRoute client-side auth checks.
 * Backend API auth is still enforced - tests mock API responses.
 */

// Helper to set up E2E mode bypass for ProtectedRoute pages
async function setupE2EMode(page: any, role: 'admin' | 'basic' | 'reviewer' = 'basic') {
  await page.addInitScript((e2eRole: string) => {
    (window as any).__E2E_MODE__ = true;
    (window as any).__E2E_ROLE__ = e2eRole;
  }, role);
}
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

  test.describe('CREATE - Add brand form', () => {
    test('should display Add form page with heading', async ({ page }) => {
      await setupE2EMode(page);
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/add-preferred-brand');
      await page.waitForLoadState('networkidle');
      
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test('should display name input field on add form', async ({ page }) => {
      await setupE2EMode(page);
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/add-preferred-brand');
      await page.waitForLoadState('networkidle');
      
      const nameInput = page.locator('input').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
    });

    test('should submit form and call POST API', async ({ page }) => {
      await setupE2EMode(page);
      
      let postCalled = false;
      let postBody: any = null;
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        if (route.request().method() === 'POST') {
          postCalled = true;
          postBody = route.request().postDataJSON();
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ id: 1, name: postBody?.name || 'New Brand', userId: 1 })
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
        }
      });

      await page.goto('/add-preferred-brand');
      await page.waitForLoadState('networkidle');
      
      const nameInput = page.locator('input').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.fill('Test New Brand');
      
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Save")').or(page.locator('button:has-text("Add")')));
      await submitButton.first().click();
      
      await page.waitForTimeout(1000);
      expect(postCalled).toBe(true);
    });

    test('POST endpoint should require authentication', async ({ page }) => {
      const response = await page.request.post('/api/preferred-brands', {
        data: { name: 'Test Brand', inMyBar: false }
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });
  });

  test.describe('UPDATE - Edit brand form', () => {
    test('should display Edit form with existing data', async ({ page }) => {
      await setupE2EMode(page);
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands/1', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ brand: { id: 1, name: 'Existing Brand', userId: 1, inMyBar: false } })
          });
        }
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/edit-preferred-brand/1');
      await page.waitForLoadState('networkidle');
      
      const nameInput = page.locator('input').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
    });

    test('should submit update and call PATCH API', async ({ page }) => {
      await setupE2EMode(page);
      
      let patchCalled = false;
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands/1', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ brand: { id: 1, name: 'Original Brand', userId: 1, inMyBar: false } })
          });
        } else if (route.request().method() === 'PATCH') {
          patchCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 1, name: 'Updated Brand', userId: 1 })
          });
        }
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/edit-preferred-brand/1');
      await page.waitForLoadState('networkidle');
      
      const nameInput = page.locator('input').first();
      await expect(nameInput).toBeVisible({ timeout: 10000 });
      await nameInput.clear();
      await nameInput.fill('Updated Brand Name');
      
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Save")'));
      await submitButton.first().click();
      
      await page.waitForTimeout(1000);
      expect(patchCalled).toBe(true);
    });

    test('PATCH endpoint should require authentication', async ({ page }) => {
      const response = await page.request.patch('/api/preferred-brands/1', {
        data: { name: 'Updated Brand' }
      });
      
      expect([401, 403, 429, 500]).toContain(response.status());
    });
  });

  test.describe('DELETE - Remove brand', () => {
    test('should display delete button on edit page', async ({ page }) => {
      await setupE2EMode(page);
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands/1', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ brand: { id: 1, name: 'Brand To Delete', userId: 1, inMyBar: false } })
        });
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.goto('/edit-preferred-brand/1');
      await page.waitForLoadState('networkidle');
      
      const deleteButton = page.locator('button:has-text("Delete")');
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
    });

    test('should call DELETE API when delete button clicked', async ({ page }) => {
      await setupE2EMode(page);
      
      let deleteCalled = false;
      
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: 1, email: 'test@test.com', role: 'basic', is_active: true } })
        });
      });

      await page.route('**/api/preferred-brands/1', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ brand: { id: 1, name: 'Brand To Delete', userId: 1, inMyBar: false } })
          });
        } else if (route.request().method() === 'DELETE') {
          deleteCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        }
      });

      await page.route('**/api/preferred-brands', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      page.on('dialog', dialog => dialog.accept());
      
      await page.goto('/edit-preferred-brand/1');
      await page.waitForLoadState('networkidle');
      
      const deleteButton = page.locator('button:has-text("Delete")');
      await expect(deleteButton).toBeVisible({ timeout: 10000 });
      await deleteButton.click();
      
      await page.waitForTimeout(1000);
      expect(deleteCalled).toBe(true);
    });

    test('DELETE endpoint should require authentication', async ({ page }) => {
      const response = await page.request.delete('/api/preferred-brands/1');
      
      expect([401, 403, 429, 500]).toContain(response.status());
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
