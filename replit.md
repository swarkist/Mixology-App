# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology, featuring a React frontend, Express.js backend, and Firebase Firestore database. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalizing ingredient tracking. The project features enterprise-grade security, AI-powered recipe importing, photo OCR capabilities, and comprehensive authentication with role-based access control. The platform serves mixology enthusiasts with a modern, accessible, and secure user experience.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Only update replit.md when running regression tests, not after individual fixes.

## Recent Changes (August 12, 2025)
- **RESOLVED: Critical Authentication & Admin Operations**: Fixed systematic failure where all admin operations were broken due to incorrect apiRequest parameter order throughout frontend
- **Fixed AI Importer**: Resolved silent save failures by correcting apiRequest calls and adding missing import in ImportCocktail.tsx - now fully functional
- **Comprehensive API Request Fix**: Updated apiRequest function calls across entire codebase (PreferredBrands, MyBar, Ingredients, CocktailList, CocktailRecipe, AddCocktail, EditIngredient, EditPreferredBrand, AddPreferredBrand, IngredientAssociation, PreferredBrandAssociation)
- **Root Cause Resolution**: Frontend was calling apiRequest(method, endpoint) instead of apiRequest(endpoint, {method}) causing HTML responses instead of JSON
- **All Admin Operations Confirmed Working**: Toggle featured status, edit/save recipes, delete items, toggle My Bar status, add new items, AI Importer cocktail saving
- **Fixed External Image Loading Error**: Replaced via.placeholder.com URL with local no-photo image in AddPreferredBrand.tsx to eliminate network errors
- **Enhanced Authentication Testing Infrastructure**: Created comprehensive auth-scenarios.test.ts with admin/basic user RBAC testing, session management validation, and user data isolation verification
- **Upgraded TestDataManager**: Added user management methods (createTestUser, loginTestUser, deleteTestUser) with proper cleanup and tracking for authentication regression tests
- **Comprehensive Regression Testing Complete**: Full test suite validates all core systems working correctly - authentication, database protection, API endpoints, and security measures
- **Authentication System Validated**: Confirmed public read access, write protection (401 errors), user registration/login, and session management all functional
- **Database State Verified**: Production data fully protected (6 cocktails, 22 ingredients, 6 tags, 5 preferred brands) with proper isolation mechanisms

## Previous Changes (August 11, 2025)
- **Enhanced AI Import with Full Editing**: Implemented comprehensive editing for AI-parsed ingredients and instructions with NEW indicators and category assignment
- **Editable Ingredient Management**: Users can modify ingredient names, amounts, units, add/remove ingredients, and assign categories to new ingredients during import
- **Interactive Instructions Editor**: Added numbered instruction steps with add/remove functionality for complete control over AI-parsed recipes
- **Smart NEW Ingredient Detection**: Automatic detection of new ingredients with required category selection before saving
- **Part Measurement Preservation**: Enhanced AI parsing to correctly preserve "part" measurements instead of converting to "oz"
- **Photo OCR Mobile Bug Fixed**: Resolved HTTP 413 error by implementing consistent image compression for both OCR extraction and brand creation
- **Image Compression Optimization**: Enhanced workflow to use 31KB compressed images throughout (down from 3.3MB), improving API efficiency
- **AI-Powered Photo OCR Feature**: Implemented extract → review → edit → create workflow for preferred brands using OpenRouter vision models
- **Enhanced YouTube Transcript Extraction**: Improved AI-powered recipe importing from YouTube videos with better transcript parsing
- **Mobile-Responsive Button Design**: Fixed button readability and stacking for iPhone 14/15 resolutions with improved gold accent styling

## Previous Changes (August 10, 2025)
- **Comprehensive Security Hardening**: Implemented enterprise-level security measures for server-only Firebase access
- **Firestore Server-Only Rules**: Deployed strict "deny all" Firestore rules forcing all data access through Admin SDK
- **Express Security Middleware**: Added Helmet, CORS allowlist, Morgan logging, and express-rate-limit (300 req/15min)
- **Admin API Key Protection**: All write operations (POST, PUT, PATCH, DELETE) now require x-admin-key header
- **Enhanced Firebase Initialization**: Strict service account requirement with proper error handling
- **Automated Backup System**: Created Firestore backup script exporting all collections to timestamped JSON files
- **Body Size Limits**: Reduced JSON payload limit from 50MB to 512KB for security
- **CORS Configuration**: Environment-based origin allowlist with credentials support
- **Rate Limiting**: API protection against abuse with 300 requests per 15-minute window per IP
- **Security Testing Verified**: Confirmed all protection layers working (auth, rate limiting, backups)

## Previous Changes (August 7, 2025)
- **Fixed Critical inMyBar Field Bug**: Resolved complete data pipeline issue where `inMyBar` field was being lost during ingredient creation and filtering
- **Enhanced Schema Validation**: Updated `InsertIngredient` schema to properly include `inMyBar` field for TypeScript validation
- **Fixed Firebase Adapter**: Corrected ingredient creation method to preserve `inMyBar` field when converting from form to database format
- **Fixed API Filtering**: Updated ingredients endpoint to properly filter by `inMyBar=true` instead of returning empty array
- **Comprehensive Testing**: Verified end-to-end functionality from creation to retrieval with regression tests
- **Fixed Critical Firebase Image Issue**: Resolved Firebase document size limit errors (1MB+) by implementing comprehensive image compression across all upload components
- **Image Compression System**: Created reusable compression utility (client/src/lib/imageCompression.ts) with 800px max dimensions and 70% JPEG quality
- **Enhanced Database Snapshot System**: Updated regression test framework to capture complete database state before tests and restore afterward
- **Improved Error Handling**: Enhanced Firebase storage layer with size validation, warnings, and detailed logging
- **Fixed My Bar Search Functionality**: Corrected search placeholder text to "Search my bar..." and implemented comprehensive filtering logic for both ingredient names and brand names
- **Enhanced Search Filtering**: Added real-time search filtering with category/subcategory support and improved empty state handling

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite for bundling.
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Consistent dark theme with gold accents, Plus Jakarta Sans font.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework, TypeScript.
- **Database**: Firebase Firestore with server-only access via Admin SDK.
- **Security**: Helmet, CORS allowlist, rate limiting (300 req/15min), session-based authentication, write operation protection.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations.
- **Storage**: Firebase Firestore implementation using Admin SDK with strict server-only access rules.
- **Authentication**: Session-based auth with user registration/login, role-based access control (RBAC), and secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing for recipe parsing, OCR, and content analysis.
- **YouTube Processing**: Transcript extraction and AI-powered recipe parsing from video content.
- **Testing Infrastructure**: Comprehensive regression test suite with database snapshots, data isolation, and authentication testing.

### Key Features & Design Decisions
- **Multi-page Application**: Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages.
- **Navigation**: Responsive navigation system (desktop header + mobile bottom nav).
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Authentication**: Session-based authentication with user registration, login, and role-based access control.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **Data Persistence**: Firebase Firestore with server-only access for secure data persistence across sessions.
- **My Bar Functionality**: Dedicated section and filtering for tracking user's personal ingredient collection, with dynamic cocktail count. Search functionality filters both ingredient names and brand names in real-time.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
- **Error Handling**: Global error middleware, custom request logging.
- **AI-Powered Features**: Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (0.75 → 3/4) across all recipe displays.

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management)
- **UI Framework**: shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide React icons
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK
- **Database**: Firebase Firestore with server-only access
- **Authentication**: Express sessions, bcrypt, passport-local
- **Validation**: Zod, React Hook Form with zodResolver
- **Security**: Helmet, CORS, express-rate-limit, morgan logging
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio web scraping
- **Image Processing**: Custom compression utilities (imageCompression.ts)

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Testing**: Vitest with comprehensive regression test suite
- **Development Utilities**: tsx, morgan logging
- **Replit Integration**: Cartographer, error overlay plugins

### Testing Infrastructure
- **Regression Testing**: Comprehensive test suite covering authentication, API functionality, data isolation
- **Authentication Testing**: Admin/basic user scenarios, RBAC validation, session management
- **Database Protection**: Production data snapshots, test data isolation with unique prefixes
- **Performance Testing**: API response time validation, load testing capabilities
- **Security Testing**: Authentication requirements, rate limiting, write operation protection

## Project File Structure

### Frontend (client/)
- **src/pages/**: Main application pages (Home, CocktailList, CocktailRecipe, Ingredients, MyBar, PreferredBrands)
- **src/components/**: Reusable UI components and feature-specific components
- **src/components/ui/**: shadcn/ui components (forms, buttons, dialogs, etc.)
- **src/lib/**: Utility libraries (queryClient, imageCompression, aiRequest, modelRouter)
- **src/hooks/**: Custom React hooks (use-toast)

### Backend (server/)
- **routes/**: API route definitions organized by feature
- **middleware/**: Authentication, CORS, security middleware
- **storage/**: Firebase Firestore integration and data adapters
- **lib/**: Utility functions and helpers

### Testing (tests/)
- **regression/**: Comprehensive regression test suite
  - **auth-scenarios.test.ts**: Authentication and RBAC testing
  - **api.test.ts**: Core API functionality testing
  - **data-isolation.ts**: Test data management and isolation
  - **performance.test.ts**: API performance benchmarking
  - **firebase-persistence.test.ts**: Database persistence testing

### Configuration
- **vite.config.ts**: Frontend build configuration
- **tailwind.config.ts**: Styling and theme configuration
- **tsconfig.json**: TypeScript compilation settings
- **components.json**: shadcn/ui component configuration
- **firebase.json**: Firebase deployment and security rules
- **firestore.rules**: Database security rules (server-only access)

### Assets & Data
- **attached_assets/**: User-uploaded images and documents
- **public/**: Static assets (hero images, icons)
- **shared/**: Shared types and schemas between frontend/backend

## Current System Status
- **Application Status**: Fully operational with all core features working
- **Security Status**: Enterprise-grade security with authentication, rate limiting, and write protection
- **Database Status**: 6 cocktails, 22 ingredients, 6 tags, 5 preferred brands maintained
- **Testing Status**: Comprehensive regression suite validates all systems
- **Performance Status**: All API endpoints responding within acceptable thresholds
- **Authentication Status**: User registration, login, and session management fully functional