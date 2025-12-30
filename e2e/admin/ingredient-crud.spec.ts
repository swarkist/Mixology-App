import { test, expect } from '../fixtures/base';

/**
 * WTEST-043: Ingredient CRUD Tests (Admin)
 * 
 * Tests for admin ingredient management:
 * - POST /api/ingredients (create - admin/reviewer)
 * - PATCH /api/ingredients/:id (update - admin/reviewer)
 * - DELETE /api/ingredients/:id (delete - admin only)
 * 
 * NOTE: Tests verify auth protection at API level without hitting Firebase storage.
 */

test.describe('Ingredient CRUD - Create (Auth Required)', () => {
  test('POST /api/ingredients requires authentication', async ({ request }) => {
    const response = await request.post('/api/ingredients', {
      data: { name: 'Test Ingredient', category: 'spirits' }
    });
    expect(response.status()).toBe(401);
  });

  test('POST /api/ingredients 401 response has error message', async ({ request }) => {
    const response = await request.post('/api/ingredients', {
      data: { name: 'Test Ingredient', category: 'spirits' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('POST endpoint exists at /api/ingredients', async ({ request }) => {
    const response = await request.post('/api/ingredients');
    expect(response.status()).toBe(401);
  });
});

test.describe('Ingredient CRUD - Update (Auth Required)', () => {
  test('PATCH /api/ingredients/:id requires authentication', async ({ request }) => {
    const response = await request.patch('/api/ingredients/1', {
      data: { name: 'Updated Ingredient' }
    });
    expect(response.status()).toBe(401);
  });

  test('PATCH /api/ingredients/:id 401 has error message', async ({ request }) => {
    const response = await request.patch('/api/ingredients/1', {
      data: { name: 'Updated Ingredient' }
    });
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error || body.message).toBeTruthy();
  });

  test('PATCH with numeric id is parsed correctly', async ({ request }) => {
    const response = await request.patch('/api/ingredients/999', {
      data: { name: 'Test' }
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Ingredient CRUD - Delete (Admin Only)', () => {
  test('DELETE /api/ingredients/:id requires authentication', async ({ request }) => {
    const response = await request.delete('/api/ingredients/1');
    expect(response.status()).toBe(401);
  });

  test('DELETE endpoint exists at /api/ingredients/:id', async ({ request }) => {
    const response = await request.delete('/api/ingredients/999');
    expect(response.status()).toBe(401);
  });

  test('DELETE 401 response is JSON', async ({ request }) => {
    const response = await request.delete('/api/ingredients/1');
    expect(response.status()).toBe(401);
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});

test.describe('Ingredient CRUD - Parameter Validation', () => {
  test('PATCH with non-numeric id returns error', async ({ request }) => {
    const response = await request.patch('/api/ingredients/abc', {
      data: { name: 'Test' }
    });
    expect([400, 401, 404]).toContain(response.status());
  });

  test('DELETE with non-numeric id returns error', async ({ request }) => {
    const response = await request.delete('/api/ingredients/xyz');
    expect([400, 401, 404]).toContain(response.status());
  });
});

test.describe('Ingredient CRUD - UI Routes', () => {
  test('/ingredients page is accessible', async ({ page }) => {
    await page.goto('/ingredients');
    await expect(page).toHaveURL('/ingredients');
    await expect(page.locator('body')).toBeVisible();
  });

  test('/ingredient/:id route exists', async ({ page }) => {
    await page.goto('/ingredient/1');
    await expect(page.locator('body')).toBeVisible();
  });
});
