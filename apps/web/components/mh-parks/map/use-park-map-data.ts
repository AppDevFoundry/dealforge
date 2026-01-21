'use client';

import { useMhCommunitiesForMap } from '@/lib/hooks/use-mh-parks';
import type { MapBounds } from '@dealforge/types';
import { useEffect, useRef, useState } from 'react';

export function useParkMapData() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data, isLoading } = useMhCommunitiesForMap(bounds);

  const updateBounds = (newBounds: MapBounds) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setBounds(newBounds);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    communities: data?.data ?? [],
    isLoading,
    updateBounds,
  };
}
