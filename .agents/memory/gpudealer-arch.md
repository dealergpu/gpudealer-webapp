---
name: GPUDealer architecture
description: Stack decisions, routes, DB schema summary, and Clerk proxy setup for GPUDealer.com.
---

## Stack
- **Frontend:** React + Vite, artifact `gpu-dealer`, preview path `/`
- **Backend:** Express 5 API server, artifact `api-server`, port 8080
- **DB:** PostgreSQL via Drizzle ORM, `@workspace/db`
- **Auth:** Clerk (Replit-managed), cookie-based, proxy via `clerkProxyMiddleware`
- **Codegen:** Orval v8 → `@workspace/api-client-react` (React Query hooks) + `@workspace/api-zod` (validation schemas)

## Frontend routes
- `/` — Homepage (public)
- `/gpus` — Marketplace search (public)
- `/listing/:id` — Listing detail (public)
- `/sell` — Create listing (auth-gated)
- `/request` — Hardware request form (auth-gated)
- `/dashboard` — User dashboard (auth-gated)
- `/sign-in/*?` and `/sign-up/*?` — Clerk auth pages (exact route strings)

## DB tables
- `listings` — GPU/server/memory listings with `seller_id` (Clerk user ID)
- `hardware_requests` — procurement requests with `user_id`
- `saved_listings` — composite PK (user_id, listing_id) with FK cascade
- `users` — JIT-provisioned from Clerk on first profile fetch

## API route files
- `src/routes/listings.ts` — CRUD + featured + my listings
- `src/routes/requests.ts` — CRUD + my requests
- `src/routes/saved.ts` — save/unsave/list saved
- `src/routes/stats.ts` — dashboard stats + marketplace stats
- `src/routes/users.ts` — profile get/patch (JIT Clerk user provision)

## Clerk setup in app.ts
Uses `clerkProxyMiddleware` from `.local/skills/clerk-auth/templates/api-server/src/middlewares/clerkProxyMiddleware.ts`, `@clerk/express` `clerkMiddleware`, and `publishableKeyFromHost` to derive the publishable key from request host.

## Why: auth is cookie-based
No Bearer tokens needed on the frontend. `getAuth(req)` in route handlers provides userId.
