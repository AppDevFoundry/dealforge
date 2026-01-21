'use client';

import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GeocoderResult {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

interface ParkMapSearchProps {
  onSelect: (lng: number, lat: number, zoom: number) => void;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Texas bounding box to bias results
const TEXAS_BBOX = '-106.65,25.84,-93.51,36.5';

export function ParkMapSearch({ onSelect }: ParkMapSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocoderResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (text: string) => {
    if (!text.trim() || !MAPBOX_TOKEN) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const encoded = encodeURIComponent(text.trim());
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&bbox=${TEXAS_BBOX}&limit=5&types=place,locality,neighborhood,address,poi`;
      const response = await fetch(url);
      const data = await response.json();
      setResults(
        (data.features || []).map(
          (f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          })
        )
      );
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => search(query), 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: GeocoderResult) => {
    setQuery(result.place_name);
    setIsOpen(false);
    onSelect(result.center[0], result.center[1], 12);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute top-4 right-4 z-10 w-72">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search location..."
          className="w-full rounded-md border bg-background pl-9 pr-8 py-2 text-sm shadow-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="mt-1 max-h-60 overflow-auto rounded-md border bg-background shadow-lg">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 truncate"
              >
                {result.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && isLoading && results.length === 0 && (
        <div className="mt-1 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground shadow-lg">
          Searching...
        </div>
      )}
    </div>
  );
}
