# Specification: Web Test Backfill

**Spec-Kit:** web-test-backfill  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Draft

---

## 1. Test Coverage Matrix

### 1.1 Authentication Flows

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| User registration | P1 | Form validation, success redirect, error handling |
| User login | P1 | Correct credentials, invalid credentials, session created |
| User logout | P1 | Session cleared, redirect to login |
| Password reset request | P1 | Email sent confirmation, rate limiting |
| Password reset completion | P1 | Token validation, password updated |
| Token refresh | P1 | Access token refreshed automatically |
| Protected route access | P1 | Redirect to login when unauthenticated |

### 1.2 Navigation & Routing

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| Home page loads | P1 | Hero section, featured cocktails, navigation |
| Navigate to Cocktails | P1 | List renders, search works |
| Navigate to Recipe | P1 | Details display, ingredients list |
| Navigate to Ingredients | P1 | List renders, categories work |
| Navigate to My Bar | P1 | Auth required, items display |
| Navigate to Admin | P1 | Role check, dashboard displays |
| 404 handling | P2 | Unknown routes show error |

### 1.3 Cocktail Features

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| Browse cocktails | P1 | List displays, pagination works |
| Search cocktails | P1 | Results match query |
| Filter by tags | P1 | Filtered results correct |
| View recipe | P1 | All sections render |
| Popularity click | P2 | Counter increments |
| Share recipe | P2 | Share modal opens |

### 1.4 Ingredient Features

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| Browse ingredients | P1 | List displays with categories |
| Filter by category | P1 | Filtered results correct |
| Search ingredients | P1 | Results match query |
| View ingredient | P1 | Details and recipes display |

### 1.5 My Bar Features

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| View My Bar | P1 | Items display correctly |
| Add ingredient to bar | P1 | Item added, UI updates |
| Remove from bar | P1 | Item removed, UI updates |
| Add brand to bar | P2 | Brand added, UI updates |

### 1.6 Preferred Brands

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| View brands list | P1 | User's brands display |
| Add new brand | P1 | Form validates, brand created |
| Edit brand | P1 | Changes saved |
| Delete brand | P1 | Brand removed with confirmation |
| Associate ingredients | P2 | Associations saved |

### 1.7 Admin Features

| Test Case | Priority | Assertions |
|-----------|----------|------------|
| Access admin dashboard | P1 | Role check works |
| View user list | P1 | Users display |
| Update user role | P1 | Role changes |
| Update user status | P1 | Status changes |
| Create cocktail | P2 | Form works, cocktail created |
| Edit cocktail | P2 | Changes saved |
| Create ingredient | P2 | Form works, ingredient created |

---

## 2. Test File Structure

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   ├── logout.spec.ts
│   │   └── password-reset.spec.ts
│   ├── cocktails/
│   │   ├── browse.spec.ts
│   │   ├── search.spec.ts
│   │   ├── recipe.spec.ts
│   │   └── filters.spec.ts
│   ├── ingredients/
│   │   ├── browse.spec.ts
│   │   └── detail.spec.ts
│   ├── mybar/
│   │   ├── view.spec.ts
│   │   └── manage.spec.ts
│   ├── brands/
│   │   └── crud.spec.ts
│   └── admin/
│       ├── dashboard.spec.ts
│       └── users.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── cocktails.ts
│   └── ingredients.ts
└── utils/
    ├── auth.ts
    └── api-mocks.ts
```

---

## 3. Page Object Pattern

```typescript
// Example: LoginPage
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.page.getByTestId('input-email').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByTestId('input-password').fill(password);
  }

  async submit() {
    await this.page.getByTestId('button-submit').click();
  }

  async expectError(message: string) {
    await expect(this.page.getByTestId('text-error')).toContainText(message);
  }

  async expectRedirectTo(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
```

---

## 4. Fixture Examples

```typescript
// fixtures/users.ts
export const testUsers = {
  basic: {
    email: 'test-basic@example.com',
    password: 'TestPassword123!',
    role: 'basic'
  },
  admin: {
    email: 'test-admin@example.com',
    password: 'AdminPassword123!',
    role: 'admin'
  }
};

// fixtures/cocktails.ts
export const testCocktails = {
  oldFashioned: {
    id: 1,
    name: 'Old Fashioned',
    ingredients: ['Bourbon', 'Sugar', 'Bitters']
  }
};
```

---

## 5. Test Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
```

---

## 6. Test Tagging

```typescript
test('user can login @critical @auth', async ({ page }) => {
  // ...
});

test('admin can create cocktail @admin', async ({ page }) => {
  // ...
});
```

**Tags:**
- `@critical` - Must pass for deployment
- `@auth` - Authentication related
- `@admin` - Admin functionality
- `@smoke` - Quick sanity checks
