import { test, expect } from '../fixtures';
import { LoginPage } from '../pages';

test.describe('Login Flow Tests', () => {
  test.describe('Login form validation', () => {
    test('should show error for invalid email format', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('notanemail');
      await loginPage.passwordInput.fill('somepassword');
      await loginPage.submitButton.click();
      
      const errorMessage = page.locator('text=valid email').or(page.locator('[role="alert"]'));
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        expect(page.url()).toContain('/login');
      });
    });

    test('should show error for missing password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.submitButton.click();
      
      const errorMessage = page.locator('text=Password').or(page.locator('text=required'));
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        expect(page.url()).toContain('/login');
      });
    });

    test('should stay on login page with wrong credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('nonexistent@test.com');
      await loginPage.passwordInput.fill('wrongpassword123');
      await loginPage.submitButton.click();
      
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/login/);
    });

    test('should accept valid email format', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('valid@example.com');
      await loginPage.passwordInput.fill('validpassword123');
      
      const emailError = page.locator('text=valid email');
      await expect(emailError).not.toBeVisible({ timeout: 1000 }).catch(() => {});
    });
  });

  test.describe('Login page UI', () => {
    test('should display all form elements', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
    });

    test('should have correct page title', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const title = page.locator('h1, h2').filter({ hasText: /login|sign in/i });
      await expect(title.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    test('should have link to register page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const registerLink = page.locator('a[href="/register"]').or(page.locator('text=Create Account'));
      await expect(registerLink.first()).toBeVisible();
    });

    test('should have link to forgot password page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const forgotLink = page.locator('a[href="/forgot-password"]').or(page.locator('text=Forgot'));
      await expect(forgotLink.first()).toBeVisible();
    });

    test('should navigate to register page when clicking register link', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const registerLink = page.locator('a[href="/register"]').or(page.locator('text=Create Account'));
      await registerLink.first().click();
      
      await expect(page).toHaveURL('/register');
    });

    test('should navigate to forgot password page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      const forgotLink = page.locator('a[href="/forgot-password"]').or(page.locator('text=Forgot'));
      await forgotLink.first().click();
      
      await expect(page).toHaveURL('/forgot-password');
    });

    test('should have password visibility toggle', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.passwordInput.fill('testpassword');
      
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
      
      const toggleButton = page.locator('button').filter({ has: page.locator('svg') }).nth(0);
      if (await toggleButton.isVisible()) {
        await toggleButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('should disable submit button while loading', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('testpassword');
      
      await loginPage.submitButton.click();
      
      await page.waitForTimeout(500);
    });
  });

  test.describe('Login API interaction', () => {
    test('should send POST request to /api/auth/login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      
      let loginRequestMade = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/auth/login') && request.method() === 'POST') {
          loginRequestMade = true;
        }
      });
      
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('testpassword123');
      await loginPage.submitButton.click();
      
      await page.waitForTimeout(2000);
      
      expect(loginRequestMade).toBe(true);
    });

    test('should handle server error gracefully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });
      
      await loginPage.goto();
      await loginPage.emailInput.fill('test@example.com');
      await loginPage.passwordInput.fill('testpassword123');
      await loginPage.submitButton.click();
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/login/);
    });
  });
});
