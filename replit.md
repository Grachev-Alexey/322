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

- **Table Redesign (Latest)**: Completely redesigned package comparison table to match Google Sheets specification
  - Removed hardcoded perks and now display database perks dynamically
  - Fixed currency formatting to show "1 000 ₽" instead of "р.1 000"
  - Reduced column spacing to prevent excessive head movement
  - Made certificate section conditional (only shows when usedCertificate=true)
  - Removed bottom selection buttons - users click package headers instead
  - Fixed bonus account calculations to use actual database values
  - Added proper database perk integration with icons and tooltips

- **Subscription Naming System**: Implemented unique subscription naming with Russian package types
  - Generated unique number combinations in format "X.XXX" (first digit 1-4)
  - Added Russian package names (ВИП, Стандарт, Эконом) instead of English
  - Implemented duplicate checking based on services, cost and package type
  - Created new client modal interface showing subscription title with copy functionality
  - Removed side notifications, results displayed in same modal window
  - Fixed all import issues and API integration errors

- **Yclients Integration Enhancement**: Fixed subscription type creation and improved synchronization
  - Implemented proper pagination for subscription types sync (handles >250 records)
  - Fixed API payload structure for creating subscription types in Yclients
  - Added comprehensive logging for API debugging
  - Corrected service data mapping and conflict handling
  - Added separate "Абонементы" tab in admin interface
  - Enhanced error handling and validation for external API calls

- **Bonus Account System (Latest)**: Implemented comprehensive bonus account feature for packages
  - Added bonusAccountPercent field to packages database schema with test values (VIP: 20%, Standard: 15%, Economy: 10%)
  - Created separate display rows in comparison table showing percentage ("+20% от стоимости") and calculated amount
  - Built admin interface for editing bonus account percentages with real-time validation
  - Added backend API endpoint for updating package bonus account settings
  - Fixed TypeScript interfaces across all components for consistency
  - Enhanced gift procedure cost calculations and display in comparison table

- **Calculator Settings Configuration**: Completed full configuration system implementation
  - All calculator parameters now configurable from admin panel (discounts, thresholds, installment options)
  - Fixed certificate discount logic to use fixed amount instead of percentage
  - Implemented dynamic text and values based on admin settings
  - Resolved bulk discount calculation using procedure count slider
  - Added proper Russian grammar for installment months display
  - Cleaned up debug logging and improved UI aesthetics with gradients and emojis
  - Fixed calculation display for unavailable packages to show potential savings


## User Preferences

```
Preferred communication style: Simple, everyday language.
Interface design: Compact but beautiful - everything should fit on screen without scrolling, but not too small.
```