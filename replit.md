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
- **Security**: Helmet, CORS allowlist, rate limiting, session-based authentication, write operation protection requiring `x-admin-key` header. Three-tier role-based access control (RBAC) with smart content restrictions for reviewers. Secure token-based password reset. Ownership validation middleware for user-specific resources. Last admin protection. Comprehensive audit logging for administrative actions.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations, body size limited to 512KB.
- **Authentication**: Session-based auth with user registration/login, three-tier role-based access control (basic/reviewer/admin), secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing. YouTube transcript extraction and AI-powered recipe parsing from video content.
- **Error Handling**: Global error middleware, custom request logging.
- **Deployment Infrastructure**: Environment detection, production database migration tools, connection testing utilities.

### Key Features & Design Decisions
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Data Persistence**: Firebase Firestore with server-only access. User data isolation ensured through `user_id` filtering.
- **My Bar Functionality**: Dedicated section with category-based filtering for tracking user's personal ingredient collection, with dynamic cocktail count, smart brand categorization, and real-time search filtering.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion and client-side image compression.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time API data.
- **AI-Powered Features**: Mixi AI Chatbot with modern dialog-based interface, streaming SSE API, and environment-configurable model routing with robust fallback system. Features recipe database integration for context-aware recommendations, performance-optimized cocktail index, and basic markdown rendering. Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. AI import allows full editing of ingredients and instructions, new ingredient detection, and preservation of "part" measurements.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design. Ownership validation enforced for user-specific brand data.
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
- **Testing**: Vitest with comprehensive regression test suite covering authentication, API functionality, data isolation, UI filtering consistency, performance, and API endpoint validation. Complete test infrastructure for authentication rules and role-based access control, and ownership enforcement.
```