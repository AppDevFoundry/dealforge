'use client';

import type { MhParkSearchQuery, TexasCounty } from '@dealforge/types';
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

interface SearchFiltersProps {
  filters: Partial<MhParkSearchQuery>;
  onFiltersChange: (filters: Partial<MhParkSearchQuery>) => void;
  counties: TexasCounty[];
  isLoading?: boolean;
}

const PROPERTY_TYPES = [
  { value: 'all_ages', label: 'All Ages' },
  { value: 'senior_55+', label: '55+' },
  { value: 'family', label: 'Family' },
];

export function SearchFilters({
  filters,
  onFiltersChange,
  counties,
  isLoading,
}: SearchFiltersProps) {
  const handleFilterChange = useCallback(
    (key: keyof MhParkSearchQuery, value: string | number | undefined) => {
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
    onFiltersChange({ page: 1, perPage: filters.perPage ?? 20 });
  }, [filters.perPage, onFiltersChange]);

  const activeFilterCount = [
    filters.county,
    filters.city,
    filters.minLots,
    filters.maxLots,
    filters.propertyType,
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

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Filter by city..."
            value={filters.city ?? ''}
            onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
            disabled={isLoading}
          />
        </div>

        {/* Property Type */}
        <div className="space-y-2">
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            value={filters.propertyType ?? 'all'}
            onValueChange={(value) =>
              handleFilterChange(
                'propertyType',
                value as 'all_ages' | 'senior_55+' | 'family' | undefined
              )
            }
            disabled={isLoading}
          >
            <SelectTrigger id="propertyType">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PROPERTY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lot Count Range */}
        <div className="space-y-2">
          <Label>Lot Count</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minLots ?? ''}
              onChange={(e) =>
                handleFilterChange('minLots', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={isLoading}
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxLots ?? ''}
              onChange={(e) =>
                handleFilterChange('maxLots', e.target.value ? Number(e.target.value) : undefined)
              }
              disabled={isLoading}
            />
          </div>
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
              {filters.city && (
                <Badge variant="secondary" className="text-xs">
                  {filters.city}
                </Badge>
              )}
              {filters.propertyType && (
                <Badge variant="secondary" className="text-xs">
                  {PROPERTY_TYPES.find((t) => t.value === filters.propertyType)?.label}
                </Badge>
              )}
              {(filters.minLots || filters.maxLots) && (
                <Badge variant="secondary" className="text-xs">
                  {filters.minLots ?? 0}-{filters.maxLots ?? '...'} lots
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
