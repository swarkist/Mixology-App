import { Page, Locator } from '@playwright/test';

export class MyBarPage {
  readonly page: Page;
  readonly ingredientList: Locator;
  readonly addIngredientButton: Locator;
  readonly searchInput: Locator;
  readonly categoryTabs: Locator;
  readonly cocktailCount: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ingredientList = page.locator('[data-testid^="bar-ingredient-"]');
    this.addIngredientButton = page.getByTestId('add-ingredient-button').or(page.locator('button:has-text("Add")'));
    this.searchInput = page.getByTestId('search-input').or(page.locator('input[placeholder*="Search"]'));
    this.categoryTabs = page.locator('[data-testid^="category-tab-"]');
    this.cocktailCount = page.getByTestId('cocktail-count').or(page.locator('text=/\\d+ cocktails?/'));
    this.emptyState = page.getByTestId('empty-state').or(page.locator('text=No ingredients in your bar'));
  }

  async goto() {
    await this.page.goto('/my-bar');
  }

  async getIngredientCount() {
    return await this.ingredientList.count();
  }

  async searchIngredient(query: string) {
    await this.searchInput.fill(query);
  }

  async selectCategory(category: string) {
    await this.page.locator(`[data-testid="category-tab-${category}"]`).click();
  }
}
