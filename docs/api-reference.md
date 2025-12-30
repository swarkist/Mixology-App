# Miximixology API Reference

**Base URL:** `https://your-domain.com` (or development: `http://localhost:5000`)

**Content-Type:** `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health Check](#health-check)
3. [Cocktails](#cocktails)
4. [Ingredients](#ingredients)
5. [Tags](#tags)
6. [My Bar](#my-bar)
7. [Preferred Brands](#preferred-brands)
8. [Search](#search)
9. [AI Features](#ai-features)
10. [Data Types](#data-types)
11. [Error Handling](#error-handling)

---

## Authentication

Authentication uses HTTP-only cookies with access tokens (JWT) and refresh tokens. All authenticated endpoints require valid cookies set during login/register.

### Roles

| Role | Description |
|------|-------------|
| `basic` | Standard users - My Bar management, preferred brands |
| `reviewer` | Content creation + basic features |
| `admin` | Full access including admin operations |

---

### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "basic",
    "is_active": true
  }
}
```

**Error Response (200 - Security):**
```json
{
  "success": false,
  "message": "The information you provided doesn't match our records."
}
```

**Cookies Set:** `accessToken`, `refreshToken` (HTTP-only)

---

### POST /api/auth/login

Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "basic",
    "is_active": true
  }
}
```

**Cookies Set:** `accessToken`, `refreshToken` (HTTP-only)

---

### POST /api/auth/logout

Log out the current user and revoke session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookies Cleared:** `accessToken`, `refreshToken`

---

### GET /api/auth/me

Get the current authenticated user's profile.

**Auth Required:** Yes

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "basic",
    "is_active": true
  },
  "csrfToken": "random-csrf-token"
}
```

**Error (401):**
```json
{
  "error": "Authentication required"
}
```

---

### POST /api/auth/forgot

Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):** Always returns success to prevent account enumeration
```json
{
  "success": true,
  "message": "If an account with that email exists, you will receive a password reset link shortly."
}
```

---

### POST /api/auth/reset

Reset password using token from email.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "newpassword8chars"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "basic",
    "is_active": true
  }
}
```

---

### DELETE /api/auth/account

Delete the current user's account. Revokes all sessions and removes user data.

**Auth Required:** Yes

**Response (200):**
```json
{
  "status": "ok",
  "message": "Account deleted"
}
```

**Error (403):** Cannot delete last active admin
```json
{
  "error": "Cannot delete the last active admin account"
}
```

---

## Health Check

### GET /api/health

Check if the API is running.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-30T05:00:00.000Z",
  "environment": "development"
}
```

---

## Cocktails

### GET /api/cocktails

Get all cocktails with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name/description |
| `featured` | boolean | Filter to featured cocktails only (`true`) |
| `popular` | boolean | Filter to popular cocktails only (`true`) |
| `ingredients` | string | Comma-separated ingredient IDs (e.g., `1,2,3`) |
| `matchAll` | boolean | Require all ingredients to match (`true`) |

**Examples:**
- `GET /api/cocktails` - All cocktails
- `GET /api/cocktails?featured=true` - Featured cocktails only
- `GET /api/cocktails?popular=true` - Popular cocktails only
- `GET /api/cocktails?search=margarita` - Search for "margarita"
- `GET /api/cocktails?ingredients=1,5&matchAll=true` - Cocktails with ingredients 1 AND 5

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Margarita",
    "description": "Classic tequila cocktail",
    "imageUrl": "https://...",
    "isFeatured": true,
    "featuredAt": "2025-01-01T00:00:00.000Z",
    "popularityCount": 42,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  }
]
```

---

### GET /api/cocktails/:id

Get a single cocktail with full details including ingredients and instructions.

**Response (200):**
```json
{
  "id": 1,
  "name": "Margarita",
  "description": "Classic tequila cocktail",
  "imageUrl": "https://...",
  "isFeatured": true,
  "featuredAt": "2025-01-01T00:00:00.000Z",
  "popularityCount": 42,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z",
  "ingredients": [
    {
      "id": 1,
      "cocktailId": 1,
      "ingredientId": 5,
      "amount": "2",
      "unit": "oz",
      "order": 0,
      "ingredient": {
        "id": 5,
        "name": "Tequila",
        "category": "spirits",
        "subCategory": "tequila"
      }
    }
  ],
  "instructions": [
    {
      "id": 1,
      "cocktailId": 1,
      "stepNumber": 1,
      "instruction": "Add all ingredients to shaker with ice"
    }
  ],
  "tags": [
    { "id": 1, "name": "classic" },
    { "id": 2, "name": "tequila" }
  ]
}
```

**Error (404):**
```json
{
  "message": "Cocktail not found"
}
```

---

### POST /api/cocktails

Create a new cocktail.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`

**Request:**
```json
{
  "name": "Margarita",
  "description": "Classic tequila cocktail",
  "image": "data:image/png;base64,...",
  "isFeatured": false,
  "ingredients": [
    {
      "name": "Tequila",
      "amount": "2",
      "unit": "oz"
    },
    {
      "name": "Lime Juice",
      "amount": "1",
      "unit": "oz"
    }
  ],
  "instructions": [
    "Add all ingredients to shaker with ice",
    "Shake well",
    "Strain into glass"
  ],
  "tags": ["classic", "tequila"]
}
```

**Note:** Ingredients can reference existing ingredients by name or create new ones automatically.

**Response (201):** Returns the created cocktail object.

---

### PATCH /api/cocktails/:id

Update an existing cocktail.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`

**Request:** Same structure as POST, all fields optional.

**Response (200):** Returns the updated cocktail object.

---

### DELETE /api/cocktails/:id

Delete a cocktail.

**Auth Required:** Yes  
**Roles:** `admin`

**Response (200):**
```json
{
  "message": "Cocktail deleted successfully"
}
```

---

### PATCH /api/cocktails/:id/featured

Set the featured status of a cocktail.

**Auth Required:** Yes  
**Roles:** `admin`

**Request:**
```json
{
  "featured": true
}
```

---

### PATCH /api/cocktails/:id/toggle-featured

Toggle the featured status of a cocktail.

**Auth Required:** Yes  
**Roles:** `admin`

**Response:** Returns the updated cocktail object.

---

### PATCH /api/cocktails/:id/increment-popularity

Increment the popularity count (alias: `/api/cocktails/:id/popularity`).

**Auth Required:** No (public endpoint for "Start Making" button)

**Response:** Returns the updated cocktail object with incremented `popularityCount`.

---

### PATCH /api/cocktails/:id/reset-popularity

Reset the popularity count to zero.

**Response:** Returns the updated cocktail object.

---

## Ingredients

### GET /api/ingredients

Get all ingredients with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name/description |
| `category` | string | Filter by category |
| `subcategory` | string | Filter by subcategory (for spirits) |
| `inMyBar` / `mybar` | boolean | Filter to My Bar items only |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Tequila",
    "category": "spirits",
    "subCategory": "tequila",
    "description": "Distilled spirit from blue agave",
    "imageUrl": "https://...",
    "preferredBrand": "Don Julio",
    "abv": 40.0,
    "usedInRecipesCount": 15,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  }
]
```

---

### GET /api/ingredients/:id

Get a single ingredient with full details.

**Response (200):**
```json
{
  "id": 1,
  "name": "Tequila",
  "category": "spirits",
  "subCategory": "tequila",
  "description": "Distilled spirit from blue agave",
  "imageUrl": "https://...",
  "preferredBrand": "Don Julio",
  "abv": 40.0,
  "usedInRecipesCount": 15,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z",
  "tags": [
    { "id": 1, "name": "base-spirit" }
  ],
  "cocktails": [
    { "id": 1, "name": "Margarita" }
  ],
  "inMyBar": false
}
```

---

### POST /api/ingredients

Create a new ingredient.

**Auth Required:** Yes  
**Roles:** `admin`

**Request:**
```json
{
  "name": "Tequila Blanco",
  "category": "spirits",
  "subCategory": "tequila",
  "description": "Unaged tequila",
  "image": "data:image/png;base64,...",
  "abv": 40.0,
  "tags": ["base-spirit", "agave"]
}
```

---

### PATCH /api/ingredients/:id

Update an existing ingredient.

**Auth Required:** Yes  
**Roles:** `admin`

---

### DELETE /api/ingredients/:id

Delete an ingredient.

**Auth Required:** Yes  
**Roles:** `admin`

---

### PATCH /api/ingredients/:id/toggle-mybar

Toggle the ingredient's presence in the user's My Bar.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`, `basic`

---

## Tags

### GET /api/tags

Get all tags.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "classic",
    "usageCount": 25,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### GET /api/tags/most-used

Get the most frequently used tags.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 5 | Number of tags to return |

---

### GET /api/tags/most-recent

Get the most recently created tags.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 5 | Number of tags to return |

---

### GET /api/tags/ingredients/most-used

Get most used tags specifically for ingredients.

---

### GET /api/tags/ingredients/most-recent

Get most recently created ingredient tags.

---

### GET /api/tags/cocktails/most-used

Get most used tags specifically for cocktails.

---

### GET /api/tags/cocktails/most-recent

Get most recently created cocktail tags.

---

### POST /api/tags

Create a new tag.

**Auth Required:** Yes  
**Roles:** `admin`

**Request:**
```json
{
  "name": "classic"
}
```

---

### DELETE /api/tags/:id

Delete a tag.

**Auth Required:** Yes  
**Roles:** `admin`

---

## My Bar

All My Bar endpoints require authentication.

### GET /api/mybar

Get the current user's bar items (ingredients and brands).

**Auth Required:** Yes

**Response (200):**
```json
{
  "ingredients": [
    {
      "id": 1,
      "name": "Tequila",
      "category": "spirits",
      "myBarId": 5
    }
  ],
  "brands": [
    {
      "id": 2,
      "name": "Don Julio",
      "proof": 80,
      "myBarId": 6
    }
  ],
  "total": 2
}
```

---

### POST /api/mybar

Add an item to the user's bar.

**Auth Required:** Yes

**Request:**
```json
{
  "type": "ingredient",
  "ref_id": 1
}
```

| type | ref_id references |
|------|-------------------|
| `ingredient` | `ingredients.id` |
| `brand` | `preferred_brands.id` |

**Response (201):**
```json
{
  "success": true,
  "item": {
    "id": 5,
    "user_id": 1,
    "type": "ingredient",
    "ref_id": 1,
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error (409):**
```json
{
  "error": "Item already in your bar"
}
```

---

### DELETE /api/mybar/:itemId

Remove an item from the user's bar.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "message": "Item removed from your bar"
}
```

---

## Preferred Brands

User-specific preferred brands for ingredients.

### GET /api/preferred-brands

Get the user's preferred brands.

**Auth Required:** Yes

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name |
| `inMyBar` | boolean | Filter to My Bar items only |

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Don Julio Blanco",
    "proof": 80,
    "imageUrl": "https://...",
    "usedInRecipesCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z",
    "inMyBar": true
  }
]
```

---

### GET /api/preferred-brands/:id

Get a single preferred brand with associated ingredients.

**Auth Required:** Yes (ownership validated)

**Response (200):**
```json
{
  "brand": {
    "id": 1,
    "user_id": 1,
    "name": "Don Julio Blanco",
    "proof": 80,
    "imageUrl": "https://..."
  },
  "ingredients": [
    { "id": 5, "name": "Tequila" }
  ],
  "tags": []
}
```

---

### POST /api/preferred-brands

Create a new preferred brand.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`, `basic`

**Request:**
```json
{
  "name": "Don Julio Blanco",
  "proof": 80,
  "image": "data:image/png;base64,...",
  "ingredientIds": [5]
}
```

---

### PATCH /api/preferred-brands/:id

Update a preferred brand.

**Auth Required:** Yes (ownership validated)  
**Roles:** `admin`, `reviewer`, `basic`

---

### DELETE /api/preferred-brands/:id

Delete a preferred brand.

**Auth Required:** Yes (ownership validated)  
**Roles:** `admin`, `reviewer`, `basic`

---

### PATCH /api/preferred-brands/:id/toggle-mybar

Toggle the brand's presence in the user's My Bar.

**Auth Required:** Yes

---

### POST /api/preferred-brands/:brandId/ingredients/:ingredientId

Associate an ingredient with a preferred brand.

---

### DELETE /api/preferred-brands/:brandId/ingredients/:ingredientId

Remove an ingredient association from a preferred brand.

---

## Search

### GET /api/search

Search across cocktails and ingredients.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | **Required.** Search query |
| `type` | string | Filter to `cocktails` or `ingredients` only |

**Response (200):**
```json
{
  "cocktails": [
    { "id": 1, "name": "Margarita", ... }
  ],
  "ingredients": [
    { "id": 5, "name": "Tequila", ... }
  ]
}
```

---

## AI Features

### POST /api/ai/brands/from-image

Extract brand information from an image using OCR.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`, `basic`

**Request:**
```json
{
  "base64": "data:image/png;base64,...",
  "autoCreate": false
}
```

**Response (200):**
```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "name": "Don Julio Blanco",
  "proof": 80,
  "confidence": 0.95,
  "notes": "Tequila from Jalisco, Mexico"
}
```

---

### POST /api/import/parse

Parse recipe content using AI.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`

**Request:**
```json
{
  "content": "Recipe text or transcript...",
  "source": "youtube"
}
```

**Response (200):**
```json
{
  "source": "youtube",
  "parsed": [
    {
      "name": "Margarita",
      "description": "Classic cocktail",
      "ingredients": [...],
      "instructions": [...],
      "tags": [...]
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

### POST /api/import/commit

Commit parsed recipes to the database.

**Auth Required:** Yes  
**Roles:** `admin`

**Request:**
```json
{
  "recipes": [...]
}
```

---

### POST /api/youtube-transcript

Extract transcript from a YouTube video.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`

**Request:**
```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

---

### POST /api/scrape-url

Scrape recipe content from a URL.

**Auth Required:** Yes  
**Roles:** `admin`, `reviewer`

**Request:**
```json
{
  "url": "https://example.com/recipe"
}
```

---

### POST /api/mixi/chat

Chat with the Mixi AI assistant about cocktails.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "How do I make a Margarita?" }
  ]
}
```

**Response:** Server-Sent Events (SSE) stream with chat response.

---

## Data Types

### Categories

```typescript
const INGREDIENT_CATEGORIES = [
  "spirits",
  "mixers",
  "juices",
  "syrups",
  "bitters",
  "garnishes",
  "other"
];
```

### Spirit Subcategories

```typescript
const SPIRIT_SUBCATEGORIES = [
  "tequila",
  "whiskey",
  "rum",
  "vodka",
  "gin",
  "scotch",
  "moonshine",
  "brandy"
];
```

### Measurement Units

```typescript
const MEASUREMENT_UNITS = [
  "oz",
  "ml",
  "parts",
  "dashes",
  "drops",
  "tsp",
  "tbsp",
  "cups",
  "slices",
  "wedges",
  "splash",
  "twist",
  "whole"
];
```

### User Roles

```typescript
type UserRole = "basic" | "reviewer" | "admin";
```

---

## Error Handling

### Standard Error Response

```json
{
  "message": "Error description",
  "error": "Detailed error info"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Authentication Errors

```json
{
  "error": "Authentication required"
}
```

### Validation Errors

```json
{
  "success": false,
  "message": "Password must be at least 8 characters"
}
```

---

## Rate Limiting

The following endpoints have rate limiting:

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests per minute |
| `/api/auth/register` | 5 requests per minute |
| `/api/auth/forgot` | 3 requests per hour |
| `/api/scrape-url` | 10 requests per minute |
| `/api/auth/account` (DELETE) | 3 requests per hour |

---

## Social Sharing

### GET /s/:id

Share URL that generates Open Graph meta tags for social media previews, then redirects to the cocktail page.

**Example:** `https://miximixology.com/s/123`

This endpoint generates proper OG tags (`og:title`, `og:description`, `og:image`) before redirecting to `/recipe/123`.

---

## Admin Endpoints

### GET /api/users/:id

Get user details (admin only).

**Auth Required:** Yes  
**Roles:** `admin`

---

### Additional Admin Routes

Admin routes are mounted at `/api/admin` and include:

- User management
- Batch operations
- System administration

Refer to admin-specific documentation for details.

---

*Last updated: December 30, 2025*
