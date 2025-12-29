import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly askMixiButton: Locator;
  readonly cocktailCards: Locator;
  readonly ingredientCards: Locator;
  readonly navCocktails: Locator;
  readonly navIngredients: Locator;
  readonly navMyBar: Locator;
  readonly navLogin: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input').or(page.locator('input[placeholder*="Search"]'));
    this.askMixiButton = page.getByTestId('ask-mixi-button').or(page.locator('button:has-text("Ask Mixi")'));
    this.cocktailCards = page.locator('[data-testid^="cocktail-card-"]');
    this.ingredientCards = page.locator('[data-testid^="ingredient-card-"]');
    this.navCocktails = page.locator('a[href="/cocktails"]');
    this.navIngredients = page.locator('a[href="/ingredients"]');
    this.navMyBar = page.locator('a[href="/my-bar"]');
    this.navLogin = page.locator('a[href="/login"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.askMixiButton.click();
  }

  async navigateToCocktails() {
    await this.navCocktails.click();
  }

  async navigateToIngredients() {
    await this.navIngredients.click();
  }

  async navigateToMyBar() {
    await this.navMyBar.click();
  }

  async navigateToLogin() {
    await this.navLogin.click();
  }
}
