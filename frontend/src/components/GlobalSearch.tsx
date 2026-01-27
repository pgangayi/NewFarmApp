import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Search,
  X,
  Clock,
  Filter,
  TrendingUp,
  Users,
  Sprout,
  Package,
  CheckSquare,
  DollarSign,
  MapPin,
  ArrowRight,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const POST_METHOD = 'POST';
const GET_METHOD = 'GET';
const CONTENT_TYPE_JSON = 'application/json';
const FILTER_ALL = 'all';

interface SearchResult {
  type: 'animal' | 'crop' | 'task' | 'inventory' | 'farm' | 'finance';
  id: string;
  name: string;
  title?: string;
  description?: string;
  species?: string;
  crop_type?: string;
  category?: string;
  supplier?: string;
  location?: string;
  priority?: string;
  status?: string;
  entry_type?: string;
  health_status?: string;
  growth_stage?: string;
  farm_id: string;
  created_at: string;
}

interface SearchSuggestion {
  type: 'recent_search' | 'entity' | 'suggestion';
  text: string;
  score: number;
}

interface SearchResults {
  animals: SearchResult[];
  crops: SearchResult[];
  tasks: SearchResult[];
  inventory: SearchResult[];
  farms: SearchResult[];
  finance: SearchResult[];
  total_results: number;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'animal':
      return <Users className="h-4 w-4 text-blue-500" />;
    case 'crop':
      return <Sprout className="h-4 w-4 text-green-500" />;
    case 'task':
      return <CheckSquare className="h-4 w-4 text-purple-500" />;
    case 'inventory':
      return <Package className="h-4 w-4 text-orange-500" />;
    case 'farm':
      return <MapPin className="h-4 w-4 text-red-500" />;
    case 'finance':
      return <DollarSign className="h-4 w-4 text-green-600" />;
    default:
      return <Search className="h-4 w-4 text-gray-500" />;
  }
};

const getTypeLabel = (type: string) => {
  return type.charAt(0).toUpperCase() + type.slice(1) + 's';
};

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
  currentFarmId?: number;
}

export function GlobalSearch({
  isOpen,
  onClose,
  onResultSelect,
  currentFarmId,
}: GlobalSearchProps) {
  const { getAuthHeaders } = useAuth();
  const { isConnected: isWebSocketConnected, lastMessage: wsMessage } = useWebSocket();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>(FILTER_ALL);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const API_SEARCH = '/api/search';

  // Get all results as flat array for navigation
  const getAllResults = useCallback((): SearchResult[] => {
    if (!results) return [];

    return [
      ...results.animals,
      ...results.crops,
      ...results.tasks,
      ...results.inventory,
      ...results.farms,
      ...results.finance,
    ];
  }, [results]);

  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      onResultSelect?.(result);
      onClose();
    },
    [onResultSelect, onClose]
  );

  const loadSuggestions = useCallback(async () => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(API_SEARCH, {
        method: POST_METHOD,
        headers: {
          'Content-Type': CONTENT_TYPE_JSON,
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: 'get_suggestions',
          data: { query },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data.suggestions);
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  }, [getAuthHeaders, query, API_SEARCH]);

  const loadRecentSearches = useCallback(async () => {
    try {
      const response = await fetch(API_SEARCH, {
        method: POST_METHOD,
        headers: {
          'Content-Type': CONTENT_TYPE_JSON,
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          action: 'get_recent_searches',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecentSearches(
          data.data.recent.map((search: { query: string }) => ({
            type: 'recent_search' as const,
            text: search.query,
            score: 0.5,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, [getAuthHeaders, API_SEARCH]);

  const performSearch = useCallback(
    async (searchQuery: string, filter: string = FILTER_ALL) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type: filter,
          ...(currentFarmId ? { farm_id: currentFarmId.toString() } : {}),
        });

        const response = await fetch(`${API_SEARCH}?${params}`, {
          method: GET_METHOD,
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const searchResults = await response.json();
        setResults(searchResults.data);

        // Save search to history
        await fetch(API_SEARCH, {
          method: POST_METHOD,
          headers: {
            'Content-Type': CONTENT_TYPE_JSON,
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action: 'save_search',
            data: { query: searchQuery, type: filter },
          }),
        });
      } catch (err) {
        const ERR_MSG = 'Search failed. Please try again.';
        setError(ERR_MSG);
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, currentFarmId, API_SEARCH]
  );

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const allResults = getAllResults();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : allResults.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && allResults[selectedIndex]) {
            handleResultSelect(allResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, getAllResults, onClose, handleResultSelect]);

  // WebSocket message handling for live search updates
  useEffect(() => {
    if (
      wsMessage?.type === 'search_results' &&
      typeof wsMessage.data === 'object' &&
      wsMessage.data &&
      'query' in wsMessage.data &&
      'results' in wsMessage.data &&
      wsMessage.data.query === query
    ) {
      setResults(wsMessage.data.results as SearchResults);
      setLoading(false);
    }
  }, [wsMessage, query]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
      performSearch(query, selectedFilter);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedFilter, performSearch]);

  // Load suggestions and recent searches
  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
      loadRecentSearches();
    }
  }, [isOpen, loadSuggestions, loadRecentSearches]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.length > 0) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      setQuery(suggestion.text);
      performSearch(suggestion.text, selectedFilter);
    },
    [performSearch, selectedFilter]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setSuggestions([]);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  const allResults = getAllResults();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Global Search
              {isWebSocketConnected && (
                <Badge variant="outline" className="text-xs">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                  Live
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search animals, crops, tasks, inventory..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'animals', 'crops', 'tasks', 'inventory', 'farms', 'finance'].map(filter => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange(filter)}
                className="text-xs"
              >
                {getTypeLabel(filter)}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin mr-2" />
              <span>Searching...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Results */}
          {!loading && !error && allResults.length > 0 && (
            <div className="space-y-4">
              {['animals', 'crops', 'tasks', 'inventory', 'farms', 'finance'].map(type => {
                const typeResults =
                  (results?.[type as keyof SearchResults] as SearchResult[]) || [];
                if (typeResults.length === 0) return null;

                return (
                  <div key={type}>
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      {getTypeIcon(type)}
                      {getTypeLabel(type)} ({typeResults.length})
                    </h3>
                    <div className="space-y-2">
                      {typeResults.map((result, _index) => (
                        <div
                          key={`${result.type}-${result.id}`}
                          role="button"
                          tabIndex={0}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedIndex === allResults.indexOf(result)
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => handleResultSelect(result)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleResultSelect(result);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(result.type)}
                                <h4 className="font-medium text-sm">
                                  {result.name || result.title}
                                </h4>
                                {result.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.priority}
                                  </Badge>
                                )}
                                {result.status && (
                                  <Badge
                                    variant={
                                      result.status === 'completed' ? 'default' : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {result.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                {result.description ||
                                  result.species ||
                                  result.crop_type ||
                                  result.category ||
                                  result.location}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && query && allResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          )}

          {/* Suggestions and Recent Searches */}
          {!loading && !query && (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Searches
                  </h3>
                  <div className="space-y-2">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        className="p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSuggestionClick(search)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSuggestionClick(search);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{search.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Searches */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular Searches
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Livestock',
                    'Crop rotation',
                    'Inventory',
                    'Tasks',
                    'Financial',
                    'Animals health',
                  ].map(term => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleSuggestionClick({ type: 'suggestion', text: term, score: 0.7 })
                      }
                      className="text-xs justify-start"
                    >
                      <Search className="h-3 w-3 mr-1" />
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Auto-complete Suggestions */}
          {!loading && query && suggestions.length > 0 && allResults.length === 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
              <div className="space-y-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    className="p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSuggestionClick(suggestion)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSuggestionClick(suggestion);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{suggestion.text}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {suggestion.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GlobalSearch;
