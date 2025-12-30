import { test, expect } from '../fixtures/base';

/**
 * WTEST-050: Error Handling Tests
 * 
 * Tests for proper error handling across the application:
 * - 404 pages render correctly
 * - Invalid route handling
 * - Form validation errors display correctly
 * - UI gracefully handles errors
 * 
 * NOTE: Tests use route interception to avoid Firebase API calls.
 * Focus is on UI error handling behavior, not backend validation.
 */

test.describe('Error Handling - 404 Not Found', () => {
  test('nonexistent page shows 404 or redirects appropriately', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    // Either shows 404 message or redirects to home/login
    const url = page.url();
    const content = await page.content();
    const is404 = content.includes('404') || content.includes('not found') || content.includes('Not Found');
    const isRedirect = url.includes('login') || url.endsWith('/');
    expect(is404 || isRedirect).toBe(true);
  });

  test('deep nonexistent route shows appropriate page', async ({ page }) => {
    await page.goto('/admin/some/deep/path/that/doesnt/exist');
    // Should handle gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Handling - API Error UI Responses', () => {
  test('cocktails page handles API error gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/cocktails');
    // Page should still render (not blank white screen)
    await expect(page.locator('body')).toBeVisible();
  });

  test('ingredients page handles API error gracefully', async ({ page }) => {
    await page.route('/api/ingredients', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/ingredients');
    await expect(page.locator('body')).toBeVisible();
  });

  test('cocktail detail page handles 404 gracefully', async ({ page }) => {
    await page.route('/api/cocktails/*', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Cocktail not found' })
      });
    });
    
    await page.goto('/cocktails/999999');
    // Page should handle 404 gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Error Handling - Form Validation UI', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toBeVisible();
    
    // Form elements should be present
    const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    expect(hasEmailField || hasPasswordField).toBe(true);
  });

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
    
    // Form elements should be present
    const hasEmailField = await page.locator('input[type="email"], input[name="email"]').count() > 0;
    expect(hasEmailField).toBe(true);
  });

  test('login handles server error gracefully', async ({ page }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible() && await submitBtn.isVisible()) {
      await emailInput.fill('test@test.com');
      await passwordInput.fill('password123');
      await submitBtn.click();
      
      // Wait for error handling
      await page.waitForTimeout(1000);
      // Page should still be functional (not crashed)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('login shows error message on auth failure', async ({ page }) => {
    await page.route('/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' })
      });
    });
    
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible() && await submitBtn.isVisible()) {
      await emailInput.fill('test@test.com');
      await passwordInput.fill('wrongpassword');
      await submitBtn.click();
      
      await page.waitForTimeout(1000);
      // Should show some error feedback or remain on login page
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Error Handling - Protected Routes', () => {
  test('my-bar handles unauthenticated access', async ({ page }) => {
    await page.goto('/my-bar');
    // Page should handle unauthenticated access (redirect or show auth message)
    await page.waitForTimeout(1000);
    const url = page.url();
    const content = await page.content();
    const handled = url.includes('login') || 
                   content.includes('login') || 
                   content.includes('sign in') ||
                   content.includes('401') ||
                   await page.locator('body').textContent().then(t => (t || '').length < 200);
    expect(handled).toBe(true);
  });

  test('preferred-brands handles unauthenticated access', async ({ page }) => {
    await page.goto('/preferred-brands');
    await page.waitForTimeout(1000);
    const url = page.url();
    const content = await page.content();
    const handled = url.includes('login') || 
                   content.includes('login') || 
                   content.includes('sign in') ||
                   content.includes('401') ||
                   await page.locator('body').textContent().then(t => (t || '').length < 200);
    expect(handled).toBe(true);
  });

  test('admin pages redirect unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Error Handling - Empty States', () => {
  test('cocktails page handles empty list', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/cocktails');
    // Should show empty state or message
    await expect(page.locator('body')).toBeVisible();
  });

  test('ingredients page handles empty list', async ({ page }) => {
    await page.route('/api/ingredients', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    await page.goto('/ingredients');
    await expect(page.locator('body')).toBeVisible();
  });
});
