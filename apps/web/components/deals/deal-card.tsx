'use client';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeleteDeal } from '@/lib/hooks/use-deals';
import type { Deal } from '@dealforge/types';
import { formatDistanceToNow } from 'date-fns';
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const dealTypeLabels: Record<string, string> = {
  rental: 'Rental',
  brrrr: 'BRRRR',
  flip: 'Flip',
  house_hack: 'House Hack',
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
  const results = deal.results as Record<string, number> | null | undefined;
  const cashFlow = results?.monthlyCashFlow;
  const cocReturn = results?.cashOnCashReturn;
  const capRate = results?.capRate;

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast.success('Deal deleted successfully');
      setShowDeleteDialog(false);
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  const handleDuplicate = () => {
    toast.info('Duplicate feature coming soon');
  };

  const editUrl = `/analyze/${deal.type}?dealId=${deal.id}`;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg font-medium truncate">
              <Link href={editUrl} className="hover:underline">
                {deal.name}
              </Link>
            </CardTitle>
            {deal.address && (
              <CardDescription className="text-sm truncate">{deal.address}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={editUrl}>
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

          {results && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              {cashFlow !== undefined && (
                <div>
                  <p className="text-muted-foreground">Cash Flow</p>
                  <p className="font-semibold text-lg tabular-nums">
                    ${Math.round(cashFlow).toLocaleString()}/mo
                  </p>
                </div>
              )}
              {cocReturn !== undefined && (
                <div>
                  <p className="text-muted-foreground">CoC Return</p>
                  <p className="font-semibold text-lg tabular-nums">{cocReturn.toFixed(1)}%</p>
                </div>
              )}
              {capRate !== undefined && (
                <div>
                  <p className="text-muted-foreground">Cap Rate</p>
                  <p className="font-semibold text-lg tabular-nums">{capRate.toFixed(1)}%</p>
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
              Are you sure you want to delete &quot;{deal.name}&quot;? This action cannot be undone.
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
