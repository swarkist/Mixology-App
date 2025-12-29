import { Page, Locator } from '@playwright/test';

export class IngredientsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly ingredientCards: Locator;
  readonly filterButtons: Locator;
  readonly categoryFilters: Locator;
  readonly loadingIndicator: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input').or(page.locator('input[placeholder*="Search"]'));
    this.ingredientCards = page.locator('[data-testid^="ingredient-card-"]').or(page.locator('.ingredient-card'));
    this.filterButtons = page.locator('[data-testid^="filter-"]');
    this.categoryFilters = page.locator('[data-testid^="category-"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
    this.noResultsMessage = page.getByTestId('no-results').or(page.locator('text=No ingredients found'));
  }

  async goto() {
    await this.page.goto('/ingredients');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async clickIngredient(index: number) {
    await this.ingredientCards.nth(index).click();
  }

  async getIngredientCount() {
    return await this.ingredientCards.count();
  }

  async waitForIngredientsToLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
