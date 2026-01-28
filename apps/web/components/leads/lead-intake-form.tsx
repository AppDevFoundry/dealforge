'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CreateLeadInput } from '@dealforge/types';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface LeadIntakeFormProps {
  onSubmit: (data: CreateLeadInput) => Promise<void>;
  isLoading?: boolean;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

export function LeadIntakeForm({ onSubmit, isLoading = false }: LeadIntakeFormProps) {
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<Partial<CreateLeadInput>>({
    features: [],
  });

  const fetchSuggestions = useCallback(async (query: string) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsFetchingSuggestions(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=US&types=address&limit=5&proximity=ip`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.features || []);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  const handleAddressChange = (value: string) => {
    setAddressInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSuggestionSelect = (feature: MapboxFeature) => {
    setAddressInput(feature.place_name);
    setSuggestions([]);

    const updates: Partial<CreateLeadInput> = {
      addressRaw: feature.place_name,
      latitude: feature.center[1],
      longitude: feature.center[0],
    };

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) updates.zipCode = ctx.text;
      else if (ctx.id.startsWith('district')) updates.county = ctx.text.replace(' County', '');
      else if (ctx.id.startsWith('place')) updates.city = ctx.text;
      else if (ctx.id.startsWith('region')) updates.state = ctx.text;
    }

    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      addressRaw: addressInput,
      features: form.features || [],
    } satisfies CreateLeadInput;
    await onSubmit(data);
  };

  const updateField = <K extends keyof CreateLeadInput>(key: K, value: CreateLeadInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Address with Autocomplete */}
      <div className="space-y-1.5">
        <Label htmlFor="address" className="required">
          Property Address
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="address"
            placeholder="122 County Rd 3052, Orange Grove, TX 78372"
            className="pl-9"
            value={addressInput}
            onChange={(e) => handleAddressChange(e.target.value)}
            autoComplete="off"
            required
          />
          {isFetchingSuggestions && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors truncate"
                onClick={() => handleSuggestionSelect(s)}
              >
                {s.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            value={form.propertyType || ''}
            onValueChange={(v) => updateField('propertyType', v as CreateLeadInput['propertyType'])}
          >
            <SelectTrigger id="propertyType">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufactured_home">Manufactured Home</SelectItem>
              <SelectItem value="mobile_home">Mobile Home</SelectItem>
              <SelectItem value="land_only">Land Only</SelectItem>
              <SelectItem value="improved_lot">Improved Lot</SelectItem>
              <SelectItem value="tiny_house">Tiny House</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="condition">Condition</Label>
          <Select
            value={form.condition || ''}
            onValueChange={(v) => updateField('condition', v as CreateLeadInput['condition'])}
          >
            <SelectTrigger id="condition">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="needs_work">Needs Work</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input
            id="yearBuilt"
            type="number"
            placeholder="2005"
            min={1950}
            max={2030}
            value={form.yearBuilt || ''}
            onChange={(e) => updateField('yearBuilt', Number(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="acreage">Acreage</Label>
          <Input
            id="acreage"
            type="number"
            step="0.01"
            placeholder="0.25"
            value={form.acreage || ''}
            onChange={(e) => updateField('acreage', Number(e.target.value) || undefined)}
          />
        </div>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="askingPrice">Asking Price ($)</Label>
          <Input
            id="askingPrice"
            type="number"
            placeholder="150000"
            value={form.askingPrice || ''}
            onChange={(e) => updateField('askingPrice', Number(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mortgageBalance">Mortgage Balance ($)</Label>
          <Input
            id="mortgageBalance"
            type="number"
            placeholder="85000"
            value={form.mortgageBalance || ''}
            onChange={(e) => updateField('mortgageBalance', Number(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="taxesOwed">Taxes Owed ($)</Label>
          <Input
            id="taxesOwed"
            type="number"
            placeholder="2400"
            value={form.taxesOwed || ''}
            onChange={(e) => updateField('taxesOwed', Number(e.target.value) || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimatedRepairs">Estimated Repairs ($)</Label>
          <Input
            id="estimatedRepairs"
            type="number"
            placeholder="10000"
            value={form.estimatedRepairs || ''}
            onChange={(e) => updateField('estimatedRepairs', Number(e.target.value) || undefined)}
          />
        </div>
      </div>

      {/* Seller Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sellerName">Seller Name</Label>
          <Input
            id="sellerName"
            placeholder="John Smith"
            value={form.sellerName || ''}
            onChange={(e) => updateField('sellerName', e.target.value || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sellerPhone">Phone</Label>
          <Input
            id="sellerPhone"
            placeholder="(555) 123-4567"
            value={form.sellerPhone || ''}
            onChange={(e) => updateField('sellerPhone', e.target.value || undefined)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sellerMotivation">Motivation</Label>
          <Input
            id="sellerMotivation"
            placeholder="Divorce, probate, etc."
            value={form.sellerMotivation || ''}
            onChange={(e) => updateField('sellerMotivation', e.target.value || undefined)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any additional details about this lead..."
          rows={3}
          value={form.notes || ''}
          onChange={(e) => updateField('notes', e.target.value || undefined)}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Intelligence gathering will start automatically after creation.
        </p>
        <Button type="submit" disabled={isLoading || !addressInput.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Creating Lead...
            </>
          ) : (
            'Create Lead'
          )}
        </Button>
      </div>
    </form>
  );
}
