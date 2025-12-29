# Specification: API Test Backfill

**Spec-Kit:** api-test-backfill  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Draft

---

## 1. Test Coverage Matrix

### 1.1 Authentication Endpoints

| Endpoint | Test Cases |
|----------|------------|
| POST /api/auth/register | Valid input, duplicate email, weak password, missing fields |
| POST /api/auth/login | Valid credentials, invalid email, invalid password, inactive user |
| POST /api/auth/logout | With valid session, without session, invalid token |
| POST /api/auth/refresh | Valid refresh token, expired token, invalid token |
| POST /api/auth/forgot-password | Valid email, unknown email, rate limiting |
| POST /api/auth/reset-password | Valid token, expired token, invalid token, weak password |
| GET /api/auth/me | Authenticated, unauthenticated, expired token |
| DELETE /api/auth/account | Authenticated, wrong password, rate limiting |

### 1.2 Cocktails Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/cocktails | No filters, with search, with tags, pagination |
| GET /api/cocktails/:id | Valid ID, invalid ID, non-existent ID |
| POST /api/cocktails | Valid input, missing fields, invalid ingredients, auth required |
| PATCH /api/cocktails/:id | Valid update, invalid ID, auth required, role check |
| DELETE /api/cocktails/:id | Valid delete, invalid ID, auth required, role check |
| POST /api/cocktails/:id/toggle-featured | Toggle on, toggle off, role check |
| POST /api/cocktails/:id/increment-popularity | Increment works |

### 1.3 Ingredients Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/ingredients | No filters, with search, with category, pagination |
| GET /api/ingredients/:id | Valid ID, invalid ID, non-existent ID |
| POST /api/ingredients | Valid input, missing fields, auth required |
| PATCH /api/ingredients/:id | Valid update, invalid ID, auth required |
| DELETE /api/ingredients/:id | Valid delete, auth required |

### 1.4 Tags Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/tags | All tags, most used, recent |
| POST /api/tags | Valid input, duplicate name, auth required |
| DELETE /api/tags/:id | Valid delete, in-use tag, auth required |

### 1.5 My Bar Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/mybar | With items, empty, unauthenticated |
| POST /api/mybar | Add ingredient, add brand, duplicate, auth required |
| DELETE /api/mybar/:id | Valid delete, not owned, auth required |

### 1.6 Preferred Brands Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/preferred-brands | User's brands only |
| GET /api/preferred-brands/:id | Valid ID, not owned |
| POST /api/preferred-brands | Valid input, auth required |
| PATCH /api/preferred-brands/:id | Valid update, not owned |
| DELETE /api/preferred-brands/:id | Valid delete, not owned |

### 1.7 Admin Endpoints

| Endpoint | Test Cases |
|----------|------------|
| GET /api/admin/users | Admin only, pagination |
| PATCH /api/admin/users/:id/role | Valid role change, self-role-change, non-admin |
| PATCH /api/admin/users/:id/status | Activate, deactivate, non-admin |
| POST /api/admin/batch/preview | Valid query, invalid query, admin-key required |
| POST /api/admin/batch/commit | Valid commit, admin-key required |

### 1.8 AI/External Endpoints

| Endpoint | Test Cases | Mock? |
|----------|------------|-------|
| POST /api/ai/brands/from-image | Valid image, invalid image | Yes |
| POST /api/openrouter | Valid request, rate limit | Yes |
| POST /api/mixi/chat | Streaming response | Yes |
| POST /api/scrape-url | Valid URL, invalid URL, blocked domain | Yes |
| POST /api/youtube-transcript | Valid URL, no captions | Yes |

---

## 2. Test File Structure

```
server/
├── __tests__/
│   ├── routes/
│   │   ├── auth.test.ts
│   │   ├── cocktails.test.ts
│   │   ├── ingredients.test.ts
│   │   ├── tags.test.ts
│   │   ├── mybar.test.ts
│   │   ├── preferred-brands.test.ts
│   │   ├── admin.test.ts
│   │   └── ai.test.ts
│   ├── middleware/
│   │   ├── requireAuth.test.ts
│   │   └── rateLimiter.test.ts
│   ├── lib/
│   │   ├── auth.test.ts
│   │   └── passwordReset.test.ts
│   ├── fixtures/
│   │   ├── users.ts
│   │   ├── cocktails.ts
│   │   └── ingredients.ts
│   └── utils/
│       ├── testApp.ts
│       └── mockStorage.ts
```

---

## 3. Test Utilities

### 3.1 Test App Setup

```typescript
// utils/testApp.ts
import express from 'express';
import { registerRoutes } from '../../routes';
import { createMockStorage } from './mockStorage';

export function createTestApp() {
  const app = express();
  const storage = createMockStorage();
  
  app.use(express.json());
  registerRoutes(app, storage);
  
  return { app, storage };
}
```

### 3.2 Mock Storage

```typescript
// utils/mockStorage.ts
import type { IStorage } from '../../storage';

export function createMockStorage(): IStorage {
  const users = new Map();
  const cocktails = new Map();
  // ... other collections

  return {
    getUserById: async (id) => users.get(id),
    createUser: async (data) => {
      const user = { id: users.size + 1, ...data };
      users.set(user.id, user);
      return user;
    },
    // ... implement all IStorage methods
  };
}
```

### 3.3 Auth Helpers

```typescript
// utils/auth.ts
export async function getAuthCookies(
  app: Express,
  email: string,
  password: string
): Promise<string[]> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.headers['set-cookie'];
}
```

---

## 4. Example Test File

```typescript
// routes/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../utils/testApp';

describe('POST /api/auth/register', () => {
  let app: Express;
  let storage: MockStorage;

  beforeEach(() => {
    ({ app, storage } = createTestApp());
  });

  it('registers a new user with valid input', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it('returns error for duplicate email', async () => {
    // Create existing user
    await storage.createUser({
      email: 'existing@example.com',
      password_hash: 'hash',
      role: 'basic',
      is_active: true
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existing@example.com',
        password: 'Password123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
  });

  it('validates password strength', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: '123' // too weak
      });

    expect(response.status).toBe(400);
  });
});
```

---

## 5. Mocking External Services

```typescript
// utils/mocks.ts
import { vi } from 'vitest';

export function mockOpenRouter() {
  return vi.fn().mockResolvedValue({
    choices: [{ message: { content: 'Mocked response' } }]
  });
}

export function mockMailer() {
  return {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true)
  };
}
```

---

## 6. Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['server/**/*.ts'],
      exclude: ['server/__tests__/**', 'server/types/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90
      }
    }
  }
});
```
