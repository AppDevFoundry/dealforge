/**
 * Refresh TDHCA Data Tool
 *
 * Creates a job to refresh TDHCA data (titles or liens) for a county.
 * The actual data refresh is handled by admin workflows or background jobs.
 */

import { getDb } from '@dealforge/database';
import { jobs } from '@dealforge/database/schema';
import { tool } from 'ai';
import { z } from 'zod';

const refreshTdhcaDataSchema = z.object({
  dataType: z
    .enum(['liens', 'titles', 'both'])
    .describe(
      'Type of TDHCA data to refresh: "liens" for tax liens, "titles" for ownership titles, or "both"'
    ),
  county: z
    .string()
    .optional()
    .describe(
      'Optional Texas county name to refresh data for (e.g., "Harris", "Bexar"). If not specified, all counties will be refreshed.'
    ),
});

type RefreshTdhcaDataParams = z.infer<typeof refreshTdhcaDataSchema>;

export const refreshTdhcaData = tool({
  description:
    'Request a refresh of TDHCA data (tax liens and/or title records). Creates a job that will be processed by the admin team. Use this when the user wants to update or sync the latest data from TDHCA.',
  inputSchema: refreshTdhcaDataSchema,
  execute: async (params: RefreshTdhcaDataParams, _options) => {
    const { dataType, county } = params;
    const db = getDb();

    const jobsToCreate: Array<{
      type: 'tdhca_titles_sync' | 'tdhca_liens_sync';
      parameters: Record<string, unknown>;
    }> = [];

    if (dataType === 'titles' || dataType === 'both') {
      jobsToCreate.push({
        type: 'tdhca_titles_sync',
        parameters: {
          county: county || null,
          requestedAt: new Date().toISOString(),
          source: 'ai_tool',
        },
      });
    }

    if (dataType === 'liens' || dataType === 'both') {
      jobsToCreate.push({
        type: 'tdhca_liens_sync',
        parameters: {
          county: county || null,
          requestedAt: new Date().toISOString(),
          source: 'ai_tool',
        },
      });
    }

    const createdJobs: Array<{ id: string; type: string; status: string }> = [];

    for (const jobData of jobsToCreate) {
      const result = await db
        .insert(jobs)
        .values({
          type: jobData.type,
          status: 'pending',
          parameters: jobData.parameters,
        })
        .returning({ id: jobs.id, type: jobs.type, status: jobs.status });

      if (result[0]) {
        createdJobs.push({
          id: result[0].id,
          type: result[0].type,
          status: result[0].status,
        });
      }
    }

    const countyText = county ? `for ${county} County` : 'for all counties';
    const dataTypeText = dataType === 'both' ? 'titles and liens' : dataType;

    return {
      success: true,
      message: `Created ${createdJobs.length} refresh job(s) ${countyText}. The admin team will process these requests and the data will be updated.`,
      jobs: createdJobs,
      dataType: dataTypeText,
      county: county || 'all',
      note: 'TDHCA data refreshes require manual download from the TDHCA portal. An admin will process this request and update the data.',
    };
  },
});
