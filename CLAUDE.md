# GPUDealer Frontend — CLAUDE.md

## 1. Project Identity

Project name: GPUDealer

Domain: https://gpudealer.com

Repository: GPUDealer Frontend

GPUDealer is a marketplace and discovery platform for used GPUs and AI hardware.

The initial product is NOT a GPU cloud, GPU rental platform, or infrastructure provider.

The first objective is to build a useful marketplace/discovery experience that aggregates and captures supply and demand for used AI hardware.

The long-term business may evolve into a GPU procurement/dealer business.

The brand name "GPUDealer" is intentional.

The eventual business vision is:

> GPUDealer becomes the place where companies and individuals find, buy, sell, lease, and procure GPU infrastructure.

However, the current product must remain simple.

---

# 2. Business Vision

GPUDealer has three major long-term stages.

## Stage A — Inventory + Demand Network

This is the current stage.

GPUDealer should:

1. Aggregate used GPU and AI hardware listings.
2. Allow users to list their own hardware.
3. Allow buyers to request hardware they cannot find.
4. Capture structured information about supply and demand.
5. Build an audience and searchable inventory.
6. Generate qualified buyer and seller leads.
7. Learn which GPUs, hardware configurations, prices, quantities, and regions have demand.

The important asset created during Stage A is:

> Structured GPU supply + demand data.

The goal is NOT to immediately process transactions.

---

## Stage B — Marketplace

If Stage A demonstrates demand, GPUDealer can evolve into a true marketplace.

Potential functionality:

- direct buyer/seller contact
- offers
- transactions
- commissions
- seller verification
- buyer verification
- payment processing
- escrow
- shipping
- reviews
- ratings
- hardware verification
- dealer accounts
- wholesale listings

Do not build these features unless explicitly requested.

---

## Stage C — GPU Dealer / Procurement

The long-term opportunity is to become a specialized GPU procurement company.

Example:

A company in India says:

> "We need 100 RTX 4090 GPUs under $1,300 each."

GPUDealer can:

1. Identify demand.
2. Search its supply network.
3. Contact US suppliers.
4. Source inventory.
5. Negotiate pricing.
6. Arrange logistics.
7. Potentially arrange inspection/testing.
8. Sell to the international customer at a margin.

GPUDealer then becomes a traditional hardware dealer/broker powered by software.

Potential future markets include:

- India
- Vietnam
- Southeast Asia
- Middle East
- Europe
- other regions with strong AI hardware demand

Do not build international procurement functionality during Stage A.

---

# 3. Current Product Strategy

The current product should be thought of as:

> "A specialized marketplace/discovery engine for used AI hardware."

A useful mental model is:

- eBay for hardware inventory
- Cars.com for GPU discovery
- PCPartPicker for technical filtering
- procurement intelligence for AI hardware

Do NOT think of the product as:

- Vast.ai
- RunPod
- Together AI
- AWS
- a GPU cloud
- a GPU rental network
- a generic computer marketplace

---

# 4. Core Stage A User Flows

There are three primary actions.

## 4.1 Find Hardware

A visitor can browse without an account.

They can:

- search GPUs
- filter by VRAM
- filter by price
- filter by condition
- filter by location
- view hardware details
- view seller/listing information
- click through to the original source

Public browsing should be frictionless.

Do NOT require registration just to browse.

---

## 4.2 Sell Hardware

Users can list:

- GPUs
- GPU servers
- AI servers
- RAM/memory
- other relevant AI hardware

Users must register before listing hardware.

Example:

> RTX 4090
> 24GB
> Used
> Quantity: 4
> $1,250 each
> Texas, USA

Listings may originate from:

- GPUDealer users
- eBay
- Reddit
- Facebook Marketplace
- other marketplaces
- manually curated sources

Third-party listings should only expose normalized information and a link to the original listing.

Do not assume we have permission to copy full descriptions or images from third-party marketplaces.

---

## 4.3 Request Hardware

This is one of the most important product features.

If someone cannot find what they need, they can submit a hardware request.

Example:

> Need 32 × RTX 4090
> Used is acceptable
> Budget: <$1,300 each
> Destination: Bangalore, India
> Required within 30 days

Users must register before submitting a request.

Hardware requests are future procurement leads.

Treat them as strategically important.

---

# 5. Primary CTA Structure

The website should communicate three things immediately:

### Find Hardware

Search existing inventory.

### Sell Your Hardware

List GPUs or AI hardware you own.

### Request Hardware

Tell GPUDealer what you need if you cannot find it.

These three actions should be visible throughout the site where appropriate.

---

# 6. Product Positioning

Primary tagline:

> Find. Sell. Request.

Supporting positioning:

> Used GPUs, AI servers, memory and compute hardware.

Alternative supporting language:

> Find the hardware you need. Sell hardware you no longer need. Request anything you can't find.

Avoid making the product sound like a gaming marketplace.

The audience includes:

- AI developers
- researchers
- startups
- enterprises
- data-center operators
- GPU resellers
- system integrators
- gamers
- hardware enthusiasts
- international buyers

The highest-value future customer is a business that needs multiple GPUs.

---

# 7. Hardware Categories

Initial categories:

## GPU

Examples:

- RTX 3090
- RTX 3090 Ti
- RTX 4090
- RTX 5090
- RTX A5000
- RTX A6000
- RTX 6000 Ada
- A100
- H100
- H200
- B200
- other NVIDIA/AMD/Intel GPUs

## Server

Examples:

- 4-GPU servers
- 8-GPU servers
- Dell GPU servers
- HP GPU servers
- Lenovo GPU servers
- Supermicro GPU servers
- custom AI servers

## Memory

Examples:

- DDR4
- DDR5
- ECC
- RDIMM
- server memory

## Other AI Hardware

Future possibilities:

- networking
- storage
- CPUs
- motherboards
- PSUs
- complete AI workstations

Do not expand into general consumer electronics.

---

# 8. Technology Stack

This repository is the frontend only.

Frontend:

- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS v4
- Deployed to Cloudflare Workers via the OpenNext adapter (`@opennextjs/cloudflare`)

Backend is a separate Hono.js repository, deployed independently:

- Hono
- TypeScript
- PostgreSQL (via Supabase)

This repo never connects to that backend's database directly, and never
vendors its code. It talks to it exclusively over REST, through
`NEXT_PUBLIC_API_URL`.

Authentication:

- Supabase Auth (`@supabase/ssr` — cookie-based sessions shared between
  Server Components, middleware, and the browser)

Frontend communicates with the backend through REST APIs, using a typed
client generated from an OpenAPI spec (see section 24).

The frontend must NOT directly access Postgres or any database.

The frontend must NOT contain backend business logic.

---

# 9. Architectural Principles

## Keep the frontend thin

Frontend responsibilities:

- rendering
- routing
- user interaction
- form handling
- validation for UX
- API calls
- displaying API state

Backend responsibilities:

- authorization
- business rules
- persistence
- database operations
- moderation
- validation/security
- analytics

Never rely on frontend validation for security.

---

# 10. Rendering Strategy

Prefer Next.js Server Components where practical.

Use Client Components only when interactivity requires them.

Good candidates for Client Components:

- search filters
- modals
- forms
- dropdowns
- interactive dashboard elements
- authentication forms

Avoid turning entire pages into Client Components unnecessarily.

SEO is extremely important.

Public listing/search pages should be indexable.

Current split, as a concrete reference:

- **Server Components with real server-side data fetching**: `/` (home),
  `/gpus` (search — reads `searchParams`, refetches on the server whenever a
  filter changes the URL), `/listing/[id]` (with `generateMetadata` for
  per-listing SEO title/description/OG tags, plus the first page of
  comments so the Q&A is indexable), `/user/[username]` (public profile +
  that user's published/sold listings). These call only public,
  unauthenticated endpoints.
- **Server Components doing an auth check only**: `/sell`, `/request`,
  `/dashboard`, `/account/profile`, `/account/api-keys` — read the session via `src/lib/supabase/server.ts` and
  `redirect()` to `/sign-in` before rendering anything if there's no user.
  The actual form/interactive body is a Client Component they render.
- **Client Components**: the interactive body of `/sell`, `/request`,
  `/dashboard`, plus `/sign-in`, `/sign-up`, and `Navbar` (all need hooks —
  forms, mutations, or `useAuth()`). Authenticated data fetching (React Query
  + the generated hooks) happens client-side only — the API client's shared
  auth-token state is a browser-safe singleton, not safe to reuse for
  concurrent per-user server-side requests, so server-side fetching is
  reserved for public data.

---

# 11. SEO Strategy

SEO is a major acquisition channel.

GPUDealer should eventually rank for searches such as:

- used RTX 3090
- used RTX 4090
- used RTX 5090
- used A6000
- used A100
- used H100
- 24GB GPU
- 48GB GPU
- 80GB GPU
- cheap GPU for AI
- used AI server
- used GPU server
- used ECC RAM

Potential URL structure:

/gpus
/gpus/rtx-3090
/gpus/rtx-4090
/gpus/rtx-5090
/gpus/a6000
/gpus/a100
/gpus/h100

Potential future URLs:

/gpus/rtx-4090/24gb
/gpus/rtx-3090/24gb

Do not create thousands of thin SEO pages.

Pages should have useful content and inventory.

---

# 12. Design Philosophy

GPUDealer should feel:

- trustworthy
- technical
- mature
- efficient
- data-driven
- professional
- slightly premium
- utilitarian

The website should feel appropriate for someone buying:

- a $700 GPU
- a $10,000 workstation
- a $100,000 server
- eventually a $1M GPU fleet

Avoid:

- excessive gradients
- cyberpunk aesthetics
- neon
- gaming/RGB aesthetics
- crypto aesthetics
- excessive animations
- cartoon illustrations
- generic "AI SaaS" visuals

The brand should feel more like a serious hardware marketplace.

---

# 13. Visual Inspiration

Use these products as conceptual inspiration only:

- Bloomberg — information density
- Linear — polished interface
- Stripe — clarity
- PCPartPicker — technical utility
- eBay — marketplace familiarity
- enterprise procurement software — seriousness

Do not copy their visual design.

---

# 14. Color Direction

Prefer:

- white
- off-white
- light gray
- charcoal
- near-black

Use one primary accent.

Possible accent:

- restrained blue
- technical green

Use status colors sparingly.

The UI should not look colorful for the sake of looking colorful.

---

# 15. Typography

Preferred:

- Geist
- Inter
- system sans

Typography should be:

- compact
- readable
- technical
- modern

Hardware specifications and prices should be easy to scan.

---

# 16. Homepage Requirements

The homepage should immediately communicate the product.

Hero:

# GPUDealer

## Find. Sell. Request.

Supporting copy:

> Used GPUs, AI servers, memory and compute hardware.

Search field:

> Search GPUs, servers, memory...

Then three primary actions:

### Find Hardware

Search existing listings.

### Sell Your Hardware

List GPUs or AI hardware.

### Request Hardware

Tell us what you need.

Below that:

- latest listings
- popular GPUs
- popular searches
- useful filters
- request CTA

---

# 17. Search UX

Search should be one of the most important parts of the site.

Users should be able to search:

- RTX 4090
- 24GB
- H100
- A6000
- GPU server
- ECC RAM

Filters:

- GPU model
- VRAM
- price
- condition
- location
- category

Sorting:

- relevance
- lowest price
- highest price
- newest

Use URL query parameters so searches are shareable and indexable.

Example:

/gpus?model=rtx-4090&vramMin=24&maxPrice=1300

---

# 18. Listing Cards

Listing cards should prioritize:

1. hardware
2. VRAM/specifications
3. price
4. condition
5. location
6. quantity
7. source

Example:

RTX 4090

24GB VRAM

$1,249

Used

4 available

Texas, USA

Source: eBay

[View Listing]

Cards should be information-dense but clean.

---

# 19. Listing Detail

Show:

- title
- images
- model
- manufacturer
- VRAM
- quantity
- price
- price per unit
- condition
- location
- source
- description
- specifications
- verification status
- date
- seller (avatar, name, link to their `/user/{username}` profile)

The seller comes from `listing.seller` (`id`, `username`, `name`,
`profilePic`), which only the single-listing endpoint returns — search/list
results don't include it. Label it "Seller" / "Sold by" for GPUDealer
listings, but "Shared by" for third-party listings: there it's whoever
added the listing to GPUDealer, not the owner of the hardware (section 27).

CTA for external listings:

> View Original Listing

CTA for GPUDealer listings:

> Contact Seller

Secondary CTA:

> Request Similar Hardware

This secondary CTA is strategically important.

## Comments

Public Q&A under each listing (`src/components/listing/comments/`), backed
by `/listings/{listingId}/comments` (`listingId` accepts id or slug).

- Anyone can read; only signed-in users can post, reply or delete.
  Logged-out visitors get "Log in to comment" (sign-in with `?next=` back to
  `#comments`).
- Posting is only allowed while `listing.status === PUBLISHED`; other
  statuses render the thread read-only (no reply/delete buttons).
- Threads are one level deep. Replying to a reply sends the **top-level**
  comment's id as `parentCommentId`, so it lands in the same thread
  (prefilled with `@username`).
- Paging: 10 top-level comments per page, newest first, each embedding its
  first 5 replies (oldest first) + `replyCount`. "See more comments" appends
  the next page; "See more replies" starts at **page 2** of
  `/comments/{id}/replies` (page 1 is the embedded 5). Always dedupe by
  `id` when appending — new posts shift offsets. Page sizes live in
  `src/lib/comments.ts` (not in the `'use client'` module, so the server
  page can import them).
- New top-level comments go to the top; new replies go to the end of their
  thread and bump `replyCount`.
- Delete only on the viewer's own comments: compare `author.id` with the
  backend `/me` id, never the Supabase user id. Deleting a top-level comment
  removes its whole thread. Confirm before deleting.
- `body` is plain text: render as a React text node with
  `whitespace-pre-wrap` — never HTML or markdown.
- Author shows as `username` + `profilePic` (first-letter fallback), linked
  to `/user/{username}`; a "Seller" badge when `author.id === listing.seller.id`.
- Errors: 400 inline under the box (typed text kept), 401 → sign-in and
  back, 403 → toast `error.message`, 404 → toast and drop the missing
  comment/thread, 429 → "You're commenting too fast…", else a generic toast.

## Reporting a listing

`ReportListingButton` (sidebar, under Trust & Safety) →
`POST /listings/{listingId}/reports` with a `reason` and optional
`additionalComments` (required for `OTHER`, max 2000).

- Shown to everyone on PUBLISHED and SOLD listings (the only reportable
  statuses), hidden from the listing's own seller (compare `sellerId` with
  the backend `/me` id).
- Signed-out click → `/sign-in?next=<listing>#report`; on return the
  `#report` hash reopens the dialog.
- Reasons are fixed options (radio list with a one-line hint each); the
  labels live in the component, the enum comes from the spec.
- 409 (already has an open report) is shown as success — same outcome for
  the user. 403/404/429 and other failures show inline in the dialog.
- The reporter never sees review details. Admin review
  (`/admin/reports`) and the `DELISTED` decision are backend/admin-only and
  not part of this frontend yet.

---

# 20. Sell Form

Route:

/sell

Registration required.

Fields should vary by category.

GPU:

- manufacturer
- model
- VRAM
- quantity
- condition
- price
- currency
- location
- description
- images
- optional testing information

Server:

- manufacturer
- model
- GPU count
- GPU model
- CPU
- RAM
- storage
- networking
- condition
- price
- location

Memory:

- memory type
- capacity
- speed
- ECC
- form factor
- quantity
- price
- condition

Keep required fields minimal.

The goal is to make listing a piece of hardware take less than three minutes.

---

# 21. Request Form

Route:

/request

Registration required.

Capture:

- category
- requested model
- quantity
- minimum VRAM
- budget per unit
- total budget
- condition preference
- preferred location
- destination
- deadline
- urgency
- notes

Example:

> Need 50 RTX 4090 GPUs under $1,300 each, preferably tested, shipped to Bangalore.

This data is a future procurement lead.

---

# 22. Authentication UX

Use Supabase Auth.

Initial methods:

- email/password
- magic link if easy to support

Do not add unnecessary authentication providers.

Browsing does not require authentication.

Authentication is required for:

- listing hardware
- requesting hardware
- contacting sellers
- saving listings

`/sign-in` accepts `?next=<path>` (use `signInPath()` from
`src/lib/auth-redirect.ts`) and returns there after password, magic-link or
Google sign-in. The links between `/sign-in` and `/sign-up` carry `next`
across (`keepNextParam`), and sign-up honours it too, so "log in or
register, then come back" works for new users. `safeNextPath()` only allows same-site paths — always run
redirect targets through it (the `/auth/callback` route does), so `next`
can't be used as an open redirect.

Signed-in users get an account dropdown in the Navbar: their email
(read-only), Edit profile, API keys, Log out. The mobile menu carries the
same links.

---

# 23. Dashboard

Route:

/dashboard

Keep it simple.

Sections:

- Overview
- My Listings
- My Requests
- Saved Listings
- Profile

Show:

- active listings
- pending listings
- open requests

Listing statuses:

- Draft
- Pending Review
- Published
- Rejected
- Sold
- Expired
- Delisted (taken down by an admin after a verified report; hidden from
  public pages, the seller can't republish it — only an admin can)

Request statuses:

- Open
- Matched
- Closed
- Cancelled

---

# 23a. User Profiles

Every user has a public profile at `/user/{username}`.

Usernames: lowercase letters, numbers and underscores, 3–30 characters,
unique, a few reserved (admin, api, gpudealer, support, …). The backend
generates one at signup and is the authority on the rules;
`USERNAME_PATTERN` in `src/lib/profile.ts` mirrors it for form feedback and
for rejecting junk route params before they reach the API.

Public profile (`src/app/user/[username]/page.tsx`):

- Server Component, `GET /users/{username}` — public fields only (never
  email, phone or role) plus the user's published and sold listings,
  paginated with `?page=`.
- Cover picture, profile picture (initials fallback), name, @username,
  headline (`shortBio`), company, location, member since, social links, bio.
- Per-profile metadata and `ProfilePage` JSON-LD. Profiles with no listings
  and no bio are `noindex` (no thin pages — section 11).
- Mixed-case URLs redirect to the lowercase canonical URL.
- `OwnProfileActions` (client) shows "Edit profile" only to the owner.

Edit profile (`/account/profile`, `ProfileEditForm`):

- Auth-gated; saves through `PATCH /me`, which only ever edits the caller's
  own account — there is no way to edit someone else's profile.
- Username availability is checked as the user types
  (`GET /users/check-username`, rate limited); a 409 on save means taken.
- `name`, `companyName`, `city`, `country` can be changed but not cleared
  (the API requires ≥1 char). `bio`, `shortBio` and the links clear to null.
- Links: `x`, `instagram`, `facebook`, `tiktok` must point at that site;
  `website` is any http(s) link.

Profile and cover pictures (`src/lib/supabase/profile-photos.ts`):

- Uploaded by the browser to the `gpu-pics` bucket under
  `<supabase user id>/profile/` — the API rejects any picture URL outside
  the user's own folder, so external image links can't be used.
- JPEG, PNG, WebP or GIF, max 2 MB (client-side check only).
- Uploaded on pick, saved with the form; replaced/discarded files are
  deleted after a successful save.

---

# 24. API Integration

The API client is generated, not hand-written, from an OpenAPI spec:

- `openapi.yaml` (repo root) — the API contract. The backend repo is the
  actual source of truth for this contract; this copy should be kept in
  sync with it (copy it over when the backend's contract changes — there's
  no automated sync between the two repos yet). If the backend has no spec
  file for a change, update this one by hand from the backend's routes and
  zod schemas, then run codegen.
- `orval.config.ts` (repo root) — generates a typed React Query client from
  `openapi.yaml` into `src/lib/api/generated/` via `pnpm run codegen`.
- `src/lib/api/custom-fetch.ts` — the fetch mutator all generated calls go
  through. Defaults its base URL to `NEXT_PUBLIC_API_URL` and exposes
  `setAuthTokenGetter()` for attaching the Supabase access token browser-side.
- `src/lib/api/index.ts` — re-exports everything consumers should import
  from (`@/lib/api`).

Never scatter raw fetch calls throughout the application — always go through
the generated client. Keep API types centralized (they come from the spec).

The backend is the source of truth for the contract and all business rules.

---

# 25. Error Handling

Always implement:

- loading state
- empty state
- error state
- success state

Important empty state:

> No matching hardware found.

Then:

> Can't find what you're looking for?

[Request Hardware]

This CTA should be prominent.

---

# 26. Marketplace Trust

Eventually GPUDealer may introduce verification.

Possible future states:

- Unverified
- Seller Claimed
- GPUDealer Verified

Do not pretend a listing is verified when it is not.

The UI must clearly distinguish:

- aggregated listing
- seller-submitted listing
- GPUDealer verified listing

Trust is extremely important because hardware transactions can be expensive.

---

# 27. Third-Party Listings

Stage A may contain manually curated listings from:

- eBay
- Facebook Marketplace
- Reddit
- other marketplaces

When displaying third-party listings:

- normalize the information
- link to the original listing
- identify the source
- avoid implying GPUDealer owns the inventory
- avoid copying large amounts of third-party content
- avoid copying images unless permitted

The goal is discovery, not pretending the third-party listing belongs to GPUDealer.

---

# 28. Important Business Principle

GPUDealer is not trying to become another GPU rental company.

The current strategic thesis is:

> Aggregate fragmented GPU hardware supply and capture fragmented GPU hardware demand.

Then eventually:

> Match supply and demand.

Then:

> Facilitate transactions.

Then:

> Become a GPU dealer/procurement company.

When deciding whether to build a feature, ask:

> Does this help GPUDealer capture supply, capture demand, improve discovery, or eventually facilitate procurement?

If not, it probably does not belong in Stage A.

---

# 29. Things NOT to Build

Unless explicitly requested, do not build:

- GPU rental
- GPU cloud
- compute orchestration
- Docker management
- Kubernetes
- live GPU provisioning
- payments
- escrow
- auctions
- bidding
- shipping management
- complex chat
- social networking
- crypto
- AI chatbot gimmicks
- unnecessary dashboards
- complicated seller analytics
- microservices
- unnecessary animations

Keep Stage A lean.

---

# 30. Success Metrics

The first goal is not revenue.

The first goal is evidence of demand.

Track:

- registered users
- sellers
- listings
- buyers
- hardware requests
- searches
- listing views
- outbound clicks
- inquiries
- requests per GPU model
- quantity requested
- price ranges
- destination countries

Particularly valuable signals:

> "Need 50 GPUs."

> "Can you source this?"

> "I have 100 GPUs to sell."

These are high-value procurement signals.

---

# 31. Validation Philosophy

GPUDealer is intentionally designed as a fast validation project.

Do not assume the business will exist for ten years.

The initial question is:

> "Can a focused GPU marketplace attract supply and demand quickly enough to justify continuing?"

The founder wants to validate this in weeks/months, not spend years building infrastructure before knowing whether the market exists.

Optimize for:

- speed
- learning
- SEO
- inventory
- lead capture
- demand capture

Not technical complexity.

---

# 32. Future Business Model

Potential revenue streams:

## Affiliate/referral

Send users to external marketplaces/providers.

## Featured listings

Sellers pay for visibility.

## Seller subscriptions

Professional sellers/dealers pay for additional functionality.

## Transaction commissions

GPUDealer eventually takes a percentage of transactions.

## Procurement margin

GPUDealer sources hardware and sells it to customers at a markup.

## Enterprise procurement

Companies pay GPUDealer to source hardware.

The most strategically valuable long-term revenue is likely:

> Procurement / dealer margin.

But this should be earned through actual market demand.

---

# 33. Long-Term Vision

The eventual product could become:

# GPUDealer

### Find

Search global GPU inventory.

### Sell

Sell GPUs and AI hardware.

### Request

Tell GPUDealer what you need.

### Match

Match buyers with sellers.

### Verify

Verify hardware.

### Buy

Complete transactions through GPUDealer.

### Procure

GPUDealer sources hardware globally.

### Dealer

GPUDealer becomes a trusted B2B GPU procurement partner.

The current frontend should not attempt to implement the entire vision.

It should create a foundation for it.

---

# 34. Engineering Standards

Write clean, understandable TypeScript.

Prefer simple solutions.

Avoid premature abstraction.

Avoid duplicate components.

Use reusable UI components when patterns repeat.

Keep page components readable.

Use semantic HTML.

Maintain accessibility.

Handle loading/error/empty states.

Do not knowingly introduce technical debt merely to move quickly.

However, do not over-engineer a validation-stage product.

---

# 35. Decision Framework

When requirements are ambiguous, prioritize:

1. User experience
2. Speed of validation
3. SEO
4. Supply capture
5. Demand capture
6. Lead generation
7. Future marketplace compatibility
8. Simplicity

Do not optimize for hypothetical scale before product-market evidence exists.

---

# 36. Definition of Done

A feature is not complete merely because it renders.

It should:

- work on desktop
- work on mobile
- handle loading
- handle errors
- handle empty states
- be accessible
- integrate with the API correctly
- avoid exposing private information
- follow the visual system
- be reasonably SEO-friendly where applicable
- not introduce unnecessary complexity

---

# 37. Final Rule

When in doubt, remember:

> GPUDealer is currently a demand-and-supply discovery network for used AI hardware.

The immediate goal is to discover whether users want:

- to find GPUs
- to sell GPUs
- to request GPUs

The long-term goal is to turn that network into:

> **the trusted GPU dealer and procurement layer between fragmented hardware supply and businesses that need GPU infrastructure.**

Build the smallest, cleanest product that moves us toward that goal.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
