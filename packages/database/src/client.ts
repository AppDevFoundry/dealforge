import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Create a Neon database client
 *
 * This uses the HTTP driver which is ideal for serverless environments.
 * For persistent connections (like in a Go service), use the pg driver directly.
 */
export function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

/**
 * Type for the database instance
 */
export type Database = ReturnType<typeof createDb>;

/**
 * Get database instance (singleton for edge runtime)
 *
 * Note: In development, you might want to use a different approach
 * to avoid connection issues with hot reloading.
 */
let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    db = createDb(connectionString);
  }
  return db;
}
