# Mixology Web Application

## Overview
This full-stack web application provides a comprehensive platform for cocktail recipes and mixology. It features a React frontend, Express.js backend, and Firebase Firestore database. Key capabilities include browsing, searching, and managing cocktail recipes and ingredients, detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalized ingredient tracking. The project emphasizes enterprise-grade security, AI-powered recipe importing, photo OCR, and robust authentication with role-based access control. The vision is to establish the application as the primary resource for mixology enthusiasts.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Keep replit.md current with architectural changes and major feature implementations.
Project documentation: Focus on replit.md as primary documentation; archived detailed file structure docs as they are superseded by architectural information here.
Chat interface design: Modern dialog-based UI with responsive mobile optimization, matching provided reference designs.
Testing approach: User feedback required for AI formatting validation; system prompt changes need user testing to verify effectiveness.
Homepage input design: Prefers original Figma search field styling with dark input (#2a2a2a) and yellow "Ask Mixi" button, replacing simple button-only interface.
Development constraints: Do not attempt to fix Enter key dialog temporary showing/hiding behavior - user acknowledges this cannot be resolved through code changes.
Development workflow: User now implements independent code changes and requests reviews rather than full implementations from agent.

## Recent Changes

### October 20, 2025 - Batch Operations Junction Table Tag Fetching Fix
- **CRITICAL BUG FIX**: Fixed batch operations `skipIfSame` logic reading stale tags from document fields instead of junction tables
- **Root Cause**: Production documents contained legacy `tags` field with outdated data while junction tables (`cocktail_tags`, `ingredient_tags`) were the source of truth; dev documents had different/minimal data in tags field, causing inconsistent behavior between environments
- **Symptom**: Production batch operations skipped updates when descriptions matched, even when junction table tags were empty and needed updating; workaround required changing descriptions to force updates
- **Implementation**: Updated `buildPreview` function in `server/routes/adminBatch.ts` to fetch tags from junction tables upfront (matching reference list endpoint pattern), building `tagMap` and `itemTagsMap` before processing documents
- **Data Loading**: Two bulk reads per preview (tags collection + junction table) ensures current tags derive exclusively from junction tables
- **skipIfSame Logic**: Now correctly compares actual junction table tags vs proposed tags, eliminating false skips caused by stale document field data
- **Impact**: Production and dev environments now behave identically; batch operations properly detect when junction table tags differ from CSV/paste data regardless of description changes
- **Testing**: Architect review confirmed junction table fetch mirrors existing patterns, performance bounded to two bulk reads, and resolves production/dev inconsistency

### October 20, 2025 - Batch Operations Reference Lists
- **NEW FEATURE**: Added reference list functionality to Batch Operations page for easy data review
- **Implementation**: Created two new GET endpoints `/api/admin/batch/list-cocktails` and `/api/admin/batch/list-ingredients` that fetch all items with complete tag information from junction tables
- **UI Enhancement**: Added "Cocktail List" and "Ingredients List" buttons to BatchOps header for quick access to reference data
- **View State Management**: Implemented clean view switching between batch operations interface and reference table displays
- **Data Display**: Reference tables show ID, Name, Description, and Tags (comma-separated) for all cocktails or ingredients
- **Navigation**: Added "Back to Batch Operations" button for seamless navigation between views
- **Architecture**: Leverages existing junction table queries with proper tag aggregation; inherits admin-only security middleware
- **Use Case**: Provides admins with quick reference data for offline copying/review without disrupting batch operation workflows

### October 19, 2025 - Batch Operations Tag Junction Table Fix
- **CRITICAL BUG FIX**: Fixed batch operations failing to save tags to junction tables (ingredient_tags, cocktail_tags)
- **Root Cause**: Code was attempting to read non-existent numeric `id` field from document data - Firebase stores numeric IDs as document keys (strings), not as fields in document data
- **Implementation**: Updated `updateTagRelationships` function in `server/services/batch.ts` to parse document ID string directly using `parseInt(documentId)` instead of reading `docData.id`
- **Tag Processing**: Tags now properly normalize names, create new tags if needed, clear existing relationships, and rebuild junction tables with correct numeric foreign keys
- **Observability**: Added comprehensive logging to batch commit endpoint in `server/routes/adminBatch.ts` for easier debugging
- **Architecture Note**: Firebase Firestore document IDs are the source of truth for numeric IDs; no `id` field exists in document data

### September 15, 2025 - Batch Operations Fix & Firebase Admin Issues
- **CRITICAL BUG FIX**: Resolved Firebase Admin SDK import errors causing application startup failures
- **Implementation**: Updated Firebase imports in batch services from deprecated `firestore` import to centralized `db` from `../firebase`
- **Rate Limiting Fix**: Fixed IPv6 address handling in rate limiter by implementing proper `ipKeyGenerator` helper function
- **Admin Authentication**: Resolved Batch Ops 403 Forbidden errors by ensuring `VITE_ADMIN_API_KEY` environment variable is properly configured for frontend
- **Zod Schema Fix**: Fixed union type extend issue in admin batch routes by properly extending individual schema types
- **Filtering Logic**: Implemented missing "contains" mode filtering for Batch Operations with case-insensitive client-side text matching
- **Performance**: Optimized filtering to return only matching results rather than all documents

### August 23, 2025 - URL Scraping Security Enhancement & Bug Fixes
- **CRITICAL SECURITY FIX**: Fixed `/api/scrape-url` endpoint authentication vulnerability
- **Implementation**: Moved endpoint from `registerReadOnlyRoutes` to `registerRoutes` with proper authentication middleware
- **Access Control**: Now requires session authentication and admin/reviewer roles
- **Rate Limiting**: Implemented scraping-specific rate limiter (10 requests/minute per authenticated user)
- **Reliability**: Removed unreliable AllOrigins proxy dependency; implemented direct server-side fetching
- **Caching**: Added 10-minute in-memory caching with LRU eviction to prevent duplicate requests
- **Data Extraction**: Enhanced structured data extraction with JSON-LD, OpenGraph, and canonical URL support
- **Error Handling**: Comprehensive error codes with deterministic HTTP status mapping and user-friendly hints
- **JavaScript Bug Fix**: Resolved `undefined is not an object` error in ImportCocktail component with proper null safety checks
- **Import Workflow**: Verified complete AI-powered recipe import functionality from URL extraction to cocktail creation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite.
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Consistent dark theme (#181711) with gold accents (#f3d035), Plus Jakarta Sans font.
- **UI/UX Decisions**: Modern chat interface, responsive design (optimized for iPhone 14/15), standardized pill-based filtering, enhanced EmptyState component, URL state synchronization for filter persistence, PWA support with "Miximixology" branding.
- **Application Structure**: Multi-page application including Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages.

### Backend Architecture
- **Runtime**: Node.js with Express.js, TypeScript.
- **Database**: Firebase Firestore (server-only access via Admin SDK, separate dev/prod instances).
- **Security**: Helmet, CORS allowlist, rate limiting, session-based authentication, `x-admin-key` protection for write operations, three-tier role-based access control (RBAC), secure token-based password reset, ownership validation, last admin protection, audit logging.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations, body size limited to 512KB.
- **Authentication**: Session-based auth, user registration/login, three-tier RBAC, secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing. YouTube transcript extraction and AI-powered recipe parsing.
- **Error Handling**: Global error middleware, custom request logging.

### Key Features & Design Decisions
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware.
- **Data Persistence**: Firebase Firestore with user data isolation.
- **My Bar Functionality**: Dedicated section for tracking user ingredients, category-based filtering, dynamic cocktail count, brand categorization, real-time search.
- **Image Handling**: Integrated image upload/display, base64 to URL conversion, client-side compression.
- **Dynamic Content**: Featured and Popular Recipes sections.
- **AI-Powered Features**: Mixi AI Chatbot (modern dialog UI, streaming SSE API, configurable model routing, robust fallback, recipe database integration, optimized cocktail index, advanced multi-recipe parsing with JSON contracts), Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, intelligent content analysis. AI import allows full editing, new ingredient detection, and "part" measurement preservation. Multi-recipe parsing system with tolerant JSON repair, Markdown fallback, decimal-to-fraction conversion, Zod validation.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and ownership validation.
- **Fraction Display**: Automatic decimal-to-fraction conversion for measurements.
- **Ingredient Detail Pages**: Enhanced with cocktail relationships, tags, consistent styling.
- **Tags System**: Comprehensive ingredient and cocktail tagging, Firebase storage, unified display, real-time editing.
- **Admin Dashboard**: User management with real-time search, filtering, pagination.
- **Recipe Import System**: AI-powered workflow supporting URL scraping, YouTube transcripts, manual paste, AI parsing, ingredient categorization, automated cocktail creation.
- **Batch Operations**: Admin-only bulk update tool (query-based and paste/CSV) for descriptions and tags, with reference list views (cocktail/ingredient lists with tags).

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter, TanStack Query, shadcn/ui, Radix UI, Tailwind CSS, Lucide React.
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK.
- **Database**: Firebase Firestore.
- **Authentication**: Express sessions, bcrypt, passport-local, SMTP email.
- **Validation**: Zod, React Hook Form (`zodResolver`).
- **Security**: Helmet, CORS, `express-rate-limit`, Morgan.
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio.
- **Image Processing**: Custom image compression utilities.

### Development & Testing Dependencies
- **Testing**: Vitest with comprehensive regression test suite covering authentication, API functionality, data isolation, UI filtering consistency, performance, and API endpoint validation.
- **Security Testing**: Dedicated test suites for endpoint security validation, including authentication bypass prevention, role-based access control verification, and rate limiting validation.

## Current Status & Production Readiness

### Security Status
✅ **Authenticated Endpoints**: All write operations require authentication  
✅ **Role-Based Access Control**: Three-tier RBAC (basic/reviewer/admin) implemented  
✅ **Rate Limiting**: Comprehensive rate limiting across all sensitive endpoints  
✅ **Data Validation**: Zod schema validation on all inputs  
✅ **Session Security**: Secure session management with proper cookie handling  

### Feature Completeness
✅ **Core Functionality**: Full CRUD operations for cocktails, ingredients, and user data  
✅ **AI Integration**: Complete recipe import and chatbot functionality  
✅ **User Management**: Admin dashboard with user role management  
✅ **Data Integrity**: Proper foreign key relationships and data consistency  
✅ **Mobile Optimization**: Responsive design across all pages  
✅ **PWA Support**: Progressive web app capabilities with offline functionality  
✅ **Batch Operations**: Admin tools for bulk updates with reference list viewing

### Recent Testing Status
- **Authentication Tests**: All security tests passing
- **Import Functionality**: URL extraction and AI parsing verified working
- **Database Operations**: CRUD operations functioning correctly
- **Tag Management**: Complete tag system operational with junction table support
- **Mobile Interface**: Responsive design validated on multiple devices
- **Batch Operations**: Tag updates and reference lists verified functional