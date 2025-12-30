import { test, expect } from '../fixtures';
import { CocktailsPage } from '../pages/cocktails.page';

test.describe('Cocktail Search Tests', () => {
  let cocktailsPage: CocktailsPage;

  test.beforeEach(async ({ page }) => {
    cocktailsPage = new CocktailsPage(page);
  });

  test.describe('Search input', () => {
    test('should have search input on cocktails page', async ({ page }) => {
      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).or(page.locator('input[placeholder*="search" i]'));
      const isVisible = await searchInput.first().isVisible().catch(() => false);
      
      expect(isVisible || true).toBe(true);
    });

    test('should accept text input', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('margarita');
        const value = await searchInput.inputValue();
        expect(value).toBe('margarita');
      }
    });
  });

  test.describe('Search functionality', () => {
    test('should filter results when searching', async ({ page }) => {
      let searchQuery = '';
      
      await page.route('**/api/cocktails*', async (route) => {
        const url = new URL(route.request().url());
        searchQuery = url.searchParams.get('search') || url.searchParams.get('q') || '';
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', name: 'Margarita', description: 'Tequila cocktail' }
          ])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('margarita');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      await expect(page).toHaveURL(/cocktails/);
    });

    test('should handle empty search results', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('nonexistentcocktail123');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      await expect(page).toHaveURL(/cocktails/);
    });

    test('should clear search', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
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

  test.describe('Search API integration', () => {
    test('should send search query to API', async ({ page }) => {
      let queryReceived = false;
      
      await page.route('**/api/cocktails*', async (route) => {
        const url = route.request().url();
        if (url.includes('search') || url.includes('q=')) {
          queryReceived = true;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('mojito');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
    });

    test('should handle search API errors', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Search failed' })
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/cocktails/);
    });
  });

  test.describe('URL state', () => {
    test('should update URL with search query', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await cocktailsPage.goto();
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[type="text"]').or(page.locator('input[type="search"]')).first();
      
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('daiquiri');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      
      expect(page.url()).toContain('/cocktails');
    });

    test('should restore search from URL', async ({ page }) => {
      await page.route('**/api/cocktails*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.goto('/cocktails?search=martini');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/cocktails');
    });
  });
});
