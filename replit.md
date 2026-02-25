# Maison / Elite Flow App

## Overview
This is an Expo React Native app ("Maison"/"Elite Flow") — a marketplace platform connecting clients with artisans (tradespeople/service providers). It has three user roles: client, artisan, and admin.

## Architecture

### Frontend
- **Expo React Native** with **expo-router** (file-based routing)
- **React Native Web** for browser rendering via Metro bundler
- UI runs on port 8081 (internal Expo Metro dev server)
- Three route groups: `(auth)`, `(client)`, `(artisan)`, `(admin)`

### Backend
- **Express.js** server (TypeScript via tsx)
- Serves on port 5000 (proxies to Expo Metro in dev mode)
- API routes prefixed with `/api`
- In production: serves static Expo build from `static-build/`

### Database
- **PostgreSQL** (Replit-managed)
- **Drizzle ORM** with schema in `shared/schema.ts`
- Config in `drizzle.config.ts`

## Development Setup

### Running
- Workflow: `npm run dev`
  - Starts Express server on port 5000 (dev proxy mode)
  - Starts Expo Metro on port 8081 (internal)
  - Express proxies all non-API requests to Metro

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `EXPO_PUBLIC_DOMAIN` - Domain for API calls (needed for production builds)
- `NODE_ENV` - "development" or "production"

### Database Schema
Run `npm run db:push` to sync schema changes to the database.

## Production Build

### Build Process
1. Set `EXPO_PUBLIC_DOMAIN` to the deployment domain
2. Run `node scripts/build.js` to build static Expo assets
3. Run `npm run server:build` to compile Express server
4. Run `npm run server:prod` to start production server

### Deployment
- Configured as `autoscale` deployment
- Build command: `EXPO_PUBLIC_DOMAIN=$REPLIT_DEPLOYMENT_URL node scripts/build.js && npm run server:build`
- Run command: `npm run server:build && npm run server:prod`

## Key Files
- `app/` - Expo Router screens
- `server/` - Express backend (index.ts, routes.ts, storage.ts)
- `shared/schema.ts` - Drizzle database schema
- `lib/query-client.ts` - React Query + API client
- `context/` - Auth, mission, chat, support contexts
- `components/` - Shared UI components
- `scripts/build.js` - Static Expo build script

## Dependencies & Patches
- `patches/expo-asset+12.0.12.patch` - HTTPS asset URL fix for dev servers
- `patches/react-native-reanimated+3.16.7.patch` - Web compatibility fix for `__reanimatedLoggerConfig`
- `@lottiefiles/dotlottie-react` - Added for lottie-react-native web support
- React upgraded to `^19.1.0` for expo-router 6.x compatibility
