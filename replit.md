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