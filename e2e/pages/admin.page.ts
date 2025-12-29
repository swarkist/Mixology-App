import { Page, Locator } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly userList: Locator;
  readonly searchInput: Locator;
  readonly roleFilter: Locator;
  readonly userCards: Locator;
  readonly pagination: Locator;
  readonly addUserButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userList = page.locator('[data-testid="user-list"]');
    this.searchInput = page.getByTestId('search-input').or(page.locator('input[placeholder*="Search"]'));
    this.roleFilter = page.getByTestId('role-filter').or(page.locator('select'));
    this.userCards = page.locator('[data-testid^="user-card-"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    this.addUserButton = page.getByTestId('add-user-button');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async searchUser(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async getUserCount() {
    return await this.userCards.count();
  }

  async waitForUsersToLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
