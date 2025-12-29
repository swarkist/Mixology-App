# PDOS Agent Definitions

**Document ID:** AGENTS-001  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Active

---

## 1. Overview

This document defines the agent roles and responsibilities for the PDOS governance process of the Mixology web + API application.

---

## 2. Agent Roles

### 2.1 Feature Agent

**Purpose:** Implement new features defined in PDOS tasks.md

**Responsibilities:**
- Read and understand the relevant PRD and spec
- Implement feature code following project conventions
- Write tests before marking task complete
- Update documentation as needed

**Constraints:**
- MUST NOT modify frozen baseline code without explicit authorization
- MUST include tests for any behavior change
- MUST follow existing code patterns and conventions

**Input:**
- Task from tasks.md with status "pending"
- Relevant spec.md content
- Existing codebase context

**Output:**
- Implemented feature code
- Test coverage for new code
- Task status update to "completed"

---

### 2.2 Test Agent

**Purpose:** Create and maintain test coverage

**Responsibilities:**
- Write E2E tests for user flows
- Write integration tests for API endpoints
- Write unit tests for utilities
- Maintain test infrastructure

**Constraints:**
- MUST NOT modify application code (test-only changes)
- MUST mock external services (no real API calls in tests)
- MUST ensure tests are deterministic (no flaky tests)

**Input:**
- Baseline snapshot for coverage targets
- spec.md for test specifications
- Application code (read-only)

**Output:**
- Test files in appropriate directories
- Test utilities and fixtures
- Coverage reports

---

### 2.3 Review Agent

**Purpose:** Review and validate changes

**Responsibilities:**
- Validate changes against spec requirements
- Check for regressions in existing functionality
- Verify test coverage
- Ensure code quality standards

**Constraints:**
- MUST NOT make code changes (review-only)
- MUST run full test suite before approval
- MUST flag any frozen baseline modifications

**Input:**
- Git diff of proposed changes
- Relevant tasks.md and spec.md
- Test results

**Output:**
- Review feedback (approve/request changes)
- List of concerns or issues
- Confirmation of test passage

---

### 2.4 Documentation Agent

**Purpose:** Maintain PDOS documentation

**Responsibilities:**
- Update baseline snapshot after approved changes
- Maintain PRD and spec documents
- Track task completion in tasks.md
- Generate change logs

**Constraints:**
- MUST NOT modify application code
- MUST NOT change task status without Review Agent approval
- MUST maintain document version history

**Input:**
- Approved changes from Review Agent
- Task completion status
- New feature requirements

**Output:**
- Updated documentation files
- Change log entries
- Version updates

---

## 3. Agent Workflow

```
┌────────────────────────────────────────────────────────────────┐
│                     PDOS Agent Workflow                         │
└────────────────────────────────────────────────────────────────┘

1. Task Assignment
   ┌─────────────┐
   │ tasks.md    │──────► Feature Agent picks "pending" task
   └─────────────┘

2. Implementation
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │ Read spec   │──────► Implement   │──────► Write tests │
   └─────────────┘      └─────────────┘      └─────────────┘

3. Review
   ┌─────────────┐      ┌─────────────┐
   │ Run tests   │──────► Review      │──────► Approve/Reject
   └─────────────┘      │ Agent       │
                        └─────────────┘

4. Documentation
   ┌─────────────┐      ┌─────────────┐
   │ Update docs │──────► Update      │
   └─────────────┘      │ tasks.md    │
                        └─────────────┘
```

---

## 4. Agent Communication Protocol

### 4.1 Task Handoff

```
Feature Agent → Test Agent:
  "Task WEB-020 implemented. Please verify test coverage."

Test Agent → Review Agent:
  "Tests written for WEB-020. 95% coverage achieved."

Review Agent → Documentation Agent:
  "WEB-020 approved. Please update baseline."
```

### 4.2 Escalation

If an agent encounters a blocker:

1. Document the issue clearly
2. Escalate to human operator if:
   - Frozen baseline modification needed
   - Spec clarification required
   - External service issue

---

## 5. Agent Configuration

### 5.1 Feature Agent Config

```yaml
agent: feature
allowed_paths:
  - client/src/**
  - server/**
  - shared/**
forbidden_paths:
  - docs/pdos/baseline/**  # Read-only
  - *.config.*             # Config files
required_outputs:
  - code_changes
  - test_files
```

### 5.2 Test Agent Config

```yaml
agent: test
allowed_paths:
  - client/src/__tests__/**
  - server/__tests__/**
  - tests/**
forbidden_paths:
  - client/src/pages/**
  - server/routes/**
required_outputs:
  - test_files
  - coverage_report
```

### 5.3 Review Agent Config

```yaml
agent: review
allowed_paths: []  # Read-only for all
required_inputs:
  - git_diff
  - test_results
  - task_reference
required_outputs:
  - review_decision
  - feedback
```

### 5.4 Documentation Agent Config

```yaml
agent: documentation
allowed_paths:
  - docs/**
  - replit.md
forbidden_paths:
  - client/**
  - server/**
required_outputs:
  - updated_docs
  - changelog
```

---

## 6. Quality Gates

### 6.1 Before Implementation

- [ ] Task exists in tasks.md
- [ ] Spec is complete and approved
- [ ] Dependencies are satisfied

### 6.2 Before Review

- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] No lint errors
- [ ] No frozen baseline changes (unless authorized)

### 6.3 Before Merge

- [ ] Review Agent approved
- [ ] Full test suite passes
- [ ] Documentation updated
- [ ] Task status updated
