# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology, featuring a React frontend, Express.js backend, and Firebase Firestore database. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalizing ingredient tracking. The project features enterprise-grade security, AI-powered recipe importing, photo OCR capabilities, and comprehensive authentication with role-based access control. The platform serves mixology enthusiasts with a modern, accessible, and secure user experience, with a vision to become the go-to resource for home mixologists.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Only update replit.md when running regression tests, not after individual fixes.

## Recent Changes (August 14, 2025)
- **Ingredient Tags Functionality Fix**: Completely resolved ingredient tags system with proper Firebase storage handling, PATCH route tag transformation, and EditIngredient form tag loading
- **Ingredient Detail Page Enhancement**: Added "Used in Cocktails" section matching Preferred Brands design with proper `/recipe/{id}` navigation links and cocktail count display
- **Tags Section Standardization**: Unified tags display across ingredient and cocktail pages with "Usage & Tags" title, gold badge styling, and "No tags assigned" fallback messaging
- **Unified Real-Time Search & Standardized Empty States**: Implemented consistent pill-based filtering across Cocktails, Ingredients, and My Bar pages with enhanced EmptyState component
- **My Bar Category Filtering**: Added smart brand categorization system (spirits, liqueurs, mixers, bitters, syrups, other) based on name pattern recognition
- **Enhanced EmptyState Component**: Differentiated messaging for search vs filter results with proper "Clear filters" vs "Try different keywords" actions
- **Streamlined My Bar Layout**: Removed "My Collection" badge and consolidated filter pills with action buttons into single inline row for cleaner interface
- **Brand Categorization Logic**: Implemented intelligent brand category detection analyzing names (whiskey→spirits, syrup→syrups, tonic→mixers, etc.)
- **URL State Synchronization**: Added category filter persistence in URL parameters for bookmarkable filtered views
- **Comprehensive Filter Testing**: Updated regression test suite with brand categorization validation and EmptyState differentiation testing
- **Cross-Page Filtering Consistency**: Standardized pill filter design and behavior across all major pages (CocktailList, Ingredients, MyBar)
- **Admin Dashboard UX Improvements**: Enhanced search functionality with inline clear button, improved button contrast (yellow theme), added "Back to Site" navigation link in header, converted search to real-time operation

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite for bundling.
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Consistent dark theme with gold accents, Plus Jakarta Sans font.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework, TypeScript.
- **Database**: Firebase Firestore with server-only access via Admin SDK.
- **Security**: Helmet, CORS allowlist, rate limiting (300 req/15min), session-based authentication, write operation protection requiring `x-admin-key` header.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations, body size limited to 512KB.
- **Authentication**: Session-based auth with user registration/login, role-based access control (RBAC), and secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing for recipe parsing, OCR, and content analysis.
- **YouTube Processing**: Transcript extraction and AI-powered recipe parsing from video content.

### Key Features & Design Decisions
- **Application Structure**: Multi-page application including Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages. Responsive navigation system (desktop header + mobile bottom nav).
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Data Persistence**: Firebase Firestore with server-only access.
- **My Bar Functionality**: Dedicated section with category-based filtering (spirits, liqueurs, mixers, bitters, syrups, other) for tracking user's personal ingredient collection, with dynamic cocktail count. Features smart brand categorization and real-time search filtering.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion and client-side image compression (800px max, 70% JPEG quality) to prevent Firebase document size limit errors.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
- **Error Handling**: Global error middleware, custom request logging.
- **AI-Powered Features**: Photo OCR for brand extraction (extract → review → edit → create workflow), YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. AI import allows full editing of ingredients and instructions, including new ingredient detection with category assignment, and preservation of "part" measurements.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (e.g., 0.75 → 3/4) across all recipe displays.
- **UI Consistency**: Standardized pill-based filtering and enhanced EmptyState component with differentiated messaging across major pages (CocktailList, Ingredients, MyBar). URL state synchronization for filter persistence.
- **Ingredient Detail Pages**: Enhanced with comprehensive cocktail relationships showing all recipes using each ingredient, complete tags support with proper create/edit functionality, and consistent CardContent styling.
- **Tags System**: Complete ingredient tagging functionality with proper Firebase storage, tag creation during ingredient updates, and unified "Usage & Tags" display matching cocktail pages.
- **Admin Dashboard**: Comprehensive user management interface with real-time search, role/status filtering, pagination, and enhanced UX features including inline clear functionality and improved visual contrast.

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management).
- **UI Framework**: shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide React icons.
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK.
- **Database**: Firebase Firestore.
- **Authentication**: Express sessions, bcrypt, passport-local.
- **Validation**: Zod, React Hook Form with `zodResolver`.
- **Security**: Helmet, CORS, `express-rate-limit`, Morgan logging.
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio web scraping.
- **Image Processing**: Custom image compression utilities (`imageCompression.ts`).

### Development & Testing Dependencies
- **Testing**: Vitest with comprehensive regression test suite covering authentication, API functionality, data isolation, UI filtering consistency, and performance.