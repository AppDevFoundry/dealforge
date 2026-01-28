# DealForge

**Open-source, AI-native real estate analysis platform**

> *"Forge better deals with data, not gut feelings."*

---

## Table of Contents

1. [Vision & Mission](#vision--mission)
2. [Target Audience](#target-audience)
3. [Core Value Propositions](#core-value-propositions)
4. [Feature Architecture](#feature-architecture)
5. [Technical Architecture](#technical-architecture)
6. [Tech Stack](#tech-stack)
7. [Repository Structure](#repository-structure)
8. [Database Design](#database-design)
9. [API Design](#api-design)
10. [AI Integration](#ai-integration)
11. [Rust/WASM Calculation Engine](#rustwasm-calculation-engine)
12. [Go Data Sync Service](#go-data-sync-service)
13. [GIS & Mapping](#gis--mapping)
14. [Authentication](#authentication)
15. [CI/CD & DevOps](#cicd--devops)
16. [Testing Strategy](#testing-strategy)
17. [Open Source Strategy](#open-source-strategy)
18. [Monetization Path](#monetization-path)
19. [Development Roadmap](#development-roadmap)
20. [Future Considerations](#future-considerations)
21. [Contributing](#contributing)

---

## Vision & Mission

### Vision

To democratize real estate investment analysis by providing institutional-grade tools to individual investors, powered by AI and open data.

### Mission

Build an open-source platform that:

- **Educates** investors on the fundamentals of deal analysis and underwriting
- **Empowers** decision-making with accurate, transparent calculations
- **Enriches** analysis with market intelligence from open data sources
- **Accelerates** workflows with AI-native features

### Why DealForge?

The real estate analysis tool landscape is fragmented:

- Spreadsheets are powerful but error-prone and hard to share
- Existing web apps are often outdated, overpriced, or lack transparency
- AI capabilities are bolted on as afterthoughts, not native to the experience
- Educational content is separated from the tools themselves

DealForge bridges these gaps by combining:

- Modern, responsive web application with excellent UX
- Transparent, auditable calculations (open source)
- AI assistance woven throughout the experience
- Educational "learn mode" that explains every calculation
- Market data integration for contextual analysis
- Progressive complexity from beginner to syndication-level deals

---

## Target Audience

### Primary Users

| Segment | Description | Key Needs |
|---------|-------------|-----------|
| **Beginner Investors** | First-time investors learning the ropes | Education, simple tools, confidence |
| **Active Investors** | Own 1-10 properties, analyzing deals regularly | Speed, accuracy, comparison tools |
| **Syndicators/GPs** | Raise capital, complex deal structures | Waterfall modeling, reporting, credibility |
| **Real Estate Agents** | Help clients evaluate investment properties | Quick analysis, shareable reports |
| **Lenders/Underwriters** | Evaluate loan applications | Standardized analysis, risk assessment |

### Secondary Users

- Real estate educators and course creators
- Property managers evaluating acquisitions
- 1031 exchange facilitators
- Real estate attorneys (due diligence)

---

## Core Value Propositions

### 1. Educational-First Design

Every calculator includes a "Learn Mode" that explains:

- What each input means and why it matters
- How each output is calculated (with formulas)
- Industry benchmarks and rules of thumb
- Common mistakes and red flags

### 2. AI-Native Experience

AI is not a feature—it's woven into the fabric:

- Natural language deal entry ("I found a 4-plex for $400k...")
- Document extraction (paste a listing URL, get structured data)
- Intelligent assistance ("Why is my cash-on-cash return low?")
- Automated report generation with narrative summaries

### 3. Market-Aware Analysis

Deals don't exist in a vacuum:

- Automatic rent comp suggestions based on location
- Property tax trend analysis
- Neighborhood growth indicators
- Risk factor overlays (flood zones, vacancy rates)

### 4. Progressive Complexity

Start simple, grow sophisticated:

- Beginner: Single-family rental calculator
- Intermediate: BRRRR, house hacking, small multi-family
- Advanced: Commercial, syndication, 1031 exchanges

### 5. Open & Extensible

- Core calculations are open source and auditable
- API access for integrations
- Community contributions welcome
- Self-hostable for privacy-conscious users

---

## Feature Architecture

### Tier 1: Deal Analysis Tools (Core)

| Tool | Complexity | Description | Priority |
|------|------------|-------------|----------|
| **Rental Property Analyzer** | Beginner | Cash flow, ROI, cap rate, cash-on-cash | P0 |
| **BRRRR Calculator** | Beginner | Buy-Rehab-Rent-Refinance-Repeat modeling | P0 |
| **Flip/Rehab Calculator** | Beginner | ARV, rehab budget, profit projection | P1 |
| **House Hack Analyzer** | Beginner | Owner-occupied multi-unit analysis | P1 |
| **Financing Comparator** | Beginner | Compare loan scenarios, points vs rate | P1 |
| **Multi-family Analyzer** | Intermediate | 5-50 units, NOI, DSCR, expense ratios | P2 |
| **1031 Exchange Planner** | Intermediate | Timeline, boot calculation, replacement requirements | P2 |
| **Commercial Property Analyzer** | Advanced | Triple-net, industrial, retail analysis | P3 |
| **Syndication Modeler** | Advanced | Waterfall distributions, LP/GP splits, IRR, equity multiple | P3 |

#### Calculator Features (All Tools)

- Real-time calculation updates
- Sensitivity analysis (what-if scenarios)
- Assumption presets (customizable defaults)
- Learn mode (educational explanations)
- Save/load functionality
- Export to PDF with AI summary
- Share via public link

### Tier 2: Market Intelligence

| Feature | Data Source | Priority |
|---------|-------------|----------|
| **Neighborhood Report Cards** | Census, BLS, HUD | P2 |
| **Rent Estimation** | HUD FMR, Zillow (where available) | P2 |
| **Property Tax Trends** | County assessor data | P2 |
| **Growth Indicators** | Census, permits, BLS employment | P2 |
| **Risk Factors** | FEMA flood zones, vacancy rates | P3 |
| **Comparable Sales** | County records (where available) | P3 |

### Tier 3: GIS & Mapping

| Feature | Description | Priority |
|---------|-------------|----------|
| **Interactive Map** | Pan, zoom, search | P2 |
| **Data Layers** | Toggle overlays (rent, taxes, flood) | P2 |
| **Heat Maps** | Visualize metrics by geography | P3 |
| **Property Pins** | Mark and compare properties | P3 |
| **Custom Boundaries** | Draw areas for analysis | P3 |
| **Zoning Display** | Visualize zoning (where data available) | P4 |

### Tier 4: AI Features

| Feature | Model | Priority |
|---------|-------|----------|
| **Deal Chat** | Claude Sonnet | P1 |
| **Listing Extraction** | Claude Haiku | P1 |
| **Calculation Explainer** | Claude Haiku | P1 |
| **PDF/Document Analysis** | Claude Sonnet | P2 |
| **Market Summarizer** | Claude Sonnet + Web Search | P2 |
| **Risk Advisor** | Claude Sonnet | P3 |
| **Report Writer** | Claude Sonnet | P3 |

### Tier 5: User Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Authentication** | Sign up, sign in, profile | P0 |
| **Deal Library** | Save, organize, tag analyses | P0 |
| **Comparison View** | Side-by-side deal comparison | P1 |
| **Export/Reports** | PDF generation | P2 |
| **Share Links** | Public read-only links | P2 |
| **Portfolio Tracker** | Track actual investments over time | P3 |
| **Teams/Organizations** | Collaborate on deals | P4 |

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│   │   Web Browser   │    │   iOS App       │    │   API Clients   │    │
│   │   (Next.js)     │    │   (Future)      │    │   (Future)      │    │
│   └────────┬────────┘    └────────┬────────┘    └────────┬────────┘    │
│            │                      │                      │              │
│            │    ┌─────────────────┴──────────────────────┘              │
│            │    │                                                        │
│            ▼    ▼                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                         VERCEL EDGE                              │   │
│   │  ┌─────────────────────────────────────────────────────────────┐│   │
│   │  │                    Next.js Application                       ││   │
│   │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  ││   │
│   │  │  │ React UI     │  │ API Routes   │  │ Server Actions    │  ││   │
│   │  │  │ + shadcn/ui  │  │ /api/v1/*    │  │ (mutations)       │  ││   │
│   │  │  └──────┬───────┘  └──────┬───────┘  └─────────┬─────────┘  ││   │
│   │  │         │                 │                    │            ││   │
│   │  │         ▼                 ▼                    ▼            ││   │
│   │  │  ┌─────────────────────────────────────────────────────┐    ││   │
│   │  │  │              Rust/WASM Calculation Engine           │    ││   │
│   │  │  │         (runs in browser for instant feedback)      │    ││   │
│   │  │  └─────────────────────────────────────────────────────┘    ││   │
│   │  └─────────────────────────────────────────────────────────────┘│   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVICES                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│   │   Neon          │    │ Vercel AI       │    │   Mapbox        │    │
│   │   (Postgres)    │    │ Gateway         │    │   (Maps)        │    │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘    │
│                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│   │   Vercel Blob   │    │   Resend        │    │   Sentry        │    │
│   │   (Storage)     │    │   (Email)       │    │   (Errors)      │    │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          BACKGROUND JOBS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    Go Data Sync Service                          │   │
│   │         (Scheduled via GitHub Actions or Vercel Cron)           │   │
│   │                                                                  │   │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│   │   │ Census API   │  │ HUD API      │  │ BLS API      │          │   │
│   │   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │   │
│   │          │                 │                 │                   │   │
│   │          └─────────────────┼─────────────────┘                   │   │
│   │                            ▼                                     │   │
│   │                    ┌──────────────┐                              │   │
│   │                    │ Neon (write) │                              │   │
│   │                    └──────────────┘                              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEAL ANALYSIS FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

User Input                    Processing                     Output
─────────────────────────────────────────────────────────────────────────
                                                              
  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
  │ Form Input  │──────────▶│ Rust/WASM   │──────────▶│ Instant     │
  │ (React)     │           │ Calculator  │           │ Results     │
  └─────────────┘           └─────────────┘           └─────────────┘
                                   │
                                   │ (if save)
                                   ▼
                            ┌─────────────┐           ┌─────────────┐
                            │ Server      │──────────▶│ Neon DB     │
                            │ Action      │           │ (persist)   │
                            └─────────────┘           └─────────────┘

  ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
  │ Listing URL │──────────▶│ AI Gateway  │──────────▶│ Structured  │
  │ (paste)     │           │ (Claude)    │           │ Data        │
  └─────────────┘           └─────────────┘           └─────────────┘
                                                              │
                                                              ▼
                                                      ┌─────────────┐
                                                      │ Pre-fill    │
                                                      │ Calculator  │
                                                      └─────────────┘
```

---

## Tech Stack

### Core Application

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 15 (App Router) | Modern React, server components, API routes |
| **Language** | TypeScript | Type safety, developer experience |
| **UI Components** | shadcn/ui | Beautiful, accessible, customizable |
| **Styling** | Tailwind CSS | Utility-first, consistent design |
| **Forms** | React Hook Form + Zod | Validation, performance |
| **State** | Zustand (client) / Server Components | Simple, scalable |

### Data Layer

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Database** | Neon (Postgres) | Serverless, branching, PostGIS support |
| **ORM** | Drizzle | Type-safe, edge-compatible, SQL-like |
| **Caching** | React Query + unstable_cache | Request deduplication, revalidation |

### Authentication

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Auth Library** | BetterAuth | Self-hosted, data ownership, customizable |
| **Session Storage** | Database (Neon) | Secure, scalable |
| **OAuth Providers** | Google, GitHub (initial) | Common, trusted |

### AI & Intelligence

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **AI SDK** | Vercel AI SDK | Streaming, React hooks, great DX |
| **AI Gateway** | Vercel AI Gateway | Model routing, rate limiting, cost tracking |
| **Primary Model** | Claude Sonnet | Best reasoning, safety |
| **Fast Model** | Claude Haiku | Speed for simple tasks |

### Calculations

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | Rust | Performance, correctness, cross-platform |
| **Compilation** | wasm-pack | Browser + server WASM |
| **Bindings** | wasm-bindgen | JS interop |

### Data Sync

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | Go | Simple concurrency, fast, single binary |
| **HTTP Client** | net/http + golang.org/x/sync | Parallel fetching |
| **Scheduler** | GitHub Actions / Vercel Cron | Free, reliable |

### Mapping

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Maps** | Mapbox GL JS | Beautiful, powerful, PostGIS compatible |
| **React Wrapper** | react-map-gl | Official Uber wrapper |
| **Spatial Queries** | PostGIS (via Neon) | Geospatial analysis |

### Infrastructure

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Hosting** | Vercel (Pro) | Edge network, great DX |
| **Storage** | Vercel Blob | Simple file storage |
| **Email** | Resend | Developer-friendly, React Email |
| **Errors** | Sentry | Industry standard |
| **Analytics** | Vercel Analytics | Built-in, privacy-friendly |
| **Feature Flags** | Vercel Feature Flags | Gradual rollouts |

### Developer Experience

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mono-repo** | Turborepo | Fast builds, caching |
| **Package Manager** | pnpm | Fast, efficient |
| **Linting/Formatting** | Biome | Fast, unified tooling |
| **Testing** | Vitest + Playwright | Modern, fast |
| **CI/CD** | GitHub Actions | Ubiquitous, free for public repos |
| **Documentation** | Fumadocs | MDX-based, Next.js native |

---

## Repository Structure

```
dealforge/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Lint, test, build on PR
│   │   ├── deploy-preview.yml     # Vercel preview deployments
│   │   ├── deploy-production.yml  # Production deployment
│   │   ├── data-sync.yml          # Scheduled data sync (Go service)
│   │   └── rust-wasm.yml          # Build and test Rust/WASM
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
│
├── apps/
│   ├── web/                       # Main Next.js application
│   │   ├── app/
│   │   │   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   │   │   ├── (dashboard)/       # Authenticated app routes
│   │   │   │   ├── deals/         # Deal library
│   │   │   │   ├── analyze/       # Calculators
│   │   │   │   ├── market/        # Market intelligence
│   │   │   │   └── settings/      # User settings
│   │   │   ├── (marketing)/       # Public marketing pages
│   │   │   ├── api/
│   │   │   │   └── v1/            # Versioned API routes
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── calculators/       # Calculator-specific components
│   │   │   ├── charts/            # Data visualization
│   │   │   ├── forms/             # Form components
│   │   │   ├── layout/            # Layout components
│   │   │   ├── maps/              # Map components
│   │   │   └── ui/                # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── ai/                # AI utilities
│   │   │   ├── auth/              # BetterAuth config
│   │   │   ├── db/                # Drizzle client
│   │   │   ├── calc/              # WASM calc bindings
│   │   │   └── utils/             # General utilities
│   │   ├── public/
│   │   ├── styles/
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   └── docs/                      # Documentation site
│       ├── app/
│       ├── content/
│       │   ├── guides/            # User guides
│       │   ├── calculators/       # Calculator documentation
│       │   ├── education/         # RE education content
│       │   └── api/               # API documentation
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── calc-engine/               # Rust calculation library
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── rental.rs          # Rental property calculations
│   │   │   ├── brrrr.rs           # BRRRR calculations
│   │   │   ├── flip.rs            # Flip/rehab calculations
│   │   │   ├── multifamily.rs     # Multi-family calculations
│   │   │   ├── syndication.rs     # Syndication/waterfall
│   │   │   └── common/            # Shared calculation logic
│   │   │       ├── amortization.rs
│   │   │       ├── cashflow.rs
│   │   │       ├── metrics.rs
│   │   │       └── time_value.rs
│   │   ├── tests/
│   │   ├── Cargo.toml
│   │   └── README.md
│   │
│   ├── calc-engine-wasm/          # WASM bindings for calc-engine
│   │   ├── src/
│   │   │   └── lib.rs             # wasm-bindgen exports
│   │   ├── pkg/                   # Generated WASM package
│   │   ├── Cargo.toml
│   │   └── package.json           # NPM package config
│   │
│   ├── database/                  # Drizzle schema and migrations
│   │   ├── src/
│   │   │   ├── schema/
│   │   │   │   ├── users.ts
│   │   │   │   ├── deals.ts
│   │   │   │   ├── market-data.ts
│   │   │   │   └── index.ts
│   │   │   ├── migrations/
│   │   │   └── client.ts
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                     # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── deals.ts
│   │   │   ├── calculations.ts
│   │   │   ├── market.ts
│   │   │   └── api.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui/                        # Shared React components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                    # Shared configurations
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── services/
│   └── data-sync/                 # Go data synchronization service
│       ├── cmd/
│       │   └── sync/
│       │       └── main.go
│       ├── internal/
│       │   ├── census/            # Census Bureau API client
│       │   ├── hud/               # HUD API client
│       │   ├── bls/               # Bureau of Labor Statistics
│       │   ├── fema/              # FEMA flood data
│       │   └── db/                # Database operations
│       ├── go.mod
│       ├── go.sum
│       ├── Dockerfile
│       └── README.md
│
├── tooling/
│   ├── scripts/                   # Development scripts
│   │   ├── setup.sh
│   │   ├── seed-db.ts
│   │   └── generate-types.ts
│   └── docker/                    # Docker configurations
│       └── docker-compose.yml     # Local development services
│
├── .env.example
├── .gitignore
├── .npmrc
├── biome.json
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── README.md
├── turbo.json
└── VISION.md                      # This document
```

---

## Database Design

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │  organizations  │       │  memberships    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ email           │       │ name            │       │ user_id (FK)    │
│ name            │       │ slug            │       │ org_id (FK)     │
│ avatar_url      │       │ created_at      │       │ role            │
│ created_at      │       │ updated_at      │       │ created_at      │
│ updated_at      │       └────────┬────────┘       └─────────────────┘
└────────┬────────┘                │
         │                         │
         │         ┌───────────────┘
         │         │
         ▼         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              deals                                   │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                              │
│ user_id (FK)                 # Owner of the deal                     │
│ org_id (FK, nullable)        # If shared with organization           │
│ type                         # rental, brrrr, flip, multifamily...  │
│ name                         # User-given name                       │
│ status                       # draft, analyzing, archived            │
│ address                      # Property address                      │
│ location (PostGIS)           # Geospatial point                      │
│ inputs (JSONB)               # Calculator inputs                     │
│ results (JSONB)              # Cached calculation results            │
│ metadata (JSONB)             # Flexible additional data              │
│ is_public                    # Public share link enabled             │
│ public_slug                  # URL slug for sharing                  │
│ created_at                                                           │
│ updated_at                                                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           deal_tags                                  │
├─────────────────────────────────────────────────────────────────────┤
│ deal_id (FK)                                                         │
│ tag                                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         market_data                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                              │
│ geo_type                     # zip, county, msa, state              │
│ geo_id                       # ZIP code, FIPS code, etc.            │
│ boundary (PostGIS)           # Geographic boundary polygon          │
│ data_type                    # rent, population, employment...      │
│ data_date                    # When the data is from                │
│ value (JSONB)                # The actual data                      │
│ source                       # census, hud, bls...                  │
│ fetched_at                   # When we fetched it                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      user_preferences                                │
├─────────────────────────────────────────────────────────────────────┤
│ user_id (PK, FK)                                                     │
│ default_assumptions (JSONB)  # Default calculator values            │
│ notification_prefs (JSONB)   # Email preferences                    │
│ ui_prefs (JSONB)             # Theme, layout preferences            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     ai_conversations                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK)                                                              │
│ user_id (FK)                                                         │
│ deal_id (FK, nullable)       # If conversation is about a deal      │
│ messages (JSONB)             # Conversation history                 │
│ created_at                                                           │
│ updated_at                                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **JSONB for flexibility**: Calculator inputs/results stored as JSONB allows schema evolution without migrations.

2. **PostGIS for spatial**: Enables efficient geographic queries and integration with mapping features.

3. **Soft organization support**: Deals can optionally belong to organizations for future team features.

4. **Cached results**: Store calculation results to avoid recomputation and enable historical comparison.

5. **Market data normalization**: Single table for all market data types with flexible JSONB values.

---

## API Design

### Design Principles

1. **Mobile-first**: Design APIs knowing an iOS app will consume them
2. **Versioned**: `/api/v1/` prefix for all routes
3. **RESTful**: Standard HTTP methods and status codes
4. **Consistent**: Uniform response shapes across endpoints
5. **Documented**: OpenAPI spec generated from code

### Response Format

All API responses follow a consistent structure:

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "purchasePrice", "message": "Must be a positive number" }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Paginated response
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Endpoint Overview

```
Authentication (BetterAuth handles these)
──────────────────────────────────────────
POST   /api/auth/sign-up
POST   /api/auth/sign-in
POST   /api/auth/sign-out
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/session

Deals
──────────────────────────────────────────
GET    /api/v1/deals                  # List user's deals
POST   /api/v1/deals                  # Create new deal
GET    /api/v1/deals/:id              # Get deal by ID
PUT    /api/v1/deals/:id              # Update deal
DELETE /api/v1/deals/:id              # Delete deal
POST   /api/v1/deals/:id/duplicate    # Duplicate a deal
GET    /api/v1/deals/:id/export       # Export as PDF

Calculations (stateless)
──────────────────────────────────────────
POST   /api/v1/calculate/rental       # Rental property analysis
POST   /api/v1/calculate/brrrr        # BRRRR analysis
POST   /api/v1/calculate/flip         # Flip/rehab analysis
POST   /api/v1/calculate/multifamily  # Multi-family analysis
POST   /api/v1/calculate/syndication  # Syndication waterfall

Market Data
──────────────────────────────────────────
GET    /api/v1/market/rent-estimate   # ?zip=78006&beds=3&baths=2
GET    /api/v1/market/neighborhood    # ?zip=78006
GET    /api/v1/market/flood-zone      # ?lat=29.78&lng=-98.73
GET    /api/v1/market/property-tax    # ?county=Kendall&state=TX

AI
──────────────────────────────────────────
POST   /api/v1/ai/chat                # Deal chat assistant
POST   /api/v1/ai/extract-listing     # Extract data from URL
POST   /api/v1/ai/explain             # Explain a calculation
POST   /api/v1/ai/summarize           # Summarize a deal

User
──────────────────────────────────────────
GET    /api/v1/user/profile           # Get current user profile
PUT    /api/v1/user/profile           # Update profile
GET    /api/v1/user/preferences       # Get preferences
PUT    /api/v1/user/preferences       # Update preferences
```

---

## AI Integration

### Vercel AI Gateway Setup

```typescript
// lib/ai/client.ts
import { createAnthropic } from '@ai-sdk/anthropic';

export const anthropic = createAnthropic({
  // Vercel AI Gateway handles API key management
  // and provides rate limiting, caching, cost tracking
});

export const models = {
  fast: anthropic('claude-3-5-haiku-latest'),    // Quick responses
  balanced: anthropic('claude-3-5-sonnet-latest'), // Default
  powerful: anthropic('claude-3-5-sonnet-latest'), // Complex tasks
} as const;
```

### AI Features Implementation

#### 1. Deal Chat

Conversational assistant that understands the current deal context:

```typescript
// app/api/v1/ai/chat/route.ts
import { streamText } from 'ai';
import { models } from '@/lib/ai/client';

export async function POST(req: Request) {
  const { messages, dealContext } = await req.json();

  const result = await streamText({
    model: models.balanced,
    system: `You are a real estate investment analyst assistant. 
             You're helping analyze a ${dealContext.type} property.
             Current deal data: ${JSON.stringify(dealContext)}
             
             Help the user understand the analysis, answer questions,
             and suggest improvements to the deal.`,
    messages,
  });

  return result.toDataStreamResponse();
}
```

#### 2. Listing Extraction

Extract structured data from a property listing URL:

```typescript
// app/api/v1/ai/extract-listing/route.ts
import { generateObject } from 'ai';
import { z } from 'zod';
import { models } from '@/lib/ai/client';

const ListingSchema = z.object({
  address: z.string(),
  price: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFeet: z.number().optional(),
  yearBuilt: z.number().optional(),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse']),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { url } = await req.json();
  
  // Fetch the listing page
  const pageContent = await fetchAndExtract(url);

  const { object } = await generateObject({
    model: models.fast, // Haiku for speed
    schema: ListingSchema,
    prompt: `Extract property listing data from this content: ${pageContent}`,
  });

  return Response.json({ success: true, data: object });
}
```

#### 3. Calculation Explainer

Natural language explanations of calculator outputs:

```typescript
// app/api/v1/ai/explain/route.ts
import { generateText } from 'ai';
import { models } from '@/lib/ai/client';

export async function POST(req: Request) {
  const { calculation, question } = await req.json();

  const { text } = await generateText({
    model: models.fast,
    system: `You are a real estate investment educator.
             Explain calculations clearly and concisely.
             Use analogies when helpful.
             Always mention relevant rules of thumb.`,
    prompt: `Given this deal analysis:
             ${JSON.stringify(calculation)}
             
             Answer this question: ${question}`,
  });

  return Response.json({ success: true, data: { explanation: text } });
}
```

### AI Cost Management

Vercel AI Gateway provides:

- **Rate limiting**: Prevent runaway costs
- **Caching**: Reuse responses for identical requests
- **Model routing**: Use cheaper models for simple tasks
- **Cost tracking**: Monitor usage by feature/user

```typescript
// Example: Tiered model selection based on complexity
function selectModel(task: 'extract' | 'chat' | 'report') {
  switch (task) {
    case 'extract':
      return models.fast;     // Haiku: ~$0.25/1M input tokens
    case 'chat':
      return models.balanced; // Sonnet: ~$3/1M input tokens
    case 'report':
      return models.balanced; // Sonnet for quality
  }
}
```

---

## Rust/WASM Calculation Engine

### Why Rust?

1. **Correctness**: Strong type system catches errors at compile time
2. **Performance**: Near-native speed for complex calculations
3. **Cross-platform**: Same code runs in browser, server, and (future) iOS
4. **Auditability**: Pure functions are easy to test and verify
5. **Learning**: Valuable skill, excellent portfolio piece

### Architecture

```
packages/calc-engine/           # Pure Rust library
├── src/
│   ├── lib.rs                  # Library entry point
│   ├── common/
│   │   ├── mod.rs
│   │   ├── amortization.rs     # Loan amortization schedules
│   │   ├── time_value.rs       # NPV, IRR, discounting
│   │   ├── metrics.rs          # ROI, cap rate, etc.
│   │   └── cashflow.rs         # Cash flow modeling
│   ├── rental.rs               # Rental property calculator
│   ├── brrrr.rs                # BRRRR calculator
│   ├── flip.rs                 # Flip calculator
│   ├── multifamily.rs          # Multi-family calculator
│   └── syndication.rs          # Syndication waterfall
└── Cargo.toml

packages/calc-engine-wasm/      # WASM bindings
├── src/
│   └── lib.rs                  # wasm-bindgen exports
├── Cargo.toml
└── package.json                # NPM package for the compiled WASM
```

### Example: Rental Calculator

```rust
// packages/calc-engine/src/rental.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RentalInputs {
    // Purchase
    pub purchase_price: f64,
    pub closing_costs: f64,
    pub rehab_costs: f64,
    
    // Financing
    pub down_payment_percent: f64,
    pub interest_rate: f64,
    pub loan_term_years: u32,
    
    // Income
    pub monthly_rent: f64,
    pub other_income: f64,
    pub vacancy_rate: f64,
    
    // Expenses
    pub property_tax_annual: f64,
    pub insurance_annual: f64,
    pub hoa_monthly: f64,
    pub maintenance_percent: f64,  // % of rent
    pub capex_percent: f64,        // % of rent
    pub management_percent: f64,   // % of rent
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RentalResults {
    // Key metrics
    pub cash_on_cash_return: f64,
    pub cap_rate: f64,
    pub total_roi: f64,
    pub monthly_cash_flow: f64,
    pub annual_cash_flow: f64,
    
    // Detailed breakdown
    pub total_investment: f64,
    pub loan_amount: f64,
    pub monthly_mortgage: f64,
    pub gross_monthly_income: f64,
    pub effective_gross_income: f64,
    pub total_monthly_expenses: f64,
    pub net_operating_income: f64,
    pub debt_service_coverage_ratio: f64,
    
    // Amortization summary
    pub year_1_principal_paydown: f64,
    pub year_1_interest_paid: f64,
    
    // Projections
    pub five_year_equity: f64,
    pub five_year_total_return: f64,
}

impl RentalInputs {
    pub fn calculate(&self) -> RentalResults {
        // Total cash invested
        let down_payment = self.purchase_price * (self.down_payment_percent / 100.0);
        let total_investment = down_payment + self.closing_costs + self.rehab_costs;
        
        // Loan calculations
        let loan_amount = self.purchase_price - down_payment;
        let monthly_rate = self.interest_rate / 100.0 / 12.0;
        let num_payments = self.loan_term_years * 12;
        
        let monthly_mortgage = if loan_amount > 0.0 && monthly_rate > 0.0 {
            loan_amount * (monthly_rate * (1.0 + monthly_rate).powi(num_payments as i32))
                / ((1.0 + monthly_rate).powi(num_payments as i32) - 1.0)
        } else {
            0.0
        };
        
        // Income calculations
        let gross_monthly_income = self.monthly_rent + self.other_income;
        let vacancy_loss = gross_monthly_income * (self.vacancy_rate / 100.0);
        let effective_gross_income = gross_monthly_income - vacancy_loss;
        
        // Expense calculations
        let monthly_property_tax = self.property_tax_annual / 12.0;
        let monthly_insurance = self.insurance_annual / 12.0;
        let monthly_maintenance = self.monthly_rent * (self.maintenance_percent / 100.0);
        let monthly_capex = self.monthly_rent * (self.capex_percent / 100.0);
        let monthly_management = self.monthly_rent * (self.management_percent / 100.0);
        
        let total_monthly_expenses = monthly_property_tax
            + monthly_insurance
            + self.hoa_monthly
            + monthly_maintenance
            + monthly_capex
            + monthly_management;
        
        // Net Operating Income (before debt service)
        let net_operating_income = (effective_gross_income - total_monthly_expenses) * 12.0;
        
        // Cash flow
        let monthly_cash_flow = effective_gross_income - total_monthly_expenses - monthly_mortgage;
        let annual_cash_flow = monthly_cash_flow * 12.0;
        
        // Key metrics
        let cash_on_cash_return = if total_investment > 0.0 {
            (annual_cash_flow / total_investment) * 100.0
        } else {
            0.0
        };
        
        let cap_rate = if self.purchase_price > 0.0 {
            (net_operating_income / self.purchase_price) * 100.0
        } else {
            0.0
        };
        
        let debt_service_coverage_ratio = if monthly_mortgage > 0.0 {
            (effective_gross_income - total_monthly_expenses) / monthly_mortgage
        } else {
            f64::INFINITY
        };
        
        // TODO: Calculate amortization, equity growth, and 5-year projections
        
        RentalResults {
            cash_on_cash_return,
            cap_rate,
            total_roi: cash_on_cash_return, // Simplified for now
            monthly_cash_flow,
            annual_cash_flow,
            total_investment,
            loan_amount,
            monthly_mortgage,
            gross_monthly_income,
            effective_gross_income,
            total_monthly_expenses,
            net_operating_income,
            debt_service_coverage_ratio,
            year_1_principal_paydown: 0.0,  // TODO
            year_1_interest_paid: 0.0,      // TODO
            five_year_equity: 0.0,          // TODO
            five_year_total_return: 0.0,    // TODO
        }
    }
}
```

### WASM Bindings

```rust
// packages/calc-engine-wasm/src/lib.rs

use wasm_bindgen::prelude::*;
use calc_engine::rental::{RentalInputs, RentalResults};

#[wasm_bindgen]
pub fn calculate_rental(inputs_json: &str) -> Result<String, JsValue> {
    let inputs: RentalInputs = serde_json::from_str(inputs_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    
    let results = inputs.calculate();
    
    serde_json::to_string(&results)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}
```

### TypeScript Integration

```typescript
// apps/web/lib/calc/rental.ts

import init, { calculate_rental } from '@dealforge/calc-engine-wasm';

let wasmInitialized = false;

async function ensureWasm() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export interface RentalInputs {
  purchasePrice: number;
  closingCosts: number;
  rehabCosts: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  otherIncome: number;
  vacancyRate: number;
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number;
  capexPercent: number;
  managementPercent: number;
}

export interface RentalResults {
  cashOnCashReturn: number;
  capRate: number;
  totalRoi: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  // ... etc
}

export async function calculateRental(inputs: RentalInputs): Promise<RentalResults> {
  await ensureWasm();
  
  // Convert to snake_case for Rust
  const rustInputs = {
    purchase_price: inputs.purchasePrice,
    closing_costs: inputs.closingCosts,
    // ... etc
  };
  
  const resultJson = calculate_rental(JSON.stringify(rustInputs));
  const rustResult = JSON.parse(resultJson);
  
  // Convert back to camelCase for TypeScript
  return {
    cashOnCashReturn: rustResult.cash_on_cash_return,
    capRate: rustResult.cap_rate,
    // ... etc
  };
}
```

---

## Go Data Sync Service

### Purpose

Periodically fetch open data from government APIs and load it into the database for fast querying.

### Architecture

```
services/data-sync/
├── cmd/
│   └── sync/
│       └── main.go           # Entry point
├── internal/
│   ├── config/
│   │   └── config.go         # Configuration loading
│   ├── db/
│   │   └── postgres.go       # Database operations
│   ├── sources/
│   │   ├── census.go         # Census Bureau API
│   │   ├── hud.go            # HUD Fair Market Rents
│   │   ├── bls.go            # Bureau of Labor Statistics
│   │   └── fema.go           # FEMA flood zones
│   └── sync/
│       └── orchestrator.go   # Coordinates all sync operations
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

### Example Implementation

```go
// services/data-sync/internal/sources/hud.go

package sources

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type HUDClient struct {
    httpClient *http.Client
    apiKey     string
    baseURL    string
}

type FairMarketRent struct {
    ZipCode      string  `json:"zip_code"`
    Year         int     `json:"year"`
    Efficiency   float64 `json:"efficiency"`
    OneBedroom   float64 `json:"one_bedroom"`
    TwoBedroom   float64 `json:"two_bedroom"`
    ThreeBedroom float64 `json:"three_bedroom"`
    FourBedroom  float64 `json:"four_bedroom"`
}

func NewHUDClient(apiKey string) *HUDClient {
    return &HUDClient{
        httpClient: &http.Client{Timeout: 30 * time.Second},
        apiKey:     apiKey,
        baseURL:    "https://www.huduser.gov/hudapi/public",
    }
}

func (c *HUDClient) FetchFMRByZip(ctx context.Context, zipCode string) (*FairMarketRent, error) {
    url := fmt.Sprintf("%s/fmr/data/%s", c.baseURL, zipCode)
    
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, fmt.Errorf("creating request: %w", err)
    }
    
    req.Header.Set("Authorization", "Bearer "+c.apiKey)
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("executing request: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
    }
    
    var result FairMarketRent
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("decoding response: %w", err)
    }
    
    return &result, nil
}
```

```go
// services/data-sync/internal/sync/orchestrator.go

package sync

import (
    "context"
    "log/slog"
    "time"

    "golang.org/x/sync/errgroup"
    
    "github.com/yourusername/dealforge/services/data-sync/internal/db"
    "github.com/yourusername/dealforge/services/data-sync/internal/sources"
)

type Orchestrator struct {
    db     *db.Client
    hud    *sources.HUDClient
    census *sources.CensusClient
    bls    *sources.BLSClient
    logger *slog.Logger
}

func (o *Orchestrator) SyncAll(ctx context.Context, zipCodes []string) error {
    start := time.Now()
    o.logger.Info("starting full sync", "zip_count", len(zipCodes))
    
    g, ctx := errgroup.WithContext(ctx)
    
    // Sync HUD Fair Market Rents
    g.Go(func() error {
        return o.syncHUD(ctx, zipCodes)
    })
    
    // Sync Census demographics
    g.Go(func() error {
        return o.syncCensus(ctx, zipCodes)
    })
    
    // Sync BLS employment data
    g.Go(func() error {
        return o.syncBLS(ctx, zipCodes)
    })
    
    if err := g.Wait(); err != nil {
        return err
    }
    
    o.logger.Info("full sync complete", "duration", time.Since(start))
    return nil
}

func (o *Orchestrator) syncHUD(ctx context.Context, zipCodes []string) error {
    o.logger.Info("syncing HUD data", "zip_count", len(zipCodes))
    
    for _, zip := range zipCodes {
        fmr, err := o.hud.FetchFMRByZip(ctx, zip)
        if err != nil {
            o.logger.Warn("failed to fetch FMR", "zip", zip, "error", err)
            continue
        }
        
        if err := o.db.UpsertMarketData(ctx, db.MarketData{
            GeoType:  "zip",
            GeoID:    zip,
            DataType: "fmr",
            Value:    fmr,
            Source:   "hud",
        }); err != nil {
            return err
        }
    }
    
    return nil
}
```

### Scheduled Execution

The Go service runs as a scheduled GitHub Action:

```yaml
# .github/workflows/data-sync.yml

name: Data Sync

on:
  schedule:
    # Run weekly on Sunday at 2am UTC
    - cron: '0 2 * * 0'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      
      - name: Build sync service
        working-directory: services/data-sync
        run: go build -o sync ./cmd/sync
      
      - name: Run sync
        working-directory: services/data-sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          HUD_API_KEY: ${{ secrets.HUD_API_KEY }}
          CENSUS_API_KEY: ${{ secrets.CENSUS_API_KEY }}
        run: ./sync --zip-file=data/target-zips.txt
```

---

## GIS & Mapping

### Technology Stack

- **Mapbox GL JS**: Primary mapping library
- **react-map-gl**: React wrapper (by Uber)
- **PostGIS**: Spatial queries in the database
- **Turf.js**: Client-side geospatial operations

### Implementation

```typescript
// apps/web/components/maps/MarketMap.tsx

'use client';

import { useState, useCallback } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import type { MapLayerMouseEvent } from 'react-map-gl';

interface MarketMapProps {
  center: [number, number];
  zoom?: number;
  layers?: ('rent' | 'taxes' | 'flood')[];
}

export function MarketMap({ center, zoom = 10, layers = [] }: MarketMapProps) {
  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    data: Record<string, unknown>;
  } | null>(null);

  const onClick = useCallback((event: MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    if (feature) {
      setPopupInfo({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
        data: feature.properties as Record<string, unknown>,
      });
    }
  }, []);

  return (
    <Map
      initialViewState={{
        longitude: center[0],
        latitude: center[1],
        zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      interactiveLayerIds={['rent-layer', 'flood-layer']}
      onClick={onClick}
    >
      {layers.includes('rent') && (
        <Source id="rent-data" type="vector" url="...">
          <Layer
            id="rent-layer"
            type="fill"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'median_rent'],
                500, '#22c55e',   // green (affordable)
                1500, '#f59e0b', // yellow
                3000, '#ef4444', // red (expensive)
              ],
              'fill-opacity': 0.6,
            }}
          />
        </Source>
      )}
      
      {layers.includes('flood') && (
        <Source id="flood-zones" type="vector" url="...">
          <Layer
            id="flood-layer"
            type="fill"
            paint={{
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3,
            }}
          />
        </Source>
      )}

      {popupInfo && (
        <Popup
          longitude={popupInfo.lng}
          latitude={popupInfo.lat}
          onClose={() => setPopupInfo(null)}
        >
          <div className="p-2">
            <pre>{JSON.stringify(popupInfo.data, null, 2)}</pre>
          </div>
        </Popup>
      )}
    </Map>
  );
}
```

### PostGIS Queries

```typescript
// apps/web/lib/db/spatial.ts

import { db } from './client';
import { sql } from 'drizzle-orm';

// Find all market data within a radius of a point
export async function findMarketDataNear(
  lng: number,
  lat: number,
  radiusMiles: number,
  dataType?: string
) {
  const radiusMeters = radiusMiles * 1609.34;
  
  return db.execute(sql`
    SELECT 
      id,
      geo_type,
      geo_id,
      data_type,
      value,
      ST_Distance(
        boundary::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) / 1609.34 as distance_miles
    FROM market_data
    WHERE ST_DWithin(
      boundary::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
    ${dataType ? sql`AND data_type = ${dataType}` : sql``}
    ORDER BY distance_miles
    LIMIT 100
  `);
}

// Get the ZIP code for a given point
export async function getZipCodeForPoint(lng: number, lat: number) {
  const result = await db.execute(sql`
    SELECT geo_id as zip_code
    FROM market_data
    WHERE geo_type = 'zip'
      AND data_type = 'boundary'
      AND ST_Contains(
        boundary,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
    LIMIT 1
  `);
  
  return result[0]?.zip_code;
}
```

---

## Authentication

### BetterAuth Setup

BetterAuth provides a self-hosted authentication solution with full control over user data.

```typescript
// apps/web/lib/auth/auth.ts

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@dealforge/database';
import { 
  users, 
  sessions, 
  accounts, 
  verifications 
} from '@dealforge/database/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // Update session age daily
  },
  
  rateLimit: {
    window: 60,      // 1 minute
    max: 10,         // 10 requests
  },
  
  advanced: {
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
```

```typescript
// apps/web/lib/auth/client.ts

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  getSession,
} = authClient;
```

### Auth Components

```typescript
// apps/web/components/auth/SignInForm.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  }

  async function handleGoogleSignIn() {
    await signIn.social({ provider: 'google' });
  }

  async function handleGitHubSignIn() {
    await signIn.social({ provider: 'github' });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={handleGoogleSignIn}>
          Google
        </Button>
        <Button variant="outline" onClick={handleGitHubSignIn}>
          GitHub
        </Button>
      </div>
    </div>
  );
}
```

### Protected Routes

```typescript
// apps/web/middleware.ts

import { betterAuth } from 'better-auth';
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/', '/sign-in', '/sign-up', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for session
  const sessionCookie = request.cookies.get('better-auth.session_token');
  
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## CI/CD & DevOps

### GitHub Actions Workflows

#### 1. Continuous Integration

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7

  test-rust:
    name: Rust Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      
      - uses: Swatinem/rust-cache@v2
        with:
          workspaces: packages/calc-engine
      
      - name: Run tests
        working-directory: packages/calc-engine
        run: cargo test
      
      - name: Build WASM
        working-directory: packages/calc-engine-wasm
        run: |
          cargo install wasm-pack
          wasm-pack build --target web

  test-go:
    name: Go Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache-dependency-path: services/data-sync/go.sum
      
      - name: Run tests
        working-directory: services/data-sync
        run: go test -v ./...

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test-unit, test-rust, test-go]
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      
      - name: Build WASM
        working-directory: packages/calc-engine-wasm
        run: |
          cargo install wasm-pack
          wasm-pack build --target web
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

#### 2. Preview Deployments

```yaml
# .github/workflows/preview.yml

name: Preview Deployment

on:
  pull_request:
    branches: [main]

jobs:
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      
      - name: Build WASM
        working-directory: packages/calc-engine-wasm
        run: |
          cargo install wasm-pack
          wasm-pack build --target web
      
      - run: pnpm install --frozen-lockfile
      
      - name: Deploy to Vercel
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### 3. Production Deployment

```yaml
# .github/workflows/deploy.yml

name: Production Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://dealforge.dev
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown
      
      - name: Build WASM
        working-directory: packages/calc-engine-wasm
        run: |
          cargo install wasm-pack
          wasm-pack build --target web
      
      - run: pnpm install --frozen-lockfile
      
      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 4. Data Sync Schedule

```yaml
# .github/workflows/data-sync.yml

name: Data Sync

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2am UTC
  workflow_dispatch:
    inputs:
      zip_list:
        description: 'Comma-separated ZIP codes (optional, defaults to full list)'
        required: false

jobs:
  sync:
    name: Sync Market Data
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache-dependency-path: services/data-sync/go.sum
      
      - name: Build
        working-directory: services/data-sync
        run: go build -o sync ./cmd/sync
      
      - name: Run sync
        working-directory: services/data-sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          HUD_API_KEY: ${{ secrets.HUD_API_KEY }}
          CENSUS_API_KEY: ${{ secrets.CENSUS_API_KEY }}
          BLS_API_KEY: ${{ secrets.BLS_API_KEY }}
        run: |
          if [ -n "${{ inputs.zip_list }}" ]; then
            ./sync --zips="${{ inputs.zip_list }}"
          else
            ./sync --zip-file=data/target-zips.txt
          fi
      
      - name: Report status
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Data sync failed! Check the logs."
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Environment Configuration

```bash
# .env.example

# Database
DATABASE_URL="postgresql://..."
DATABASE_URL_POOLER="postgresql://..."  # For connection pooling

# Authentication
BETTER_AUTH_SECRET="generate-a-secure-secret"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AI
ANTHROPIC_API_KEY=""

# Mapping
NEXT_PUBLIC_MAPBOX_TOKEN=""

# Email
RESEND_API_KEY=""

# Data Sources
HUD_API_KEY=""
CENSUS_API_KEY=""
BLS_API_KEY=""

# Monitoring
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

# Vercel (for CI/CD)
VERCEL_TOKEN=""
VERCEL_ORG_ID=""
VERCEL_PROJECT_ID=""
```

---

## Testing Strategy

### Testing Pyramid

```
                    ┌─────────────┐
                    │    E2E      │  Playwright
                    │   Tests     │  (Critical paths)
                    ├─────────────┤
                    │ Integration │  Vitest + MSW
                    │   Tests     │  (API routes, DB)
                ────┼─────────────┼────
                    │   Unit      │  Vitest (TS)
                    │   Tests     │  Cargo (Rust)
                    └─────────────┘
```

### Unit Tests (Vitest)

```typescript
// packages/types/src/__tests__/calculations.test.ts

import { describe, it, expect } from 'vitest';
import { validateRentalInputs } from '../calculations';

describe('validateRentalInputs', () => {
  it('should accept valid inputs', () => {
    const inputs = {
      purchasePrice: 200000,
      downPaymentPercent: 20,
      interestRate: 7,
      monthlyRent: 1500,
    };
    
    expect(() => validateRentalInputs(inputs)).not.toThrow();
  });
  
  it('should reject negative purchase price', () => {
    const inputs = {
      purchasePrice: -100,
      // ...
    };
    
    expect(() => validateRentalInputs(inputs)).toThrow('Purchase price must be positive');
  });
});
```

### Rust Unit Tests

```rust
// packages/calc-engine/src/rental.rs

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_basic_rental_calculation() {
        let inputs = RentalInputs {
            purchase_price: 200_000.0,
            closing_costs: 5_000.0,
            rehab_costs: 0.0,
            down_payment_percent: 20.0,
            interest_rate: 7.0,
            loan_term_years: 30,
            monthly_rent: 1_800.0,
            other_income: 0.0,
            vacancy_rate: 5.0,
            property_tax_annual: 3_000.0,
            insurance_annual: 1_200.0,
            hoa_monthly: 0.0,
            maintenance_percent: 5.0,
            capex_percent: 5.0,
            management_percent: 8.0,
        };
        
        let results = inputs.calculate();
        
        assert!(results.monthly_cash_flow > 0.0, "Should have positive cash flow");
        assert_relative_eq!(results.cap_rate, 7.14, epsilon = 0.1);
    }
    
    #[test]
    fn test_zero_down_payment() {
        let inputs = RentalInputs {
            purchase_price: 100_000.0,
            down_payment_percent: 0.0,
            // ...
        };
        
        let results = inputs.calculate();
        
        assert_eq!(results.loan_amount, 100_000.0);
    }
}
```

### Integration Tests

```typescript
// apps/web/__tests__/api/deals.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, createTestUser, cleanupTestData } from '../utils';

describe('Deals API', () => {
  let client: ReturnType<typeof createTestClient>;
  let userId: string;
  
  beforeAll(async () => {
    const user = await createTestUser();
    userId = user.id;
    client = createTestClient(user.token);
  });
  
  afterAll(async () => {
    await cleanupTestData(userId);
  });
  
  it('should create a new deal', async () => {
    const response = await client.post('/api/v1/deals', {
      type: 'rental',
      name: 'Test Property',
      inputs: {
        purchasePrice: 200000,
        monthlyRent: 1500,
        // ...
      },
    });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
  });
  
  it('should calculate and store results', async () => {
    const createResponse = await client.post('/api/v1/deals', {
      type: 'rental',
      name: 'Calculation Test',
      inputs: { purchasePrice: 100000, monthlyRent: 1000 },
    });
    
    const dealId = createResponse.body.data.id;
    const getResponse = await client.get(`/api/v1/deals/${dealId}`);
    
    expect(getResponse.body.data.results).toBeDefined();
    expect(getResponse.body.data.results.cashOnCashReturn).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Playwright)

```typescript
// apps/web/e2e/rental-calculator.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Rental Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await page.goto('/analyze/rental');
  });
  
  test('should calculate cash flow with valid inputs', async ({ page }) => {
    // Fill in the form
    await page.fill('[name="purchasePrice"]', '200000');
    await page.fill('[name="downPaymentPercent"]', '20');
    await page.fill('[name="interestRate"]', '7');
    await page.fill('[name="monthlyRent"]', '1800');
    await page.fill('[name="propertyTaxAnnual"]', '3000');
    await page.fill('[name="insuranceAnnual"]', '1200');
    
    // Wait for calculation
    await expect(page.locator('[data-testid="monthly-cash-flow"]')).toBeVisible();
    
    // Verify results are reasonable
    const cashFlow = await page.locator('[data-testid="monthly-cash-flow"]').textContent();
    expect(parseFloat(cashFlow!.replace(/[$,]/g, ''))).toBeGreaterThan(0);
  });
  
  test('should save deal to library', async ({ page }) => {
    // Fill form with test data
    await page.fill('[name="purchasePrice"]', '150000');
    await page.fill('[name="monthlyRent"]', '1200');
    
    // Save
    await page.click('[data-testid="save-deal-button"]');
    await page.fill('[name="dealName"]', 'E2E Test Property');
    await page.click('[data-testid="confirm-save"]');
    
    // Verify saved
    await expect(page.locator('text=Deal saved successfully')).toBeVisible();
    
    // Navigate to library and find it
    await page.goto('/deals');
    await expect(page.locator('text=E2E Test Property')).toBeVisible();
  });
});
```

### Test Scripts

```json
// package.json (root)
{
  "scripts": {
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:e2e": "turbo test:e2e",
    "test:coverage": "turbo test:coverage"
  }
}
```

---

## Open Source Strategy

### License Structure

| Component | License | Rationale |
|-----------|---------|-----------|
| `packages/calc-engine` | MIT | Maximum adoption, embeddable |
| `packages/calc-engine-wasm` | MIT | Browser/server usage |
| `packages/types` | MIT | TypeScript ecosystem |
| `packages/ui` | MIT | Component reuse |
| `services/data-sync` | MIT | Self-hosting support |
| `apps/web` | AGPL-3.0 | Protect hosted version |
| `apps/docs` | MIT | Documentation access |

### Why AGPL for the Main App?

- **Open source protection**: Competitors can't take the codebase and host it as their own SaaS without open-sourcing their modifications
- **Self-hosting allowed**: Individuals and companies can run their own instances
- **Commercial licensing**: Offers path for companies who want to embed without AGPL obligations
- **Community-friendly**: Core libraries remain MIT for maximum contribution

### Contributing Guidelines

See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code of conduct
- Development setup
- PR process
- Coding standards
- Commit conventions (Conventional Commits)
- Testing requirements

### Community Building

1. **Discord/Slack**: Community discussions
2. **GitHub Discussions**: Feature requests, Q&A
3. **Good First Issues**: Labeled for newcomers
4. **Documentation**: Comprehensive onboarding
5. **Showcase**: Highlight community usage

---

## Monetization Path

### Pricing Tiers (Future)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 saved deals, basic calculators, limited AI |
| **Pro** | $19/mo | Unlimited deals, all calculators, full AI, exports |
| **Team** | $49/mo | Pro + 5 seats, collaboration, shared library |
| **Enterprise** | Custom | Self-hosted, SSO, custom integrations, SLA |

### Revenue Streams

1. **SaaS Subscriptions**: Primary revenue
2. **API Access**: For integrators (lenders, property managers)
3. **White-Label**: Embeddable calculators for RE websites
4. **Enterprise Licenses**: Self-hosted with support
5. **Educational Content**: Premium courses/certifications (potential)

### Transition Strategy

1. **Phase 1**: Fully open source, build community
2. **Phase 2**: Launch hosted version, free tier generous
3. **Phase 3**: Introduce paid tiers with advanced features
4. **Phase 4**: Enterprise offering with commercial license

---

## Development Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Working app with one calculator, auth, and save/load

- [ ] Initialize mono-repo with Turborepo
- [ ] Set up Next.js 15 app with App Router
- [ ] Configure Tailwind CSS + shadcn/ui
- [ ] Set up BetterAuth with email + OAuth
- [ ] Configure Neon database + Drizzle ORM
- [ ] Build Rental Property Calculator (TypeScript)
- [ ] Implement save/load deals functionality
- [ ] Create basic dashboard layout
- [ ] Set up CI pipeline (lint, test, build)
- [ ] Deploy to Vercel

**Deliverable**: Users can sign up, analyze a rental property, and save it.

### Phase 2: Rust/WASM Integration (Weeks 5-8)

**Goal**: Port calculations to Rust, instant client-side calculations

- [ ] Set up Rust project structure
- [ ] Implement rental calculator in Rust
- [ ] Configure wasm-pack build pipeline
- [ ] Integrate WASM into Next.js
- [ ] Add BRRRR calculator
- [ ] Add Flip/Rehab calculator
- [ ] Implement sensitivity analysis
- [ ] Add comparison view (side-by-side deals)
- [ ] Write comprehensive Rust tests

**Deliverable**: Calculations run instantly in the browser via WASM.

### Phase 3: AI Integration (Weeks 9-12)

**Goal**: AI-native features that enhance the analysis workflow

- [ ] Set up Vercel AI Gateway
- [ ] Implement Deal Chat assistant
- [ ] Build listing URL extraction feature
- [ ] Create calculation explainer
- [ ] Add "Learn Mode" with AI explanations
- [ ] Implement basic report generation
- [ ] Add AI cost tracking and rate limiting

**Deliverable**: Users can chat about deals, paste listing URLs, and get AI explanations.

### Phase 4: Market Intelligence (Weeks 13-16)

**Goal**: Contextual market data integration

- [ ] Build Go data sync service
- [ ] Integrate Census Bureau API
- [ ] Integrate HUD Fair Market Rents
- [ ] Integrate BLS employment data
- [ ] Set up PostGIS for spatial queries
- [ ] Build basic Mapbox integration
- [ ] Create neighborhood data overlays
- [ ] Connect market data to deal analysis
- [ ] Schedule automated data sync

**Deliverable**: Deals show market context; users can explore data on a map.

### Phase 5: Advanced Features (Weeks 17-20)

**Goal**: Complete calculator suite, polished exports

- [ ] Multi-family analyzer (5-50 units)
- [ ] Commercial property tools
- [ ] 1031 Exchange planner
- [ ] Syndication waterfall modeler
- [ ] PDF export with AI summaries
- [ ] Public share links
- [ ] Portfolio tracker
- [ ] Advanced sensitivity/scenario analysis

**Deliverable**: Full range of calculators from beginner to syndication.

### Phase 6: Scale & Polish (Weeks 21+)

**Goal**: Production-ready, premium features

- [ ] Performance optimization
- [ ] Mobile responsiveness polish
- [ ] Team/organization features
- [ ] API for third-party integrations
- [ ] Advanced GIS features (draw areas, custom analysis)
- [ ] Premium subscription infrastructure
- [ ] Documentation site
- [ ] Public launch

**Deliverable**: Launch-ready product with monetization infrastructure.

---

## Future Considerations

### iOS Native App

When ready to build an iOS companion app:

1. **API Compatibility**: All Next.js Route Handlers are mobile-ready
2. **Auth**: BetterAuth has mobile SDKs
3. **Shared Calculations**: Rust compiles to iOS via `uniffi-rs`
4. **Offline Support**: WASM calculations work offline
5. **Sync**: Deals sync seamlessly between platforms

### Additional Integrations

- **Zillow/Redfin**: Property data (where APIs available)
- **County Records**: Direct assessor integrations
- **Lender APIs**: Pre-qualification, rate quotes
- **Property Management**: Buildium, AppFolio integrations
- **Accounting**: QuickBooks, Stessa connections

### Machine Learning Opportunities

- **Rent Prediction**: ML models for rent estimation
- **Deal Scoring**: Automated opportunity scoring
- **Market Forecasting**: Price/rent trend predictions
- **Anomaly Detection**: Flag unusual deals

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Clone the repo
git clone https://github.com/yourusername/dealforge.git
cd dealforge

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development
pnpm dev

# Run tests
pnpm test
```

### Areas for Contribution

- 🧮 **Calculators**: New analysis tools
- 🎨 **UI/UX**: Component improvements
- 📚 **Education**: Learn mode content
- 🗺️ **Data**: New data source integrations
- 🧪 **Testing**: Expand test coverage
- 📖 **Docs**: Documentation improvements

---

## License

- Core libraries: MIT License
- Main application: AGPL-3.0 License

See [LICENSE](./LICENSE) for details.

---

## Acknowledgments

Built with love for the real estate investing community.

Special thanks to the open source projects that make this possible:
- Next.js, React, and the Vercel team
- Rust and the WASM ecosystem
- The Go community
- Anthropic (Claude AI)
- All our contributors

---

*This is a living document. Last updated: January 2025*
