/**
 * Get Data Refresh Status Tool
 *
 * Retrieves the status of data refresh jobs.
 */

import { getDb } from '@dealforge/database';
import { jobs } from '@dealforge/database/schema';
import { tool } from 'ai';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const getDataRefreshStatusSchema = z.object({
  jobId: z
    .string()
    .optional()
    .describe('Specific job ID to check. If not provided, returns recent jobs.'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe('Maximum number of jobs to return (default: 5, max: 20)'),
  type: z
    .enum(['tdhca_titles_sync', 'tdhca_liens_sync', 'discover_parks', 'calculate_distress', 'all'])
    .default('all')
    .describe('Filter by job type'),
});

type GetDataRefreshStatusParams = z.infer<typeof getDataRefreshStatusSchema>;

const typeLabels: Record<string, string> = {
  tdhca_titles_sync: 'TDHCA Titles Sync',
  tdhca_liens_sync: 'TDHCA Liens Sync',
  discover_parks: 'Park Discovery',
  calculate_distress: 'Distress Calculation',
  csv_import: 'CSV Import',
};

const statusDescriptions: Record<string, string> = {
  pending: 'Waiting to be processed',
  running: 'Currently being processed',
  completed: 'Successfully completed',
  failed: 'Failed with an error',
  cancelled: 'Cancelled by admin',
};

function formatDuration(start: Date | null, end: Date | null): string | null {
  if (!start) return null;
  const endDate = end || new Date();
  const diffMs = endDate.getTime() - start.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs} seconds`;
  const diffMins = Math.floor(diffSecs / 60);
  const remainingSecs = diffSecs % 60;
  return `${diffMins}m ${remainingSecs}s`;
}

export const getDataRefreshStatus = tool({
  description:
    'Check the status of data refresh jobs. Can check a specific job by ID or list recent jobs. Use this to follow up on refresh requests or see what data updates are in progress.',
  inputSchema: getDataRefreshStatusSchema,
  execute: async (params: GetDataRefreshStatusParams, _options) => {
    const { jobId, limit, type } = params;
    const db = getDb();

    // If specific job ID requested
    if (jobId) {
      const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

      const job = result[0];
      if (!job) {
        return {
          success: false,
          message: `Job with ID "${jobId}" not found.`,
        };
      }

      return {
        success: true,
        job: {
          id: job.id,
          type: job.type,
          typeLabel: typeLabels[job.type] || job.type,
          status: job.status,
          statusDescription: statusDescriptions[job.status] || job.status,
          parameters: job.parameters,
          result: job.result,
          errorMessage: job.errorMessage,
          duration: formatDuration(job.startedAt, job.completedAt),
          createdAt: job.createdAt.toISOString(),
          startedAt: job.startedAt?.toISOString() || null,
          completedAt: job.completedAt?.toISOString() || null,
        },
      };
    }

    // List recent jobs
    let query = db.select().from(jobs);

    if (type !== 'all') {
      query = query.where(eq(jobs.type, type)) as typeof query;
    }

    const result = await query.orderBy(desc(jobs.createdAt)).limit(limit);

    const jobList = result.map((job) => ({
      id: job.id,
      type: job.type,
      typeLabel: typeLabels[job.type] || job.type,
      status: job.status,
      statusDescription: statusDescriptions[job.status] || job.status,
      duration: formatDuration(job.startedAt, job.completedAt),
      createdAt: job.createdAt.toISOString(),
      errorMessage: job.errorMessage,
    }));

    // Summary stats
    const statusCounts = {
      pending: jobList.filter((j) => j.status === 'pending').length,
      running: jobList.filter((j) => j.status === 'running').length,
      completed: jobList.filter((j) => j.status === 'completed').length,
      failed: jobList.filter((j) => j.status === 'failed').length,
    };

    return {
      success: true,
      jobs: jobList,
      count: jobList.length,
      summary: statusCounts,
      message:
        jobList.length > 0
          ? `Found ${jobList.length} job(s). ${statusCounts.running} running, ${statusCounts.pending} pending, ${statusCounts.completed} completed, ${statusCounts.failed} failed.`
          : 'No jobs found matching the criteria.',
    };
  },
});
