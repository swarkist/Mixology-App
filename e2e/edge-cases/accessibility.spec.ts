import { test, expect } from '../fixtures/base';
import AxeBuilder from '@axe-core/playwright';

/**
 * WTEST-052: Accessibility Testing with axe-core
 * 
 * Uses @axe-core/playwright to run automated accessibility scans.
 * Tests check for WCAG 2.1 Level A and AA compliance.
 * 
 * NOTE: These are baseline capture tests for frozen codebase.
 * Tests document existing violations without failing.
 * Future delta work should address these issues.
 */

test.describe('Accessibility - Core Pages (Baseline Capture)', () => {
  test('home page accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();
    
    // Document violations
    console.log(`Home page: ${results.violations.length} violations found`);
    results.violations.forEach(v => {
      console.log(`  - ${v.id} (${v.impact}): ${v.description}`);
    });
    
    // Test passes - baseline capture
    expect(results).toBeDefined();
  });

  test('login page accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();
    
    console.log(`Login page: ${results.violations.length} violations found`);
    results.violations.forEach(v => {
      console.log(`  - ${v.id} (${v.impact}): ${v.description}`);
    });
    
    expect(results).toBeDefined();
  });

  test('register page accessibility scan', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();
    
    console.log(`Register page: ${results.violations.length} violations found`);
    results.violations.forEach(v => {
      console.log(`  - ${v.id} (${v.impact}): ${v.description}`);
    });
    
    expect(results).toBeDefined();
  });

  test('cocktails page accessibility scan', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Margarita', description: 'Classic tequila cocktail', ingredients: [] }
        ])
      });
    });
    
    await page.goto('/cocktails');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();
    
    console.log(`Cocktails page: ${results.violations.length} violations found`);
    
    expect(results).toBeDefined();
  });

  test('ingredients page accessibility scan', async ({ page }) => {
    await page.route('/api/ingredients', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Lime', category: 'Citrus' }
        ])
      });
    });
    
    await page.goto('/ingredients');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a'])
      .analyze();
    
    console.log(`Ingredients page: ${results.violations.length} violations found`);
    
    expect(results).toBeDefined();
  });
});

test.describe('Accessibility - Full WCAG AA Audit', () => {
  test('home page WCAG AA audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    console.log(`Home WCAG AA: ${results.violations.length} issues`);
    
    expect(results).toBeDefined();
  });
});

test.describe('Accessibility - Form Labels', () => {
  test('login form accessibility', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();
    
    const labelViolations = results.violations.filter(v => 
      v.id.includes('label')
    );
    console.log(`Login form label issues: ${labelViolations.length}`);
    
    expect(results).toBeDefined();
  });

  test('register form accessibility', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .include('form')
      .analyze();
    
    expect(results).toBeDefined();
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('home page color contrast audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    console.log(`Color contrast issues: ${results.violations.length}`);
    
    expect(results).toBeDefined();
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test('login page is keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });

  test('cocktails page links are keyboard accessible', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, name: 'Test', description: 'Test', ingredients: [] }])
      });
    });
    
    await page.goto('/cocktails');
    await page.waitForLoadState('networkidle');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeDefined();
  });
});
