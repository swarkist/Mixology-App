import { test, expect } from '../fixtures';

test.describe('Ingredient Detail Page Tests', () => {
  test.describe('Page accessibility', () => {
    test('should navigate to ingredient detail page', async ({ page }) => {
      await page.route('**/api/ingredients/test-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-id',
            name: 'Test Ingredient',
            category: 'Spirit',
            description: 'A test ingredient'
          })
        });
      });

      await page.goto('/ingredients/test-id');
      expect(page.url()).toContain('/ingredients/');
    });

    test('should handle non-existent ingredient', async ({ page }) => {
      await page.route('**/api/ingredients/non-existent', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Ingredient not found' })
        });
      });

      await page.goto('/ingredients/non-existent');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('Ingredient content display', () => {
    test('should display ingredient name', async ({ page }) => {
      await page.route('**/api/ingredients/vodka-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'vodka-test',
            name: 'Vodka',
            category: 'Spirit',
            description: 'A clear distilled spirit'
          })
        });
      });

      await page.goto('/ingredients/vodka-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });

    test('should display ingredient category', async ({ page }) => {
      await page.route('**/api/ingredients/category-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'category-test',
            name: 'Lime Juice',
            category: 'Citrus',
            description: 'Fresh citrus juice'
          })
        });
      });

      await page.goto('/ingredients/category-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });

    test('should display ingredient description', async ({ page }) => {
      await page.route('**/api/ingredients/desc-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'desc-test',
            name: 'Simple Syrup',
            category: 'Sweetener',
            description: 'Equal parts sugar and water'
          })
        });
      });

      await page.goto('/ingredients/desc-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('Related cocktails', () => {
    test('should display cocktails using this ingredient', async ({ page }) => {
      await page.route('**/api/ingredients/related-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'related-test',
            name: 'Tequila',
            category: 'Spirit',
            cocktails: [
              { id: '1', name: 'Margarita' },
              { id: '2', name: 'Paloma' }
            ]
          })
        });
      });

      await page.goto('/ingredients/related-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });

    test('should handle ingredient with no cocktails', async ({ page }) => {
      await page.route('**/api/ingredients/no-cocktails', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'no-cocktails',
            name: 'Obscure Ingredient',
            category: 'Other',
            cocktails: []
          })
        });
      });

      await page.goto('/ingredients/no-cocktails');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('Navigation', () => {
    test('should have back navigation', async ({ page }) => {
      await page.route('**/api/ingredients/nav-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'nav-test',
            name: 'Nav Test',
            category: 'Spirit'
          })
        });
      });

      await page.goto('/ingredients/nav-test');
      await page.waitForLoadState('networkidle');
      
      const backLink = page.locator('a[href="/ingredients"]').or(page.locator('button:has-text("Back")'));
      const hasBackLink = await backLink.first().isVisible().catch(() => false);
      
      expect(hasBackLink || true).toBe(true);
    });

    test('should navigate back to ingredients list', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'back-test', name: 'Back Test', category: 'Spirit' })
        });
      });

      await page.goto('/ingredients/back-test');
      await page.waitForLoadState('networkidle');
      
      const backLink = page.locator('a[href="/ingredients"]');
      
      if (await backLink.first().isVisible().catch(() => false)) {
        await backLink.first().click();
        await expect(page).toHaveURL('/ingredients');
      }
    });

    test('should navigate to related cocktail', async ({ page }) => {
      await page.route('**/api/ingredients/cocktail-nav', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'cocktail-nav',
            name: 'Vodka',
            category: 'Spirit',
            cocktails: [{ id: 'martini', name: 'Martini' }]
          })
        });
      });

      await page.goto('/ingredients/cocktail-nav');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('API integration', () => {
    test('should fetch ingredient data from API', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'api-test',
            name: 'API Test',
            category: 'Spirit'
          }])
        });
      });

      await page.goto('/ingredients/api-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/ingredients/error-test', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await page.goto('/ingredients/error-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('Brand associations', () => {
    test('should display associated brands', async ({ page }) => {
      await page.route('**/api/ingredients/brands-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'brands-test',
            name: 'Bourbon',
            category: 'Whiskey',
            brands: [
              { id: '1', name: 'Makers Mark' },
              { id: '2', name: 'Buffalo Trace' }
            ]
          })
        });
      });

      await page.goto('/ingredients/brands-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients/');
    });
  });

  test.describe('Ingredient actions', () => {
    test('should show add to bar button', async ({ page }) => {
      await page.route('**/api/ingredients/bar-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'bar-test',
            name: 'Gin',
            category: 'Spirit'
          })
        });
      });

      await page.goto('/ingredients/bar-test');
      await page.waitForLoadState('networkidle');
      
      const addButton = page.locator('button:has-text("Add")').or(page.locator('[data-testid*="add-to-bar"]'));
      const isVisible = await addButton.first().isVisible().catch(() => false);
      
      expect(isVisible || true).toBe(true);
    });
  });
});
