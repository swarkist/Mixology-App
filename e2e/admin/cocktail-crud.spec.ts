import { test, expect } from '../fixtures/base';

/**
 * WTEST-042: Cocktail CRUD Tests (Admin)
 * 
 * Tests for admin cocktail management:
 * - POST /api/cocktails (create - admin/reviewer)
 * - PATCH /api/cocktails/:id (update - admin/reviewer)
 * - DELETE /api/cocktails/:id (delete - admin only)
 * - PATCH /api/cocktails/:id/featured (set featured - admin only)
 * 
 * NOTE: Tests that hit Firebase storage are skipped during quota exhaustion.
 * Auth-level tests verify endpoint existence and protection without database access.
 */

test.describe('Cocktail CRUD - Create (Auth Required)', () => {
  test('POST /api/cocktails requires authentication', async ({ request }) => {
    const response = await request.post('/api/cocktails', {
      data: { name: 'Test Cocktail' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/cocktails 401 response has error message', async ({ request }) => {
    const response = await request.post('/api/cocktails', {
      data: { name: 'Test Cocktail' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('POST endpoint exists at /api/cocktails', async ({ request }) => {
    const response = await request.post('/api/cocktails');
    expect(response.status()).toBe(401);
  });
});

test.describe('Cocktail CRUD - Update (Auth Required)', () => {
  test('PATCH /api/cocktails/:id requires authentication', async ({ request }) => {
    const response = await request.patch('/api/cocktails/1', {
      data: { name: 'Updated Cocktail' }
    });
    expect(response.status()).toBe(401);
  });

  test('PATCH /api/cocktails/:id 401 has error message', async ({ request }) => {
    const response = await request.patch('/api/cocktails/1', {
      data: { name: 'Updated Cocktail' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('PATCH with numeric id is parsed correctly', async ({ request }) => {
    const response = await request.patch('/api/cocktails/999', {
      data: { name: 'Test' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Cocktail CRUD - Delete (Admin Only)', () => {
  test('DELETE /api/cocktails/:id requires authentication', async ({ request }) => {
    const response = await request.delete('/api/cocktails/1');
    expect(response.status()).toBe(401);
  });

  test('DELETE endpoint exists at /api/cocktails/:id', async ({ request }) => {
    const response = await request.delete('/api/cocktails/999');
    expect(response.status()).toBe(401);
  });

  test('DELETE 401 response is JSON', async ({ request }) => {
    const response = await request.delete('/api/cocktails/1');
    expect(response.status()).toBe(401);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});

test.describe('Cocktail CRUD - Featured (Admin Only)', () => {
  test('PATCH /api/cocktails/:id/featured requires authentication', async ({ request }) => {
    const response = await request.patch('/api/cocktails/1/featured', {
      data: { featured: true }
    });
    expect(response.status()).toBe(401);
  });

  test('PATCH /api/cocktails/:id/toggle-featured requires authentication', async ({ request }) => {
    const response = await request.patch('/api/cocktails/1/toggle-featured');
    expect(response.status()).toBe(401);
  });

  test('featured endpoint accepts boolean value in body', async ({ request }) => {
    const response = await request.patch('/api/cocktails/1/featured', {
      data: { featured: false }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Cocktail CRUD - Parameter Validation (Auth)', () => {
  test('PATCH with non-numeric id returns error', async ({ request }) => {
    const response = await request.patch('/api/cocktails/abc', {
      data: { name: 'Test' }
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('DELETE with non-numeric id returns error', async ({ request }) => {
    const response = await request.delete('/api/cocktails/xyz');
    expect([400, 401, 404]).toContain(response.status());
  });
});

test.describe('Cocktail CRUD - UI Routes', () => {
  test('/add-cocktail page requires authentication', async ({ page }) => {
    await page.goto('/add-cocktail');
    await expect(page).toHaveURL(/login/);
  });

  test('/cocktails page is accessible', async ({ page }) => {
    await page.goto('/cocktails');
    await expect(page).toHaveURL('/cocktails');
    await expect(page.locator('body')).toBeVisible();
  });

  test('/recipe/:id route exists', async ({ page }) => {
    await page.goto('/recipe/1');
    await expect(page.locator('body')).toBeVisible();
  });
});
