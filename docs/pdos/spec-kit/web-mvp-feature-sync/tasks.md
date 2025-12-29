# Tasks: Web MVP Feature Sync

**Spec-Kit:** web-mvp-feature-sync  
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
[ ] WEB-001: Set up Playwright E2E test configuration
    Priority: P1
    Estimate: 2h
    Dependencies: []
    Test Requirement: N/A (meta-task)

[ ] WEB-002: Create test utilities and fixtures
    Priority: P1
    Estimate: 3h
    Dependencies: [WEB-001]
    Test Requirement: N/A (meta-task)

[ ] WEB-003: Add E2E tests for critical user flows (auth, browse cocktails, view recipe)
    Priority: P1
    Estimate: 4h
    Dependencies: [WEB-002]
    Test Requirement: Required
```

---

## Phase 2: Core Enhancements

```
[ ] WEB-010: Implement consistent LoadingState component
    Priority: P1
    Estimate: 2h
    Dependencies: [WEB-003]
    Test Requirement: Required

[ ] WEB-011: Add skeleton loaders to CocktailList page
    Priority: P1
    Estimate: 1h
    Dependencies: [WEB-010]
    Test Requirement: Required

[ ] WEB-012: Add skeleton loaders to Ingredients page
    Priority: P1
    Estimate: 1h
    Dependencies: [WEB-010]
    Test Requirement: Required

[ ] WEB-013: Implement ErrorBoundary component
    Priority: P1
    Estimate: 2h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-014: Wrap route components with ErrorBoundary
    Priority: P1
    Estimate: 1h
    Dependencies: [WEB-013]
    Test Requirement: Required

[ ] WEB-020: Implement "What Can I Make?" toggle on CocktailList
    Priority: P1
    Estimate: 4h
    Dependencies: [WEB-003]
    Test Requirement: Required

[ ] WEB-021: Add visual match indicator to cocktail cards
    Priority: P2
    Estimate: 2h
    Dependencies: [WEB-020]
    Test Requirement: Required
```

---

## Phase 3: Search & Filters

```
[ ] WEB-030: Add ABV range filter to CocktailList
    Priority: P2
    Estimate: 2h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-031: Add ingredient count filter
    Priority: P2
    Estimate: 1h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-032: Persist filter state to URL query params
    Priority: P2
    Estimate: 2h
    Dependencies: [WEB-030, WEB-031]
    Test Requirement: Required

[ ] WEB-033: Add "Clear Filters" action
    Priority: P2
    Estimate: 1h
    Dependencies: [WEB-032]
    Test Requirement: Required
```

---

## Phase 4: Accessibility

```
[ ] WEB-040: Audit and fix keyboard navigation
    Priority: P2
    Estimate: 3h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-041: Add skip-to-content link
    Priority: P2
    Estimate: 1h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-042: Add ARIA labels to interactive elements
    Priority: P2
    Estimate: 2h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-043: Integrate axe-core accessibility testing
    Priority: P2
    Estimate: 2h
    Dependencies: [WEB-001]
    Test Requirement: Required
```

---

## Phase 5: Extended Features

```
[ ] WEB-050: Implement recipe scaling UI
    Priority: P2
    Estimate: 4h
    Dependencies: [API-020]
    Test Requirement: Required

[ ] WEB-051: Add print-friendly recipe view
    Priority: P3
    Estimate: 3h
    Dependencies: []
    Test Requirement: Required

[ ] WEB-052: Implement shopping list generation
    Priority: P2
    Estimate: 4h
    Dependencies: [WEB-020]
    Test Requirement: Required
```

---

## Completion Checklist

- [ ] All P1 tasks completed
- [ ] All required tests passing
- [ ] No regression in existing functionality
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Lighthouse scores verified

---

## Notes

- Tasks marked with `Test Requirement: Required` MUST include tests before marking complete
- Dependencies must be completed before starting dependent tasks
- Estimates are initial; update as work progresses
