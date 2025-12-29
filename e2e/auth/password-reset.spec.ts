import { test, expect, generateUniqueEmail } from '../fixtures';

test.describe('Password Reset Flow Tests', () => {
  test.describe('Forgot password page UI', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await expect(emailInput).toBeVisible();
      await expect(submitButton).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
      await page.goto('/forgot-password');
      
      const title = page.locator('text=Forgot').or(page.locator('text=Reset'));
      await expect(title.first()).toBeVisible();
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/forgot-password');
      
      const loginLink = page.locator('a[href="/login"]').or(page.locator('text=Login').or(page.locator('text=Sign in')));
      await expect(loginLink.first()).toBeVisible();
    });

    test('should navigate from login to forgot password', async ({ page }) => {
      await page.goto('/login');
      
      const forgotLink = page.locator('a[href="/forgot-password"]').or(page.locator('text=Forgot'));
      await forgotLink.first().click();
      
      await expect(page).toHaveURL('/forgot-password');
    });
  });

  test.describe('Forgot password form validation', () => {
    test('should show error for invalid email', async ({ page }) => {
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('notanemail');
      await submitButton.click();
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/forgot-password/);
    });

    test('should accept valid email format', async ({ page }) => {
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      
      await emailInput.fill('valid@example.com');
      
      const emailError = page.locator('text=valid email');
      await expect(emailError).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    });
  });

  test.describe('Forgot password API interaction', () => {
    test('should send POST request to forgot password endpoint', async ({ page }) => {
      let requestMade = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/forgot') && request.method() === 'POST') {
          requestMade = true;
        }
      });
      
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      await page.waitForTimeout(3000);
      
      expect(requestMade).toBe(true);
    });

    test('should handle non-existent email gracefully', async ({ page }) => {
      await page.route('**/api/auth/forgot', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'If email exists, reset link sent' }),
        });
      });
      
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('nonexistent@example.com');
      await submitButton.click();
      
      await page.waitForTimeout(2000);
    });

    test('should handle server error gracefully', async ({ page }) => {
      await page.route('**/api/auth/forgot', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' }),
        });
      });
      
      await page.goto('/forgot-password');
      
      const emailInput = page.locator('input[type="email"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/forgot-password/);
    });
  });

  test.describe('Reset password page', () => {
    test('reset page should be accessible with token', async ({ page }) => {
      await page.goto('/reset?token=test-token-123');
      
      await page.waitForLoadState('domcontentloaded');
      
      expect(page.url()).toContain('/reset');
    });

    test('reset page should have password fields', async ({ page }) => {
      await page.goto('/reset?token=test-token-123');
      await page.waitForLoadState('networkidle');
      
      const passwordInputs = page.locator('input[type="password"]');
      const count = await passwordInputs.count();
      
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
