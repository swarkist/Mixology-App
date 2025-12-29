import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('input-email').or(page.locator('input[type="email"]'));
    this.passwordInput = page.locator('input[name="password"]').or(page.locator('input[type="password"]').first());
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    this.submitButton = page.getByTestId('button-submit').or(page.locator('button[type="submit"]'));
    this.errorMessage = page.getByTestId('error-message').or(page.locator('[role="alert"]'));
    this.loginLink = page.locator('a[href="/login"]');
  }

  async goto() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string, confirmPassword?: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword || password);
    await this.submitButton.click();
  }

  async navigateToLogin() {
    await this.loginLink.click();
  }
}
