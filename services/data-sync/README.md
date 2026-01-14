# DealForge Data Sync Service

A Go service that periodically fetches open data from government APIs and loads it into the database.

## Purpose

This service syncs market data from various government sources:

- **HUD** - Fair Market Rents (FMR)
- **Census Bureau** - Demographics, population, income
- **BLS** - Employment data, unemployment rates
- **FEMA** - Flood zone data

## Architecture

```
cmd/
└── sync/
    └── main.go           # Entry point

internal/
├── config/
│   └── config.go         # Configuration loading
├── db/
│   └── postgres.go       # Database operations
├── sources/
│   ├── census.go         # Census Bureau API
│   ├── hud.go            # HUD API
│   ├── bls.go            # Bureau of Labor Statistics
│   └── fema.go           # FEMA flood data
└── sync/
    └── orchestrator.go   # Coordinates sync operations
```

## Getting Started

### Prerequisites

- Go 1.22+
- PostgreSQL database (Neon)
- API keys for data sources

### Environment Variables

```bash
DATABASE_URL=postgresql://...
HUD_API_KEY=your_hud_key
CENSUS_API_KEY=your_census_key
BLS_API_KEY=your_bls_key
```

### Development

```bash
# Install dependencies
go mod download

# Run locally
go run ./cmd/sync

# Build
go build -o sync ./cmd/sync

# Run tests
go test -v ./...
```

## Scheduled Execution

This service runs as a GitHub Action on a schedule:

- **Weekly**: Full sync of all data sources
- **On-demand**: Manual trigger for specific ZIP codes

See `.github/workflows/data-sync.yml` for the schedule configuration.

## API Sources

### HUD Fair Market Rents

- **Endpoint**: `https://www.huduser.gov/hudapi/public/fmr/data/{zip}`
- **Frequency**: Annual (updated each fiscal year)
- **Data**: Rent estimates by bedroom count

### Census Bureau

- **Endpoint**: Various (ACS 5-year estimates)
- **Frequency**: Annual
- **Data**: Population, income, demographics

### Bureau of Labor Statistics

- **Endpoint**: Various BLS APIs
- **Frequency**: Monthly
- **Data**: Unemployment rates, employment by sector

## Contributing

When adding new data sources:

1. Create a new client in `internal/sources/`
2. Implement the data fetching logic
3. Add database schema for the new data type
4. Register in the orchestrator
5. Add tests

## License

MIT License - See [LICENSE](../../LICENSE)
