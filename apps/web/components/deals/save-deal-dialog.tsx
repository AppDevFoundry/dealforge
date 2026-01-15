'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDeal, useUpdateDeal } from '@/lib/hooks/use-deals';
import type { DealType } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const SaveDealFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  address: z.string().max(500).optional(),
});

type SaveDealFormValues = z.infer<typeof SaveDealFormSchema>;

interface SaveDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealType: DealType;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  existingDealId?: string;
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
    } catch {
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
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDeal.isPending || updateDeal.isPending}>
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
