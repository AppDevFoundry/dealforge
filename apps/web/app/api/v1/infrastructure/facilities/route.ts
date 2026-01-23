/**
 * CCN Facilities API endpoint
 *
 * Returns GeoJSON FeatureCollection of CCN facility lines (infrastructure)
 * Query params:
 * - bbox: "minLng,minLat,maxLng,maxLat" (required)
 * - serviceType: "water" | "sewer" (optional filter)
 */

import { getCcnFacilitiesByBbox } from '@/lib/infrastructure/queries';
import type { CcnServiceType } from '@dealforge/types';
import { parseBBox } from '@dealforge/types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bboxStr = searchParams.get('bbox');
  const serviceType = searchParams.get('serviceType') as CcnServiceType | null;

  if (!bboxStr) {
    return NextResponse.json({ error: 'bbox parameter is required' }, { status: 400 });
  }

  const bbox = parseBBox(bboxStr);
  if (!bbox) {
    return NextResponse.json(
      { error: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
      { status: 400 }
    );
  }

  try {
    const facilities = await getCcnFacilitiesByBbox(bbox, serviceType || undefined);
    return NextResponse.json(facilities);
  } catch (error) {
    console.error('Error fetching CCN facilities:', error);
    return NextResponse.json({ error: 'Failed to fetch CCN facilities' }, { status: 500 });
  }
}
