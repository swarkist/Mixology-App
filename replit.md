# Mixology Web Application

## Overview

This is a full-stack web application for cocktail recipes and mixology. The application features a modern React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database with Drizzle ORM. The current implementation includes a cocktail browsing interface with sections for featured cocktails, ingredient filtering, and popular recipes.

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
- **Pages**: Modular page structure with section-based components
- **Styling**: CSS variables system with light/dark theme support
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

### Replit-Specific Features
- **Development Banner**: Replit development environment integration
- **Error Overlay**: Runtime error modal for development
- **Cartographer**: Development tooling integration
- **File System Security**: Strict file access controls