# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology, featuring a React frontend, Express.js backend, and Firebase Firestore database. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalizing ingredient tracking. The project features enterprise-grade security, AI-powered recipe importing, photo OCR capabilities, and comprehensive authentication with role-based access control. The platform serves mixology enthusiasts with a modern, accessible, and secure user experience, with a vision to become the go-to resource for home mixologists.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Keep replit.md current with architectural changes and major feature implementations.
Project documentation: Focus on replit.md as primary documentation; archived detailed file structure docs as they are superseded by architectural information here.
Chat interface design: Modern dialog-based UI with responsive mobile optimization, matching provided reference designs.
Testing approach: User feedback required for AI formatting validation; system prompt changes need user testing to verify effectiveness.
Homepage input design: Prefers original Figma search field styling with dark input (#2a2a2a) and yellow "Ask Mixi" button, replacing simple button-only interface.
Development constraints: Do not attempt to fix Enter key dialog temporary showing/hiding behavior - user acknowledges this cannot be resolved through code changes.
Development workflow: User now implements independent code changes and requests reviews rather than full implementations from agent.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite for bundling.
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Consistent dark theme (#181711) with gold accents (#f3d035), Plus Jakarta Sans font.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **UI/UX Decisions**: Modern chat interface with message bubbles, responsive design optimized for iPhone 14/15. Standardized pill-based filtering and enhanced EmptyState component. URL state synchronization for filter persistence. PWA support with "Miximixology" branding, standalone display mode, dark theme, and comprehensive icon set.
- **Application Structure**: Multi-page application including Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages. Responsive navigation system.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework, TypeScript.
- **Database**: Firebase Firestore with server-only access via Admin SDK. Supports separate development and production instances.
- **Security**: Helmet, CORS allowlist, rate limiting (300 req/15min), session-based authentication, write operation protection requiring `x-admin-key` header. Role-based access control (RBAC). Secure token-based password reset.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations, body size limited to 512KB.
- **Authentication**: Session-based auth with user registration/login, role-based access control (RBAC), and secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing. YouTube transcript extraction and AI-powered recipe parsing from video content.
- **Error Handling**: Global error middleware, custom request logging.
- **Deployment Infrastructure**: Environment detection, production database migration tools, connection testing utilities.

### Key Features & Design Decisions
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Data Persistence**: Firebase Firestore with server-only access.
- **My Bar Functionality**: Dedicated section with category-based filtering for tracking user's personal ingredient collection, with dynamic cocktail count, smart brand categorization, and real-time search filtering.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion and client-side image compression.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time API data.
- **AI-Powered Features**: Mixi AI Chatbot with modern dialog-based interface, streaming SSE API, and environment-configurable model routing with robust fallback system. Features recipe database integration for context-aware recommendations, performance-optimized cocktail index, and basic markdown rendering. Clickable navigation links validated against site database. Homepage features input field matching original Figma design with "Ask Mixi" button. Silent error handling prevents user-facing abort messages. Enhanced branding with consistent "Mixi" agent identity. Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. AI import allows full editing of ingredients and instructions, new ingredient detection, and preservation of "part" measurements.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (e.g., 0.75 → 3/4) across all recipe displays.
- **Ingredient Detail Pages**: Enhanced with comprehensive cocktail relationships, complete tags support, and consistent styling.
- **Tags System**: Complete ingredient tagging functionality with proper Firebase storage and unified "Usage & Tags" display.
- **Admin Dashboard**: Comprehensive user management interface with real-time search, role/status filtering, pagination, and enhanced UX.

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management), shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide React icons.
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK.
- **Database**: Firebase Firestore.
- **Authentication**: Express sessions, bcrypt, passport-local, SMTP email integration.
- **Validation**: Zod, React Hook Form with `zodResolver`.
- **Security**: Helmet, CORS, `express-rate-limit`, Morgan logging.
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio web scraping.
- **Image Processing**: Custom image compression utilities (`imageCompression.ts`).

### Development & Testing Dependencies
- **Testing**: Vitest with comprehensive regression test suite covering authentication, API functionality, data isolation, UI filtering consistency, performance, and API endpoint validation. Complete test infrastructure for authentication rules and role-based access control.

## Security & Data Integrity

### Critical Security Fixes & Authentication Resolution (August 20, 2025)
- **User Data Isolation Vulnerability RESOLVED**: Fixed critical security issue where users could see each other's My Bar and Preferred Brands data. Root cause was Firebase storage layer using global `inMyBar` boolean flags instead of user-specific `my_bar` collection. Updated `getPreferredBrandsInMyBar()` and `getMyBarIngredients()` methods to query user-specific data via `my_bar` collection with proper `user_id` filtering. Removed global `toggleIngredientInMyBar()` and `toggleMyBarBrand()` methods that violated data isolation.
- **React Hooks Stability**: Resolved "Rendered more hooks than during the previous render" error caused by hooks being called before early return in MyBar component. Moved all hooks after authentication check.
- **API Endpoint Hardening**: Enhanced user-specific data filtering to ensure complete isolation between user accounts for all personalized features.
- **Preferred Brands Schema Update**: Added `user_id` foreign key to `preferredBrands` table schema to make preferred brands user-specific instead of global. Updated all Firebase storage methods and API endpoints to require authentication and filter by user ID.
- **Authentication Required**: All preferred brands endpoints now require proper user authentication, preventing unauthorized access to any user's personal data.
- **Cookie Authentication Fix**: Resolved missing `requireAuth` middleware on GET `/api/preferred-brands` endpoint that was causing 401 authentication failures even for valid authenticated requests. JWT token parsing and validation now works correctly for all user-specific API endpoints.
- **Top Navigation Search Fix**: Fixed search parameter mismatch between navigation (`search`) and cocktails page (`q`) - now CocktailList reads both parameters for seamless navigation filtering.
- **Mixi Chatbot API Fix**: Resolved LSP compilation error in OCR function that was preventing the chat API from responding. Chat endpoint now streams responses correctly using OpenRouter API integration.

### Comprehensive Security Testing Suite
- **User Data Isolation Tests**: Dedicated test suite (`tests/security/user-data-isolation.test.ts`) validating that users can only access their own My Bar items and Preferred Brands status.
- **Cross-User Access Prevention**: Tests ensuring users cannot access, modify, or view other users' personal data.
- **Authentication Context Validation**: Verification that user-specific endpoints require proper authentication while global content remains publicly accessible.
- **Data Integrity Validation**: Tests confirming that user operations maintain data consistency and proper ownership verification.