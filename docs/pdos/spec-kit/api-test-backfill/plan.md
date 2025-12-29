# Plan: API Test Backfill

**Spec-Kit:** api-test-backfill  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Planning

---

## 1. Objective

Backfill comprehensive test coverage for the existing API backend baseline features without modifying any application code.

---

## 2. Approach

### Phase 1: Infrastructure Setup (Week 1)
- Configure Vitest + supertest for API testing
- Set up mock storage layer
- Create test utilities and helpers

### Phase 2: Auth & Security Tests (Week 2)
- Authentication endpoints
- Authorization middleware
- Rate limiting validation

### Phase 3: CRUD Endpoint Tests (Week 3-4)
- Cocktails API
- Ingredients API
- Tags API
- Preferred Brands API
- My Bar API

### Phase 4: Admin & AI Tests (Week 5)
- Admin endpoints
- Batch operations
- AI proxy endpoints (mocked)

---

## 3. Testing Strategy

| Test Type | Tool | Coverage Target |
|-----------|------|-----------------|
| Unit Tests | Vitest | Utility functions, validators |
| Integration Tests | Vitest + supertest | All API endpoints |
| Contract Tests | Zod schemas | Request/response validation |
| Security Tests | Custom | Auth, RBAC, rate limits |

---

## 4. Mock Strategy

- Mock Firestore operations with in-memory storage
- Mock external APIs (OpenRouter, SMTP) entirely
- Use factory functions for test data generation

---

## 5. Success Criteria

- [ ] 90%+ line coverage for routes
- [ ] All endpoints have happy path + error tests
- [ ] No flaky tests
- [ ] Tests run in <30 seconds
- [ ] CI integration ready
