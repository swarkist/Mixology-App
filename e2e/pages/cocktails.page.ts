import { Page, Locator } from '@playwright/test';

export class CocktailsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly cocktailCards: Locator;
  readonly filterButtons: Locator;
  readonly sortDropdown: Locator;
  readonly loadingIndicator: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input').or(page.locator('input[placeholder*="Search"]'));
    this.cocktailCards = page.locator('[data-testid^="cocktail-card-"]').or(page.locator('.cocktail-card'));
    this.filterButtons = page.locator('[data-testid^="filter-"]');
    this.sortDropdown = page.getByTestId('sort-dropdown').or(page.locator('select'));
    this.loadingIndicator = page.locator('[data-testid="loading"]').or(page.locator('.loading'));
    this.noResultsMessage = page.getByTestId('no-results').or(page.locator('text=No cocktails found'));
  }

  async goto() {
    await this.page.goto('/cocktails');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
  }

  async clickCocktail(index: number) {
    await this.cocktailCards.nth(index).click();
  }

  async getCocktailCount() {
    return await this.cocktailCards.count();
  }

  async waitForCocktailsToLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
