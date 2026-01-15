I need to implement the save/load deals functionality for DealForge. This is a critical feature that allows users to save their deal analyses and return to them later.

## Current State

- ✅ Next.js 15 app with App Router is set up
- ✅ BetterAuth is configured with email authentication
- ✅ Drizzle ORM is set up with Neon database
- ✅ Rental Property Calculator is working (TypeScript implementation)
- ✅ Basic dashboard layout exists
- ✅ Testing framework is in place

## Goal

Implement full CRUD functionality for deals:
- Users can save calculator results as named deals
- Users can view a library of their saved deals
- Users can load a saved deal back into the calculator
- Users can update and delete deals

## 1. Database Schema

### Finalize the deals table in `packages/database/src/schema/deals.ts`:
```typescript
import { pgTable, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { createId } from '@paralleldrive/cuid2';

export const deals = pgTable('deals', {
  id: text('id').primaryKey().$defaultFn(() => `deal_${createId()}`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Deal metadata
  type: text('type').notNull(), // 'rental', 'brrrr', 'flip', 'multifamily', etc.
  name: text('name').notNull(),
  status: text('status').notNull().default('analyzing'), // 'draft', 'analyzing', 'archived'
  
  // Property info (optional)
  address: text('address'),
  
  // Calculator data stored as JSONB
  inputs: jsonb('inputs').notNull(), // The calculator inputs
  results: jsonb('results'), // Cached calculation results
  
  // Sharing
  isPublic: boolean('is_public').notNull().default(false),
  publicSlug: text('public_slug').unique(),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('deals_user_id_idx').on(table.userId),
  typeIdx: index('deals_type_idx').on(table.type),
  statusIdx: index('deals_status_idx').on(table.status),
  publicSlugIdx: index('deals_public_slug_idx').on(table.publicSlug),
}));

// TypeScript types derived from schema
export type Deal = typeof deals.$inferSelect;
export type NewDeal = typeof deals.$inferInsert;
```

### Create and run the migration:
```bash
pnpm db:generate  # Generate migration
pnpm db:migrate   # Run migration
```

## 2. Shared Types

### Update `packages/types/src/deals.ts`:
```typescript
import { z } from 'zod';

// Deal status enum
export const DealStatus = z.enum(['draft', 'analyzing', 'archived']);
export type DealStatus = z.infer<typeof DealStatus>;

// Deal type enum
export const DealType = z.enum(['rental', 'brrrr', 'flip', 'multifamily', 'commercial', 'syndication']);
export type DealType = z.infer<typeof DealType>;

// Base deal schema for API responses
export const DealSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: DealType,
  name: z.string().min(1).max(100),
  status: DealStatus,
  address: z.string().nullable(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).nullable(),
  isPublic: z.boolean(),
  publicSlug: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Deal = z.infer<typeof DealSchema>;

// Create deal request
export const CreateDealSchema = z.object({
  type: DealType,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  address: z.string().optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
});
export type CreateDealInput = z.infer<typeof CreateDealSchema>;

// Update deal request
export const UpdateDealSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: DealStatus.optional(),
  address: z.string().nullable().optional(),
  inputs: z.record(z.unknown()).optional(),
  results: z.record(z.unknown()).nullable().optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;

// List deals query params
export const ListDealsQuerySchema = z.object({
  type: DealType.optional(),
  status: DealStatus.optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListDealsQuery = z.infer<typeof ListDealsQuerySchema>;
```

## 3. API Routes

### Create the deals API routes in `apps/web/app/api/v1/deals/`:

#### `route.ts` (List & Create)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@dealforge/database';
import { deals } from '@dealforge/database/schema';
import { eq, desc, asc, and, count } from 'drizzle-orm';
import { CreateDealSchema, ListDealsQuerySchema } from '@dealforge/types';
import { headers } from 'next/headers';

// GET /api/v1/deals - List user's deals
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = ListDealsQuerySchema.parse(Object.fromEntries(searchParams));

    // Build where clause
    const whereConditions = [eq(deals.userId, session.user.id)];
    if (query.type) whereConditions.push(eq(deals.type, query.type));
    if (query.status) whereConditions.push(eq(deals.status, query.status));

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(deals)
      .where(and(...whereConditions));

    // Get paginated results
    const orderBy = query.sortOrder === 'asc' 
      ? asc(deals[query.sortBy]) 
      : desc(deals[query.sortBy]);

    const results = await db
      .select()
      .from(deals)
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        pagination: {
          page: query.page,
          perPage: query.perPage,
          total,
          totalPages: Math.ceil(total / query.perPage),
        },
      },
    });
  } catch (error) {
    console.error('Error listing deals:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list deals' } },
      { status: 500 }
    );
  }
}

// POST /api/v1/deals - Create a new deal
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = CreateDealSchema.parse(body);

    const [newDeal] = await db
      .insert(deals)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        name: validatedData.name,
        address: validatedData.address,
        inputs: validatedData.inputs,
        results: validatedData.results ?? null,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: newDeal },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input',
            details: error.errors,
          } 
        },
        { status: 400 }
      );
    }
    console.error('Error creating deal:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create deal' } },
      { status: 500 }
    );
  }
}
```

#### `[id]/route.ts` (Get, Update, Delete)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { db } from '@dealforge/database';
import { deals } from '@dealforge/database/schema';
import { eq, and } from 'drizzle-orm';
import { UpdateDealSchema } from '@dealforge/types';
import { headers } from 'next/headers';
import { z } from 'zod';

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/deals/:id - Get a single deal
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const [deal] = await db
      .select()
      .from(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .limit(1);

    if (!deal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch deal' } },
      { status: 500 }
    );
  }
}

// PUT /api/v1/deals/:id - Update a deal
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Verify ownership
    const [existingDeal] = await db
      .select()
      .from(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .limit(1);

    if (!existingDeal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateDealSchema.parse(body);

    const [updatedDeal] = await db
      .update(deals)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid input',
            details: error.errors,
          } 
        },
        { status: 400 }
      );
    }
    console.error('Error updating deal:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update deal' } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/deals/:id - Delete a deal
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Verify ownership and delete
    const [deletedDeal] = await db
      .delete(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .returning();

    if (!deletedDeal) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: { id: deletedDeal.id, deleted: true } 
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete deal' } },
      { status: 500 }
    );
  }
}
```

## 4. React Query Hooks

### Create `apps/web/lib/hooks/use-deals.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Deal, CreateDealInput, UpdateDealInput, ListDealsQuery } from '@dealforge/types';

// API response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

// Fetch helpers
async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  
  return data;
}

// Query keys
export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (params: Partial<ListDealsQuery>) => [...dealKeys.lists(), params] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// List deals hook
export function useDeals(params: Partial<ListDealsQuery> = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) searchParams.set(key, String(value));
  });

  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => fetchApi<Deal[]>(`/api/v1/deals?${searchParams}`),
  });
}

// Get single deal hook
export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: dealKeys.detail(id!),
    queryFn: () => fetchApi<Deal>(`/api/v1/deals/${id}`),
    enabled: !!id,
  });
}

// Create deal mutation
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealInput) =>
      fetchApi<Deal>('/api/v1/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

// Update deal mutation
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealInput }) =>
      fetchApi<Deal>(`/api/v1/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
    },
  });
}

// Delete deal mutation
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ id: string; deleted: boolean }>(`/api/v1/deals/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}
```

## 5. UI Components

### Save Deal Dialog (`apps/web/components/deals/SaveDealDialog.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDeal, useUpdateDeal } from '@/lib/hooks/use-deals';
import { toast } from 'sonner';
import type { DealType } from '@dealforge/types';

const SaveDealFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().optional(),
});

type SaveDealFormValues = z.infer<typeof SaveDealFormSchema>;

interface SaveDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealType: DealType;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  existingDealId?: string; // If provided, update instead of create
  defaultValues?: {
    name?: string;
    address?: string;
  };
  onSuccess?: (dealId: string) => void;
}

export function SaveDealDialog({
  open,
  onOpenChange,
  dealType,
  inputs,
  results,
  existingDealId,
  defaultValues,
  onSuccess,
}: SaveDealDialogProps) {
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const isUpdating = !!existingDealId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SaveDealFormValues>({
    resolver: zodResolver(SaveDealFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      address: defaultValues?.address || '',
    },
  });

  const onSubmit = async (data: SaveDealFormValues) => {
    try {
      if (isUpdating) {
        const result = await updateDeal.mutateAsync({
          id: existingDealId,
          data: {
            name: data.name,
            address: data.address || null,
            inputs,
            results,
          },
        });
        toast.success('Deal updated successfully');
        onSuccess?.(result.data.id);
      } else {
        const result = await createDeal.mutateAsync({
          type: dealType,
          name: data.name,
          address: data.address,
          inputs,
          results,
        });
        toast.success('Deal saved successfully');
        onSuccess?.(result.data.id);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(isUpdating ? 'Failed to update deal' : 'Failed to save deal');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isUpdating ? 'Update Deal' : 'Save Deal'}</DialogTitle>
            <DialogDescription>
              {isUpdating
                ? 'Update the details for this deal analysis.'
                : 'Give your deal analysis a name so you can find it later.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Deal Name *</Label>
              <Input
                id="name"
                placeholder="e.g., 123 Main St Rental Analysis"
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Property Address (optional)</Label>
              <Textarea
                id="address"
                placeholder="e.g., 123 Main St, Austin, TX 78701"
                rows={2}
                {...register('address')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createDeal.isPending || updateDeal.isPending}
            >
              {createDeal.isPending || updateDeal.isPending
                ? 'Saving...'
                : isUpdating
                  ? 'Update'
                  : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Deal Card Component (`apps/web/components/deals/DealCard.tsx`)
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Copy } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeleteDeal } from '@/lib/hooks/use-deals';
import { toast } from 'sonner';
import type { Deal } from '@dealforge/types';

const dealTypeLabels: Record<string, string> = {
  rental: 'Rental',
  brrrr: 'BRRRR',
  flip: 'Flip',
  multifamily: 'Multi-family',
  commercial: 'Commercial',
  syndication: 'Syndication',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  analyzing: 'bg-blue-500',
  archived: 'bg-amber-500',
};

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteDeal = useDeleteDeal();

  // Extract key metrics from results for display
  const cashFlow = deal.results?.monthlyCashFlow as number | undefined;
  const cocReturn = deal.results?.cashOnCashReturn as number | undefined;
  const capRate = deal.results?.capRate as number | undefined;

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast.success('Deal deleted successfully');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate functionality
    toast.info('Duplicate feature coming soon');
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-medium">
              <Link
                href={`/analyze/${deal.type}?dealId=${deal.id}`}
                className="hover:underline"
              >
                {deal.name}
              </Link>
            </CardTitle>
            {deal.address && (
              <CardDescription className="text-sm">
                {deal.address}
              </CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/analyze/${deal.type}?dealId=${deal.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary">{dealTypeLabels[deal.type] || deal.type}</Badge>
            <Badge className={statusColors[deal.status]}>{deal.status}</Badge>
          </div>

          {deal.results && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              {cashFlow !== undefined && (
                <div>
                  <p className="text-muted-foreground">Cash Flow</p>
                  <p className="font-semibold text-lg">
                    ${cashFlow.toLocaleString()}/mo
                  </p>
                </div>
              )}
              {cocReturn !== undefined && (
                <div>
                  <p className="text-muted-foreground">CoC Return</p>
                  <p className="font-semibold text-lg">{cocReturn.toFixed(2)}%</p>
                </div>
              )}
              {capRate !== undefined && (
                <div>
                  <p className="text-muted-foreground">Cap Rate</p>
                  <p className="font-semibold text-lg">{capRate.toFixed(2)}%</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Updated {formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deal.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDeal.isPending}
            >
              {deleteDeal.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

### Deals Library Page (`apps/web/app/(dashboard)/deals/page.tsx`)
```typescript
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DealCard } from '@/components/deals/DealCard';
import { useDeals } from '@/lib/hooks/use-deals';
import { Skeleton } from '@/components/ui/skeleton';
import type { DealType, DealStatus } from '@dealforge/types';

export default function DealsPage() {
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<DealType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');

  const { data, isLoading, error } = useDeals({
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    perPage: 20,
  });

  const deals = data?.data || [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deal Library</h1>
          <p className="text-muted-foreground">
            Manage and review your saved deal analyses
          </p>
        </div>
        <Button asChild>
          <Link href="/analyze/rental">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            className="pl-9"
            // TODO: Implement search
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as DealType | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Deal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rental">Rental</SelectItem>
            <SelectItem value="brrrr">BRRRR</SelectItem>
            <SelectItem value="flip">Flip</SelectItem>
            <SelectItem value="multifamily">Multi-family</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as DealStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load deals</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium">No deals yet</h3>
          <p className="text-muted-foreground mt-1">
            Start by creating your first deal analysis
          </p>
          <Button asChild className="mt-4">
            <Link href="/analyze/rental">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {/* TODO: Implement pagination controls */}
              <p className="text-sm text-muted-foreground">
                Showing {deals.length} of {pagination.total} deals
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

## 6. Calculator Integration

### Update the rental calculator page to support save/load

Update `apps/web/app/(dashboard)/analyze/rental/page.tsx`:
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RentalCalculatorForm } from '@/components/calculators/RentalCalculatorForm';
import { RentalResults } from '@/components/calculators/RentalResults';
import { SaveDealDialog } from '@/components/deals/SaveDealDialog';
import { useDeal } from '@/lib/hooks/use-deals';
import { calculateRental } from '@/lib/calculations/rental';
import type { RentalInputs, RentalResults as RentalResultsType } from '@dealforge/types';
import { toast } from 'sonner';

export default function RentalCalculatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');

  // Load existing deal if dealId is present
  const { data: existingDeal, isLoading: isLoadingDeal } = useDeal(dealId || undefined);

  const [inputs, setInputs] = useState<RentalInputs | null>(null);
  const [results, setResults] = useState<RentalResultsType | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load existing deal data into form
  useEffect(() => {
    if (existingDeal?.data) {
      const deal = existingDeal.data;
      setInputs(deal.inputs as RentalInputs);
      if (deal.results) {
        setResults(deal.results as RentalResultsType);
      }
    }
  }, [existingDeal]);

  const handleCalculate = (newInputs: RentalInputs) => {
    setInputs(newInputs);
    const calculationResults = calculateRental(newInputs);
    setResults(calculationResults);
    setHasUnsavedChanges(true);
  };

  const handleSaveSuccess = (savedDealId: string) => {
    setHasUnsavedChanges(false);
    // Update URL to include dealId if this was a new save
    if (!dealId) {
      router.replace(`/analyze/rental?dealId=${savedDealId}`);
    }
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (dealId && isLoadingDeal) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-[400px] bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {existingDeal?.data?.name || 'Rental Property Calculator'}
          </h1>
          <p className="text-muted-foreground">
            Analyze potential rental property investments
          </p>
        </div>
        {results && (
          <Button onClick={() => setShowSaveDialog(true)}>
            <Save className="mr-2 h-4 w-4" />
            {dealId ? 'Update Deal' : 'Save Deal'}
          </Button>
        )}
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="text-sm text-amber-600 dark:text-amber-400">
          You have unsaved changes
        </div>
      )}

      {/* Calculator */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RentalCalculatorForm
          defaultValues={inputs || undefined}
          onCalculate={handleCalculate}
        />
        {results && <RentalResults results={results} />}
      </div>

      {/* Save Dialog */}
      {inputs && results && (
        <SaveDealDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          dealType="rental"
          inputs={inputs}
          results={results}
          existingDealId={dealId || undefined}
          defaultValues={{
            name: existingDeal?.data?.name,
            address: existingDeal?.data?.address || undefined,
          }}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
```

## 7. Update Navigation

Add a link to the deals page in your dashboard sidebar/navigation:
```typescript
// In your navigation component, add:
<NavLink href="/deals" icon={FolderOpen}>
  Deal Library
</NavLink>
```

## 8. Testing

### Add tests for the deals functionality

Create `apps/web/__tests__/integration/deals-api.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../utils/msw/server';
import { http, HttpResponse } from 'msw';

describe('Deals API', () => {
  describe('GET /api/v1/deals', () => {
    it('should return paginated deals', async () => {
      server.use(
        http.get('/api/v1/deals', () => {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 'deal_1', name: 'Test Deal 1', type: 'rental' },
              { id: 'deal_2', name: 'Test Deal 2', type: 'brrrr' },
            ],
            meta: { pagination: { page: 1, perPage: 20, total: 2, totalPages: 1 } },
          });
        })
      );

      const response = await fetch('/api/v1/deals');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.meta.pagination.total).toBe(2);
    });
  });

  describe('POST /api/v1/deals', () => {
    it('should create a new deal', async () => {
      const newDeal = {
        type: 'rental',
        name: 'New Test Property',
        inputs: { purchasePrice: 200000 },
      };

      const response = await fetch('/api/v1/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.name).toBe('New Test Property');
    });
  });
});
```

## Summary

After implementation, users will be able to:

1. ✅ Save calculator results with a name and optional address
2. ✅ View all saved deals in the Deal Library
3. ✅ Filter deals by type and status
4. ✅ Load a saved deal back into the calculator for editing
5. ✅ Update existing deals with new calculations
6. ✅ Delete deals they no longer need
7. ✅ See unsaved changes warning before leaving

## Files to Create/Modify

- [ ] `packages/database/src/schema/deals.ts` - Finalize schema
- [ ] `packages/types/src/deals.ts` - Shared types
- [ ] `apps/web/app/api/v1/deals/route.ts` - List & Create endpoints
- [ ] `apps/web/app/api/v1/deals/[id]/route.ts` - Get, Update, Delete endpoints
- [ ] `apps/web/lib/hooks/use-deals.ts` - React Query hooks
- [ ] `apps/web/components/deals/SaveDealDialog.tsx` - Save modal
- [ ] `apps/web/components/deals/DealCard.tsx` - Deal display card
- [ ] `apps/web/app/(dashboard)/deals/page.tsx` - Deal Library page
- [ ] Update `apps/web/app/(dashboard)/analyze/rental/page.tsx` - Add save/load
- [ ] Update navigation to include Deal Library link
- [ ] Add MSW handlers for testing
- [ ] Run database migration