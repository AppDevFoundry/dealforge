'use client';

import { useEffect, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useAddressAutocomplete,
  type UseAddressAutocompleteOptions,
} from '@/lib/hooks/use-address-autocomplete';
import type { AddressSuggestion } from '@/lib/shared/address-autocomplete';

export interface AddressAutocompleteProps
  extends Omit<UseAddressAutocompleteOptions, 'onSelect'> {
  value?: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  error,
  minCharacters = 3,
  debounceMs = 300,
}: AddressAutocompleteProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    inputValue,
    setInputValue,
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    handleKeyDown,
    handleSelect: handleSelectInternal,
  } = useAddressAutocomplete({
    minCharacters,
    debounceMs,
    onSelect,
  });

  // Sync external value with internal state
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue, setInputValue]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    handleSelectInternal(suggestion);
    onChange(suggestion.placeName);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowSuggestions]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          id="address"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(className, error && 'border-destructive')}
          autoComplete="off"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls="address-suggestions"
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="address-suggestions"
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          <ul className="max-h-60 overflow-auto p-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={`suggestion-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={cn(
                  'flex cursor-pointer items-start gap-2 rounded-sm px-3 py-2 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  index === selectedIndex && 'bg-accent text-accent-foreground'
                )}
                onMouseDown={(e) => {
                  // Use onMouseDown instead of onClick to prevent input blur
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
                onMouseEnter={() => {
                  // Update selected index on hover for keyboard navigation sync
                  if (selectedIndex !== index) {
                    // Note: We're not updating selectedIndex on hover to avoid confusion
                    // with keyboard navigation. Users can use arrow keys for precise selection.
                  }
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate font-medium">{suggestion.addressText}</span>
                  {suggestion.placeText && (
                    <span className="truncate text-xs text-muted-foreground">
                      {suggestion.placeText}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSuggestions &&
        !isLoading &&
        inputValue.length >= minCharacters &&
        suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-center text-sm text-muted-foreground shadow-md">
            No addresses found
          </div>
        )}
    </div>
  );
}
