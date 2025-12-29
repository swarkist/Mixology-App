# Web & API Baseline Snapshot

**Document Version:** 1.0  
**Snapshot Date:** 2025-12-29  
**Status:** Pre-PDOS Legacy Baseline (FROZEN)

---

## Overview

This document captures the current state of the Mixology application (web + API) as the Pre-PDOS Legacy baseline. All existing functionality documented here is frozen and must not be modified unless a PDOS `tasks.md` explicitly authorizes the change.

---

## Application Summary

**Application Name:** Mixi Mixology  
**Domain:** www.miximixology.com  
**Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + TypeScript
- **Database:** Firebase Firestore (primary), with Drizzle ORM schema definitions
- **Routing:** Wouter (frontend), Express Router (backend)
- **State Management:** TanStack Query v5
- **Auth:** JWT (access + refresh tokens) with httpOnly cookies

---

## Major Features

### Web (Frontend)

| Feature | Description | Entry Point |
|---------|-------------|-------------|
| Home Page | Hero section, featured cocktails, popular recipes, filter by ingredient | `/` (Frame.tsx) |
| Cocktail List | Browse, search, filter cocktails by tags/ingredients | `/cocktails` |
| Recipe Detail | View cocktail details, ingredients, instructions, popularity tracking | `/recipe/:id` |
| Ingredients List | Browse, search, filter ingredients by category | `/ingredients` |
| Ingredient Detail | View ingredient details, associated cocktails | `/ingredient/:id` |
| My Bar | User's personal collection of ingredients and brands | `/my-bar` |
| Preferred Brands | User's preferred spirit brands with ingredient associations | `/preferred-brands` |
| Add/Edit Cocktail | Admin/Reviewer form for cocktail management | `/add-cocktail`, `/edit-cocktail/:id` |
| Add/Edit Ingredient | Admin/Reviewer form for ingredient management | `/add-ingredient`, `/edit-ingredient/:id` |
| Add/Edit Preferred Brand | User form for brand management | `/add-preferred-brand`, `/edit-preferred-brand/:id` |
| AI Recipe Import | Admin/Reviewer AI-powered recipe import (URL/text/YouTube) | `/import` |
| Admin Dashboard | User management, batch operations | `/admin`, `/admin/batch-ops` |
| Authentication | Login, register, forgot/reset password | `/login`, `/register`, `/forgot-password`, `/reset` |
| Mixi Chat | AI chatbot (bartender assistant) | Global component |
| Social Sharing | Share recipes via native OS share sheet | `/s/:id` |
| Legal Pages | Terms of Service, Privacy Policy | `/terms`, `/privacy` |

### API (Backend)

| Endpoint Group | Description | Key Routes |
|----------------|-------------|------------|
| Auth | User registration, login, logout, password reset, token refresh | `/api/auth/*` |
| Cocktails | CRUD operations, search, filtering, featured/popular toggles | `/api/cocktails/*` |
| Ingredients | CRUD operations, search, category filtering | `/api/ingredients/*` |
| Tags | CRUD operations, usage tracking | `/api/tags/*` |
| My Bar | User-specific ingredient/brand collection management | `/api/mybar/*` |
| Preferred Brands | User-specific brand management with ingredient associations | `/api/preferred-brands/*` |
| Admin | User management (roles, status), batch operations | `/api/admin/*` |
| AI Services | OCR brand extraction, OpenRouter proxy, Mixi chat | `/api/ai/*`, `/api/openrouter`, `/api/mixi/chat` |
| Scraping | URL scraping for recipe import | `/api/scrape-url` |
| YouTube | Transcript extraction for recipe import | `/api/youtube-transcript` |
| Search | Global search across cocktails and ingredients | `/api/search` |

---

## Data Model (Key Entities)

| Entity | Description | Key Fields |
|--------|-------------|------------|
| Users | User accounts with RBAC | id, email, password_hash, role (basic/reviewer/admin), is_active |
| Sessions | JWT refresh token sessions | user_id, refresh_token_hash, expires_at |
| Cocktails | Recipe records | id, name, description, imageUrl, isFeatured, popularityCount |
| Ingredients | Ingredient catalog | id, name, category, subCategory, abv, imageUrl |
| Tags | Reusable tags | id, name, usageCount |
| CocktailIngredients | Junction: cocktail ↔ ingredient | cocktailId, ingredientId, amount, unit, order |
| CocktailInstructions | Step-by-step instructions | cocktailId, stepNumber, instruction |
| PreferredBrands | User's preferred brands | user_id, name, proof, imageUrl |
| MyBar | User's bar collection | user_id, type (ingredient/brand), ref_id |
| PasswordResets | Password reset tokens | user_id, token_hash, expires_at |
| AuditLogs | Action audit trail | user_id, action, resource, resource_id |

---

## Security Features

- **Authentication:** JWT with short-lived access tokens (30min) and refresh tokens (7 days)
- **Cookies:** httpOnly, secure, sameSite=lax
- **RBAC:** Three roles (basic, reviewer, admin) with route-level enforcement
- **Middleware:** Helmet (CSP, HSTS), CORS allowlist, rate limiting
- **Password:** bcrypt with cost factor 12
- **Admin Protection:** x-admin-key header for sensitive operations
- **HTTPS Enforcement:** Production redirect with HSTS preload

---

## Known Limitations

1. **No Automated Test Suite:** No unit, integration, or E2E tests currently exist
2. **No CI/CD Pipeline:** Tests not integrated into deployment workflow
3. **Firebase-Dependent:** Core data operations tied to Firestore (no Postgres usage despite schema)
4. **Image Storage:** Images stored as base64 or external URLs (no dedicated object storage)
5. **Email:** Password reset emails require external SMTP configuration
6. **Rate Limiting:** Basic in-memory rate limiting (no Redis)
7. **Search:** Full-text search is case-insensitive prefix matching (no fuzzy search)
8. **Batch Operations:** Limited to description and tag modifications
9. **OCR:** Requires OpenRouter API key for AI-powered brand extraction

---

## Key Entry Points

### Web Routes (client/src/App.tsx)

```
/                     → Frame (Home)
/cocktails            → CocktailList
/recipe/:id           → RecipePage
/ingredients          → Ingredients
/ingredient/:id       → IngredientDetail
/my-bar               → MyBar
/preferred-brands     → PreferredBrands
/add-cocktail         → AddCocktail (admin/reviewer)
/edit-cocktail/:id    → AddCocktail (admin/reviewer)
/add-ingredient       → AddIngredient (admin/reviewer)
/edit-ingredient/:id  → EditIngredient (admin/reviewer)
/add-preferred-brand  → AddPreferredBrand (auth)
/edit-preferred-brand/:id → EditPreferredBrand (auth)
/import               → ImportCocktail (admin/reviewer)
/admin                → AdminDashboard (admin/reviewer)
/admin/batch-ops      → BatchOps (admin)
/login                → Login
/register             → Register
/forgot-password      → ForgotPassword
/reset                → ResetPassword
/terms                → Terms
/privacy              → Privacy
/s/:id                → SocialShare
```

### Server Routes (server/routes.ts + server/routes/*.ts)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
DELETE /api/auth/account

GET    /api/cocktails
GET    /api/cocktails/:id
POST   /api/cocktails
PATCH  /api/cocktails/:id
DELETE /api/cocktails/:id
POST   /api/cocktails/:id/toggle-featured
POST   /api/cocktails/:id/increment-popularity

GET    /api/ingredients
GET    /api/ingredients/:id
POST   /api/ingredients
PATCH  /api/ingredients/:id
DELETE /api/ingredients/:id

GET    /api/tags
POST   /api/tags
DELETE /api/tags/:id

GET    /api/mybar
POST   /api/mybar
DELETE /api/mybar/:id

GET    /api/preferred-brands
GET    /api/preferred-brands/:id
POST   /api/preferred-brands
PATCH  /api/preferred-brands/:id
DELETE /api/preferred-brands/:id

GET    /api/admin/users
PATCH  /api/admin/users/:id/role
PATCH  /api/admin/users/:id/status
POST   /api/admin/batch/preview
POST   /api/admin/batch/commit
POST   /api/admin/batch/rollback

POST   /api/ai/brands/from-image
POST   /api/openrouter
POST   /api/mixi/chat (streaming)
POST   /api/scrape-url
POST   /api/youtube-transcript
GET    /api/search
```

---

## Test Setup Status

| Category | Status | Notes |
|----------|--------|-------|
| Unit Tests | ❌ None | No test files exist |
| Integration Tests | ❌ None | No API test coverage |
| E2E Tests | ❌ None | No Playwright/Cypress setup |
| Test Framework | ⚠️ Installed | Vitest configured but unused |
| CI/CD | ❌ None | No automated test pipeline |

---

## File Structure Overview

```
├── client/
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks (auth, toast)
│   │   ├── lib/             # Utilities (queryClient, utils)
│   │   ├── pages/           # Route pages
│   │   └── App.tsx          # Route definitions
│   └── public/              # Static assets
├── server/
│   ├── lib/                 # Auth, mailer, logger utilities
│   ├── middleware/          # Auth, rate limiting middleware
│   ├── routes/              # API route modules
│   ├── services/            # Batch operations service
│   ├── storage/             # Firebase storage implementation
│   ├── firebase.ts          # Firebase initialization
│   ├── routes.ts            # Main route registration
│   └── index.ts             # Server entry point
├── shared/
│   └── schema.ts            # Drizzle schema + Zod validation
└── docs/pdos/               # PDOS governance documentation
```

---

## Governance Notes

- This baseline snapshot is **FROZEN** as of the snapshot date
- Any modifications to existing functionality require explicit authorization in a PDOS `tasks.md`
- New features follow delta-only governance (additive changes only)
- All changes must include corresponding test coverage
