import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('input-email').or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByTestId('input-password').or(page.locator('input[type="password"]'));
    this.submitButton = page.getByTestId('button-submit').or(page.locator('button[type="submit"]'));
    this.errorMessage = page.getByTestId('error-message').or(page.locator('[role="alert"]'));
    this.registerLink = page.locator('a[href="/register"]');
    this.forgotPasswordLink = page.locator('a[href="/forgot-password"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async navigateToRegister() {
    await this.registerLink.click();
  }

  async navigateToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
