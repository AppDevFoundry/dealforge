# DealForge Documentation

This will be the documentation site for DealForge, built with [Fumadocs](https://fumadocs.vercel.app/).

## Planned Content Structure

```
content/
├── guides/                # User guides
│   ├── getting-started.mdx
│   ├── first-analysis.mdx
│   └── understanding-metrics.mdx
├── calculators/           # Calculator documentation
│   ├── rental-property.mdx
│   ├── brrrr.mdx
│   ├── flip-rehab.mdx
│   └── syndication.mdx
├── education/             # Real estate education
│   ├── fundamentals/
│   ├── metrics/
│   └── strategies/
└── api/                   # API documentation
    ├── overview.mdx
    ├── authentication.mdx
    └── endpoints/
```

## Setup (Coming Soon)

This documentation site will be set up with:

1. **Fumadocs** - MDX-based documentation framework for Next.js
2. **Full-text search** - Built-in search functionality
3. **Dark mode** - Theme support
4. **API docs** - Auto-generated from OpenAPI spec

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Start docs development server
pnpm --filter @dealforge/docs dev
```

## Contributing

Documentation contributions are welcome! See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
