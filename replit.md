# ViVi-Calc - Sales Calculator

## Project Overview
ViVi-Calc is a comprehensive sales calculation tool designed for beauty salons. It helps calculate package deals, discounts, installment payments, and manages client data with different subscription types.

## Recent Changes
- **2024-12-23**: Successfully migrated project from Replit Agent to Replit environment
- **2024-12-23**: Set up PostgreSQL database with all required tables
- **2024-12-23**: Added test data: 10 services and 5 perks with package configurations
- **2024-12-23**: Removed gray background from calculator page per user request
- **2024-12-23**: Applied basic visual separation using card borders to distinguish components from white background
- **2024-12-23**: Fixed missing borders on all UI blocks in both calculator and promo-calculator pages
- **2024-12-23**: Removed gray background from package comparison table header for consistent white design
- **2024-12-23**: Application running successfully on port 5000 - migration and styling complete
- **2024-12-23**: Fixed gift services cost calculation to use original cost per procedure instead of discounted cost
- **2024-12-23**: Fixed gift services calculation to use database settings (giftSessions) and update properly when procedure count changes
- **2024-12-23**: Debugging gift calculation issue - selectedServices array not being passed correctly to component

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
- Wants simple visual separation with borders, no complex hover effects or gradients

## Development Notes
- Uses TSX for TypeScript execution
- Database migrations handled via Drizzle Kit
- Environment configured for Replit deployment
- Client/server separation maintained for security