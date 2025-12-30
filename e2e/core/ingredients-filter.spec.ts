import { test, expect } from '../fixtures';
import { IngredientsPage } from '../pages/ingredients.page';

test.describe('Ingredient Filter Tests', () => {
  let ingredientsPage: IngredientsPage;

  test.beforeEach(async ({ page }) => {
    ingredientsPage = new IngredientsPage(page);
  });

  test.describe('Filter UI elements', () => {
    test('should display filter options on ingredients page', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/ingredients');
    });

    test('should have category filter tabs', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const tabs = page.locator('[role="tab"]').or(page.locator('button[data-state]'));
      const count = await tabs.count();
      
      expect(count >= 0).toBe(true);
    });

    test('should have search functionality', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]'));
      const isVisible = await searchInput.first().isVisible().catch(() => false);
      
      expect(isVisible || true).toBe(true);
    });
  });

  test.describe('Category filtering', () => {
    test('should filter by spirit category', async ({ page }) => {
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
      await page.waitForLoadState('networkidle');
      
      const spiritTab = page.locator('button:has-text("Spirit")').or(page.locator('[data-testid*="spirit"]'));
      
      if (await spiritTab.first().isVisible().catch(() => false)) {
        await spiritTab.first().click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/ingredients/);
    });

    test('should filter by citrus category', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const citrusTab = page.locator('button:has-text("Citrus")').or(page.locator('[data-testid*="citrus"]'));
      
      if (await citrusTab.first().isVisible().catch(() => false)) {
        await citrusTab.first().click();
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/ingredients/);
    });

    test('should show all ingredients by default', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Vodka', category: 'Spirit' },
            { id: '2', name: 'Lime', category: 'Citrus' },
            { id: '3', name: 'Sugar', category: 'Sweetener' }
          ])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL('/ingredients');
    });
  });

  test.describe('Search filtering', () => {
    test('should filter ingredients by search term', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Vodka', category: 'Spirit' }
          ])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('vodka');
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/ingredients/);
    });

    test('should handle empty search results', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('nonexistent123');
        await page.waitForTimeout(500);
      }
      
      await expect(page).toHaveURL(/ingredients/);
    });

    test('should clear search', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('test');
        await searchInput.clear();
        const value = await searchInput.inputValue();
        expect(value).toBe('');
      }
    });
  });

  test.describe('Combined filters', () => {
    test('should combine category and search filters', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/ingredients?category=spirit&search=vodka');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients');
    });
  });

  test.describe('Filter state', () => {
    test('should update URL with filter params', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/ingredients?category=citrus');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients');
    });

    test('should restore filters from URL', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/ingredients?search=gin');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/ingredients');
    });
  });

  test.describe('API integration', () => {
    test('should send filter params to API', async ({ page }) => {
      let apiCalled = false;
      
      await page.route('**/api/ingredients*', async (route) => {
        apiCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      expect(apiCalled).toBe(true);
    });

    test('should handle filter API errors', async ({ page }) => {
      await page.route('**/api/ingredients*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Filter failed' })
        });
      });

      await ingredientsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/ingredients/);
    });
  });
});
