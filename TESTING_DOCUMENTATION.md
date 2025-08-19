# Authentication & Role-Based Access Control Testing Documentation

## Overview

This document outlines the comprehensive testing infrastructure for authentication rules and role-based access control (RBAC) across both frontend and backend components of the Mixology application.

## Test Structure

### Directory Organization
```
tests/
├── setup.ts                          # Global test configuration
├── auth/
│   └── authentication.test.ts        # Core authentication system tests
├── api/
│   └── role-based-endpoints.test.ts  # API endpoint permission tests
├── ui/
│   └── user-features-visibility.test.ts # Frontend UI access control tests
├── regression/
│   └── ui-filtering-consistency.test.ts # Regression tests for consistency
└── run-all-tests.sh                  # Test runner script
```

## Testing Categories

### 1. Authentication System Tests (`tests/auth/authentication.test.ts`)

**Purpose**: Validate core authentication functionality across the application.

**Test Coverage**:
- API endpoint authentication requirements
- Public vs. protected route access
- Role-based permission enforcement
- User-specific feature access control
- Global content accessibility
- Data isolation between users
- Security header validation

**Key Scenarios**:
- Unauthenticated access to protected routes (should return 401)
- Public access to global content (cocktails, ingredients)
- Basic user permission restrictions
- Reviewer read-only admin access
- Admin full access validation
- My Bar and Preferred Brands authentication requirements

### 2. Role-Based API Endpoints (`tests/api/role-based-endpoints.test.ts`)

**Purpose**: Comprehensive validation of API endpoint permissions by user role.

**Test Coverage**:
- Authentication required endpoints
- Public access endpoints
- Basic user permissions and restrictions
- Reviewer user permissions (read admin views, edit content)
- Admin user full access
- Data isolation verification
- Security header validation

**User Role Matrix**:
```
| Feature                  | Public | Basic | Reviewer | Admin |
|--------------------------|--------|--------|----------|-------|
| View Cocktails/Ingredients| ✓     | ✓      | ✓        | ✓     |
| My Bar Access            | ✗     | ✓      | ✓        | ✓     |
| Preferred Brands         | ✗     | ✓      | ✓        | ✓     |
| Edit Content             | ✗     | ✗      | ✓        | ✓     |
| Admin Views              | ✗     | ✗      | ✓        | ✓     |
| Admin Operations         | ✗     | ✗      | ✗        | ✓     |
```

### 3. User Features Visibility (`tests/ui/user-features-visibility.test.ts`)

**Purpose**: Ensure frontend UI properly shows/hides features based on authentication status and user role.

**Test Coverage**:
- My Bar feature visibility controls
- Preferred Brands section visibility
- Global content accessibility
- Admin features visibility
- Edit access control
- Role-based content access validation

**Key Rules Tested**:
- User-specific features (My Bar, Preferred Brands) hidden for logged-out users
- Global content (cocktails, ingredients, chat) always visible
- Admin features only visible to admin users
- Edit access only for reviewer and admin users

### 4. UI Filtering Consistency (`tests/regression/ui-filtering-consistency.test.ts`)

**Purpose**: Prevent regression in filtering behavior and ensure consistency across pages.

**Test Coverage**:
- Search and filter state management
- Filter clearing functionality
- Cross-page filter consistency
- Empty state handling
- Pagination state management
- Performance regression detection
- API endpoint data structure validation
- Cross-platform behavior consistency

## Access Control Rules

### Authentication Rules
1. **Public Access**: Cocktails, ingredients, individual recipe pages, chat bot, featured/popular content
2. **Authentication Required**: My Bar, Preferred Brands, user profile, logout functionality
3. **Admin Only**: User management, system analytics, admin operations

### Role-Based Permissions
1. **Basic Users**:
   - Access personal features (My Bar, Preferred Brands)
   - View all global content
   - No content editing permissions
   - No admin access

2. **Reviewer Users**:
   - All basic user permissions
   - Read-only access to admin views
   - Content editing permissions (cocktails, ingredients)
   - No admin operations (user management, deletions)

3. **Admin Users**:
   - Full system access
   - All content operations (create, edit, delete)
   - User management capabilities
   - System administration features

### User-Specific Features
- **My Bar**: Personal ingredient inventory tracking
- **Preferred Brands**: User's brand preferences for ingredients
- Both features require authentication and are isolated per user

## Running Tests

### Individual Test Suites
```bash
# Authentication system tests
npm test tests/auth/authentication.test.ts

# API endpoint tests
npm test tests/api/role-based-endpoints.test.ts

# UI visibility tests
npm test tests/ui/user-features-visibility.test.ts

# Regression tests
npm test tests/regression/ui-filtering-consistency.test.ts
```

### All Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Use test runner script
chmod +x tests/run-all-tests.sh
./tests/run-all-tests.sh
```

## Test Configuration

### Environment Setup (`tests/setup.ts`)
- Mock environment variables for testing
- Firebase service account configuration
- Web API mocks (ResizeObserver, IntersectionObserver)
- Global cleanup and setup hooks

### Vitest Configuration (`vitest.config.ts`)
- JSDOM environment for frontend testing
- Path aliases for import resolution
- Global test setup file
- Custom reporter configuration

## Expected Test Results

### Success Criteria
- All authentication requirements properly enforced
- Role-based permissions correctly implemented
- User-specific features properly gated
- Global content accessible to all users
- Data isolation maintained between users
- UI consistency maintained across pages
- Performance within acceptable limits

### Failure Indicators
- Unauthenticated access to protected features
- Incorrect role permission enforcement
- User data leakage between accounts
- Global content access restrictions
- UI inconsistencies across platforms
- Performance regression in filtering

## Maintenance

### Adding New Tests
1. Follow existing test structure and naming conventions
2. Add tests for new authentication requirements
3. Update role permission matrix for new features
4. Include regression tests for UI changes
5. Update this documentation

### Test Data Management
- Use mock data for consistent test results
- Ensure test isolation with proper cleanup
- Avoid dependencies on external services
- Mock Firebase and API calls appropriately

## Integration with CI/CD

These tests should be integrated into the continuous integration pipeline to:
- Validate authentication rules on every commit
- Prevent regression in access control features
- Ensure role-based permissions remain consistent
- Maintain UI behavior consistency
- Detect performance regressions early

## Security Considerations

The test suite validates:
- Proper authentication enforcement
- Correct role-based access control
- Data isolation between users
- Security header requirements
- Protection against unauthorized access
- Consistent error handling for security violations

This comprehensive testing infrastructure ensures the authentication and role-based access control system remains secure, consistent, and reliable across all application features.