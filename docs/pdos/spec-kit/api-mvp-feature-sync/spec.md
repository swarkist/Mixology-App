# Specification: API MVP Feature Sync

**Spec-Kit:** api-mvp-feature-sync  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Draft

---

## 1. Endpoint Specifications

### 1.1 Cocktails by My Bar

**Endpoint:** `GET /api/cocktails`

**New Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `mybar` | boolean | Filter to cocktails user can make |
| `maxMissing` | number | Max missing ingredients (default: 0) |

**Request:**
```http
GET /api/cocktails?mybar=true&maxMissing=1
Cookie: accessToken=<jwt>
```

**Response:**
```json
{
  "cocktails": [
    {
      "id": 1,
      "name": "Old Fashioned",
      "matchInfo": {
        "hasIngredients": 3,
        "totalIngredients": 4,
        "missingIngredients": ["Angostura Bitters"]
      }
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

**Logic:**
```typescript
async function filterByMyBar(
  userId: number,
  maxMissing: number = 0
): Promise<CocktailWithMatch[]> {
  const myBarItems = await storage.getMyBarItems(userId);
  const myBarIngredientIds = myBarItems
    .filter(item => item.type === 'ingredient')
    .map(item => item.ref_id);
  
  const cocktails = await storage.getAllCocktails();
  
  return cocktails
    .map(cocktail => {
      const recipeIngredients = await storage.getCocktailIngredients(cocktail.id);
      const missing = recipeIngredients.filter(
        ri => !myBarIngredientIds.includes(ri.ingredientId)
      );
      return {
        ...cocktail,
        matchInfo: {
          hasIngredients: recipeIngredients.length - missing.length,
          totalIngredients: recipeIngredients.length,
          missingIngredients: missing.map(m => m.ingredientName)
        }
      };
    })
    .filter(c => c.matchInfo.missingIngredients.length <= maxMissing);
}
```

**Test Requirements:**
- Test with empty My Bar (returns all with full missing)
- Test with partial My Bar (returns partial matches)
- Test with full My Bar (returns exact matches)
- Test maxMissing threshold
- Test unauthenticated request (401)

---

### 1.2 Advanced Cocktail Filters

**Endpoint:** `GET /api/cocktails`

**New Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `minAbv` | number | Minimum average ABV |
| `maxAbv` | number | Maximum average ABV |
| `ingredientCountMin` | number | Minimum ingredient count |
| `ingredientCountMax` | number | Maximum ingredient count |

**Response:** Standard cocktails list with filters applied

**Logic:**
- Calculate average ABV based on spirit ingredients
- Count ingredients per cocktail
- Apply range filters

**Test Requirements:**
- Test each filter individually
- Test filter combinations
- Test edge cases (0, 100)
- Test invalid values (negative, non-numeric)

---

### 1.3 Recipe Scaling

**Endpoint:** `GET /api/cocktails/:id/scaled`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `servings` | number | Number of servings (default: 1) |

**Response:**
```json
{
  "id": 1,
  "name": "Old Fashioned",
  "servings": 4,
  "ingredients": [
    {
      "ingredientId": 5,
      "name": "Bourbon",
      "originalAmount": "2",
      "originalUnit": "oz",
      "scaledAmount": "8",
      "scaledUnit": "oz"
    }
  ],
  "instructions": ["..."]
}
```

**Logic:**
```typescript
function scaleAmount(amount: string, multiplier: number): string {
  const numericValue = parseFloat(amount);
  if (isNaN(numericValue)) return amount; // Handle "splash", etc.
  return (numericValue * multiplier).toString();
}
```

**Test Requirements:**
- Test scaling up (2x, 4x)
- Test non-numeric amounts ("splash")
- Test decimal amounts
- Test invalid servings value

---

### 1.4 Response Caching

**Implementation:** In-memory cache with TTL

**Cached Endpoints:**
| Endpoint | TTL | Cache Key |
|----------|-----|-----------|
| `GET /api/cocktails` | 5 min | `cocktails:${queryHash}` |
| `GET /api/ingredients` | 10 min | `ingredients:${queryHash}` |
| `GET /api/tags` | 30 min | `tags:all` |

**Cache Invalidation:**
- Invalidate on POST/PATCH/DELETE operations
- Invalidate by collection (e.g., all cocktail caches)
- TTL-based automatic expiration

**Headers:**
```
X-Cache: HIT | MISS
Cache-Control: public, max-age=300
```

---

## 2. Error Response Format

All errors follow consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameter",
    "details": [
      {
        "field": "minAbv",
        "issue": "Must be a number between 0 and 100"
      }
    ]
  }
}
```

**Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## 3. Rate Limiting

| Endpoint Group | Limit | Window |
|----------------|-------|--------|
| Auth endpoints | 5 | 1 min |
| Read endpoints | 100 | 1 min |
| Write endpoints | 20 | 1 min |
| AI endpoints | 10 | 1 min |

---

## 4. Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Input Validation | Zod schemas for all inputs |
| SQL Injection | Parameterized queries (Firestore) |
| XSS | Content-Type headers, no HTML in responses |
| CSRF | SameSite cookies, origin checking |
| Rate Limiting | express-rate-limit middleware |
