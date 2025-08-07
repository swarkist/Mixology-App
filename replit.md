# Mixology Web Application

## Overview
This is a full-stack web application for cocktail recipes and mixology, featuring a React frontend, Express.js backend, and PostgreSQL database with Drizzle ORM. The application provides comprehensive features for browsing, searching, and managing cocktail recipes and ingredients, including detailed recipe pages, ingredient filtering, and a "My Bar" functionality for personalizing ingredient tracking. The project aims to provide a modern, accessible, and user-friendly platform for mixology enthusiasts.

## User Preferences
Preferred communication style: Simple, everyday language.
Documentation updates: Only update replit.md when running regression tests, not after individual fixes.

## Recent Changes (August 7, 2025)
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
- **My Bar Functionality**: Dedicated section and filtering for tracking user's personal ingredient collection, with dynamic cocktail count. Search functionality filters both ingredient names and brand names in real-time.
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