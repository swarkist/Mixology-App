import { test, expect } from '@playwright/test';
import {
  setupVisualPage,
  setupE2EAuth,
  setupFullMocks,
  setupAuthenticatedMocks,
  mockCocktailsAPI,
  mockIngredientsAPI,
  mockMyBarAPI,
  mockPreferredBrandsAPI,
  mockAuthAPI,
  waitForStableUI,
  MOCK_COCKTAILS,
  MOCK_INGREDIENTS
} from '../fixtures/visual';

/**
 * WTEST-053: Visual Regression Snapshot Tests
 * 
 * Uses Playwright's built-in screenshot comparison to detect visual regressions.
 * All tests use:
 * - Consistent viewport (1280x720)
 * - Disabled animations
 * - Frozen time
 * - Deterministic mock data via route interception
 * 
 * Run with: npx playwright test e2e/visual/ --update-snapshots
 * to generate/update baseline snapshots.
 */

test.describe('Visual Regression - Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await setupVisualPage(page);
    await setupFullMocks(page);
  });

  test('Home page', async ({ page }) => {
    await page.goto('/');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Cocktails list page', async ({ page }) => {
    await page.goto('/cocktails');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('cocktails-list.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Cocktail detail page', async ({ page }) => {
    await page.goto('/cocktails/1');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('cocktail-detail.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Ingredients list page', async ({ page }) => {
    await page.goto('/ingredients');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('ingredients-list.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Ingredient detail page', async ({ page }) => {
    await page.goto('/ingredients/1');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('ingredient-detail.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Authenticated Pages (E2E Mode)', () => {
  test('My Bar page (basic user)', async ({ page }) => {
    await setupVisualPage(page);
    await setupAuthenticatedMocks(page, 'basic');
    await setupE2EAuth(page, 'basic');
    
    await page.goto('/my-bar');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('my-bar-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Preferred Brands page (basic user)', async ({ page }) => {
    await setupVisualPage(page);
    await setupAuthenticatedMocks(page, 'basic');
    await setupE2EAuth(page, 'basic');
    
    await page.goto('/preferred-brands');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('preferred-brands-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Admin Pages (E2E Mode)', () => {
  test('Admin Batch Operations page', async ({ page }) => {
    await setupVisualPage(page);
    await setupAuthenticatedMocks(page, 'admin');
    await setupE2EAuth(page, 'admin');
    
    await page.goto('/admin/batch-ops');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('admin-batch-ops.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Login/Register Forms', () => {
  test.beforeEach(async ({ page }) => {
    await setupVisualPage(page);
  });

  test('Login page', async ({ page }) => {
    await page.goto('/login');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Register page', async ({ page }) => {
    await page.goto('/register');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});

test.describe('Visual Regression - Responsive Views', () => {
  test('Cocktails list - mobile viewport', async ({ page }) => {
    await setupVisualPage(page);
    await setupFullMocks(page);
    
    // Override to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/cocktails');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('cocktails-list-mobile.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });

  test('Home page - tablet viewport', async ({ page }) => {
    await setupVisualPage(page);
    await setupFullMocks(page);
    
    // Override to tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await waitForStableUI(page);
    
    await expect(page).toHaveScreenshot('home-page-tablet.png', {
      fullPage: true,
      animations: 'disabled'
    });
  });
});
