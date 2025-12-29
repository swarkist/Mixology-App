# Tasks: API Test Backfill

**Spec-Kit:** api-test-backfill  
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
[ ] ATEST-001: Configure Vitest for server testing
    Priority: P1
    Estimate: 2h
    Dependencies: []

[ ] ATEST-002: Set up supertest for HTTP assertions
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-001]

[ ] ATEST-003: Create mock storage implementation
    Priority: P1
    Estimate: 4h
    Dependencies: [ATEST-001]

[ ] ATEST-004: Create test app factory
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-002, ATEST-003]

[ ] ATEST-005: Create auth helper utilities
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-004]

[ ] ATEST-006: Create test data fixtures
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-003]
```

---

## Phase 2: Authentication Tests

```
[ ] ATEST-010: Write POST /api/auth/register tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-005]

[ ] ATEST-011: Write POST /api/auth/login tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-005]

[ ] ATEST-012: Write POST /api/auth/logout tests
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-011]

[ ] ATEST-013: Write POST /api/auth/refresh tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-011]

[ ] ATEST-014: Write password reset flow tests
    Priority: P1
    Estimate: 3h
    Dependencies: [ATEST-005]

[ ] ATEST-015: Write GET /api/auth/me tests
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-011]

[ ] ATEST-016: Write DELETE /api/auth/account tests
    Priority: P2
    Estimate: 2h
    Dependencies: [ATEST-011]
```

---

## Phase 3: Middleware Tests

```
[ ] ATEST-020: Write requireAuth middleware tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-005]

[ ] ATEST-021: Write requireAdmin middleware tests
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-020]

[ ] ATEST-022: Write allowRoles middleware tests
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-020]

[ ] ATEST-023: Write rate limiter tests
    Priority: P2
    Estimate: 2h
    Dependencies: [ATEST-004]
```

---

## Phase 4: CRUD Endpoint Tests

```
[ ] ATEST-030: Write cocktails GET tests
    Priority: P1
    Estimate: 3h
    Dependencies: [ATEST-006]

[ ] ATEST-031: Write cocktails POST/PATCH/DELETE tests
    Priority: P1
    Estimate: 3h
    Dependencies: [ATEST-030, ATEST-020]

[ ] ATEST-032: Write ingredients GET tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-006]

[ ] ATEST-033: Write ingredients POST/PATCH/DELETE tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-032, ATEST-020]

[ ] ATEST-034: Write tags CRUD tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-006, ATEST-020]

[ ] ATEST-035: Write mybar CRUD tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-006, ATEST-020]

[ ] ATEST-036: Write preferred-brands CRUD tests
    Priority: P1
    Estimate: 3h
    Dependencies: [ATEST-006, ATEST-020]
```

---

## Phase 5: Admin Endpoint Tests

```
[ ] ATEST-040: Write admin user list tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-021]

[ ] ATEST-041: Write admin role update tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-040]

[ ] ATEST-042: Write admin status update tests
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-040]

[ ] ATEST-043: Write batch operations tests
    Priority: P2
    Estimate: 3h
    Dependencies: [ATEST-040]
```

---

## Phase 6: External Service Tests

```
[ ] ATEST-050: Create OpenRouter mock
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-004]

[ ] ATEST-051: Write AI endpoint tests (with mocks)
    Priority: P1
    Estimate: 2h
    Dependencies: [ATEST-050]

[ ] ATEST-052: Write scrape-url tests (with mocks)
    Priority: P2
    Estimate: 2h
    Dependencies: [ATEST-004]

[ ] ATEST-053: Write youtube-transcript tests (with mocks)
    Priority: P2
    Estimate: 2h
    Dependencies: [ATEST-004]
```

---

## Phase 7: Coverage & CI

```
[ ] ATEST-060: Configure coverage thresholds
    Priority: P1
    Estimate: 1h
    Dependencies: [ATEST-001]

[ ] ATEST-061: Generate coverage report
    Priority: P2
    Estimate: 1h
    Dependencies: [ATEST-060]

[ ] ATEST-062: Document CI integration steps
    Priority: P2
    Estimate: 1h
    Dependencies: []
```

---

## Completion Checklist

- [ ] All P1 tests written and passing
- [ ] 90%+ coverage achieved
- [ ] No flaky tests in suite
- [ ] Tests run in <30 seconds
- [ ] Coverage report generated
