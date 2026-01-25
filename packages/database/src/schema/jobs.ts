import { createId } from '@paralleldrive/cuid2';
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

/**
 * Job status enum
 */
export const jobStatusEnum = pgEnum('job_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * Job type enum
 */
export const jobTypeEnum = pgEnum('job_type', [
  'tdhca_titles_sync',
  'tdhca_liens_sync',
  'discover_parks',
  'calculate_distress',
  'csv_import',
]);

/**
 * Background Jobs table
 *
 * Tracks async/background job execution for data sync,
 * processing, and other long-running tasks.
 */
export const jobs = pgTable(
  'jobs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `job_${createId()}`),
    type: jobTypeEnum('type').notNull(),
    status: jobStatusEnum('status').notNull().default('pending'),
    parameters: jsonb('parameters'), // Input parameters for the job
    result: jsonb('result'), // Output result from the job
    errorMessage: text('error_message'),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('jobs_status_idx').on(table.status),
    index('jobs_type_idx').on(table.type),
    index('jobs_created_by_idx').on(table.createdBy),
    index('jobs_created_at_idx').on(table.createdAt),
  ]
);

// Type exports
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobType = (typeof jobTypeEnum.enumValues)[number];
