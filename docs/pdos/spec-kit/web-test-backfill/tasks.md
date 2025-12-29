# Tasks: Web Test Backfill

**Spec-Kit:** web-test-backfill  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Backlog

---

## Task Format

```
[ ] TASK-ID: Description
    Priority: P1/P2/P3
    Estimate: Xh
    Dependencies: [TASK-IDs]
```

---

## Phase 1: Infrastructure

```
[x] WTEST-001: Configure Playwright with TypeScript
    Priority: P1
    Estimate: 2h
    Dependencies: []
    COMPLETED: 2025-12-29
    - Created playwright.config.ts with TypeScript, Chromium project, baseURL localhost:5000
    - Created e2e/ directory structure (e2e/fixtures/, e2e/pages/)
    - Created e2e/fixtures/base.ts with global network tripwire fixture:
      * Allows localhost/127.0.0.1 and app baseURL
      * Stubs fonts.googleapis.com, replit.com/public, cdnjs with empty responses
      * BLOCKS dangerous APIs: openrouter.ai, api.openai.com, youtube.com/api
    - Created e2e/example.spec.ts with 3 smoke tests (all passing)
    - Installed @playwright/test package + system deps (glib, nss, gtk3, etc.)
    - Files: playwright.config.ts, e2e/fixtures/base.ts, e2e/example.spec.ts

[x] WTEST-002: Create page object models for core pages
    Priority: P1
    Estimate: 3h
    Dependencies: [WTEST-001]
    COMPLETED: 2025-12-29
    - Created 8 page object models in e2e/pages/:
      * home.page.ts - HomePage (search, navigation, cocktail/ingredient cards)
      * login.page.ts - LoginPage (email, password, submit, error)
      * register.page.ts - RegisterPage (username, email, password, confirm)
      * cocktails.page.ts - CocktailsPage (search, filter, cocktail cards)
      * cocktail-detail.page.ts - CocktailDetailPage (title, ingredients, instructions)
      * ingredients.page.ts - IngredientsPage (search, filter, ingredient cards)
      * my-bar.page.ts - MyBarPage (ingredient list, categories, cocktail count)
      * admin.page.ts - AdminPage (user list, search, role filter)
    - Created e2e/pages/index.ts barrel export
    - All page objects use flexible locators (data-testid OR fallback selectors)
    - Tests still passing (3/3)

[x] WTEST-003: Set up test fixtures (users, cocktails, ingredients)
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-001]
    COMPLETED: 2025-12-29
    - Created e2e/fixtures/test-data.ts:
      * testUsers (admin, reviewer, basic, newUser factory)
      * testCocktails (margarita, mojito, oldFashioned)
      * testIngredients (tequila, lime, mint, bourbon, bitters)
      * testBrands (patronSilver, makersMarkTest)
      * generateUniqueEmail() and generateUniqueUsername() helpers
    - Created e2e/fixtures/api-helpers.ts:
      * apiLogin, apiRegister, apiLogout
      * apiGetCocktails, apiGetIngredients
      * apiCreateCocktail, apiDeleteCocktail
      * apiCreateIngredient, apiDeleteIngredient
      * apiHealthCheck
    - Tests still passing (3/3)

[x] WTEST-004: Create auth helper utilities (login, logout functions)
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-002]
    COMPLETED: 2025-12-29
    - Created e2e/fixtures/auth.ts with Playwright fixture extension:
      * login(email, password) - browser-based login flow
      * loginAsAdmin() - quick admin login
      * loginAsReviewer() - quick reviewer login
      * loginAsBasic() - quick basic user login
      * logout() - logout flow with fallback cookie clear
      * isLoggedIn() - check login state via DOM
      * getCurrentUser() - API call to get current user
    - Auth fixture extends base fixture with network tripwire
    - Tests still passing (3/3)

[x] WTEST-005: Configure test environment isolation
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-001]
    COMPLETED: 2025-12-29
    - Created e2e/fixtures/isolation.ts:
      * TestIsolation fixture with unique test IDs
      * generateUniqueEmail/Username per test
      * Cleanup task registration and execution
      * Fresh browser context per test with cookie clearing
      * withFreshContext() helper for isolated test sessions
      * saveAuthState/loadAuthState for session persistence
    - Created e2e/fixtures/index.ts barrel export:
      * Exports baseTest, authTest, and isolation test
      * Exports all test data and API helpers
    - Tests still passing (3/3)
```

---

## Phase 2: Authentication Tests

```
[ ] WTEST-010: Write login flow tests (success + failure)
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-004]

[ ] WTEST-011: Write registration flow tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-004]

[ ] WTEST-012: Write logout flow tests
    Priority: P1
    Estimate: 1h
    Dependencies: [WTEST-010]

[ ] WTEST-013: Write password reset flow tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-004]

[ ] WTEST-014: Write protected route access tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-010]

[ ] WTEST-015: Write token refresh tests
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-010]
```

---

## Phase 3: Core Feature Tests

```
[ ] WTEST-020: Write cocktail browsing tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-003]

[ ] WTEST-021: Write cocktail search tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-020]

[ ] WTEST-022: Write cocktail filter tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-020]

[ ] WTEST-023: Write recipe detail page tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-020]

[ ] WTEST-024: Write ingredient browsing tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-003]

[ ] WTEST-025: Write ingredient filter tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-024]

[ ] WTEST-026: Write ingredient detail page tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-024]
```

---

## Phase 4: User Feature Tests

```
[ ] WTEST-030: Write My Bar view tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-014]

[ ] WTEST-031: Write My Bar add/remove tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-030]

[ ] WTEST-032: Write Preferred Brands CRUD tests
    Priority: P1
    Estimate: 3h
    Dependencies: [WTEST-014]

[ ] WTEST-033: Write brand-ingredient association tests
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-032]
```

---

## Phase 5: Admin Feature Tests

```
[ ] WTEST-040: Write admin dashboard access tests
    Priority: P1
    Estimate: 2h
    Dependencies: [WTEST-014]

[ ] WTEST-041: Write user management tests
    Priority: P1
    Estimate: 3h
    Dependencies: [WTEST-040]

[ ] WTEST-042: Write cocktail CRUD tests (admin)
    Priority: P2
    Estimate: 3h
    Dependencies: [WTEST-040]

[ ] WTEST-043: Write ingredient CRUD tests (admin)
    Priority: P2
    Estimate: 3h
    Dependencies: [WTEST-040]

[ ] WTEST-044: Write batch operations tests
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-040]
```

---

## Phase 6: Edge Cases & Quality

```
[ ] WTEST-050: Write error handling tests
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-020]

[ ] WTEST-051: Write network failure recovery tests
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-020]

[ ] WTEST-052: Integrate axe-core accessibility testing
    Priority: P2
    Estimate: 2h
    Dependencies: [WTEST-001]

[ ] WTEST-053: Add visual regression snapshots
    Priority: P3
    Estimate: 3h
    Dependencies: [WTEST-020]
```

---

## Completion Checklist

- [ ] All P1 tests written and passing
- [ ] No flaky tests in suite
- [ ] Test run time <5 minutes
- [ ] CI configuration documented
- [ ] Test coverage report generated
