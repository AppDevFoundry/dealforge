'use client';

import type { GeoJSONFeatureCollection, InfrastructureLayerVisibility } from '@dealforge/types';
import { Layer, Source } from '@vis.gl/react-mapbox';

interface InfrastructureLayersProps {
  ccnData: GeoJSONFeatureCollection | undefined;
  floodData: GeoJSONFeatureCollection | undefined;
  visibility: InfrastructureLayerVisibility;
}

// Cast our GeoJSON type to the format expected by mapbox Source component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asSourceData(data: GeoJSONFeatureCollection): any {
  return data;
}

export function InfrastructureLayers({
  ccnData,
  floodData,
  visibility,
}: InfrastructureLayersProps) {
  return (
    <>
      {/* CCN Service Areas */}
      {ccnData && (visibility.waterCcn || visibility.sewerCcn) && (
        <Source id="ccn-areas" type="geojson" data={asSourceData(ccnData)}>
          {/* Water CCN areas - blue */}
          <Layer
            id="ccn-water-fill"
            type="fill"
            filter={[
              'any',
              ['==', ['get', 'serviceType'], 'water'],
              ['==', ['get', 'serviceType'], 'both'],
            ]}
            paint={{
              'fill-color': '#3b82f6',
              'fill-opacity': 0.3,
            }}
            layout={{
              visibility: visibility.waterCcn ? 'visible' : 'none',
            }}
          />
          <Layer
            id="ccn-water-outline"
            type="line"
            filter={[
              'any',
              ['==', ['get', 'serviceType'], 'water'],
              ['==', ['get', 'serviceType'], 'both'],
            ]}
            paint={{
              'line-color': '#2563eb',
              'line-width': 1.5,
            }}
            layout={{
              visibility: visibility.waterCcn ? 'visible' : 'none',
            }}
          />

          {/* Sewer CCN areas - purple */}
          <Layer
            id="ccn-sewer-fill"
            type="fill"
            filter={[
              'any',
              ['==', ['get', 'serviceType'], 'sewer'],
              ['==', ['get', 'serviceType'], 'both'],
            ]}
            paint={{
              'fill-color': '#8b5cf6',
              'fill-opacity': 0.3,
            }}
            layout={{
              visibility: visibility.sewerCcn ? 'visible' : 'none',
            }}
          />
          <Layer
            id="ccn-sewer-outline"
            type="line"
            filter={[
              'any',
              ['==', ['get', 'serviceType'], 'sewer'],
              ['==', ['get', 'serviceType'], 'both'],
            ]}
            paint={{
              'line-color': '#7c3aed',
              'line-width': 1.5,
            }}
            layout={{
              visibility: visibility.sewerCcn ? 'visible' : 'none',
            }}
          />
        </Source>
      )}

      {/* Flood Zones */}
      {floodData && (visibility.floodZonesHigh || visibility.floodZonesModerate) && (
        <Source id="flood-zones" type="geojson" data={asSourceData(floodData)}>
          {/* High-risk flood zones - red */}
          <Layer
            id="flood-high-fill"
            type="fill"
            filter={['==', ['get', 'riskLevel'], 'high']}
            paint={{
              'fill-color': '#ef4444',
              'fill-opacity': 0.4,
            }}
            layout={{
              visibility: visibility.floodZonesHigh ? 'visible' : 'none',
            }}
          />
          <Layer
            id="flood-high-outline"
            type="line"
            filter={['==', ['get', 'riskLevel'], 'high']}
            paint={{
              'line-color': '#dc2626',
              'line-width': 1,
            }}
            layout={{
              visibility: visibility.floodZonesHigh ? 'visible' : 'none',
            }}
          />

          {/* Moderate-risk flood zones - yellow */}
          <Layer
            id="flood-moderate-fill"
            type="fill"
            filter={['==', ['get', 'riskLevel'], 'moderate']}
            paint={{
              'fill-color': '#fbbf24',
              'fill-opacity': 0.2,
            }}
            layout={{
              visibility: visibility.floodZonesModerate ? 'visible' : 'none',
            }}
          />
          <Layer
            id="flood-moderate-outline"
            type="line"
            filter={['==', ['get', 'riskLevel'], 'moderate']}
            paint={{
              'line-color': '#f59e0b',
              'line-width': 1,
            }}
            layout={{
              visibility: visibility.floodZonesModerate ? 'visible' : 'none',
            }}
          />
        </Source>
      )}
    </>
  );
}
