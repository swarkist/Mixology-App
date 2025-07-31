# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology, featuring a React frontend, Express.js backend, and PostgreSQL database with Drizzle ORM. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalizing ingredient tracking. The project aims to provide a modern, accessible, and user-friendly platform for mixology enthusiasts.

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
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database.
- **Session Management**: PostgreSQL sessions with `connect-pg-simple`.
- **API Design**: RESTful API with `/api` prefix, centralized route registration.
- **Storage**: Abstract storage interface with implementations for in-memory, file-based persistence, and Firebase Firestore.

### Key Features & Design Decisions
- **Multi-page Application**: Home, Cocktail List, Individual Recipe, Ingredients, and My Bar pages.
- **Navigation**: Responsive navigation system (desktop header + mobile bottom nav).
- **Data Flow**: Centralized API requests, TanStack Query for caching, React state management, Express middleware for request processing.
- **Authentication**: Session-based authentication with PostgreSQL storage.
- **Accessibility**: Comprehensive button accessibility, horizontal scrolling fixes for mobile.
- **Data Persistence**: File-based storage (`data/storage.json`) and Firebase Firestore for robust data persistence across sessions.
- **My Bar Functionality**: Dedicated section and filtering for tracking user's personal ingredient collection, with dynamic cocktail count.
- **Image Handling**: Integrated image upload and display for cocktails and ingredients, with base64 to URL conversion.
- **Dynamic Content**: Featured and Popular Recipes sections with real-time data from the API.
- **Error Handling**: Global error middleware, custom request logging.

## External Dependencies

### Core Dependencies
- **UI Framework**: Radix UI primitives, Tailwind CSS.
- **Database**: Neon Database (PostgreSQL), Firebase Firestore.
- **Validation**: Zod.
- **Date Handling**: `date-fns`.
- **Icons**: Lucide React.
- **Session Management**: `connect-pg-simple`.

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler.
- **Database Tools**: Drizzle Kit.
- **Testing**: Vitest.
- **Development Utilities**: tsx.
- **Replit Integration**: Cartographer, error overlay plugins.