import { Page, Locator } from '@playwright/test';

export class CocktailDetailPage {
  readonly page: Page;
  readonly title: Locator;
  readonly description: Locator;
  readonly ingredients: Locator;
  readonly instructions: Locator;
  readonly image: Locator;
  readonly backButton: Locator;
  readonly editButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId('cocktail-title').or(page.locator('h1'));
    this.description = page.getByTestId('cocktail-description').or(page.locator('[class*="description"]'));
    this.ingredients = page.getByTestId('ingredients-list').or(page.locator('[class*="ingredients"]'));
    this.instructions = page.getByTestId('instructions').or(page.locator('[class*="instructions"]'));
    this.image = page.getByTestId('cocktail-image').or(page.locator('img[alt*="cocktail"]'));
    this.backButton = page.getByTestId('back-button').or(page.locator('button:has-text("Back")'));
    this.editButton = page.getByTestId('edit-button').or(page.locator('button:has-text("Edit")'));
  }

  async goto(id: string) {
    await this.page.goto(`/recipe/${id}`);
  }

  async getTitle() {
    return await this.title.textContent();
  }

  async getIngredientCount() {
    const ingredientItems = this.page.locator('[data-testid^="ingredient-item-"]');
    return await ingredientItems.count();
  }

  async goBack() {
    await this.backButton.click();
  }
}
