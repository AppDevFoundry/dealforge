import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhTitlings } from '@dealforge/database/schema';
import { ListMhTitlingsQuerySchema } from '@dealforge/types';
import { type SQL, and, asc, eq, gte, lte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = ListMhTitlingsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    const whereConditions: SQL[] = [];

    if (query.county) {
      whereConditions.push(eq(mhTitlings.county, query.county));
    }
    if (query.startMonth) {
      whereConditions.push(gte(mhTitlings.month, query.startMonth));
    }
    if (query.endMonth) {
      whereConditions.push(lte(mhTitlings.month, query.endMonth));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db
      .select()
      .from(mhTitlings)
      .where(whereClause)
      .orderBy(asc(mhTitlings.month));

    return createSuccessResponse(results);
  } catch (error) {
    console.error('Error listing MH titlings:', error);
    return ApiErrors.internalError('Failed to list MH titlings');
  }
}
