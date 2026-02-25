# Elite Flow (Maitrio) — Artisan Marketplace

## Overview
Expo React Native web marketplace connecting clients with certified artisans in Ile-de-France. Full mission lifecycle: Diagnostic → Estimation → Payment → Matching → Tracking → Signature → Payout. Built with Express backend, PostgreSQL, WebSocket real-time updates, canvas signature capture, and PDF invoice generation.

## Architecture

### Frontend
- **Expo React Native** with **expo-router** (file-based routing)
- **React Native Web** for browser rendering via Metro bundler
- UI runs on port 8081 (internal Expo Metro dev server)
- Route groups: `(auth)`, `(client)`, `(artisan)`
- Contexts: auth-context, mission-context, chat-context, support-context

### Backend
- **Express.js** server (TypeScript via tsx) on port 5000
- Proxies non-API requests to Expo Metro in dev mode
- API routes registered BEFORE proxy middleware (order matters)
- WebSocket on `/ws?userId=XXX` for real-time updates
- PDF invoice generation via jsPDF (`server/pdf.ts`)

### Database
- **PostgreSQL** (Replit-managed) via `DATABASE_URL`
- **Drizzle ORM** with schema in `shared/schema.ts`
- Tables: users, artisan_profiles, missions, mission_quotes, reviews, wallets, wallet_transactions, signatures, invoices, artisan_portfolio_items, notifications
- Config in `drizzle.config.ts`

## Development Setup

### Running
- Workflow: `npm run dev`
  - Starts Express server on port 5000
  - Starts Expo Metro on port 8081 (internal)
  - Express proxies all non-API requests to Metro

### Key Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `NODE_ENV` - "development" or "production"

### Database Schema
Run `npm run db:push` to sync schema changes.

## Seeded Test Data
- **10 IDF artisans** with real GPS coordinates (Paris, Boulogne, Vincennes, Montreuil, etc.)
- **3 test clients**: jean.client / marie.client / paul.client (password: client123)
- **Artisan accounts**: marc.dupont, sophie.martin, karim.benali, etc. (password: artisan123)
- Auto-seeds on first startup, skips if users already exist

## API Endpoints
- POST `/api/auth/register`, POST `/api/auth/login`
- GET/POST `/api/missions`, GET/PUT `/api/missions/:id`
- POST `/api/missions/:id/accept`, POST `/api/missions/:id/complete`
- POST `/api/missions/:id/signature`
- GET `/api/artisans`, GET `/api/artisans/:id`, GET `/api/artisans/:id/portfolio`
- GET `/api/wallet/:userId`
- GET/POST `/api/reviews`
- GET `/api/notifications/:userId`

## Key Files
- `app/` - Expo Router screens (index, auth, client tabs, artisan tabs, mission flows)
- `server/index.ts` - Express server with proxy setup
- `server/routes.ts` - REST API + WebSocket handlers
- `server/storage.ts` - DatabaseStorage class (Drizzle ORM)
- `server/seed.ts` - 10 IDF artisan seeder
- `server/pdf.ts` - jsPDF invoice generation
- `shared/schema.ts` - Drizzle database schema
- `lib/query-client.ts` - API client (uses window.location.origin on web)
- `context/` - Auth, mission, chat, support contexts
- `app/mission/[id]/completion.tsx` - Canvas signature capture screen
- `app/mission/[id]/tracking.tsx` - Real-time mission tracking

## Dependencies & Patches
- `patches/expo+54.0.33.patch` - CorsMiddleware fix for Replit proxy (disables origin check)
- `patches/expo-asset+12.0.12.patch` - HTTPS asset URL fix
- `patches/react-native-reanimated+3.16.7.patch` - Web compatibility fix
- jsPDF installed with `--legacy-peer-deps`
- Reanimated animations disabled on web (set to final values immediately)

## Production Build
1. Set `EXPO_PUBLIC_DOMAIN` to deployment domain
2. Run `node scripts/build.js` to build static Expo assets
3. Run `npm run server:build` to compile Express server
4. Run `npm run server:prod` to start production server
