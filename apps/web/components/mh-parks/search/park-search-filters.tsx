'use client';

import type { MhPropertyType } from '@dealforge/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ParkSearchFiltersProps {
  county: string;
  city: string;
  propertyTypes: MhPropertyType[];
  lotCountMin: string;
  lotCountMax: string;
  search: string;
  onCountyChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPropertyTypesChange: (types: MhPropertyType[]) => void;
  onLotCountMinChange: (value: string) => void;
  onLotCountMaxChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

const PROPERTY_TYPES: { value: MhPropertyType; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'senior', label: 'Senior' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'unknown', label: 'Other' },
];

const COUNTIES = ['Bexar', 'Cameron', 'Hidalgo', 'Nueces', 'Travis'];

export function ParkSearchFilters({
  county,
  city,
  propertyTypes,
  lotCountMin,
  lotCountMax,
  search,
  onCountyChange,
  onCityChange,
  onPropertyTypesChange,
  onLotCountMinChange,
  onLotCountMaxChange,
  onSearchChange,
  onReset,
}: ParkSearchFiltersProps) {
  const handleTypeToggle = (type: MhPropertyType) => {
    if (propertyTypes.includes(type)) {
      onPropertyTypesChange(propertyTypes.filter((t) => t !== type));
    } else {
      onPropertyTypesChange([...propertyTypes, type]);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Search</Label>
          <Input
            placeholder="Name, city, or county..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">County</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={county}
            onChange={(e) => onCountyChange(e.target.value)}
          >
            <option value="">All Counties</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">City</Label>
          <Input
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Property Type</Label>
          <div className="space-y-1.5">
            {PROPERTY_TYPES.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={propertyTypes.includes(value)}
                  onChange={() => handleTypeToggle(value)}
                  className="rounded border-muted-foreground"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Lot Count Range</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={lotCountMin}
              onChange={(e) => onLotCountMinChange(e.target.value)}
              className="tabular-nums"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={lotCountMax}
              onChange={(e) => onLotCountMaxChange(e.target.value)}
              className="tabular-nums"
            />
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onReset} className="w-full">
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
