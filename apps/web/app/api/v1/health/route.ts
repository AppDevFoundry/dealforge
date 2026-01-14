import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 *
 * GET /api/v1/health
 *
 * Returns server status for monitoring and load balancers.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  });
}
