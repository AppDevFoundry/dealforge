import { pgTable, text, timestamp, boolean, jsonb, real } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Deals table
 *
 * Stores real estate deal analyses created by users.
 */
export const deals = pgTable('deals', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  orgId: text('org_id'), // For future organization support
  type: text('type').notNull(), // rental, brrrr, flip, multifamily, etc.
  name: text('name').notNull(),
  status: text('status').notNull().default('draft'), // draft, analyzing, archived
  address: text('address'),

  // Location (simplified - PostGIS can be added later)
  latitude: real('latitude'),
  longitude: real('longitude'),

  // Flexible JSON storage for calculator data
  inputs: jsonb('inputs').notNull().default({}),
  results: jsonb('results'),
  metadata: jsonb('metadata'),

  // Sharing
  isPublic: boolean('is_public').notNull().default(false),
  publicSlug: text('public_slug').unique(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Deal tags for organization
 */
export const dealTags = pgTable('deal_tags', {
  id: text('id').primaryKey(),
  dealId: text('deal_id')
    .notNull()
    .references(() => deals.id, { onDelete: 'cascade' }),
  tag: text('tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * User preferences (calculator defaults, UI settings, etc.)
 */
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  defaultAssumptions: jsonb('default_assumptions').default({}),
  notificationPrefs: jsonb('notification_prefs').default({}),
  uiPrefs: jsonb('ui_prefs').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
export type DealTag = typeof dealTags.$inferSelect;
export type NewDealTag = typeof dealTags.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
