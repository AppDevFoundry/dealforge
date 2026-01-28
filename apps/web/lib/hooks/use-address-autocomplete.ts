'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchAddressSuggestions,
  type AddressSuggestion,
} from '@/lib/shared/address-autocomplete';

export interface UseAddressAutocompleteOptions {
  minCharacters?: number; // Minimum characters before triggering API call
  debounceMs?: number; // Debounce delay in milliseconds
  onSelect?: (suggestion: AddressSuggestion) => void;
}

export function useAddressAutocomplete(options?: UseAddressAutocompleteOptions) {
  const { minCharacters = 3, debounceMs = 300, onSelect } = options ?? {};

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce timer reference
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  // AbortController for cancelling in-flight requests
  const abortController = useRef<AbortController | null>(null);

  // Fetch suggestions with debouncing
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Cancel in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }

    // Don't fetch if below minimum characters
    if (inputValue.length < minCharacters) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    // Set loading state immediately
    setIsLoading(true);

    // Debounce the API call
    debounceTimer.current = setTimeout(() => {
      const controller = new AbortController();
      abortController.current = controller;

      fetchAddressSuggestions(inputValue, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setIsLoading(false);
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            console.error('Failed to fetch suggestions:', error);
            setSuggestions([]);
            setShowSuggestions(false);
            setIsLoading(false);
          }
        });
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [inputValue, minCharacters, debounceMs]);

  // Handle suggestion selection
  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      setInputValue(suggestion.placeName);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      onSelect?.(suggestion);
    },
    [onSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selected = suggestions[selectedIndex];
            if (selected) {
              handleSelect(selected);
            }
          }
          break;
        case 'Escape':
          event.preventDefault();
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSelect]
  );

  return {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    handleKeyDown,
    handleSelect,
  };
}
