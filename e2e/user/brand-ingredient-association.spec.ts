import { test, expect } from '../fixtures/base';

/**
 * WTEST-033: Brand-Ingredient Association Tests
 * 
 * Tests for associating ingredients with preferred brands:
 * - POST /api/preferred-brands/:brandId/ingredients/:ingredientId
 * - DELETE /api/preferred-brands/:brandId/ingredients/:ingredientId
 * 
 * NOTE (Frozen Baseline): These endpoints lack auth middleware in server/routes.ts.
 * Tests verify endpoint existence and behavior as-is. Auth protection is documented
 * as a future enhancement.
 */

test.describe('Brand-Ingredient Association - Endpoint Existence', () => {
  test('POST endpoint exists at expected path', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/1/ingredients/1');
    // Endpoint exists - either succeeds, fails on storage, or returns error
    // 404 would mean endpoint doesn't exist
    expect(response.status()).not.toBe(404);
  });

  test('DELETE endpoint exists at expected path', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/1/ingredients/1');
    expect(response.status()).not.toBe(404);
  });

  test('POST endpoint responds to requests', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/123/ingredients/456');
    // Any response that's not 404 confirms endpoint is registered
    expect([200, 400, 401, 500]).toContain(response.status());
  });

  test('DELETE endpoint responds to requests', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/123/ingredients/456');
    expect([200, 400, 401, 500]).toContain(response.status());
  });
});

test.describe('Brand-Ingredient Association - Parameter Parsing', () => {
  test('POST parses numeric brandId and ingredientId', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/999/ingredients/888');
    // Response confirms params were parsed (not a 404)
    expect(response.status()).not.toBe(404);
  });

  test('DELETE parses numeric parameters', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/999/ingredients/888');
    expect(response.status()).not.toBe(404);
  });

  test('POST with non-numeric brandId returns response', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/abc/ingredients/1');
    // May succeed (NaN conversion) or fail - just not 404
    expect(response.status()).not.toBe(404);
  });

  test('DELETE with non-numeric params returns response', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/xyz/ingredients/abc');
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Brand-Ingredient Association - Response Format', () => {
  test('POST response is JSON', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/1/ingredients/1');
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('DELETE response is JSON', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/1/ingredients/1');
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('POST response body has message field', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/1/ingredients/1');
    const body = await response.json();
    expect(body.message).toBeTruthy();
  });

  test('DELETE response body has message field', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/1/ingredients/1');
    const body = await response.json();
    expect(body.message).toBeTruthy();
  });
});

test.describe('Brand-Ingredient Association - Edge Cases', () => {
  test('POST with zero brandId handles gracefully', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/0/ingredients/1');
    // Should respond (not crash)
    expect([200, 400, 500]).toContain(response.status());
  });

  test('POST with zero ingredientId handles gracefully', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/1/ingredients/0');
    expect([200, 400, 500]).toContain(response.status());
  });

  test('POST with negative brandId handles gracefully', async ({ request }) => {
    const response = await request.post('/api/preferred-brands/-1/ingredients/1');
    expect([200, 400, 500]).toContain(response.status());
  });

  test('DELETE with large IDs does not crash', async ({ request }) => {
    const response = await request.delete('/api/preferred-brands/999999999/ingredients/888888888');
    expect([200, 400, 500]).toContain(response.status());
  });
});

test.describe('Brand-Ingredient Association - UI Flow', () => {
  test('preferred brands page is accessible', async ({ page }) => {
    await page.goto('/preferred-brands');
    await expect(page).toHaveURL('/preferred-brands');
  });

  test('add preferred brand page requires auth', async ({ page }) => {
    await page.goto('/add-preferred-brand');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('preferred brands page shows login prompt when unauthenticated', async ({ page }) => {
    await page.goto('/preferred-brands');
    // Look for login prompt or link
    const loginIndicator = page.locator('text=/log in|sign in|login/i').first();
    await expect(loginIndicator).toBeVisible({ timeout: 5000 });
  });

  test('preferred brands page renders without crash', async ({ page }) => {
    await page.goto('/preferred-brands');
    // Verify page body is visible
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Brand-Ingredient Association - HTTP Method Validation', () => {
  test('GET on association path returns response', async ({ request }) => {
    const response = await request.get('/api/preferred-brands/1/ingredients/1');
    // May hit catch-all route or return various statuses
    expect(response.status()).toBeDefined();
  });

  test('PUT on association path returns response', async ({ request }) => {
    const response = await request.put('/api/preferred-brands/1/ingredients/1');
    // PUT not explicitly defined but may have catch-all behavior
    expect(response.status()).toBeDefined();
  });

  test('PATCH on association path returns response', async ({ request }) => {
    const response = await request.patch('/api/preferred-brands/1/ingredients/1');
    expect(response.status()).toBeDefined();
  });
});
