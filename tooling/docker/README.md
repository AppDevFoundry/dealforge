# Docker Configuration

Docker Compose configuration for local development services.

## Services

### PostgreSQL (with PostGIS)

Local PostgreSQL database with PostGIS extension for spatial queries.

```bash
# Start the database
docker-compose up -d postgres

# Connect to the database
docker-compose exec postgres psql -U dealforge
```

### Future Services

Additional services will be added as needed:
- Redis (for caching, if needed)
- Minio (for local S3-compatible storage)

## Usage

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (resets data)
docker-compose down -v
```

## Note on Neon

For production and most development, we use [Neon](https://neon.tech/) for PostgreSQL.
This Docker Compose setup is provided for:
- Offline development
- CI/CD testing
- Self-hosting scenarios

If you have a Neon account, you can skip the local PostgreSQL setup
and use your Neon database URL directly in `.env.local`.
