# Mixology Web Application - Complete File Structure

This document provides a comprehensive overview of all files and directories in the mixology web application project.

## Project Root Configuration
- `.replit` - Replit configuration
- `package.json` & `package-lock.json` - Node.js dependencies
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `vitest.config.ts` - Test configuration
- `postcss.config.js` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `drizzle.config.ts` - Database ORM configuration
- `replit.md` - Project documentation and architecture

## Frontend (`client/`)

### Main Application
- `index.html` - Entry HTML
- `src/main.tsx` - React entry point
- `src/App.tsx` - Main app component
- `src/index.css` - Global styles

### Pages
- `src/pages/Frame.tsx` - Main layout
- `src/pages/CocktailList.tsx` - Cocktail listing
- `src/pages/CocktailRecipe.tsx` - Recipe details
- `src/pages/AddCocktail.tsx` - Add new cocktail
- `src/pages/Ingredients.tsx` - Ingredient listing
- `src/pages/AddIngredient.tsx` - Add new ingredient
- `src/pages/EditIngredient.tsx` - Edit ingredient
- `src/pages/MyBar.tsx` - Personal ingredient collection
- `src/pages/PreferredBrands.tsx` - Brand management
- `src/pages/AddPreferredBrand.tsx` - Add new brand
- `src/pages/EditPreferredBrand.tsx` - Edit brand
- `src/pages/BulkUpload.tsx` - Bulk data import
- `src/pages/not-found.tsx` - 404 page

### Page Sections
- `src/pages/sections/FeaturedCocktailsSection.tsx`
- `src/pages/sections/FilterByIngredientSection.tsx`
- `src/pages/sections/FooterSection.tsx`
- `src/pages/sections/PopularRecipesSection.tsx`

### Components
- `src/components/Navigation.tsx` - Bottom navigation
- `src/components/TopNavigation.tsx` - Header navigation
- `src/components/IngredientAssociation.tsx`
- `src/components/PreferredBrandAssociation.tsx`

### UI Components (shadcn/ui)
Complete set of 40+ reusable UI components:
- `src/components/ui/accordion.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/alert.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/chart.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/pagination.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/resizable.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/toggle-group.tsx`
- `src/components/ui/toggle.tsx`
- `src/components/ui/tooltip.tsx`

### Utilities & Hooks
- `src/lib/utils.ts` - Utility functions
- `src/lib/queryClient.ts` - API client setup
- `src/lib/imageCompression.ts` - Image processing
- `src/hooks/use-toast.ts` - Toast notifications
- `src/hooks/use-mobile.tsx` - Mobile detection

## Backend (`server/`)

### Main Server
- `index.ts` - Express server entry point
- `routes.ts` - API routes definition
- `vite.ts` - Vite integration

### Storage Layer
- `storage.ts` - Storage interface definition
- `storage/firebase.ts` - Firebase implementation
- `storage/firebase-adapter.ts` - Firebase adapter
- `storage/persistent-storage.ts` - File-based storage
- `debug-storage.ts` - Debug utilities

### Scripts & Utilities
- `scripts/migrate-to-firebase.ts` - Migration script
- `routes/firebase-test.ts` - Firebase testing endpoints
- `firebase.ts` - Firebase configuration

## Shared Code (`shared/`)
- `schema.ts` - TypeScript schemas and Zod validation

## Testing (`tests/`)

### Regression Tests
- `regression/ui-accessibility.test.ts` - UI accessibility tests
- `regression/api.test.ts` - API regression tests
- `regression/data-isolation.ts` - Data isolation utilities
- `regression/data-isolation-verification.test.ts` - Data isolation verification
- `regression/edge-cases.test.ts` - Edge case testing
- `regression/firebase-persistence.test.ts` - Firebase persistence tests
- `regression/performance.test.ts` - Performance testing
- `regression/README.md` - Test documentation
- `regression/run-regression.ts` - Test runner
- `regression/run-safe-tests.ts` - Safe test runner

### Unit Tests
- `unit/components.test.tsx` - Component unit tests
- `unit/mybar-search.test.ts` - My Bar search functionality tests
- `unit/storage.test.ts` - Storage layer unit tests

### Integration Tests
- `integration/full-workflow.test.ts` - End-to-end workflow tests

### Test Configuration & Utilities
- `setup.ts` - Test environment setup
- `storage.test.ts` - Storage system tests
- `test-maintenance-guide.md` - Test maintenance documentation
- `utils/test-helpers.ts` - Testing utility functions
- `vitest.config.ts` - Vitest configuration

## Data & Assets

### Data Storage
- `data/storage.json` - Local JSON data storage

### Attached Assets (`attached_assets/`)
Design and documentation files:
- `cocktaillist_1753577485341.css` - Cocktail list styles
- `Cocktaillist-structure_1753577493914.json` - Cocktail structure
- `ingredientslist_1753671421452.css` - Ingredients list styles
- `Ingredientslist-structure_1753671425335.json` - Ingredients structure
- `ingredients-scroll-fix_1753826495651.md` - Scroll fix documentation
- `Mixology_PRD_1753568108937.md` - Product requirements document
- `styleguide_1753568260333.css` - Style guide
- `styleguidestructure_1753568252183.json` - Style guide structure
- Various paste files with debugging and feature documentation

## Cache & Configuration Directories

### Replit Cache & Config
- `.cache/replit/env/latest.json` - Environment cache
- `.cache/replit/figma/attempt-1752452075441.json` - Figma integration cache
- `.cache/replit/last_scan_result.json` - Code scan results
- `.cache/replit/nix/dotreplitenv.json` - Nix environment cache
- `.cache/replit/toolchain.json` - Toolchain configuration

### Local State & Agent Data
- `.local/state/replit/agent/filesystem/filesystem_state.json` - Filesystem state
- `.local/state/replit/agent/.latest.json` - Latest agent state
- `.local/state/replit/agent/progress_tracker.md` - Progress tracking

### Other Configuration
- `.config/.semgrep/semgrep_rules.json` - Code analysis rules
- `.upm/store.json` - Package manager store

## Architecture Overview

This project follows a modern full-stack architecture:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript + Firebase Firestore
- **Database**: Firebase Firestore with comprehensive data modeling
- **Testing**: Comprehensive test suite with regression, unit, and integration tests
- **Mobile-First**: Responsive design optimized for cocktail recipe management
- **Development**: Hot reload, TypeScript validation, comprehensive error handling

The file structure supports scalable development with clear separation of concerns, comprehensive testing, and maintainable code organization.