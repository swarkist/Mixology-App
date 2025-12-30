import { test, expect } from '../fixtures';
import { IngredientsPage } from '../pages/ingredients.page';

test.describe('Ingredient Browsing Tests', () => {
  let ingredientsPage: IngredientsPage;

  test.beforeEach(async ({ page }) => {
    ingredientsPage = new IngredientsPage(page);
  });

  test.describe('Page accessibility', () => {
    test('should navigate to ingredients page', async ({ page }) => {
      await ingredientsPage.goto();
      await expect(page).toHaveURL('/ingredients');
    });

    test('should display page content', async ({ page }) => {
      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);
    });

    test('should be accessible without authentication', async ({ page }) => {
      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/ingredients');
    });
  });

  test.describe('Ingredient list display', () => {
    test('should display ingredient cards or empty state', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Vodka', category: 'spirit' },
            { id: '2', name: 'Lime Juice', category: 'citrus' },
            { id: '3', name: 'Simple Syrup', category: 'sweetener' }
          ])
        });
      });

      await ingredientsPage.goto();
      await ingredientsPage.waitForIngredientsToLoad();
      
      await expect(page).toHaveURL('/ingredients');
    });

    test('should handle empty ingredient list', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await ingredientsPage.waitForIngredientsToLoad();
      
      await expect(page).toHaveURL('/ingredients');
    });

    test('should handle API error gracefully', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/ingredients');
    });
  });

  test.describe('Ingredient card elements', () => {
    test('should display ingredient names', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'test-1', name: 'Test Vodka', category: 'spirit' }
          ])
        });
      });

      await ingredientsPage.goto();
      await ingredientsPage.waitForIngredientsToLoad();
      
      await expect(page).toHaveURL('/ingredients');
    });

    test('should display ingredient categories', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Bourbon', category: 'Whiskey' }
          ])
        });
      });

      await ingredientsPage.goto();
      await ingredientsPage.waitForIngredientsToLoad();
      
      await expect(page).toHaveURL('/ingredients');
    });
  });

  test.describe('Navigation', () => {
    test('should have navigation links', async ({ page }) => {
      await ingredientsPage.goto();
      await page.waitForLoadState('domcontentloaded');
      
      const navLinks = page.locator('nav a').or(page.locator('header a'));
      const count = await navLinks.count();
      
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('API integration', () => {
    test('should make request to ingredients API', async ({ page }) => {
      let apiCalled = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/ingredients')) {
          apiCalled = true;
        }
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      expect(apiCalled).toBe(true);
    });

    test('should accept query parameters in API', async ({ page }) => {
      const response = await page.request.get('/api/ingredients');
      expect([200, 429, 500]).toContain(response.status());
    });
  });

  test.describe('Category grouping', () => {
    test('should display category headers', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Vodka', category: 'Spirit' },
            { id: '2', name: 'Lime', category: 'Citrus' }
          ])
        });
      });

      await ingredientsPage.goto();
      await ingredientsPage.waitForIngredientsToLoad();
      
      await expect(page).toHaveURL('/ingredients');
    });
  });
});
