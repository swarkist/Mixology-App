# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology. It features a React frontend, Express.js backend, and Firebase Firestore database. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality. Key capabilities include enterprise-grade security, AI-powered recipe importing, photo OCR, and comprehensive authentication with role-based access control. The platform aims to serve mixology enthusiasts with a modern, accessible, and secure user experience, with ambitions for market potential in personalized cocktail creation and ingredient management.

**Recent Major Update (Aug 14, 2025)**: Implemented comprehensive CORS and session authentication system to resolve My Favs 401 errors, enabling cross-site cookie functionality for secure user session management.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Only update replit.md when running regression tests, not after individual fixes.

## Recent Changes
**August 14, 2025 - CORS and Session Authentication Overhaul**
- Implemented comprehensive fix for My Favs 401 Unauthorized errors
- Added express-session middleware with cross-site cookie support (secure: true, sameSite: 'none')
- Updated CORS configuration with credentials: true and preflight handling
- Enhanced apiRequest function to always send credentials: 'include' for session cookies
- Separated CocktailList queries with authentication guards to prevent unauthorized API calls
- Added debug endpoint /api/_whoami for session validation and troubleshooting
- Implemented graceful 401 error handling in useFavoriteIds returning isAuthed: false
- Added request logging for favoriteOnly queries showing Origin and Cookie presence
- Fixed Content Security Policy configuration to allow Vite development scripts
- System now properly handles both logged-in and logged-out states for My Favs functionality

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
- **Security**: Helmet with CSP, CORS with credentials support, rate limiting (300 req/15min), cross-site session authentication, write operation protection.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations.
- **Storage**: Firebase Firestore implementation using Admin SDK with strict server-only access rules.
- **Authentication**: Dual JWT and express-session auth system with cross-site cookie support, RBAC, and secure session management (httpOnly, secure, sameSite: 'none').
- **CORS Configuration**: Comprehensive CORS setup with credentials: true, preflight handling, and allowlist-based origin validation for cross-site requests.
- **Session Management**: Express-session middleware with secure cross-site cookie settings for Replit HTTPS iframe compatibility.
- **Debug Infrastructure**: /api/_whoami endpoint and request logging for session validation and troubleshooting.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing for recipe parsing, OCR, and content analysis.
- **YouTube Processing**: Transcript extraction and AI-powered recipe parsing from video content.
- **Testing Infrastructure**: Comprehensive regression test suite with database snapshots, data isolation, and authentication testing.

### Key Features & Design Decisions
- **Multi-page Application**: Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages.
- **Navigation**: Responsive navigation system (desktop header + mobile bottom nav).
- **Data Flow**: Centralized API requests with credentials: 'include', TanStack Query for caching, React state management, Express middleware for request processing.
- **Authentication**: Dual JWT and express-session authentication with cross-site cookie support, user registration, login, and role-based access control (RBAC).
- **Favorites System**: Robust My Favs functionality with authentication guards, graceful 401 handling, and optimistic updates. Prevents unauthorized API calls when logged out.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **Data Persistence**: Firebase Firestore with server-only access for secure data persistence across sessions.
- **My Bar Functionality**: Dedicated section and filtering for tracking user's personal ingredient collection, with dynamic cocktail count and search.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
- **Error Handling**: Global error middleware, custom request logging, graceful authentication error handling.
- **AI-Powered Features**: Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. This includes full editing for AI-parsed ingredients and instructions, with new ingredient detection and part measurement preservation.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (0.75 → 3/4) across all recipe displays.
- **Cross-Site Compatibility**: Full CORS and session cookie support for Replit HTTPS iframe deployment with proper sameSite and secure cookie settings.

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management)
- **UI Framework**: shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide React icons
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK
- **Database**: Firebase Firestore
- **Authentication**: Express sessions, bcrypt, passport-local
- **Validation**: Zod, React Hook Form with zodResolver
- **Security**: Helmet, CORS, express-rate-limit, morgan logging
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio web scraping
- **Image Processing**: Custom compression utilities

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Testing**: Vitest with comprehensive regression test suite
- **Development Utilities**: tsx, morgan logging
- **Replit Integration**: Cartographer, error overlay plugins