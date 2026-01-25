import { getDb } from '@dealforge/database';
import { jobs } from '@dealforge/database/schema';
import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession, getUserRole } from '@/lib/auth-server';

/**
 * POST /api/v1/admin/sync/upload
 *
 * Upload a CSV file for TDHCA data import
 * Creates a job record to track the import status
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('type') as 'titles' | 'liens' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fileType || !['titles', 'liens'].includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "titles" or "liens"' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV file' }, { status: 400 });
    }

    // Create job record
    const db = getDb();
    const jobType = fileType === 'titles' ? 'tdhca_titles_sync' : 'tdhca_liens_sync';

    const result = await db
      .insert(jobs)
      .values({
        type: jobType,
        status: 'pending',
        parameters: {
          filename: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
        createdBy: session.user.id,
      })
      .returning();

    const newJob = result[0];
    if (!newJob) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // In a full implementation, we would:
    // 1. Save the file to cloud storage (S3, GCS, etc.)
    // 2. Trigger a background worker to process the file
    // 3. Update the job status as processing progresses
    //
    // For MVP, the job is created with 'pending' status
    // and admin can manually trigger processing or update status

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: newJob.id,
          message: `Job created for ${fileType} import. File: ${file.name}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
