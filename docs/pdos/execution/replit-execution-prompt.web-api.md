# Replit Execution Prompt: Web + API PDOS

**Document ID:** EXEC-001  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Active

---

## Overview

This document provides the execution instructions for Replit Agent when working on the Mixology web + API application under PDOS governance.

---

## Pre-Execution Checklist

Before starting any work:

1. [ ] Read `docs/pdos/baseline/web-api-baseline-snapshot.md`
2. [ ] Identify the relevant `tasks.md` for the work item
3. [ ] Understand the scope (frozen baseline vs. delta work)
4. [ ] Confirm test infrastructure is available

---

## Non-Negotiable Test Enforcement

### ⚠️ MANDATORY TEST REQUIREMENTS ⚠️

The following rules are **non-negotiable** and must be followed for ALL changes:

---

### Rule 1: Every Behavior Change MUST Include Tests

```
✅ REQUIRED: Any code change that affects application behavior 
             MUST have corresponding tests (new or updated)

❌ FORBIDDEN: Merging behavior changes without test coverage
```

**What counts as a behavior change:**
- New features or endpoints
- Bug fixes
- UI changes visible to users
- API response changes
- Business logic modifications

**What does NOT require tests:**
- Documentation changes only
- Code comments only
- Dependency updates (unless behavior changes)

---

### Rule 2: Bug Fix Workflow

All bug fixes MUST follow this workflow:

```
1. Write failing test that reproduces the bug
   └── Test must fail initially, proving the bug exists

2. Fix the bug in application code
   └── Make minimal changes to fix the issue

3. Verify test passes
   └── Same test must now pass

4. Verify no regression
   └── Run full test suite
```

**Example:**
```typescript
// STEP 1: Failing test
it('should not allow negative ABV values', async () => {
  const response = await request(app)
    .post('/api/ingredients')
    .send({ name: 'Test', category: 'spirits', abv: -10 });
  
  expect(response.status).toBe(400); // FAILS if bug exists
});

// STEP 2: Fix the bug (in routes.ts)
// STEP 3: Run test again - should pass
// STEP 4: Run `npm test` - all tests should pass
```

---

### Rule 3: UI-Visible Changes Require Tests

```
✅ REQUIRED: Any change visible in the user interface 
             MUST have at least one E2E test

Examples requiring tests:
- New button or form element
- Changed text or labels
- Modified layout or styling (if functional)
- New page or route
- Modal or dialog changes
- Error message changes
```

---

### Rule 4: Never Delete Flaky Tests

```
❌ FORBIDDEN: Deleting a test because it's flaky

✅ REQUIRED: Fix the test to be deterministic
             OR replace with equivalent non-flaky test
```

**How to fix flaky tests:**
1. Identify the source of flakiness (timing, data, network)
2. Add appropriate waits or retries
3. Use deterministic test data
4. Mock external dependencies

---

### Rule 5: Run Full Test Suite Before Completion

```
Before declaring ANY task complete:

1. Run: npm test
2. Verify: All tests pass
3. Verify: No skipped tests (unless documented)
4. Verify: Coverage meets thresholds
```

---

### Rule 6: Mock All External Services

```
⚠️ CRITICAL: Do NOT run third-party integration tests by default

External services that MUST be mocked:
- OpenRouter (AI models)
- OCR services
- SMTP (email)
- Any external API

Only run real integration tests when:
- Task explicitly authorizes it
- User explicitly requests it
- Testing production deployment
```

**Mock Example:**
```typescript
// ✅ CORRECT: Mock OpenRouter
vi.mock('../lib/openrouter', () => ({
  callOpenRouter: vi.fn().mockResolvedValue({
    choices: [{ message: { content: 'Mocked response' } }]
  })
}));

// ❌ WRONG: Real API call in tests
const response = await fetch('https://openrouter.ai/api/...');
```

---

## Execution Workflow

### Starting a Task

1. **Claim the task** in tasks.md:
   ```
   [ ] WEB-020: Implement "What Can I Make?" toggle → [x] WEB-020: (IN PROGRESS)
   ```

2. **Read the spec** in the relevant spec-kit:
   ```
   docs/pdos/spec-kit/web-mvp-feature-sync/spec.md
   ```

3. **Implement the feature** following the spec

4. **Write tests** for the new functionality

5. **Run tests** and fix any failures:
   ```bash
   npm test
   ```

6. **Update task status** in tasks.md:
   ```
   [x] WEB-020: Implement "What Can I Make?" toggle (COMPLETE)
   ```

---

### Modifying Frozen Baseline

If you need to modify frozen baseline code:

1. **STOP** - This requires explicit authorization
2. Check if the task.md explicitly allows the modification
3. If not authorized, escalate to user:
   ```
   "This task requires modifying frozen baseline code at [file:line].
   This is not authorized in the current tasks.md.
   Should I proceed? This will require updating the baseline snapshot."
   ```

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types without justification
- All exports typed

### Testing
- Use `data-testid` for E2E selectors
- Descriptive test names
- Group related tests with `describe`
- One assertion concept per test

### Commits
- Conventional commit format
- Reference task ID: `feat(WEB-020): add What Can I Make filter`

---

## File Modification Rules

### ALLOWED to modify:
- `client/src/**` (frontend code)
- `server/**` (backend code)
- `shared/schema.ts` (with schema migration)
- `tests/**` (test files)

### FORBIDDEN to modify without authorization:
- `docs/pdos/baseline/**` (baseline snapshot)
- `vite.config.ts` (build config)
- `package.json` (use packager tool instead)
- `drizzle.config.ts` (DB config)

### READ-ONLY:
- `docs/pdos/prd/**` (PRDs)
- `docs/pdos/spec-kit/**/spec.md` (specs)

---

## Error Handling

### Test Failures

If tests fail after your changes:

1. Read the error message carefully
2. Check if it's your code or flaky test
3. Fix your code if it's a real failure
4. Fix/replace the test if it's flaky (don't delete)
5. Re-run full suite

### External Service Errors

If you get errors from external services in tests:

```
OpenRouter API Error: 401 Unauthorized
```

**Solution:** You're hitting a real API. Add a mock:
```typescript
vi.mock('../lib/openrouter', () => ({ ... }));
```

---

## Completion Checklist

Before marking a task complete:

- [ ] Feature implemented according to spec
- [ ] Tests written and passing
- [ ] No frozen baseline modifications (or authorized)
- [ ] Full test suite passes: `npm test`
- [ ] No lint errors
- [ ] Task status updated in tasks.md
- [ ] Documentation updated if needed

---

## Quick Reference

| Action | Command |
|--------|---------|
| Run all tests | `npm test` |
| Run specific test | `npm test -- auth.test.ts` |
| Run E2E tests | `npx playwright test` |
| Check coverage | `npm test -- --coverage` |
| Lint code | `npm run lint` |

---

## Contact & Escalation

If you encounter issues not covered by this document:

1. Check the relevant spec.md for guidance
2. Check the baseline snapshot for existing patterns
3. If still blocked, ask the user for clarification
