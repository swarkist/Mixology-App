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

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, Vite for bundling.
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Forms**: React Hook Form with Zod validation.
- **Styling**: Consistent dark theme with gold accents, Plus Jakarta Sans font.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **UI/UX Decisions**: Consistent dark theme (#181711) with gold accents (#f3d035), Plus Jakarta Sans font. Modern chat interface with message bubbles, responsive design for mobile devices (iPhone 14/15 optimized). Standardized pill-based filtering and enhanced EmptyState component with differentiated messaging across major pages. URL state synchronization for filter persistence. PWA support with "Miximixology" branding, standalone display mode, dark theme, and comprehensive icon set.
- **Application Structure**: Multi-page application including Home, Cocktail List, Individual Recipe, Ingredients, My Bar, and Preferred Brands pages. Responsive navigation system (desktop header + mobile bottom nav).

### Backend Architecture
- **Runtime**: Node.js with Express.js framework, TypeScript.
- **Database**: Firebase Firestore with server-only access via Admin SDK.
- **Security**: Helmet, CORS allowlist, rate limiting (300 req/15min), session-based authentication, write operation protection requiring `x-admin-key` header. Role-based access control (RBAC). Secure token-based password reset. OpenRouter API integration with graceful environment variable handling.
- **API Design**: RESTful API with `/api` prefix, centralized route registration, authentication-required write operations, body size limited to 512KB.
- **Authentication**: Session-based auth with user registration/login, role-based access control (RBAC), and secure session management.
- **Backup System**: Automated Firestore collection export to timestamped JSON files.
- **AI Integration**: OpenRouter API proxy with model routing.
- **YouTube Processing**: Transcript extraction and AI-powered recipe parsing from video content.
- **Error Handling**: Global error middleware, custom request logging.

### Key Features & Design Decisions
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Data Persistence**: Firebase Firestore with server-only access.
- **My Bar Functionality**: Dedicated section with category-based filtering (spirits, liqueurs, mixers, bitters, syrups, other) for tracking user's personal ingredient collection, with dynamic cocktail count. Features smart brand categorization and real-time search filtering.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion and client-side image compression (800px max, 70% JPEG quality).
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
 - **AI-Powered Features**: Mixi AI Chatbot with modern dialog-based interface, streaming SSE API, and 4-model fallback system (deepseek-r1:free, meta-llama, qwen). Features recipe database integration for context-aware recommendations, clickable navigation links to site recipes only, and mobile-responsive design. Homepage features input field matching original Figma design with "Ask Mixi" button for direct chat initiation and automatic message submission. Silent error handling prevents user-facing abort messages when closing dialog during AI responses. Photo OCR for brand extraction, YouTube transcript parsing, recipe importing from URLs, and intelligent content analysis. AI import allows full editing of ingredients and instructions, new ingredient detection with category assignment, and preservation of "part" measurements. System prompt includes formatting guidelines for ordered lists with plain-text recipe names and structured recipe display, though implementation requires further refinement. Name-based linking system prevents 404 errors by validating recipe names against database before creating clickable links. Known limitation: Enter key triggers temporary dialog showing/hiding behavior that cannot be resolved through code modifications.
- **Preferred Brands System**: Photo-to-brand extraction workflow with editable fields and mobile-responsive design.
- **Fraction Display**: Automatic conversion of decimal measurements to fractions (e.g., 0.75 → 3/4) across all recipe displays.
- **Ingredient Detail Pages**: Enhanced with comprehensive cocktail relationships, complete tags support, and consistent styling.
- **Tags System**: Complete ingredient tagging functionality with proper Firebase storage and unified "Usage & Tags" display.
- **Admin Dashboard**: Comprehensive user management interface with real-time search, role/status filtering, pagination, and enhanced UX.

## External Dependencies

### Core Dependencies
- **Frontend**: React 18, TypeScript, Vite, Wouter (routing), TanStack Query (state management).
- **UI Framework**: shadcn/ui, Radix UI primitives, Tailwind CSS, Lucide React icons.
- **Backend**: Express.js, Node.js, TypeScript, Firebase Admin SDK.
- **Database**: Firebase Firestore.
- **Authentication**: Express sessions, bcrypt, passport-local, secure password reset with email tokens.
- **Validation**: Zod, React Hook Form with `zodResolver`.
- **Security**: Helmet, CORS, `express-rate-limit`, Morgan logging, SMTP email integration.
- **AI Integration**: OpenRouter API, YouTube transcript extraction, Cheerio web scraping.
- **Image Processing**: Custom image compression utilities (`imageCompression.ts`).

### Development & Testing Dependencies
- **Testing**: Vitest with comprehensive regression test suite covering authentication, API functionality, data isolation, UI filtering consistency, performance, and API endpoint validation.