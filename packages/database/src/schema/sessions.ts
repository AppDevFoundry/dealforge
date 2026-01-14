import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Sessions table
 *
 * Stores user sessions for authentication.
 * Compatible with BetterAuth session management.
 */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
