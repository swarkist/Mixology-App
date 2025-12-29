import { test as base, expect } from '@playwright/test';

const ALLOWED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
]);

const STUB_PATTERNS = [
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
  /replit\.com\/public/,
  /cdnjs\.cloudflare\.com/,
];

const BLOCKED_API_PATTERNS = [
  /openrouter\.ai/,
  /api\.openai\.com/,
  /youtube\.com\/api/,
  /googleapis\.com\/youtube/,
];

export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const baseHost = baseURL ? new URL(baseURL).host : 'localhost:5000';
    
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      
      try {
        const parsedUrl = new URL(url);
        const host = parsedUrl.host;
        const hostname = parsedUrl.hostname;
        
        const isLocalAllowed =
          ALLOWED_HOSTS.has(hostname) ||
          host === baseHost ||
          host.startsWith('localhost:') ||
          host.startsWith('127.0.0.1:') ||
          url.startsWith('data:') ||
          url.startsWith('blob:');
        
        if (isLocalAllowed) {
          await route.continue();
          return;
        }

        const isBlockedApi = BLOCKED_API_PATTERNS.some(pattern => pattern.test(url));
        if (isBlockedApi) {
          console.error(`[TRIPWIRE] Blocked dangerous API request to: ${url}`);
          throw new Error(
            `Network tripwire triggered! External API request blocked: ${url}\n` +
            `Tests must not call external services. Mock this endpoint or use route interception.`
          );
        }

        const isStubbed = STUB_PATTERNS.some(pattern => pattern.test(url));
        if (isStubbed) {
          if (url.includes('fonts.googleapis.com') || url.includes('.css')) {
            await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
          } else if (url.includes('.js')) {
            await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
          } else if (url.includes('.woff') || url.includes('.woff2') || url.includes('.ttf')) {
            await route.fulfill({ status: 200, contentType: 'font/woff2', body: '' });
          } else {
            await route.fulfill({ status: 200, body: '' });
          }
          return;
        }

        console.warn(`[TRIPWIRE] Blocking unrecognized external request to: ${url}`);
        await route.abort('blockedbyclient');
      } catch (err) {
        if (err instanceof Error && err.message.includes('tripwire')) {
          throw err;
        }
        await route.continue();
      }
    });
    
    await use(page);
  },
});

export { expect };
