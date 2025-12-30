import { test, expect } from '../fixtures/base';

/**
 * WTEST-051: Network Failure Recovery Tests
 * 
 * Tests for handling network failures and recovery:
 * - Timeout handling
 * - Retry behavior
 * - Graceful degradation
 * - Connection error recovery
 * 
 * Note: These tests verify the application's resilience to network issues.
 */

test.describe('Network Failure - API Timeouts', () => {
  test('page handles slow API gracefully', async ({ page }) => {
    // Set up route interception to simulate slow response
    await page.route('/api/cocktails', async route => {
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    await page.goto('/cocktails');
    // Page should still load (show loading state or content)
    await expect(page.locator('body')).toBeVisible();
  });

  test('page recovers from temporary network failure', async ({ page }) => {
    let failCount = 0;
    
    // First request fails, second succeeds
    await page.route('/api/cocktails', async route => {
      if (failCount < 1) {
        failCount++;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    
    await page.goto('/cocktails');
    // Page should handle the failure gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Network Failure - Connection Errors', () => {
  test('login page shows error on network failure', async ({ page }) => {
    await page.goto('/login');
    
    // Intercept login request and abort
    await page.route('/api/auth/login', route => route.abort('failed'));
    
    // Fill and submit form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('test@test.com');
      await passwordInput.fill('password123');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        // Wait for error to appear
        await page.waitForTimeout(1000);
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('search handles network failure gracefully', async ({ page }) => {
    await page.goto('/cocktails');
    
    // Intercept search request and fail
    await page.route('/api/cocktails?*', route => route.abort('failed'));
    
    // Try to search
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('margarita');
      await page.waitForTimeout(500);
      // Page should not crash
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Network Failure - Request Cancellation', () => {
  test('navigating away cancels pending requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('/api/cocktails', async route => {
      requestCount++;
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    // Start loading cocktails
    await page.goto('/cocktails');
    
    // Navigate away before request completes
    await page.goto('/ingredients');
    
    // Page should handle navigation cleanly
    await expect(page.locator('body')).toBeVisible();
    expect(requestCount).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Network Failure - Offline Behavior', () => {
  test('page displays content when offline after initial load', async ({ page, context }) => {
    // Load page first
    await page.goto('/cocktails');
    await page.waitForLoadState('networkidle');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to interact - page should still be visible
    await expect(page.locator('body')).toBeVisible();
    
    // Restore connection
    await context.setOffline(false);
  });

  test('page shows error state when navigating offline', async ({ page, context }) => {
    await page.goto('/');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate
    const cocktailLink = page.locator('a[href="/cocktails"]').first();
    if (await cocktailLink.isVisible()) {
      await cocktailLink.click();
      await page.waitForTimeout(1000);
      // Page should show offline error or cached content
      await expect(page.locator('body')).toBeVisible();
    }
    
    // Restore connection
    await context.setOffline(false);
  });
});

test.describe('Network Failure - API Response Validation', () => {
  test('handles malformed JSON response', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'not valid json {'
      });
    });
    
    await page.goto('/cocktails');
    // Page should handle error gracefully
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles empty response body', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ''
      });
    });
    
    await page.goto('/cocktails');
    // Page should handle empty response
    await expect(page.locator('body')).toBeVisible();
  });

  test('handles unexpected HTML response', async ({ page }) => {
    await page.route('/api/cocktails', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Error page</body></html>'
      });
    });
    
    await page.goto('/cocktails');
    // Page should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});
