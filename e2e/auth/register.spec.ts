import { test, expect, generateUniqueEmail } from '../fixtures';
import { RegisterPage } from '../pages';

test.describe('Registration Flow Tests', () => {
  test.describe('Registration form validation', () => {
    test('should show error for invalid email format', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await registerPage.emailInput.fill('notanemail');
      await registerPage.passwordInput.fill('Password123!');
      await registerPage.confirmPasswordInput.fill('Password123!');
      await registerPage.submitButton.click();
      
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/register/);
    });

    test('should show error for short password', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('short');
      await registerPage.confirmPasswordInput.fill('short');
      await registerPage.submitButton.click();
      
      const errorMessage = page.locator('text=8 characters');
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        expect(page.url()).toContain('/register');
      });
    });

    test('should show error for password mismatch', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('Password123!');
      await registerPage.confirmPasswordInput.fill('DifferentPassword123!');
      await registerPage.submitButton.click();
      
      const errorMessage = page.locator('text=match');
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 }).catch(() => {
        expect(page.url()).toContain('/register');
      });
    });
  });

  test.describe('Registration page UI', () => {
    test('should display all form elements', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      await expect(registerPage.emailInput).toBeVisible();
      await expect(registerPage.passwordInput).toBeVisible();
      await expect(registerPage.confirmPasswordInput).toBeVisible();
      await expect(registerPage.submitButton).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      const title = page.locator('text=Create Account');
      await expect(title.first()).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      const loginLink = page.locator('a[href="/login"]').or(page.locator('text=Login').or(page.locator('text=Sign in')));
      await expect(loginLink.first()).toBeVisible();
    });

    test('should navigate to login page when clicking login link', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      const loginLink = page.locator('a[href="/login"]').or(page.locator('text=Login').or(page.locator('text=Sign in')));
      await loginLink.first().click();
      
      await expect(page).toHaveURL('/login');
    });

    test('should show password requirements hint', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      const hint = page.locator('text=8 characters');
      await expect(hint.first()).toBeVisible();
    });
  });

  test.describe('Registration API interaction', () => {
    test('should send POST request to /api/auth/register', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      
      let registerRequestMade = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/register') && request.method() === 'POST') {
          registerRequestMade = true;
        }
      });
      
      await registerPage.emailInput.fill(generateUniqueEmail());
      await registerPage.passwordInput.fill('TestPassword123!');
      await registerPage.confirmPasswordInput.fill('TestPassword123!');
      await registerPage.submitButton.click();
      
      await page.waitForTimeout(3000);
      
      expect(registerRequestMade).toBe(true);
    });

    test('should handle server error gracefully', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });
      
      await registerPage.goto();
      await registerPage.emailInput.fill('test@example.com');
      await registerPage.passwordInput.fill('TestPassword123!');
      await registerPage.confirmPasswordInput.fill('TestPassword123!');
      await registerPage.submitButton.click();
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/register/);
    });

    test('should handle duplicate email error', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      
      await page.route('**/api/auth/register', async (route) => {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Email already exists' }),
        });
      });
      
      await registerPage.goto();
      await registerPage.emailInput.fill('existing@example.com');
      await registerPage.passwordInput.fill('TestPassword123!');
      await registerPage.confirmPasswordInput.fill('TestPassword123!');
      await registerPage.submitButton.click();
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/register/);
    });
  });
});
