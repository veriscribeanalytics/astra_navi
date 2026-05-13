'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, X, Check, Clock } from 'lucide-react';

export interface LocationResult {
    name: string;
    lat: number;
    lon: number;
    timezone: string;
}

interface LocationSearchProps {
    /** Currently selected location display name (for pre-fill) */
    value?: string;
    /** Called when a location is selected from the dropdown */
    onSelect: (location: LocationResult) => void;
    /** Called when the input text changes (for tracking form changes) */
    onChange?: (text: string) => void;
    /** Label for the input */
    label?: string;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the field is required */
    required?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Show the confirmed location badge */
    confirmedLocation?: LocationResult | null;
}

export default function LocationSearch({
    value,
    onSelect,
    onChange,
    label = 'Place of Birth',
    placeholder = 'Search city, e.g. Delhi',
    required = false,
    error,
    helperText,
    disabled = false,
    confirmedLocation,
}: LocationSearchProps) {
    const [query, setQuery] = useState(value || '');
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selected, setSelected] = useState<LocationResult | null>(confirmedLocation || null);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxId = 'birth-location-results';

    // Sync external value changes
    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        setSelected(confirmedLocation || null);
    }, [confirmedLocation]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchLocations = useCallback(async (searchQuery: string) => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/locations/search?q=${encodeURIComponent(searchQuery.trim())}`);
            if (!res.ok) {
                setResults([]);
                return;
            }
            const data = await res.json();
            setResults(data.results || []);
            setShowDropdown(true);
        } catch {
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        setSelected(null);
        onChange?.(newQuery);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchLocations(newQuery);
        }, 300);
    };

    const handleSelect = (location: LocationResult) => {
        setQuery(location.name);
        setSelected(location);
        setShowDropdown(false);
        setResults([]);
        onSelect(location);
    };

    const handleClear = () => {
        setQuery('');
        setSelected(null);
        setResults([]);
        setShowDropdown(false);
        onChange?.('');
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightIdx >= 0 && highlightIdx < results.length) {
                handleSelect(results[highlightIdx]);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    return (
        <div className="space-y-2 w-full text-left" ref={containerRef}>
            {label && (
                <label className="text-[10px] sm:text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body block">
                    {label}
                    {required && <span className="text-secondary ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-secondary/60">
                    <MapPin className="w-4 h-4" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (results.length > 0) setShowDropdown(true);
                        else if (query.trim().length >= 2 && !selected) searchLocations(query);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-invalid={error ? 'true' : 'false'}
                    className={`w-full bg-surface border transition-all outline-none text-primary placeholder:text-primary/40 font-body rounded-[20px] sm:rounded-[24px] pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 md:py-4 text-sm sm:text-base ${
                        error
                            ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500'
                            : selected
                                ? 'border-secondary/50 focus:ring-2 focus:ring-secondary/30 focus:border-secondary'
                                : 'border-outline-variant/30 focus:ring-2 focus:ring-secondary/30 focus:border-secondary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {query && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30 hover:text-secondary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                {isSearching && (
                    <div className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                    </div>
                )}

                {/* Dropdown */}
                {showDropdown && results.length > 0 && (
                    <div
                        id={listboxId}
                        role="listbox"
                        className="absolute z-50 top-full mt-2 w-full bg-surface border border-outline-variant/30 rounded-[16px] sm:rounded-[20px] shadow-lg overflow-hidden max-h-[240px] overflow-y-auto"
                    >
                        {results.map((loc, idx) => (
                            <button
                                key={`${loc.name}-${loc.lat}-${loc.lon}`}
                                type="button"
                                onClick={() => handleSelect(loc)}
                                onMouseEnter={() => setHighlightIdx(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                    idx === highlightIdx
                                        ? 'bg-secondary/10 text-foreground'
                                        : 'text-foreground/80 hover:bg-secondary/5'
                                } ${idx === results.length - 1 ? '' : 'border-b border-outline-variant/10'}`}
                            >
                                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{loc.name}</p>
                                    <p className="text-[10px] text-foreground/40 flex items-center gap-2">
                                        <span>{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</span>
                                        <Clock className="w-3 h-3" />
                                        <span>{loc.timezone}</span>
                                    </p>
                                </div>
                                {selected?.name === loc.name && (
                                    <Check className="w-4 h-4 text-secondary shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmed location badge */}
            {selected && !error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/20 text-[11px] text-secondary font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span className="truncate">{selected.name}</span>
                    <span className="text-secondary/60">({selected.lat.toFixed(2)}°, {selected.lon.toFixed(2)}°) · {selected.timezone}</span>
                </div>
            )}

            {error && (
                <p className="text-[10px] sm:text-xs text-red-500 ml-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {error}
                </p>
            )}
            {helperText && !error && !selected && (
                <p className="text-[10px] sm:text-xs text-on-surface-variant/60 ml-1">{helperText}</p>
            )}
        </div>
    );
}
