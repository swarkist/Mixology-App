import { Page, BrowserContext } from '@playwright/test';
import { test as base, expect } from './base';
import { testUsers } from './test-data';

export interface AuthHelpers {
  login: (email: string, password: string) => Promise<boolean>;
  loginAsAdmin: () => Promise<boolean>;
  loginAsReviewer: () => Promise<boolean>;
  loginAsBasic: () => Promise<boolean>;
  logout: () => Promise<void>;
  isLoggedIn: () => Promise<boolean>;
  getCurrentUser: () => Promise<any | null>;
}

async function createAuthHelpers(page: Page): Promise<AuthHelpers> {
  const login = async (email: string, password: string): Promise<boolean> => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitButton.click();
    
    try {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  };

  const loginAsAdmin = async (): Promise<boolean> => {
    return login(testUsers.admin.email, testUsers.admin.password);
  };

  const loginAsReviewer = async (): Promise<boolean> => {
    return login(testUsers.reviewer.email, testUsers.reviewer.password);
  };

  const loginAsBasic = async (): Promise<boolean> => {
    return login(testUsers.basic.email, testUsers.basic.password);
  };

  const logout = async (): Promise<void> => {
    try {
      const userMenu = page.locator('[data-testid="user-menu"]').or(page.locator('button:has-text("Logout")'));
      const logoutButton = page.locator('[data-testid="logout-button"]').or(page.locator('button:has-text("Logout")'));
      
      if (await userMenu.isVisible()) {
        await userMenu.click();
      }
      
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForURL('/');
      }
    } catch {
      await page.goto('/');
      await page.context().clearCookies();
    }
  };

  const isLoggedIn = async (): Promise<boolean> => {
    try {
      const logoutButton = page.locator('[data-testid="logout-button"]').or(page.locator('button:has-text("Logout")'));
      const userMenu = page.locator('[data-testid="user-menu"]');
      const loginButton = page.locator('a[href="/login"]');
      
      const hasLogout = await logoutButton.isVisible().catch(() => false);
      const hasUserMenu = await userMenu.isVisible().catch(() => false);
      const hasLoginButton = await loginButton.isVisible().catch(() => false);
      
      return (hasLogout || hasUserMenu) && !hasLoginButton;
    } catch {
      return false;
    }
  };

  const getCurrentUser = async (): Promise<any | null> => {
    try {
      const response = await page.request.get('/api/auth/me');
      if (response.ok()) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  return {
    login,
    loginAsAdmin,
    loginAsReviewer,
    loginAsBasic,
    logout,
    isLoggedIn,
    getCurrentUser,
  };
}

export const test = base.extend<{ auth: AuthHelpers }>({
  auth: async ({ page }, use) => {
    const authHelpers = await createAuthHelpers(page);
    await use(authHelpers);
  },
});

export { expect };
