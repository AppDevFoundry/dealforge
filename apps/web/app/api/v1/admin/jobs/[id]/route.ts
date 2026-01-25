import { getDb } from '@dealforge/database';
import { jobs } from '@dealforge/database/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession, getUserRole } from '@/lib/auth-server';

/**
 * GET /api/v1/admin/jobs/[id]
 *
 * Get a specific job by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/admin/jobs/[id]
 *
 * Update a job (status, result, error)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(session.user.id);
    if (role !== 'admin' && role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, result, errorMessage } = body;

    const db = getDb();

    // Check if job exists
    const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Partial<typeof jobs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (status) {
      const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set timestamps based on status
      if (status === 'running' && !existingJob.startedAt) {
        updateData.startedAt = new Date();
      }
      if (['completed', 'failed', 'cancelled'].includes(status) && !existingJob.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    if (result !== undefined) {
      updateData.result = result;
    }

    if (errorMessage !== undefined) {
      updateData.errorMessage = errorMessage;
    }

    const [updatedJob] = await db.update(jobs).set(updateData).where(eq(jobs.id, id)).returning();

    return NextResponse.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
