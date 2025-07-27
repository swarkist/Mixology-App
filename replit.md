# Mixology Web Application

## Overview

This is a full-stack web application for cocktail recipes and mixology. The application features a modern React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM. The application now includes a complete navigation system with multiple pages: home page with cocktail browsing, dedicated cocktail list page, detailed recipe pages, and a comprehensive ingredients page with filtering and selection capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: PostgreSQL sessions with connect-pg-simple
- **API Design**: RESTful API with `/api` prefix

### Development Setup
- **Development Server**: Vite dev server with HMR
- **Backend Development**: tsx for TypeScript execution
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Frontend Structure
- **Main App**: React app with query client provider and routing
- **UI Components**: Comprehensive shadcn/ui component library
- **Pages**: Multi-page application with routing between:
  - Home page (Frame with FilterByIngredientSection)
  - Cocktail list page with search and filtering
  - Individual cocktail recipe pages
  - Ingredients page with category filtering and selection
- **Navigation**: Responsive navigation system (desktop header + mobile bottom nav)
- **Styling**: CSS variables system with consistent dark theme (#161611) and gold accents (#f2c40c)
- **Fonts**: Plus Jakarta Sans as primary font family

### Backend Structure
- **Server Entry**: Express server with middleware setup
- **Routes**: Centralized route registration system
- **Storage**: Abstract storage interface with memory-based implementation
- **Error Handling**: Global error middleware with proper status codes
- **Logging**: Custom request logging for API endpoints

### Database Schema
- **Users Table**: Basic user management with username/password
- **Schema Validation**: Zod schemas for type-safe data validation
- **ORM**: Drizzle ORM with PostgreSQL dialect

## Data Flow

### Frontend Data Management
1. **API Requests**: Centralized fetch wrapper with error handling
2. **Query Management**: TanStack Query for caching and synchronization
3. **State Updates**: React state with hooks and context providers
4. **Form Handling**: React Hook Form with schema validation

### Backend Data Flow
1. **Request Processing**: Express middleware chain
2. **Route Handling**: Modular route registration
3. **Data Access**: Storage interface abstraction
4. **Response Formatting**: Consistent JSON API responses

### Authentication Flow
- Session-based authentication with PostgreSQL storage
- User creation and retrieval through storage interface
- Password handling with validation schemas

## External Dependencies

### Core Dependencies
- **UI Framework**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Database**: Neon Database for serverless PostgreSQL
- **Validation**: Zod for runtime type checking
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React for consistent iconography

### Development Dependencies
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Database Tools**: Drizzle Kit for migrations
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Cartographer and error overlay plugins

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push`

### Production Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Server Setup**: Express serves static files and API routes
- **Database**: PostgreSQL connection with SSL in production

### Development Workflow
- **Local Development**: Concurrent frontend and backend servers
- **Hot Reloading**: Vite HMR for frontend, nodemon equivalent for backend
- **Database Development**: Local or cloud PostgreSQL instance

### Recent Updates (July 2025)
- **Fixed Image Upload Issue (July 27, 2025)**: Resolved cocktail image upload and persistence functionality
  - Added image processing logic to both POST and PATCH cocktail routes
  - Images sent as base64 from frontend are now properly converted to imageUrl in backend
  - Image data is correctly stored and retrieved from the database
  - Both create and edit operations now preserve uploaded images
- **Fixed Tags in Edit Mode Issue (July 27, 2025)**: Resolved tags being removed when editing cocktails
  - Added proper tag loading from API response in edit mode
  - Tags are now populated correctly when opening cocktail for editing
  - Existing tags are preserved and displayed in the form
  - Tags remain selected and persist through save operations
- **Fixed Featured Toggle Bug (July 27, 2025)**: Resolved cocktail featured status toggle functionality
  - Fixed route mismatch between frontend `/featured` and backend `/toggle-featured` endpoints
  - Corrected TypeScript compilation errors that prevented proper route registration
  - Added proper `/api/cocktails/:id/featured` route with request body handling
  - Ensured React Query cache invalidation works correctly for UI updates
  - Featured button now properly toggles on/off when clicked
- **Navigation Enhancement (July 27, 2025)**: Enhanced ingredients page with consistent navigation and layout
  - Added DesktopNavigation component to ingredients page matching cocktails list page
  - Fixed spacing issues by implementing proper padding and container structure
  - Streamlined filter controls layout with improved button styling
  - Consistent page header structure with appropriate spacing and typography
  - Maintained responsive grid layout for ingredient cards
- **Critical Fix: Data Persistence Issue Resolved (July 27, 2025)**: Fixed the core data structure mismatch between frontend and backend
  - Frontend sends ingredients as `{name, amount, unit}` but backend expected `{ingredientId, amount, unit}`
  - Implemented automatic data transformation in POST/PATCH routes to convert ingredient names to IDs
  - Added helper methods `findIngredientByName` and `findTagByName` to both MemStorage and Firebase adapters
  - Automatically creates new ingredients and tags when they don't exist during cocktail creation/update
  - Fixed updateCocktail method to handle transformed data structure with ingredientId and tagIds
  - Fixed null image handling bug in updateCocktail method that was causing "Cannot read properties of null" error
  - Complete functionality restored: POST creates cocktails with full relationships, PATCH updates work perfectly
- **Default Recipe Images**: Added fallback image for cocktail recipes without photos using attached no-photo asset
- **Cocktail Card Images**: Enhanced cocktail list cards to display recipe images or default placeholder
- **Add Cocktail Button**: Added prominent "Add Cocktail" button in cocktail list page header for easy recipe creation
- **Edit Recipe Functionality**: Replaced "Cocktail Recipe" badge with "Edit Recipe" button that allows users to edit cocktail details using the same form interface
- **Fixed Cocktail Update Bug**: Enhanced updateCocktail method to properly handle ingredients, instructions, and tags during recipe edits
- **Removed Pro Tips Section**: Eliminated hardcoded "Pro Tips" content that wasn't part of the data model
- **Multi-page Architecture**: Added complete routing system with Wouter
- **Ingredients Page**: Comprehensive ingredient browser with category filtering, search, and ingredient selection
- **Cocktail List Page**: Dedicated cocktail browsing with grid/list views and advanced filtering
- **Recipe Detail Pages**: Individual cocktail pages with ingredients, instructions, and pro tips
- **Navigation System**: Responsive navigation with desktop header and mobile bottom navigation
- **Interactive Features**: Ingredient selection, recipe filtering, hover effects, and smooth transitions

### Firebase Integration (July 26, 2025) - NEEDS WORK
- **Database Migration**: Implemented Firebase Firestore as database backend instead of in-memory storage
- **Storage Architecture**: Created FirebaseStorage class with complete CRUD operations for cocktails and ingredients
- **Adapter Pattern**: Built FirebaseStorageAdapter to maintain compatibility with existing IStorage interface
- **Configuration**: Dynamic storage selection based on FIREBASE_PROJECT_ID environment variable
- **Error Handling**: Robust error handling for Firebase service account key parsing
- **Test Endpoints**: Added `/api/test-firebase` endpoint for connection testing and data migration
- **KNOWN ISSUE**: Firebase storage doesn't implement proper relational structure (stores raw data instead of using junction tables)
- **TEMPORARY FIX**: Using MemStorage until Firebase can be properly restructured for relational data model

### PRD Implementation (July 26, 2025)
- **Data Models**: Complete schema redesign matching PRD specifications
  - Cocktails with featured status, popularity tracking, and relational ingredients/instructions
  - Ingredients with "My Bar" functionality, category/subcategory structure, and usage tracking
  - Tags system for both cocktails and ingredients with usage analytics
  - Junction tables for complex relationships (cocktail-ingredients, cocktail-instructions, tags)
- **Storage Layer**: Comprehensive in-memory storage implementation
  - Full CRUD operations for all entities
  - Search functionality across cocktails and ingredients
  - Advanced filtering (featured cocktails, popular recipes, ingredient-based filtering)
  - "My Bar" ingredient tracking with toggle functionality
  - Popularity metrics with increment/reset capabilities
- **API Layer**: RESTful API endpoints supporting all MVP features
  - Real-time search across cocktails and ingredients
  - Featured cocktails management with timestamp tracking
  - Popularity tracking ("Start Making This Cocktail" button functionality)
  - Ingredient filtering by category, search, and "My Bar" status
  - Match Any/Match All ingredient-based cocktail filtering
  - Tag management with usage analytics and suggestions

### Replit-Specific Features
- **Development Banner**: Replit development environment integration
- **Error Overlay**: Runtime error modal for development
- **Cartographer**: Development tooling integration
- **File System Security**: Strict file access controls