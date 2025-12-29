import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('input-username').or(page.locator('input[name="username"]'));
    this.emailInput = page.getByTestId('input-email').or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByTestId('input-password').or(page.locator('input[name="password"]'));
    this.confirmPasswordInput = page.getByTestId('input-confirm-password').or(page.locator('input[name="confirmPassword"]'));
    this.submitButton = page.getByTestId('button-submit').or(page.locator('button[type="submit"]'));
    this.errorMessage = page.getByTestId('error-message').or(page.locator('[role="alert"]'));
    this.loginLink = page.locator('a[href="/login"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(username: string, email: string, password: string, confirmPassword?: string) {
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (this.confirmPasswordInput) {
      await this.confirmPasswordInput.fill(confirmPassword || password);
    }
    await this.submitButton.click();
  }

  async navigateToLogin() {
    await this.loginLink.click();
  }
}
