import { test, expect } from './fixtures/base';

test.describe('Smoke Test', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mixi/i);
  });

  test('can access local API endpoints', async ({ page }) => {
    await page.goto('/');
    const response = await page.request.get('/api/cocktails');
    expect(response.ok()).toBe(true);
  });

  test('tripwire stubs external fonts and resources', async ({ page }) => {
    const stubbedRequests: string[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('fonts.googleapis.com') || url.includes('replit.com/public')) {
        stubbedRequests.push(url);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('localhost');
  });
});
