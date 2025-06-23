# ViVi-Calc - Sales Calculator

## Project Overview
ViVi-Calc is a comprehensive sales calculation tool designed for beauty salons. It helps calculate package deals, discounts, installment payments, and manages client data with different subscription types.

## Recent Changes
- **2024-12-23**: Successfully migrated project from Replit Agent to Replit environment
- **2024-12-23**: Set up PostgreSQL database with all required tables
- **2024-12-23**: Added test data: 10 services and 5 perks with package configurations
- **2024-12-23**: Removed gray background from calculator page per user request
- **2024-12-23**: Applied modern visual separation to all UI components with subtle gradients, shadows, and enhanced borders
- **2024-12-23**: Application running successfully on port 5000 - migration and styling complete

## Project Architecture
- **Frontend**: React with Vite, TailwindCSS, Radix UI components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: PIN-based system with roles (master/admin)
- **Key Features**:
  - Package calculation (VIP, Standard, Economy)
  - Service selection and pricing
  - Installment payment calculations
  - Client management
  - Sales tracking
  - Configurable perks and discounts

## User Preferences
- Language: Russian
- Prefers test data without icons in names or descriptions
- Wants 5 perks without highlighting features
- Prefers clean white background on calculator page (no gray backgrounds)

## Development Notes
- Uses TSX for TypeScript execution
- Database migrations handled via Drizzle Kit
- Environment configured for Replit deployment
- Client/server separation maintained for security