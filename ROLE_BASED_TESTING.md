# Role-Based Access Control (RBAC) Testing Documentation

## User Role Definitions

### Administrator Role
- **Cocktails & Ingredients**: Full CRUD (Create, Read, Update, Delete)
- **Preferred Brands**: Full CRUD for all users' data
- **My Bar**: Can manage own My Bar (add/remove preferred brands)
- **AI Importer**: Full access and save functionality
- **Admin Panel**: Full access to user management, role provisioning
- **Provisioning**: Can promote users to admin/reviewer roles

### Basic Role
- **Cocktails & Ingredients**: Read-only access
- **Preferred Brands**: Full CRUD for own data only
- **My Bar**: Can add/remove own preferred brands
- **AI Importer**: No access (link hidden)
- **Admin Panel**: No access (link hidden)
- **UI**: Edit buttons disabled on cocktails/ingredients

### Reviewer Role
- **Cocktails & Ingredients**: Read-only access, can view edit forms but save buttons disabled
- **Preferred Brands**: Full CRUD for own data only
- **My Bar**: Can add/remove own preferred brands
- **AI Importer**: Full access but cannot save to database
- **Admin Panel**: Link visible but access denied with error message
- **UI**: Save buttons disabled on all content editing

## Test Matrix

### Cocktails API Testing

| Role | GET /api/cocktails | POST /api/cocktails | PATCH /api/cocktails/:id | DELETE /api/cocktails/:id |
|------|-------------------|--------------------|-----------------------|--------------------------|
| Admin | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow |
| Basic | ✅ Allow | ❌ Block | ❌ Block | ❌ Block |
| Reviewer | ✅ Allow | ❌ Block | ❌ Block | ❌ Block |

### Ingredients API Testing

| Role | GET /api/ingredients | POST /api/ingredients | PATCH /api/ingredients/:id | DELETE /api/ingredients/:id |
|------|---------------------|----------------------|---------------------------|----------------------------|
| Admin | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow |
| Basic | ✅ Allow | ❌ Block | ❌ Block | ❌ Block |
| Reviewer | ✅ Allow | ❌ Block | ❌ Block | ❌ Block |

### My Bar API Testing

| Role | GET /api/ingredients/:id/toggle-mybar | PATCH /api/ingredients/:id/toggle-mybar |
|------|--------------------------------------|----------------------------------------|
| Admin | ✅ Allow (own data) | ✅ Allow (own data) |
| Basic | ✅ Allow (own data) | ✅ Allow (own data) |
| Reviewer | ✅ Allow (own data) | ✅ Allow (own data) |

### Preferred Brands API Testing

| Role | GET /api/preferred-brands | POST /api/preferred-brands | PATCH /api/preferred-brands/:id | DELETE /api/preferred-brands/:id |
|------|--------------------------|----------------------------|--------------------------------|--------------------------------|
| Admin | ✅ Allow | ✅ Allow | ✅ Allow | ✅ Allow |
| Basic | ✅ Allow (own data) | ✅ Allow | ✅ Allow (own data) | ✅ Allow (own data) |
| Reviewer | ✅ Allow (own data) | ✅ Allow | ✅ Allow (own data) | ✅ Allow (own data) |

### Admin Panel API Testing

| Role | GET /api/admin/users | POST /api/admin/users | PATCH /api/admin/users/:id/role |
|------|---------------------|----------------------|-------------------------------|
| Admin | ✅ Allow | ✅ Allow | ✅ Allow |
| Basic | ❌ Block | ❌ Block | ❌ Block |
| Reviewer | ❌ Block | ❌ Block | ❌ Block |

### AI Importer API Testing

| Role | POST /api/ai/import | POST /api/ai/import/save |
|------|--------------------|-----------------------|
| Admin | ✅ Allow | ✅ Allow |
| Basic | ❌ Block | ❌ Block |
| Reviewer | ✅ Allow | ❌ Block |

### UI Element Visibility Testing

| Role | AI Importer Link | Admin Panel Link | Save Buttons (Cocktails) | Save Buttons (Ingredients) |
|------|------------------|------------------|--------------------------|---------------------------|
| Admin | ✅ Visible | ✅ Visible | ✅ Enabled | ✅ Enabled |
| Basic | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| Reviewer | ✅ Visible | ✅ Visible | ❌ Disabled | ❌ Disabled |

## Test User Accounts

### Current Test Users
- **Admin**: swarkist@gmail.com (role: admin)
- **Basic**: basicuser@test.com (role: basic)
- **Reviewer**: Need to create/promote

## Regression Test Commands

### Authentication Setup
```bash
# Admin login
curl -s -H "Content-Type: application/json" -X POST -d '{"email":"swarkist@gmail.com","password":"mixology2025"}' http://localhost:5000/api/auth/login --cookie-jar admin_cookies.txt

# Basic user login
curl -s -H "Content-Type: application/json" -X POST -d '{"email":"basicuser@test.com","password":"password123"}' http://localhost:5000/api/auth/login --cookie-jar basic_cookies.txt

# Create reviewer user (requires admin)
curl -s --cookie admin_cookies.txt -H "Content-Type: application/json" -H "x-admin-key: ${ADMIN_API_KEY}" -X PATCH -d '{"role": "reviewer"}' http://localhost:5000/api/admin/users/{USER_ID}/role
```

### Cocktails Testing
```bash
# Test cocktail read (should work for all)
curl -s --cookie admin_cookies.txt http://localhost:5000/api/cocktails
curl -s --cookie basic_cookies.txt http://localhost:5000/api/cocktails
curl -s --cookie reviewer_cookies.txt http://localhost:5000/api/cocktails

# Test cocktail create (admin only)
curl -s --cookie admin_cookies.txt -H "Content-Type: application/json" -X POST -d '{"name":"Test Cocktail"}' http://localhost:5000/api/cocktails
curl -s --cookie basic_cookies.txt -H "Content-Type: application/json" -X POST -d '{"name":"Test Cocktail"}' http://localhost:5000/api/cocktails  # Should fail
curl -s --cookie reviewer_cookies.txt -H "Content-Type: application/json" -X POST -d '{"name":"Test Cocktail"}' http://localhost:5000/api/cocktails  # Should fail
```

### My Bar Testing
```bash
# Test My Bar toggle (should work for all with own data)
curl -s --cookie admin_cookies.txt -X PATCH http://localhost:5000/api/ingredients/{ID}/toggle-mybar
curl -s --cookie basic_cookies.txt -X PATCH http://localhost:5000/api/ingredients/{ID}/toggle-mybar
curl -s --cookie reviewer_cookies.txt -X PATCH http://localhost:5000/api/ingredients/{ID}/toggle-mybar
```

## Known Issues to Address
1. Reviewer role may not be properly restricted from saving content
2. UI elements may not be properly hidden/disabled based on role
3. My Bar functionality may not respect user-specific data isolation
4. Admin panel access control may need verification

## Test Execution Schedule
- **Pre-deployment**: Full RBAC test suite
- **Post-deployment**: Smoke tests for each role
- **Weekly**: Full regression testing
- **After role changes**: Complete role-specific testing