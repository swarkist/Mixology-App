# Tasks: API MVP Feature Sync

**Spec-Kit:** api-mvp-feature-sync  
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
    Test Requirement: Required/Optional
```

---

## Phase 1: Testing Infrastructure

```
[ ] API-001: Set up Vitest + supertest for API testing
    Priority: P1
    Estimate: 2h
    Dependencies: []
    Test Requirement: N/A (meta-task)

[ ] API-002: Create API test utilities and mock storage
    Priority: P1
    Estimate: 3h
    Dependencies: [API-001]
    Test Requirement: N/A (meta-task)

[ ] API-003: Add integration tests for existing auth endpoints
    Priority: P1
    Estimate: 4h
    Dependencies: [API-002]
    Test Requirement: Required

[ ] API-004: Add integration tests for existing cocktails endpoints
    Priority: P1
    Estimate: 3h
    Dependencies: [API-002]
    Test Requirement: Required

[ ] API-005: Add integration tests for existing ingredients endpoints
    Priority: P1
    Estimate: 3h
    Dependencies: [API-002]
    Test Requirement: Required
```

---

## Phase 2: Performance

```
[ ] API-010: Implement in-memory cache service
    Priority: P1
    Estimate: 3h
    Dependencies: []
    Test Requirement: Required

[ ] API-011: Add caching to GET /api/cocktails
    Priority: P1
    Estimate: 2h
    Dependencies: [API-010]
    Test Requirement: Required

[ ] API-012: Add caching to GET /api/ingredients
    Priority: P1
    Estimate: 1h
    Dependencies: [API-010]
    Test Requirement: Required

[ ] API-013: Add caching to GET /api/tags
    Priority: P1
    Estimate: 1h
    Dependencies: [API-010]
    Test Requirement: Required

[ ] API-014: Implement cache invalidation on writes
    Priority: P1
    Estimate: 2h
    Dependencies: [API-011, API-012, API-013]
    Test Requirement: Required

[ ] API-015: Add X-Cache response headers
    Priority: P2
    Estimate: 1h
    Dependencies: [API-010]
    Test Requirement: Required
```

---

## Phase 3: Core Features

```
[ ] API-020: Implement cocktails by My Bar filtering
    Priority: P1
    Estimate: 4h
    Dependencies: [API-004]
    Test Requirement: Required

[ ] API-021: Add match info to cocktails response
    Priority: P1
    Estimate: 2h
    Dependencies: [API-020]
    Test Requirement: Required

[ ] API-022: Implement ABV range filter for cocktails
    Priority: P2
    Estimate: 2h
    Dependencies: [API-004]
    Test Requirement: Required

[ ] API-023: Implement ingredient count filter
    Priority: P2
    Estimate: 2h
    Dependencies: [API-004]
    Test Requirement: Required

[ ] API-024: Create recipe scaling endpoint
    Priority: P2
    Estimate: 3h
    Dependencies: [API-004]
    Test Requirement: Required

[ ] API-025: Handle non-numeric scaling gracefully
    Priority: P2
    Estimate: 1h
    Dependencies: [API-024]
    Test Requirement: Required
```

---

## Phase 4: Security & Polish

```
[ ] API-030: Enhance audit logging with more detail
    Priority: P2
    Estimate: 3h
    Dependencies: []
    Test Requirement: Required

[ ] API-031: Add session listing endpoint
    Priority: P3
    Estimate: 2h
    Dependencies: [API-003]
    Test Requirement: Required

[ ] API-032: Add session revocation endpoint
    Priority: P3
    Estimate: 2h
    Dependencies: [API-031]
    Test Requirement: Required

[ ] API-033: Standardize error response format
    Priority: P2
    Estimate: 2h
    Dependencies: []
    Test Requirement: Required

[ ] API-034: Add request validation middleware
    Priority: P1
    Estimate: 2h
    Dependencies: []
    Test Requirement: Required
```

---

## Phase 5: Documentation

```
[ ] API-040: Generate OpenAPI specification
    Priority: P2
    Estimate: 4h
    Dependencies: []
    Test Requirement: Optional

[ ] API-041: Add inline JSDoc comments to routes
    Priority: P3
    Estimate: 3h
    Dependencies: []
    Test Requirement: Optional
```

---

## Completion Checklist

- [ ] All P1 tasks completed
- [ ] All required tests passing
- [ ] No regression in existing endpoints
- [ ] Code reviewed and approved
- [ ] Response times verified (<200ms p95)
- [ ] Documentation updated

---

## Notes

- Tasks marked with `Test Requirement: Required` MUST include tests before marking complete
- All new endpoints MUST have corresponding integration tests
- Mock external services (OpenRouter, SMTP) in tests
- Dependencies must be completed before starting dependent tasks
