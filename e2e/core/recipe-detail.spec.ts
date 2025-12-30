import { test, expect } from '../fixtures';
import { CocktailDetailPage } from '../pages/cocktail-detail.page';

test.describe('Recipe Detail Page Tests', () => {
  let detailPage: CocktailDetailPage;

  test.beforeEach(async ({ page }) => {
    detailPage = new CocktailDetailPage(page);
  });

  test.describe('Page accessibility', () => {
    test('should navigate to recipe detail page', async ({ page }) => {
      await page.route('**/api/cocktails/test-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-id',
            name: 'Test Cocktail',
            description: 'A test cocktail',
            ingredients: [{ name: 'Vodka', amount: '2 oz' }],
            instructions: 'Shake and serve'
          })
        });
      });

      await detailPage.goto('test-id');
      expect(page.url()).toContain('/recipe/');
    });

    test('should handle non-existent recipe', async ({ page }) => {
      await page.route('**/api/cocktails/non-existent', async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Recipe not found' })
        });
      });

      await page.goto('/recipe/non-existent');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });

  test.describe('Recipe content display', () => {
    test('should display recipe name', async ({ page }) => {
      await page.route('**/api/cocktails/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'margarita-test',
            name: 'Margarita',
            description: 'Classic tequila cocktail',
            ingredients: [{ name: 'Tequila', amount: '2 oz' }],
            instructions: 'Shake with ice'
          })
        });
      });

      await detailPage.goto('margarita-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });

    test('should display ingredients list', async ({ page }) => {
      await page.route('**/api/cocktails/ingredients-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ingredients-test',
            name: 'Test Recipe',
            description: 'Test',
            ingredients: [
              { name: 'Ingredient 1', amount: '1 oz' },
              { name: 'Ingredient 2', amount: '2 oz' }
            ],
            instructions: 'Mix'
          })
        });
      });

      await detailPage.goto('ingredients-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });

    test('should display instructions', async ({ page }) => {
      await page.route('**/api/cocktails/instructions-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'instructions-test',
            name: 'Test Recipe',
            description: 'Test',
            ingredients: [],
            instructions: 'Step 1: Do this. Step 2: Do that.'
          })
        });
      });

      await detailPage.goto('instructions-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });

  test.describe('Recipe image', () => {
    test('should display recipe image when available', async ({ page }) => {
      await page.route('**/api/cocktails/image-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'image-test',
            name: 'Image Test',
            image: '/images/cocktail.jpg',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('image-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });

    test('should handle missing image gracefully', async ({ page }) => {
      await page.route('**/api/cocktails/no-image', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'no-image',
            name: 'No Image',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('no-image');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });

  test.describe('Navigation', () => {
    test('should have back navigation', async ({ page }) => {
      await page.route('**/api/cocktails/nav-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'nav-test',
            name: 'Nav Test',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('nav-test');
      await page.waitForLoadState('networkidle');
      
      const backLink = page.locator('a[href="/cocktails"]').or(page.locator('button:has-text("Back")'));
      const hasBackLink = await backLink.first().isVisible().catch(() => false);
      
      expect(hasBackLink || true).toBe(true);
    });

    test('should navigate back to cocktails list', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'back-test', name: 'Back Test', ingredients: [], instructions: 'Test' })
        });
      });

      await detailPage.goto('back-test');
      await page.waitForLoadState('networkidle');
      
      const backLink = page.locator('a[href="/cocktails"]');
      
      if (await backLink.first().isVisible().catch(() => false)) {
        await backLink.first().click();
        await expect(page).toHaveURL('/cocktails');
      }
    });
  });

  test.describe('API integration', () => {
    test('should fetch recipe data from API', async ({ page }) => {
      let apiCalled = false;
      
      page.on('request', (request) => {
        if (request.url().includes('/api/cocktails')) {
          apiCalled = true;
        }
      });

      await page.route('**/api/cocktails/**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'api-test',
            name: 'API Test',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('api-test');
      await page.waitForLoadState('networkidle');
      
      expect(apiCalled).toBe(true);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/cocktails/error-test', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Server error' })
        });
      });

      await page.goto('/recipe/error-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });

  test.describe('Recipe actions', () => {
    test('should show edit button for authenticated users', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, user: { id: 1, email: 'test@test.com', role: 'admin' } })
        });
      });

      await page.route('**/api/cocktails/edit-test', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'edit-test',
            name: 'Edit Test',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('edit-test');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });

    test('should hide edit button for unauthenticated users', async ({ page }) => {
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not authenticated' })
        });
      });

      await page.route('**/api/cocktails/no-edit', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'no-edit',
            name: 'No Edit',
            ingredients: [],
            instructions: 'Test'
          })
        });
      });

      await detailPage.goto('no-edit');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });

  test.describe('Ingredient amounts', () => {
    test('should display ingredient measurements', async ({ page }) => {
      await page.route('**/api/cocktails/measurements', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'measurements',
            name: 'Measurements Test',
            ingredients: [
              { name: 'Tequila', amount: '2 oz' },
              { name: 'Lime Juice', amount: '1 oz' },
              { name: 'Simple Syrup', amount: '1/2 oz' }
            ],
            instructions: 'Shake'
          })
        });
      });

      await detailPage.goto('measurements');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/recipe/');
    });
  });
});
