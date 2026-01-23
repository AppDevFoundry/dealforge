declare module 'shpjs' {
  interface GeoJsonFeature {
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: unknown;
    };
    properties: Record<string, unknown>;
  }

  interface GeoJsonCollection {
    type: 'FeatureCollection';
    features: GeoJsonFeature[];
  }

  function shp(buffer: ArrayBuffer | Buffer): Promise<GeoJsonCollection | GeoJsonCollection[]>;

  export = shp;
}
