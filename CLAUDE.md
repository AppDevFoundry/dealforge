# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start all dev servers (Turbo orchestrated)
pnpm build            # Build all packages
pnpm lint             # Run Biome linter
pnpm lint:fix         # Fix linting issues
pnpm typecheck        # TypeScript type checking
pnpm test             # Run all tests
pnpm test:unit        # Run Vitest unit/component tests
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run Playwright E2E tests
```

### Database (Drizzle ORM)

```bash
pnpm db:generate      # Generate migrations from schema changes
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes directly (dev)
pnpm db:studio        # Open Drizzle Studio
```

### Go Data Sync Service

```bash
cd services/data-sync
go run ./cmd/sync     # Run sync service
go test -v ./...      # Run tests
```

### Rust/WASM Calculation Engine

```bash
cd packages/calc-engine-wasm
wasm-pack build --target web      # Build for browser
wasm-pack build --target nodejs   # Build for Node.js
```

## Architecture

This is a **pnpm + Turborepo monorepo** for an AI-native real estate investment analysis platform.

### Workspace Structure

```
apps/
├── web/                    # Next.js 15 web app (main product)
└── docs/                   # Documentation site (Fumadocs - placeholder)

packages/
├── database/               # Drizzle ORM schema + Neon PostgreSQL
├── types/                  # Shared TypeScript types
├── ui/                     # React component library (shadcn/ui based)
├── config/                 # Shared Tailwind + TypeScript configs
├── calc-engine/            # Pure Rust calculation library
└── calc-engine-wasm/       # WASM bindings for calc-engine

services/
└── data-sync/              # Go service for government data sync (HUD, Census, BLS)
```

### Web App Route Groups

The Next.js app uses route groups in `apps/web/app/`:
- `(marketing)/` - Public landing pages
- `(auth)/` - Sign in/up flows (BetterAuth)
- `(dashboard)/` - Protected authenticated routes

### Key Patterns

- **Server Components first** - Leverage Next.js 15 streaming and RSC
- **JSONB flexibility** - Deal inputs/results stored as JSONB for schema evolution
- **Type safety** - Shared types in `@dealforge/types` consumed across all packages
- **WASM calculations** - Client-side calculations via Rust for instant feedback

## Code Style (Biome)

- Single quotes, semicolons always, ES5 trailing commas
- 2-space indentation, 100-character line width
- Import organization enabled
- `noExplicitAny: warn`, `noUnusedImports: warn`

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, shadcn/ui
- **Database**: Neon PostgreSQL (serverless) + Drizzle ORM + PostGIS
- **Auth**: BetterAuth (self-hosted)
- **AI**: Anthropic Claude via Vercel AI Gateway
- **Calculations**: Rust compiled to WASM
- **Data Sync**: Go service for government APIs
- **Mapping**: Mapbox GL JS
- **Testing**: Vitest + React Testing Library + Playwright + MSW

## Environment Requirements

- Node >= 20.0.0
- pnpm >= 9.0.0
- Rust 1.75+ with `wasm32-unknown-unknown` target (for WASM builds)
- Go 1.22+ (for data-sync service)
