import { Page } from '@playwright/test';

/**
 * Visual regression test helpers
 * Provides utilities for consistent, deterministic snapshots
 */

// Standard viewport for consistent snapshots
export const SNAPSHOT_VIEWPORT = { width: 1280, height: 720 };

// Mock data for deterministic API responses
export const MOCK_COCKTAILS = [
  {
    id: '1',
    name: 'Classic Margarita',
    description: 'A refreshing tequila-based cocktail with lime juice and triple sec.',
    instructions: 'Shake all ingredients with ice and strain into a salt-rimmed glass.',
    image: null,
    ingredients: [
      { name: 'Tequila', amount: '2', unit: 'oz' },
      { name: 'Lime Juice', amount: '1', unit: 'oz' },
      { name: 'Triple Sec', amount: '0.5', unit: 'oz' }
    ],
    tags: ['Classic', 'Citrus', 'Strong']
  },
  {
    id: '2',
    name: 'Mojito',
    description: 'A Cuban highball with white rum, lime, sugar, and mint.',
    instructions: 'Muddle mint with sugar and lime juice. Add rum and top with soda water.',
    image: null,
    ingredients: [
      { name: 'White Rum', amount: '2', unit: 'oz' },
      { name: 'Lime Juice', amount: '1', unit: 'oz' },
      { name: 'Mint Leaves', amount: '6', unit: 'leaves' }
    ],
    tags: ['Refreshing', 'Mint', 'Summer']
  },
  {
    id: '3',
    name: 'Old Fashioned',
    description: 'A timeless whiskey cocktail with bitters and sugar.',
    instructions: 'Muddle sugar with bitters, add whiskey and ice, stir gently.',
    image: null,
    ingredients: [
      { name: 'Bourbon', amount: '2', unit: 'oz' },
      { name: 'Sugar', amount: '1', unit: 'tsp' },
      { name: 'Angostura Bitters', amount: '2', unit: 'dashes' }
    ],
    tags: ['Classic', 'Whiskey', 'Strong']
  }
];

export const MOCK_INGREDIENTS = [
  { id: '1', name: 'Tequila', category: 'Spirits', description: 'Mexican agave spirit' },
  { id: '2', name: 'Lime Juice', category: 'Citrus', description: 'Fresh squeezed lime' },
  { id: '3', name: 'Triple Sec', category: 'Liqueurs', description: 'Orange-flavored liqueur' },
  { id: '4', name: 'White Rum', category: 'Spirits', description: 'Light Caribbean rum' },
  { id: '5', name: 'Mint Leaves', category: 'Herbs', description: 'Fresh spearmint leaves' },
  { id: '6', name: 'Bourbon', category: 'Spirits', description: 'American whiskey' }
];

export const MOCK_MY_BAR = {
  ingredients: [
    { id: '1', name: 'Tequila', category: 'Spirits' },
    { id: '2', name: 'Lime Juice', category: 'Citrus' },
    { id: '4', name: 'White Rum', category: 'Spirits' }
  ]
};

export const MOCK_PREFERRED_BRANDS = [
  { id: '1', ingredientId: '1', brand: 'Patron Silver', notes: 'Premium tequila' },
  { id: '2', ingredientId: '4', brand: 'Bacardi Superior', notes: 'Classic white rum' }
];

/**
 * Setup page for visual regression testing
 * - Sets consistent viewport
 * - Disables animations
 * - Freezes time
 */
export async function setupVisualPage(page: Page): Promise<void> {
  // Set consistent viewport
  await page.setViewportSize(SNAPSHOT_VIEWPORT);
  
  // Freeze Date.now() for deterministic timestamps
  await page.addInitScript(() => {
    const fixedTime = new Date('2025-01-01T12:00:00Z').getTime();
    Date.now = () => fixedTime;
    
    // Also freeze Date constructor for consistency
    const OriginalDate = Date;
    class MockDate extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          super(...(args as [any]));
        }
      }
      static now() {
        return fixedTime;
      }
    }
    (window as any).Date = MockDate;
  });
  
  // Disable CSS animations and transitions
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
}

/**
 * Mock user data for authenticated sessions
 */
export const MOCK_USERS = {
  basic: {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'basic',
    is_active: true
  },
  reviewer: {
    id: 2,
    email: 'reviewer@example.com',
    username: 'reviewer',
    role: 'reviewer',
    is_active: true
  },
  admin: {
    id: 3,
    email: 'admin@example.com',
    username: 'admin',
    role: 'admin',
    is_active: true
  }
};

/**
 * Setup E2E mode with specific role
 */
export async function setupE2EAuth(page: Page, role: 'basic' | 'reviewer' | 'admin' = 'basic'): Promise<void> {
  await page.addInitScript((r) => {
    (window as any).__E2E_MODE__ = true;
    (window as any).__E2E_ROLE__ = r;
  }, role);
}

/**
 * Mock auth API to return authenticated user
 */
export async function mockAuthAPI(page: Page, role: 'basic' | 'reviewer' | 'admin' = 'basic'): Promise<void> {
  const user = MOCK_USERS[role];
  
  await page.route('/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user)
    });
  });
  
  await page.route('/api/auth/logout', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

/**
 * Install deterministic route mocks for cocktails API
 */
export async function mockCocktailsAPI(page: Page): Promise<void> {
  await page.route('/api/cocktails', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_COCKTAILS)
    });
  });
  
  await page.route('/api/cocktails/*', route => {
    const url = route.request().url();
    const idMatch = url.match(/\/api\/cocktails\/(\d+)/);
    if (idMatch) {
      const cocktail = MOCK_COCKTAILS.find(c => c.id === idMatch[1]) || MOCK_COCKTAILS[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cocktail)
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Install deterministic route mocks for ingredients API
 */
export async function mockIngredientsAPI(page: Page): Promise<void> {
  await page.route('/api/ingredients', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_INGREDIENTS)
    });
  });
  
  await page.route('/api/ingredients/*', route => {
    const url = route.request().url();
    const idMatch = url.match(/\/api\/ingredients\/(\d+)/);
    if (idMatch) {
      const ingredient = MOCK_INGREDIENTS.find(i => i.id === idMatch[1]) || MOCK_INGREDIENTS[0];
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ingredient)
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Install deterministic route mocks for My Bar API
 */
export async function mockMyBarAPI(page: Page): Promise<void> {
  await page.route('/api/my-bar', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_MY_BAR)
    });
  });
  
  await page.route('/api/my-bar/*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

/**
 * Install deterministic route mocks for Preferred Brands API
 */
export async function mockPreferredBrandsAPI(page: Page): Promise<void> {
  await page.route('/api/preferred-brands', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PREFERRED_BRANDS)
    });
  });
  
  await page.route('/api/preferred-brands/*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
}

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForStableUI(page: Page): Promise<void> {
  // Wait for network idle
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  const loadingSpinner = page.locator('[class*="animate-spin"], [class*="loading"], .spinner');
  const spinnerCount = await loadingSpinner.count();
  if (spinnerCount > 0) {
    await loadingSpinner.first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }
  
  // Small delay for final render
  await page.waitForTimeout(200);
}

/**
 * Setup all mocks for a complete visual test (unauthenticated)
 */
export async function setupFullMocks(page: Page): Promise<void> {
  await mockCocktailsAPI(page);
  await mockIngredientsAPI(page);
  await mockMyBarAPI(page);
  await mockPreferredBrandsAPI(page);
}

/**
 * Setup all mocks for authenticated visual test
 */
export async function setupAuthenticatedMocks(page: Page, role: 'basic' | 'reviewer' | 'admin' = 'basic'): Promise<void> {
  await mockAuthAPI(page, role);
  await mockCocktailsAPI(page);
  await mockIngredientsAPI(page);
  await mockMyBarAPI(page);
  await mockPreferredBrandsAPI(page);
}
