import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local from the root of the monorepo
config({ path: '../../.env.local' });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
