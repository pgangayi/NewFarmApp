import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';

interface SearchResult {
  id: string;
  type: 'animal' | 'crop' | 'task' | 'inventory' | 'finance' | 'field' | 'farm';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  score: number;
}

interface SearchOptions {
  types?: string[];
  limit?: number;
  fuzzy?: boolean;
  filters?: Record<string, unknown>;
}

const SEARCH_CONFIG = {
  minQueryLength: 2,
  debounceMs: 300,
  maxResults: 20,
  recentSearchesKey: 'farm:recentSearches',
};

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_CONFIG.recentSearchesKey);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    }
  }, []);

  const debouncedQuery = useDebounce(query, SEARCH_CONFIG.debounceMs);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < SEARCH_CONFIG.minQueryLength) {
        return [];
      }

      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=${SEARCH_CONFIG.maxResults}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results: SearchResult[] = await response.json();
      return results;
    },
    enabled: debouncedQuery.length >= SEARCH_CONFIG.minQueryLength,
    staleTime: 1000 * 60 * 5,
  });

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || !searchResults) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < (searchResults?.length || 0)) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    if (searchQuery.length < SEARCH_CONFIG.minQueryLength) return;

    const newRecentSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(
      0,
      10
    );

    setRecentSearches(newRecentSearches);
    localStorage.setItem(SEARCH_CONFIG.recentSearchesKey, JSON.stringify(newRecentSearches));
  };

  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setSelectedIndex(-1);

    const navigationMap: Record<string, string> = {
      animal: `/animals/${result.id}`,
      crop: `/crops/${result.id}`,
      task: `/tasks/${result.id}`,
      inventory: `/inventory/${result.id}`,
      finance: `/finance/entries/${result.id}`,
      field: `/fields/${result.id}`,
      farm: `/farms/${result.id}`,
    };

    const route = navigationMap[result.type];
    if (route) {
      window.location.href = route;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (event: React.FocusEvent) => {
    setTimeout(() => {
      if (!resultsRef.current?.contains(event.relatedTarget as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return {
    query,
    setQuery,
    searchResults: searchResults || [],
    recentSearches,
    isLoading,
    error,
    isOpen,
    selectedIndex,
    searchInputRef,
    resultsRef,
    handleKeyDown,
    handleSelect,
    handleFocus,
    handleBlur,
    clearSearch,
  };
}

export default useGlobalSearch;
export type { SearchResult, SearchOptions };
