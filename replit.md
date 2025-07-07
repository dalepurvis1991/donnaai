# Baron - Email Assistant

## Overview

Baron is a modern email management and categorization application built with a React frontend and Express.js backend. The system automatically categorizes emails into three main types: FYI (informational), Draft (requiring action), and Forward (to be shared). It integrates with Gmail via IMAP to fetch and process emails, providing users with a clean dashboard interface to manage their email workflow.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Email Integration**: IMAP via ImapFlow and mailparser libraries
- **Authentication**: Session-based with connect-pg-simple for PostgreSQL session storage

### Design System
- **Component Library**: shadcn/ui with "new-york" style variant
- **Theme**: Neutral base color with CSS variables for theming
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Email entities with categorization fields
- **Migrations**: Managed through Drizzle Kit
- **Storage**: Dual storage approach with in-memory fallback and PostgreSQL primary storage

### Email Service
- **Provider**: Gmail integration via IMAP
- **Protocol**: Secure IMAP connection (port 993)
- **Authentication**: App-specific passwords for Gmail accounts
- **Processing**: Automatic email parsing and categorization
- **Real-time Updates**: Periodic fetching with connection monitoring

### API Layer
- **Health Monitoring**: Connection status tracking for email services
- **Statistics**: Email count and categorization metrics
- **CRUD Operations**: Full email management capabilities
- **Error Handling**: Comprehensive error responses and logging

### User Interface
- **Dashboard**: Three-column layout for categorized emails (FYI, Draft, Forward)
- **Statistics**: Overview cards showing email counts and last update times
- **Real-time Updates**: Automatic data refreshing with visual indicators
- **Responsive Design**: Mobile and desktop optimized layouts

## Data Flow

1. **Email Ingestion**: IMAP service connects to Gmail and fetches recent emails
2. **Processing**: Emails are parsed using mailparser and categorized automatically
3. **Storage**: Processed emails are stored in PostgreSQL with Drizzle ORM
4. **API Layer**: Express routes provide RESTful access to email data
5. **Frontend**: React components fetch data via TanStack Query and display in dashboard
6. **User Interaction**: Users can refresh data and view categorized emails in real-time

## External Dependencies

### Email Integration
- **Gmail IMAP**: Primary email source requiring app-specific passwords
- **Connection Requirements**: GMAIL_EMAIL and GMAIL_APP_PASSWORD environment variables

### Database
- **Neon Database**: Serverless PostgreSQL provider
- **Connection**: DATABASE_URL environment variable required

### Development Tools
- **Replit Integration**: Development environment with hot reloading and error overlays
- **Vite Plugins**: Runtime error modal and cartographer for enhanced development experience

## Deployment Strategy

### Development
- **Local Development**: `npm run dev` starts both frontend and backend with hot reloading
- **Environment**: NODE_ENV=development with Vite dev server integration
- **Database**: Drizzle push for schema synchronization

### Production
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Static Assets**: Frontend built to `dist/public` directory
- **Server**: Express serves both API and static files
- **Database**: Production PostgreSQL with connection pooling

### Configuration
- **Environment Variables**: DATABASE_URL, GMAIL_EMAIL, GMAIL_APP_PASSWORD
- **Port Configuration**: Dynamic port assignment for cloud deployment
- **Asset Serving**: Static file serving with proper MIME types

## Changelog

Changelog:
- July 06, 2025. Initial setup
- July 06, 2025. Implemented Replit OAuth authentication for simple Google login (no setup required)
- July 06, 2025. Added user session management and authentication-based routing
- July 06, 2025. Created landing page with one-click Google authentication via Replit
- July 07, 2025. Switched to production-ready system with real Gmail integration
- July 07, 2025. Implemented database storage with PostgreSQL for persistent data
- July 07, 2025. Connected real Gmail IMAP for email fetching and categorization
- July 07, 2025. Removed demo mode - now using authentic email data only
- July 07, 2025. Ready for live deployment with Replit OAuth authentication

## User Preferences

Preferred communication style: Simple, everyday language.