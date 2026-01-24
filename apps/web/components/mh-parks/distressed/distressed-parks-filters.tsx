'use client';

import type { DistressedParksQuery } from '@dealforge/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTexasCounties } from '@/lib/hooks/use-mh-parks';

interface DistressedParksFiltersProps {
  filters: Partial<DistressedParksQuery>;
  onFiltersChange: (filters: Partial<DistressedParksQuery>) => void;
}

export function DistressedParksFilters({ filters, onFiltersChange }: DistressedParksFiltersProps) {
  const { data: counties } = useTexasCounties();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="county-select">County</Label>
          <Select
            value={filters.county || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, county: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger id="county-select">
              <SelectValue placeholder="All counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counties</SelectItem>
              {counties?.map((county) => (
                <SelectItem key={county.id} value={county.name}>
                  {county.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-score">Min Score</Label>
          <Input
            id="min-score"
            type="number"
            min={0}
            max={100}
            value={filters.minScore ?? 20}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minScore: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-select">Sort By</Label>
          <Select
            value={filters.sortBy || 'score'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                sortBy: value as DistressedParksQuery['sortBy'],
              })
            }
          >
            <SelectTrigger id="sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Distress Score</SelectItem>
              <SelectItem value="lienCount">Lien Count</SelectItem>
              <SelectItem value="taxOwed">Tax Owed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="limit-select">Results</Label>
          <Select
            value={String(filters.limit || 25)}
            onValueChange={(value) => onFiltersChange({ ...filters, limit: Number(value) })}
          >
            <SelectTrigger id="limit-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
