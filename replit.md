# Beauty Service Calculator

## Overview

This is a full-stack web application for calculating beauty service packages with flexible pricing tiers and payment options. The system is designed for beauty salons to provide price calculations for different service packages (VIP, Standard, Economy) with installment payment options and client management.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React with TypeScript, using Vite for build tooling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI with Tailwind CSS styling
- **State Management**: TanStack Query for server state management
- **Authentication**: PIN-based authentication system

## Key Components

### Frontend Architecture
- **React Router**: Uses Wouter for client-side routing
- **Component Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and variables
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack Query for API state, local state for UI

### Backend Architecture
- **API Structure**: RESTful API with Express.js
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Service Layer**: Modular services including Yclients integration
- **Authentication**: Session-based authentication with PIN codes
- **Data Storage**: Abstracted storage interface for database operations

### Database Schema
- **Users**: PIN-based authentication with role-based access (master/admin)
- **Services**: Cached beauty services from Yclients API
- **Subscription Types**: Package definitions with pricing tiers
- **Clients**: Customer information and contact data
- **Sales**: Transaction records and package purchases
- **Config**: Application configuration storage

### External Integrations
- **Yclients API**: Integration for service data synchronization
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and deployment environment

## Data Flow

1. **Authentication**: Users authenticate with 6-digit PIN codes
2. **Service Selection**: Users select beauty services from cached Yclients data
3. **Package Calculation**: System calculates pricing for VIP, Standard, and Economy packages
4. **Payment Configuration**: Users configure down payment and installment options
5. **Client Management**: System captures client information for order processing
6. **Order Processing**: Final calculations are processed and stored

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection for serverless environment
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI component primitives
- **wouter**: Lightweight React router
- **zod**: Schema validation library
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

The application is configured for deployment on Replit with:
- **Build Process**: Vite builds the frontend, esbuild bundles the backend
- **Runtime**: Node.js 20 environment
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Auto-scaling**: Configured for autoscale deployment target

The development environment uses Vite's HMR (Hot Module Replacement) for rapid development, while production builds are optimized and served statically.

## Recent Changes

✓ January 21, 2025: Successfully migrated project from Replit Agent to standard Replit environment
✓ Created PostgreSQL database and configured environment variables
✓ Ran database migrations with drizzle-kit push
✓ Verified application functionality and security setup

## User Preferences

```
Preferred communication style: Simple, everyday language.
```