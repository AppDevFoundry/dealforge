import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import {
  gatherLeadIntelligence,
  saveLeadIntelligence,
  updateLeadWithGeocode,
} from '@/lib/leads/intelligence';
import { getDb } from '@dealforge/database/client';
import { leads } from '@dealforge/database/schema';
import { CreateLeadSchema, ListLeadsQuerySchema } from '@dealforge/types';
import { type SQL, and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/leads - List user's leads
 *
 * Query params:
 * - status: Filter by status
 * - propertyType: Filter by property type
 * - county: Filter by county
 * - zipCode: Filter by ZIP code
 * - minPrice: Minimum asking price
 * - maxPrice: Maximum asking price
 * - search: Search in address
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 20, max: 100)
 * - sortBy: Sort field
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const queryResult = ListLeadsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build where conditions
    const whereConditions: SQL[] = [eq(leads.userId, session.user.id)];

    if (query.status) {
      whereConditions.push(eq(leads.status, query.status));
    }
    if (query.propertyType) {
      whereConditions.push(eq(leads.propertyType, query.propertyType));
    }
    if (query.county) {
      whereConditions.push(ilike(leads.county, query.county));
    }
    if (query.zipCode) {
      whereConditions.push(eq(leads.zipCode, query.zipCode));
    }
    if (query.minPrice) {
      whereConditions.push(gte(leads.askingPrice, query.minPrice));
    }
    if (query.maxPrice) {
      whereConditions.push(lte(leads.askingPrice, query.maxPrice));
    }
    if (query.search) {
      whereConditions.push(
        or(
          ilike(leads.address, `%${query.search}%`),
          ilike(leads.city, `%${query.search}%`),
          ilike(leads.sellerName, `%${query.search}%`)
        )!
      );
    }

    const whereClause = and(...whereConditions);

    // Get total count
    const [countResult] = await db.select({ total: count() }).from(leads).where(whereClause);

    const total = countResult?.total ?? 0;

    // Build sort order
    const sortColumn =
      query.sortBy === 'createdAt'
        ? leads.createdAt
        : query.sortBy === 'updatedAt'
          ? leads.updatedAt
          : query.sortBy === 'askingPrice'
            ? leads.askingPrice
            : query.sortBy === 'address'
              ? leads.address
              : query.sortBy === 'status'
                ? leads.status
                : leads.createdAt;

    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated results
    const results = await db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    return createSuccessResponse(results, {
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
      },
    });
  } catch (error) {
    console.error('Error listing leads:', error);
    return ApiErrors.internalError('Failed to list leads');
  }
}

/**
 * POST /api/v1/leads - Create a new lead
 *
 * Creates a lead and triggers async intelligence gathering.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = CreateLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return ApiErrors.validationError(parseResult.error.errors);
    }

    const data = parseResult.data;
    const db = getDb();

    // Create the lead with "analyzing" status
    const [newLead] = await db
      .insert(leads)
      .values({
        userId: session.user.id,
        status: 'analyzing',
        address: data.address,
        propertyType: data.propertyType,
        propertyCondition: data.propertyCondition,
        yearBuilt: data.yearBuilt,
        lotSize: data.lotSize,
        homeSize: data.homeSize,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        lotCount: data.lotCount,
        askingPrice: data.askingPrice,
        estimatedValue: data.estimatedValue,
        lotRent: data.lotRent,
        monthlyIncome: data.monthlyIncome,
        annualTaxes: data.annualTaxes,
        annualInsurance: data.annualInsurance,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        sellerEmail: data.sellerEmail || null,
        sellerMotivation: data.sellerMotivation,
        leadSource: data.leadSource,
        notes: data.notes,
      })
      .returning();

    // Trigger intelligence gathering in the background
    // We don't await this - it runs asynchronously
    gatherIntelligenceAsync(newLead!);

    return createSuccessResponse(newLead, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validationError(error.errors);
    }
    console.error('Error creating lead:', error);
    return ApiErrors.internalError('Failed to create lead');
  }
}

/**
 * Async function to gather intelligence and update lead
 */
async function gatherIntelligenceAsync(lead: typeof leads.$inferSelect) {
  try {
    const db = getDb();

    // Gather intelligence
    const intelligence = await gatherLeadIntelligence(lead);

    // Update lead with geocoded data if available
    if (intelligence.geocode) {
      await updateLeadWithGeocode(lead.id, intelligence.geocode);
    }

    // Save intelligence
    await saveLeadIntelligence(lead.id, intelligence);

    // Update lead status to "analyzed"
    await db
      .update(leads)
      .set({
        status: 'analyzed',
        analyzedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));
  } catch (error) {
    console.error('Error gathering intelligence for lead:', lead.id, error);

    // Update lead status to indicate analysis failed
    const db = getDb();
    await db
      .update(leads)
      .set({
        status: 'new', // Revert to new so user can retry
        updatedAt: new Date(),
      })
      .where(eq(leads.id, lead.id));
  }
}
