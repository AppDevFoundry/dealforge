# Phase 2: Infrastructure Intelligence - Requirements

## Overview

Phase 2 adds infrastructure data overlays to help MH park investors assess development feasibility and risk. Users will be able to see:
- Where municipal water/sewer service is available (critical for land development)
- Which areas are in flood zones (affects insurance costs and feasibility)

---

## Database Schema

These tables should already exist from the vision doc. Verify or create:

```sql
-- Water/Sewer CCN Service Areas
CREATE TABLE ccn_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccn_number TEXT,
  utility_name TEXT NOT NULL,
  service_type TEXT NOT NULL, -- 'water', 'sewer', 'both'
  county TEXT,
  boundary GEOGRAPHY(POLYGON, 4326),
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ccn_boundary ON ccn_areas USING GIST(boundary);

-- FEMA Flood Zones
CREATE TABLE flood_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_code TEXT NOT NULL, -- 'A', 'AE', 'AH', 'AO', 'V', 'VE', 'X', 'D'
  zone_description TEXT,
  county TEXT,
  boundary GEOGRAPHY(MULTIPOLYGON, 4326),
  effective_date DATE,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_flood_boundary ON flood_zones USING GIST(boundary);
```

---

## Data Sources & Acquisition

### PUC Texas CCN Data

**Source**: https://www.puc.texas.gov/industry/water/utilities/gis.aspx

**Files to download**:
- Water CCN boundaries (shapefile)
- Sewer/Wastewater CCN boundaries (shapefile)

**Processing steps**:
1. Download shapefiles from PUC website
2. Use `ogr2ogr` or a Node/Python script to convert to GeoJSON or load directly to PostGIS
3. Insert into `ccn_areas` table with appropriate service_type

**Key fields to extract**:
- CCN number
- Utility name
- Service type (water vs sewer)
- Boundary polygon

### FEMA NFHL Data

**Source options**:
1. FEMA Map Service Center: https://msc.fema.gov/portal/home
2. TNRIS DataHub: https://data.tnris.org/ (search "FEMA" or "flood")
3. FEMA WMS: https://hazards.fema.gov/gis/nfhl/services

**Recommended approach**: 
- For MVP, focus on the 5 initial counties (Bexar, Hidalgo, Cameron, Nueces, Travis)
- Download county-level NFHL data from FEMA or TNRIS
- Alternatively, use FEMA's WMS tile service for dynamic loading (simpler but less control)

**Processing steps**:
1. Download NFHL shapefiles for target counties
2. Extract flood zone polygons (S_FLD_HAZ_AR layer typically)
3. Load into `flood_zones` table

**Flood zone codes**:
- **High Risk**: A, AE, AH, AO, AR, A99, V, VE (require flood insurance)
- **Moderate Risk**: B, X (shaded)
- **Low Risk**: C, X (unshaded)
- **Undetermined**: D

---

## Data Sync Scripts

Create scripts in `services/data-sync/` or `scripts/` directory:

### `sync-ccn-data.ts`
```typescript
// Pseudocode structure
async function syncCCNData() {
  // 1. Download shapefiles from PUC (or load from local if pre-downloaded)
  // 2. Parse shapefile using libraries like 'shapefile' or 'gdal'
  // 3. Transform to GeoJSON
  // 4. Insert/upsert into ccn_areas table
  // 5. Log results
}
```

### `sync-flood-data.ts`
```typescript
// Pseudocode structure
async function syncFloodData(counties: string[]) {
  // 1. For each county, download NFHL data
  // 2. Parse shapefile
  // 3. Transform to GeoJSON
  // 4. Insert into flood_zones table
  // 5. Log results
}
```

**Libraries to consider**:
- `shapefile` - Pure JS shapefile parser
- `@mapbox/togeojson` - Convert to GeoJSON
- `pg` with PostGIS - Direct spatial inserts
- Or use command-line `ogr2ogr` (part of GDAL)

---

## API Endpoints

### GET `/api/v1/infrastructure/ccn`
Returns CCN areas within a bounding box or near a point.

**Query params**:
- `bbox`: Bounding box (minLng,minLat,maxLng,maxLat)
- `lat`, `lng`, `radius`: Point + radius in miles
- `serviceType`: Filter by 'water', 'sewer', or 'both'

**Response**: GeoJSON FeatureCollection

### GET `/api/v1/infrastructure/flood-zones`
Returns flood zones within a bounding box.

**Query params**:
- `bbox`: Bounding box
- `county`: Filter by county
- `highRiskOnly`: Boolean to filter only high-risk zones

**Response**: GeoJSON FeatureCollection

### GET `/api/v1/infrastructure/check-point`
Check infrastructure at a specific point (useful for quick lookups).

**Query params**:
- `lat`, `lng`: Coordinates

**Response**:
```json
{
  "ccn": {
    "inServiceArea": true,
    "utilities": [
      { "name": "San Antonio Water System", "type": "water" },
      { "name": "San Antonio Water System", "type": "sewer" }
    ]
  },
  "flood": {
    "zone": "X",
    "riskLevel": "low",
    "description": "Area of minimal flood hazard"
  }
}
```

---

## Map Integration

### Layer Configuration

Add to map component:

```typescript
// Map layers to add
const infrastructureLayers = {
  ccnWater: {
    id: 'ccn-water-layer',
    type: 'fill',
    source: 'ccn-data',
    filter: ['==', ['get', 'service_type'], 'water'],
    paint: {
      'fill-color': '#3b82f6', // blue
      'fill-opacity': 0.3,
      'fill-outline-color': '#1d4ed8'
    }
  },
  ccnSewer: {
    id: 'ccn-sewer-layer', 
    type: 'fill',
    source: 'ccn-data',
    filter: ['==', ['get', 'service_type'], 'sewer'],
    paint: {
      'fill-color': '#8b5cf6', // purple
      'fill-opacity': 0.3,
      'fill-outline-color': '#6d28d9'
    }
  },
  floodHighRisk: {
    id: 'flood-high-risk-layer',
    type: 'fill',
    source: 'flood-data',
    filter: ['in', ['get', 'zone_code'], ['literal', ['A', 'AE', 'AH', 'AO', 'V', 'VE']]],
    paint: {
      'fill-color': '#ef4444', // red
      'fill-opacity': 0.4
    }
  },
  floodModerateRisk: {
    id: 'flood-moderate-risk-layer',
    type: 'fill',
    source: 'flood-data',
    filter: ['==', ['get', 'zone_code'], 'X'],
    paint: {
      'fill-color': '#fbbf24', // yellow
      'fill-opacity': 0.2
    }
  }
};
```

### Layer Controls Component

Create `components/maps/LayerControls.tsx`:

```typescript
interface LayerControlsProps {
  layers: {
    communities: boolean;
    ccnWater: boolean;
    ccnSewer: boolean;
    floodZones: boolean;
  };
  onToggle: (layer: string, visible: boolean) => void;
  onOpacityChange?: (layer: string, opacity: number) => void;
}
```

Features:
- Toggle switches for each layer
- Optional opacity sliders
- Legend with color meanings
- Collapse/expand panel

---

## UI Components

### Layer Panel (sidebar or overlay)
```
┌─────────────────────────────┐
│ Map Layers                  │
├─────────────────────────────┤
│ ☑ MH Communities           │
│ ☑ Water Service (CCN)  🔵  │
│ ☑ Sewer Service (CCN)  🟣  │
│ ☑ Flood Zones              │
│   ├─ High Risk         🔴  │
│   └─ Moderate Risk     🟡  │
├─────────────────────────────┤
│ Legend                      │
│ 🔵 Municipal Water          │
│ 🟣 Municipal Sewer          │
│ 🔴 High Flood Risk (A/V)    │
│ 🟡 Moderate Flood Risk (X)  │
└─────────────────────────────┘
```

### Info Popup (on click)
When user clicks on infrastructure layer, show popup with details:

**CCN Click**:
```
San Antonio Water System
Service: Water
CCN #: 12345
```

**Flood Zone Click**:
```
Flood Zone: AE
Risk Level: High
Special Flood Hazard Area
Flood insurance required
```

---

## Testing

### Unit Tests
- GeoJSON parsing functions
- Flood zone risk classification
- Bounding box query building

### Integration Tests
- API endpoints return valid GeoJSON
- Spatial queries return correct results
- Layer toggles work correctly

### Manual Testing
- Verify CCN boundaries align with known utility service areas
- Verify flood zones match FEMA flood maps
- Test performance with large polygon datasets

---

## Performance Considerations

1. **Simplify geometries**: Use ST_Simplify to reduce polygon complexity for display
2. **Tile the data**: Consider converting to vector tiles (Mapbox tileset) for large datasets
3. **Lazy loading**: Only fetch data for current viewport
4. **Caching**: Cache API responses, especially for flood data that rarely changes

---

## Success Criteria

- [ ] CCN water boundaries display correctly on map
- [ ] CCN sewer boundaries display correctly on map  
- [ ] Flood zones display with appropriate risk coloring
- [ ] Layer toggles show/hide each layer independently
- [ ] Click on layer shows relevant details in popup
- [ ] Point lookup API returns correct infrastructure info
- [ ] Data covers at least the 5 initial counties
- [ ] Map performance remains smooth with layers enabled

---

## File Structure

```
apps/web/
├── app/
│   └── api/
│       └── v1/
│           └── infrastructure/
│               ├── ccn/route.ts
│               ├── flood-zones/route.ts
│               └── check-point/route.ts
├── components/
│   └── maps/
│       ├── LayerControls.tsx
│       ├── InfrastructurePopup.tsx
│       └── MapLegend.tsx
├── lib/
│   └── infrastructure/
│       ├── queries.ts
│       └── types.ts

packages/database/
└── src/
    └── schema/
        └── infrastructure.ts  (ccn_areas, flood_zones)

scripts/
├── sync-ccn-data.ts
└── sync-flood-data.ts
```
