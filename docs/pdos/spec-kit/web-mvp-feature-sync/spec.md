# Specification: Web MVP Feature Sync

**Spec-Kit:** web-mvp-feature-sync  
**Version:** 1.0  
**Created:** 2025-12-29  
**Status:** Draft

---

## 1. Feature Specifications

### 1.1 Loading States

**Component:** `<LoadingState />`

```typescript
interface LoadingStateProps {
  variant: 'skeleton' | 'spinner' | 'dots';
  count?: number;  // For skeleton lists
  className?: string;
}
```

**Behavior:**
- Render immediately when query `isLoading` is true
- Use skeleton variant for content lists
- Use spinner variant for action buttons
- Animate with CSS transitions

**Test Requirements:**
- Verify skeleton renders during data fetch
- Verify content replaces skeleton on load complete
- Verify error state replaces loading on failure

---

### 1.2 Error Boundaries

**Component:** `<ErrorBoundary />`

```typescript
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}
```

**Behavior:**
- Catch JavaScript errors in child component tree
- Display user-friendly fallback UI
- Log error details to console (dev) or monitoring (prod)
- Provide "Try Again" action where applicable

**Test Requirements:**
- Verify error caught and fallback rendered
- Verify error callback invoked
- Verify recovery after retry

---

### 1.3 "What Can I Make?" Filter

**Location:** `/cocktails` page

**UI:**
- Toggle button: "Show What I Can Make"
- Visual indicator of My Bar ingredient match count
- Partial match option (e.g., "missing 1 ingredient")

**Logic:**
```typescript
function filterByMyBar(cocktails: Cocktail[], myBarIngredients: number[]): Cocktail[] {
  return cocktails.filter(cocktail => {
    const recipeIngredients = getIngredientIds(cocktail);
    const missingCount = recipeIngredients.filter(
      id => !myBarIngredients.includes(id)
    ).length;
    return missingCount === 0; // or <= threshold
  });
}
```

**API Requirement:**
- `GET /api/cocktails?mybar=true` - Server-side filtering option

**Test Requirements:**
- Verify toggle state persists
- Verify correct filtering with various My Bar states
- Verify empty state when no matches

---

### 1.4 Advanced Filters

**Location:** `/cocktails` page filter panel

**New Filters:**
| Filter | Type | Values |
|--------|------|--------|
| ABV Range | Range slider | 0-100% |
| Ingredient Count | Dropdown | 1-5, 6-10, 10+ |
| Preparation Time | Dropdown | Quick (<5min), Standard, Complex |

**State Management:**
- URL query parameters for shareable filter states
- Local storage for filter preferences

**Test Requirements:**
- Verify each filter applies correctly
- Verify filter combinations work
- Verify URL reflects filter state
- Verify filter reset clears all

---

## 2. Component Hierarchy

```
App
├── ErrorBoundary
│   ├── Navigation
│   └── Routes
│       ├── CocktailList
│       │   ├── SearchBar
│       │   ├── FilterPanel
│       │   │   ├── CategoryFilter
│       │   │   ├── ABVFilter
│       │   │   ├── IngredientCountFilter
│       │   │   └── MyBarToggle
│       │   ├── LoadingState (conditional)
│       │   └── CocktailGrid
│       └── ...
```

---

## 3. State Management

### Query Keys Structure

```typescript
const queryKeys = {
  cocktails: {
    all: ['cocktails'] as const,
    lists: () => [...queryKeys.cocktails.all, 'list'] as const,
    list: (filters: CocktailFilters) => [...queryKeys.cocktails.lists(), filters] as const,
    details: () => [...queryKeys.cocktails.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.cocktails.details(), id] as const,
  },
  myBar: {
    all: ['mybar'] as const,
  },
};
```

---

## 4. Accessibility Requirements

| Feature | WCAG Level | Implementation |
|---------|------------|----------------|
| Keyboard Navigation | AA | Focus management, skip links |
| Screen Reader | AA | ARIA labels, live regions |
| Color Contrast | AA | 4.5:1 minimum ratio |
| Focus Indicators | AA | Visible focus rings |
| Error Announcements | AA | aria-live for dynamic content |

---

## 5. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| Bundle Size (gzipped) | <200KB | Build output |
