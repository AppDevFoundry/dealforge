import { getDb } from '@dealforge/database';
import { jobs } from '@dealforge/database/schema';
import { desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession, getUserRole } from '@/lib/auth-server';

/**
 * GET /api/v1/admin/jobs
 *
 * List recent jobs with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '10'), 100);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const db = getDb();
    let query = db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);

    // Apply filters
    if (status) {
      query = query.where(
        eq(jobs.status, status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled')
      ) as typeof query;
    }
    if (type) {
      query = query.where(
        eq(
          jobs.type,
          type as
            | 'tdhca_titles_sync'
            | 'tdhca_liens_sync'
            | 'discover_parks'
            | 'calculate_distress'
            | 'csv_import'
        )
      ) as typeof query;
    }

    const result = await query;

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/jobs
 *
 * Create a new job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, parameters } = body;

    if (!type) {
      return NextResponse.json({ error: 'Job type is required' }, { status: 400 });
    }

    const validTypes = [
      'tdhca_titles_sync',
      'tdhca_liens_sync',
      'discover_parks',
      'calculate_distress',
      'csv_import',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const db = getDb();
    const [newJob] = await db
      .insert(jobs)
      .values({
        type: type as
          | 'tdhca_titles_sync'
          | 'tdhca_liens_sync'
          | 'discover_parks'
          | 'calculate_distress'
          | 'csv_import',
        status: 'pending',
        parameters: parameters || null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newJob,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
