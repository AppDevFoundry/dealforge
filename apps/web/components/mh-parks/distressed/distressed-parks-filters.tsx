'use client';

import type { DistressedParksQuery, TexasCounty } from '@dealforge/types';
import { Filter, X } from 'lucide-react';
import { useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface DistressedParksFiltersProps {
  filters: Partial<DistressedParksQuery>;
  onFiltersChange: (filters: Partial<DistressedParksQuery>) => void;
  counties: TexasCounty[];
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: 'score', label: 'Distress Score' },
  { value: 'lienCount', label: 'Active Lien Count' },
  { value: 'taxOwed', label: 'Tax Owed' },
];

export function DistressedParksFilters({
  filters,
  onFiltersChange,
  counties,
  isLoading,
}: DistressedParksFiltersProps) {
  const handleFilterChange = useCallback(
    (key: keyof DistressedParksQuery, value: string | number | undefined) => {
      const newFilters = { ...filters };

      if (value === undefined || value === '' || value === 'all') {
        delete newFilters[key];
      } else {
        (newFilters as Record<string, unknown>)[key] = value;
      }

      // Reset to page 1 when filters change
      newFilters.page = 1;
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      page: 1,
      perPage: filters.perPage ?? 25,
      sortBy: 'score',
      sortOrder: 'desc',
      minScore: 20,
    });
  }, [filters.perPage, onFiltersChange]);

  const activeFilterCount = [
    filters.county,
    filters.minScore !== undefined && filters.minScore !== 20,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* County */}
        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Select
            value={filters.county ?? 'all'}
            onValueChange={(value) => handleFilterChange('county', value)}
            disabled={isLoading}
          >
            <SelectTrigger id="county">
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {counties.map((county) => (
                <SelectItem key={county.id} value={county.name}>
                  {county.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Score */}
        <div className="space-y-2">
          <Label htmlFor="minScore">Minimum Distress Score</Label>
          <div className="flex items-center gap-2">
            <Input
              id="minScore"
              type="number"
              min={0}
              max={100}
              value={filters.minScore ?? 20}
              onChange={(e) =>
                handleFilterChange('minScore', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={isLoading}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Higher scores indicate more distress signals
          </p>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select
            value={filters.sortBy ?? 'score'}
            onValueChange={(value) =>
              handleFilterChange('sortBy', value as DistressedParksQuery['sortBy'])
            }
            disabled={isLoading}
          >
            <SelectTrigger id="sortBy">
              <SelectValue placeholder="Distress Score" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Select
            value={filters.sortOrder ?? 'desc'}
            onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
            disabled={isLoading}
          >
            <SelectTrigger id="sortOrder">
              <SelectValue placeholder="Descending" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Highest First</SelectItem>
              <SelectItem value="asc">Lowest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="pt-2">
            <Label className="text-muted-foreground text-xs">Active Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.county && (
                <Badge variant="secondary" className="text-xs">
                  {filters.county}
                </Badge>
              )}
              {filters.minScore !== undefined && filters.minScore !== 20 && (
                <Badge variant="secondary" className="text-xs">
                  Score &ge; {filters.minScore}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
