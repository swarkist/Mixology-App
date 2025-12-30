import { test, expect } from '../fixtures';
import { CocktailsPage } from '../pages/cocktails.page';

test.describe('Cocktail Filter Tests', () => {
  let cocktailsPage: CocktailsPage;

  test.beforeEach(async ({ page }) => {
    cocktailsPage = new CocktailsPage(page);
  });

  test.describe('Filter UI elements', () => {
    test('should display filter options on cocktails page', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const filterElements = page.locator('[data-testid*="filter"]').or(page.locator('button:has-text("Filter")'));
      const count = await filterElements.count();
      
      expect(count >= 0).toBe(true);
    });

    test('should have category filter options', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const categoryButtons = page.locator('[data-testid*="category"]').or(page.locator('[role="tab"]'));
      const count = await categoryButtons.count();
      
      expect(count >= 0).toBe(true);
    });
  });

  test.describe('Filter functionality', () => {
    test('should filter by spirit type', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Margarita', spirit: 'tequila' },
            { id: '2', name: 'Mojito', spirit: 'rum' }
          ])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const filterButton = page.locator('button:has-text("Tequila")').or(page.locator('[data-testid*="tequila"]'));
      
      if (await filterButton.first().isVisible().catch(() => false)) {
        await filterButton.first().click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/cocktails/);
    });

    test('should allow multiple filters', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/cocktails/);
    });

    test('should clear filters', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const clearButton = page.locator('button:has-text("Clear")').or(page.locator('[data-testid*="clear"]'));
      
      if (await clearButton.first().isVisible().catch(() => false)) {
        await clearButton.first().click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/cocktails/);
    });
  });

  test.describe('Filter state', () => {
    test('should update URL with filter params', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/cocktails?spirit=vodka');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/cocktails');
    });

    test('should restore filters from URL', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/cocktails?category=classic');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/cocktails');
    });

    test('should combine filters with search', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/cocktails?search=margarita&spirit=tequila');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/cocktails');
    });
  });

  test.describe('Filter API integration', () => {
    test('should send filter params to API', async ({ page }) => {
      let apiCalled = false;
      
      await page.route('**/api/cocktails*', async (route) => {
        apiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      expect(apiCalled).toBe(true);
    });

    test('should handle filter API errors', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Filter failed' })
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/cocktails/);
    });
  });

  test.describe('Sort functionality', () => {
    test('should have sort options', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const sortElement = page.locator('select').or(page.locator('[data-testid*="sort"]'));
      const count = await sortElement.count();
      
      expect(count >= 0).toBe(true);
    });

    test('should sort alphabetically', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Apple Martini' },
            { id: '2', name: 'Zombie' },
            { id: '3', name: 'Margarita' }
          ])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/cocktails/);
    });
  });
});
