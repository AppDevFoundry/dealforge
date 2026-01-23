-- Migration: Add infrastructure tables (CCN areas + Flood zones)
-- Requires PostGIS extension

CREATE EXTENSION IF NOT EXISTS postgis;

-- CCN (Certificate of Convenience and Necessity) Service Areas
CREATE TABLE IF NOT EXISTS ccn_areas (
  id TEXT PRIMARY KEY,
  ccn_number TEXT NOT NULL,
  utility_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'water', 'sewer', 'both'
  county TEXT NOT NULL,
  boundary GEOGRAPHY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ccn_areas_county_idx ON ccn_areas (county);
CREATE INDEX IF NOT EXISTS ccn_areas_service_type_idx ON ccn_areas (service_type);
CREATE INDEX IF NOT EXISTS ccn_areas_ccn_number_idx ON ccn_areas (ccn_number);
CREATE INDEX IF NOT EXISTS ccn_areas_boundary_gist_idx ON ccn_areas USING GIST (boundary);

-- FEMA Flood Zone polygons
CREATE TABLE IF NOT EXISTS flood_zones (
  id TEXT PRIMARY KEY,
  zone_code TEXT NOT NULL,
  zone_description TEXT,
  county TEXT NOT NULL,
  boundary GEOGRAPHY NOT NULL,
  effective_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS flood_zones_county_idx ON flood_zones (county);
CREATE INDEX IF NOT EXISTS flood_zones_zone_code_idx ON flood_zones (zone_code);
CREATE INDEX IF NOT EXISTS flood_zones_boundary_gist_idx ON flood_zones USING GIST (boundary);
