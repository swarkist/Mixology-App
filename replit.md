# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology. It features a React frontend, Express.js backend, and Firebase Firestore database. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality. Key capabilities include enterprise-grade security, AI-powered recipe importing, photo OCR, and comprehensive authentication with role-based access control. The platform aims to serve mixology enthusiasts with a modern, accessible, and secure user experience, with ambitions for market potential in personalized cocktail creation and ingredient management.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Only update replit.md when running regression tests, not after individual fixes.

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
- **Authentication**: Session-based authentication with user registration, login, and role-based access control (RBAC).
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **Data Persistence**: Firebase Firestore with server-only access for secure data persistence across sessions.
- **My Bar Functionality**: Dedicated section and filtering for tracking user's personal ingredient collection, with dynamic cocktail count and search.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
- **Error Handling**: Global error middleware, custom request logging.
- **AI-Powered Features**: Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. This includes full editing for AI-parsed ingredients and instructions, with new ingredient detection and part measurement preservation.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (0.75 → 3/4) across all recipe displays.

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