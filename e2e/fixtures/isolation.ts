import { test as base, expect, BrowserContext, Page } from '@playwright/test';
import { test as authTest } from './auth';
import { generateUniqueEmail, generateUniqueUsername } from './test-data';

export interface TestIsolation {
  uniqueEmail: string;
  uniqueUsername: string;
  testId: string;
  cleanup: () => Promise<void>;
  addCleanupTask: (task: () => Promise<void>) => void;
}

const cleanupTasks: Array<() => Promise<void>> = [];

export const test = authTest.extend<{ isolation: TestIsolation }>({
  isolation: async ({ page }, use) => {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uniqueEmail = generateUniqueEmail();
    const uniqueUsername = generateUniqueUsername();
    const localCleanupTasks: Array<() => Promise<void>> = [];

    const addCleanupTask = (task: () => Promise<void>) => {
      localCleanupTasks.push(task);
    };

    const cleanup = async () => {
      for (const task of localCleanupTasks.reverse()) {
        try {
          await task();
        } catch (error) {
          console.warn(`Cleanup task failed: ${error}`);
        }
      }
      localCleanupTasks.length = 0;
    };

    await use({
      uniqueEmail,
      uniqueUsername,
      testId,
      cleanup,
      addCleanupTask,
    });

    await cleanup();
  },

  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
    });
    
    await use(context);
    
    await context.clearCookies();
    await context.close();
  },
});

export async function withFreshContext(
  browser: any,
  fn: (context: BrowserContext, page: Page) => Promise<void>
): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await fn(context, page);
  } finally {
    await context.clearCookies();
    await context.close();
  }
}

export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}

export async function loadAuthState(
  browser: any,
  statePath: string
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: statePath });
  const page = await context.newPage();
  return { context, page };
}

export { expect };
