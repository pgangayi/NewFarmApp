// Advanced filtering system for comprehensive data management
// Provides powerful filtering, sorting, and search capabilities across all farm data

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'not_empty'
  | 'is_true'
  | 'is_false'
  | 'after'
  | 'before'
  | 'on'
  | 'is_null'
  | 'is_not_null';

export type SortOrder = 'asc' | 'desc';

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
  label?: string;
  isActive: boolean;
}

export interface SortRule {
  field: string;
  order: SortOrder;
  priority: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterRule[];
  sorts: SortRule[];
  isDefault: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FilterState {
  filters: FilterRule[];
  sorts: SortRule[];
  searchQuery: string;
  groupBy: string | null;
  viewMode: 'table' | 'card' | 'grid';
  pageSize: number;
  currentPage: number;
}

const DEFAULT_PAGE_SIZE = 25;

const FIELD_TYPES = {
  text: [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'is_empty',
    'not_empty',
  ],
  number: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_equal',
    'less_equal',
    'between',
    'in',
    'not_in',
    'is_empty',
    'not_empty',
  ],
  date: ['after', 'before', 'on', 'between', 'is_empty', 'not_empty'],
  boolean: ['is_true', 'is_false', 'equals'],
  select: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'not_empty'],
  multiselect: ['contains', 'not_contains', 'in', 'not_in', 'is_empty', 'not_empty'],
};

const FIELD_LABELS: Record<string, string> = {
  // Common fields
  id: 'ID',
  name: 'Name',
  title: 'Title',
  description: 'Description',
  created_at: 'Created',
  updated_at: 'Updated',
  status: 'Status',

  // Animal fields
  species: 'Species',
  breed: 'Breed',
  age: 'Age',
  weight: 'Weight',
  health_status: 'Health Status',
  vaccination_status: 'Vaccination',
  last_health_check: 'Last Health Check',
  location: 'Location',

  // Crop fields
  crop_type: 'Crop Type',
  variety: 'Variety',
  planting_date: 'Planting Date',
  harvest_date: 'Harvest Date',
  yield: 'Yield',
  growth_stage: 'Growth Stage',
  field_id: 'Field',

  // Task fields
  priority: 'Priority',
  assignee: 'Assignee',
  due_date: 'Due Date',
  completed_at: 'Completed',
  category: 'Category',
  tags: 'Tags',

  // Inventory fields
  quantity: 'Quantity',
  unit: 'Unit',
  cost_per_unit: 'Cost per Unit',
  supplier: 'Supplier',
  expiration_date: 'Expiration',
  min_stock: 'Min Stock',

  // Weather fields
  temperature: 'Temperature',
  humidity: 'Humidity',
  rainfall: 'Rainfall',
  wind_speed: 'Wind Speed',
  condition: 'Condition',
};

export function useAdvancedFiltering(
  entityType: string,
  options?: {
    searchableFields?: string[];
    filterableFields?: string[];
    sortableFields?: string[];
    defaultSorts?: SortRule[];
    enableGrouping?: boolean;
    enableSearch?: boolean;
    enableSavedFilters?: boolean;
    pageSizes?: number[];
  }
) {
  const [state, setState] = useState<FilterState>({
    filters: [],
    sorts: options?.defaultSorts || [],
    searchQuery: '',
    groupBy: null,
    viewMode: 'table',
    pageSize: options?.pageSizes?.[0] || DEFAULT_PAGE_SIZE,
    currentPage: 1,
  });

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeSavedFilter, setActiveSavedFilter] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`farm:filters:${entityType}`);
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        setSavedFilters(filters);
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, [entityType]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(`farm:filters:${entityType}`, JSON.stringify(savedFilters));
  }, [savedFilters, entityType]);

  // Get field type
  const getFieldType = useCallback((field: string): keyof typeof FIELD_TYPES => {
    // This would typically come from a field schema
    // For now, infer from common field patterns
    if (field.includes('_date') || field === 'created_at' || field === 'updated_at') {
      return 'date';
    }
    if (field === 'status' || field === 'is_active' || field === 'completed') {
      return 'boolean';
    }
    if (field.includes('quantity') || field === 'age' || field === 'weight' || field === 'cost') {
      return 'number';
    }
    if (field === 'tags' || field.includes('multiselect')) {
      return 'multiselect';
    }
    if (
      field.includes('id') ||
      field === 'name' ||
      field.includes('description') ||
      field.includes('title')
    ) {
      return 'text';
    }
    return 'text'; // default
  }, []);

  // Get available operators for a field
  const getAvailableOperators = useCallback(
    (field: string) => {
      const fieldType = getFieldType(field);
      return FIELD_TYPES[fieldType] || FIELD_TYPES.text;
    },
    [getFieldType]
  );

  // Get field label
  const getFieldLabel = useCallback((field: string) => {
    return FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Add filter rule
  const addFilter = useCallback(
    (field: string, operator: FilterOperator, value: unknown = null) => {
      const newFilter: FilterRule = {
        id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        field,
        operator,
        value,
        label: `${getFieldLabel(field)} ${getOperatorLabel(operator)} ${formatValue(value)}`,
        isActive: true,
      };

      setState(prev => ({
        ...prev,
        filters: [...prev.filters, newFilter],
        currentPage: 1, // Reset to first page when filters change
      }));
    },
    [getFieldLabel]
  );

  // Update filter rule
  const updateFilter = useCallback(
    (filterId: string, updates: Partial<FilterRule>) => {
      setState(prev => ({
        ...prev,
        filters: prev.filters.map(filter =>
          filter.id === filterId
            ? {
                ...filter,
                ...updates,
                label:
                  updates.field || updates.operator || updates.value !== undefined
                    ? `${getFieldLabel(updates.field || filter.field)} ${getOperatorLabel(updates.operator || filter.operator)} ${formatValue(updates.value !== undefined ? updates.value : filter.value)}`
                    : filter.label,
              }
            : filter
        ),
        currentPage: 1,
      }));
    },
    [getFieldLabel]
  );

  // Remove filter rule
  const removeFilter = useCallback((filterId: string) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId),
      currentPage: 1,
    }));
  }, []);

  // Toggle filter active state
  const toggleFilter = useCallback((filterId: string) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.id === filterId ? { ...filter, isActive: !filter.isActive } : filter
      ),
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: [],
      currentPage: 1,
    }));
    setActiveSavedFilter(null);
  }, []);

  // Add sort rule
  const addSort = useCallback((field: string, order: SortOrder = 'asc') => {
    setState(prev => {
      const existingIndex = prev.sorts.findIndex(sort => sort.field === field);
      let newSorts;

      if (existingIndex !== -1) {
        // Update existing sort
        newSorts = prev.sorts.map((sort, index) =>
          index === existingIndex ? { ...sort, order } : sort
        );
      } else {
        // Add new sort
        newSorts = [...prev.sorts, { field, order, priority: prev.sorts.length }];
      }

      return { ...prev, sorts: newSorts, currentPage: 1 };
    });
  }, []);

  // Remove sort rule
  const removeSort = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      sorts: prev.sorts.filter(sort => sort.field !== field),
      currentPage: 1,
    }));
  }, []);

  // Toggle sort order
  const toggleSort = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      sorts: prev.sorts.map(sort =>
        sort.field === field
          ? { ...sort, order: sort.order === 'asc' ? 'desc' : ('asc' as SortOrder) }
          : sort
      ),
      currentPage: 1,
    }));
  }, []);

  // Update search query (with debounce)
  const updateSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query, currentPage: 1 }));
  }, []);

  // Set group by field
  const setGroupBy = useCallback((field: string | null) => {
    setState(prev => ({ ...prev, groupBy: field, currentPage: 1 }));
  }, []);

  // Update view mode
  const setViewMode = useCallback((mode: 'table' | 'card' | 'grid') => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  // Update page size
  const setPageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  }, []);

  // Update current page
  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: Math.max(1, page) }));
  }, []);

  // Save current filters
  const saveCurrentFilters = useCallback(
    (name: string, description?: string) => {
      const newSavedFilter: SavedFilter = {
        id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        filters: [...state.filters],
        sorts: [...state.sorts],
        isDefault: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      setSavedFilters(prev => [...prev, newSavedFilter]);
    },
    [state]
  );

  // Load saved filter
  const loadSavedFilter = useCallback(
    (filterId: string) => {
      const savedFilter = savedFilters.find(f => f.id === filterId);
      if (savedFilter) {
        setState(prev => ({
          ...prev,
          filters: [...savedFilter.filters],
          sorts: [...savedFilter.sorts],
          currentPage: 1,
        }));
        setActiveSavedFilter(filterId);
      }
    },
    [savedFilters]
  );

  // Delete saved filter
  const deleteSavedFilter = useCallback(
    (filterId: string) => {
      setSavedFilters(prev => prev.filter(f => f.id !== filterId));
      if (activeSavedFilter === filterId) {
        setActiveSavedFilter(null);
      }
    },
    [activeSavedFilter]
  );

  // Make saved filter default
  const setDefaultFilter = useCallback((filterId: string) => {
    setSavedFilters(prev =>
      prev.map(f => ({
        ...f,
        isDefault: f.id === filterId,
      }))
    );
  }, []);

  // Build API query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    // Add search query
    if (state.searchQuery) {
      params.set('search', state.searchQuery);
    }

    // Add active filters
    state.filters
      .filter(f => f.isActive)
      .forEach((filter, index) => {
        params.set(`filters[${index}][field]`, filter.field);
        params.set(`filters[${index}][operator]`, filter.operator);
        if (filter.value !== null && filter.value !== undefined) {
          params.set(`filters[${index}][value]`, JSON.stringify(filter.value));
        }
      });

    // Add sorts
    state.sorts.forEach((sort, index) => {
      params.set(`sorts[${index}][field]`, sort.field);
      params.set(`sorts[${index}][order]`, sort.order);
    });

    // Add pagination
    params.set('page', state.currentPage.toString());
    params.set('pageSize', state.pageSize.toString());

    // Add grouping
    if (state.groupBy) {
      params.set('groupBy', state.groupBy);
    }

    return params.toString();
  }, [state]);

  // Get operator label
  const getOperatorLabel = useCallback((operator: FilterOperator) => {
    const labels: Record<FilterOperator, string> = {
      equals: '=',
      not_equals: '≠',
      contains: 'contains',
      not_contains: 'not contains',
      starts_with: 'starts with',
      ends_with: 'ends with',
      greater_than: '>',
      less_than: '<',
      greater_equal: '≥',
      less_equal: '≤',
      between: 'between',
      in: 'in',
      not_in: 'not in',
      is_empty: 'is empty',
      not_empty: 'is not empty',
      is_true: 'is true',
      is_false: 'is false',
      after: 'after',
      before: 'before',
      on: 'on',
      is_null: 'is null',
      is_not_null: 'is not null',
    };
    return labels[operator] || operator;
  }, []);

  // Format value for display
  const formatValue = useCallback((value: unknown) => {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  }, []);

  // Get available fields for filtering
  const getAvailableFields = useCallback(() => {
    // This would typically come from a schema
    const commonFields = ['id', 'name', 'status', 'created_at', 'updated_at'];
    const entitySpecificFields = {
      animal: ['species', 'breed', 'age', 'weight', 'health_status', 'location'],
      crop: ['crop_type', 'variety', 'planting_date', 'harvest_date', 'yield', 'growth_stage'],
      task: ['priority', 'assignee', 'due_date', 'category', 'tags'],
      inventory: ['quantity', 'unit', 'cost_per_unit', 'supplier', 'min_stock'],
    };

    return [
      ...commonFields,
      ...(entitySpecificFields[entityType as keyof typeof entitySpecificFields] || []),
    ];
  }, [entityType]);

  // Memoized computed values
  const hasActiveFilters = useMemo(() => state.filters.some(f => f.isActive), [state.filters]);

  const hasActiveSorts = useMemo(() => state.sorts.length > 0, [state.sorts]);

  const hasActiveSearch = useMemo(() => state.searchQuery.length > 0, [state.searchQuery]);

  const isFilterStateEmpty = useMemo(
    () => !hasActiveFilters && !hasActiveSorts && !hasActiveSearch && !state.groupBy,
    [hasActiveFilters, hasActiveSorts, hasActiveSearch, state.groupBy]
  );

  return {
    // State
    state,
    savedFilters,
    activeSavedFilter,

    // Actions
    addFilter,
    updateFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
    addSort,
    removeSort,
    toggleSort,
    updateSearchQuery,
    setGroupBy,
    setViewMode,
    setPageSize,
    setCurrentPage,
    saveCurrentFilters,
    loadSavedFilter,
    deleteSavedFilter,
    setDefaultFilter,

    // Utilities
    buildQueryParams,
    getFieldType,
    getAvailableOperators,
    getFieldLabel,
    getOperatorLabel,
    formatValue,
    getAvailableFields,

    // Computed
    hasActiveFilters,
    hasActiveSorts,
    hasActiveSearch,
    isFilterStateEmpty,
  };
}

// Helper function to apply filters to data
export function applyAdvancedFilters<T>(
  data: T[],
  filters: FilterRule[],
  sorts: SortRule[],
  searchQuery: string,
  searchableFields: string[]
): T[] {
  let result = [...data];

  // Apply search query
  if (searchQuery && searchableFields.length > 0) {
    const query = searchQuery.toLowerCase();
    result = result.filter(item => {
      return searchableFields.some(field => {
        const value = (item as Record<string, unknown>)[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }

  // Apply filters
  const activeFilters = filters.filter(f => f.isActive);
  result = result.filter(item => {
    return activeFilters.every(filter => {
      const itemValue = (item as Record<string, unknown>)[filter.field];
      return evaluateFilter(itemValue, filter.operator, filter.value);
    });
  });

  // Apply sorts
  if (sorts.length > 0) {
    result.sort((a, b) => {
      for (const sort of sorts) {
        const aValue = (a as Record<string, unknown>)[sort.field];
        const bValue = (b as Record<string, unknown>)[sort.field];

        let comparison = 0;
        if (aValue !== null && aValue !== undefined && bValue !== null && bValue !== undefined) {
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;
        }

        if (comparison !== 0) {
          return sort.order === 'asc' ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  return result;
}

// Helper function to evaluate individual filters
function evaluateFilter(
  itemValue: unknown,
  operator: FilterOperator,
  filterValue: unknown
): boolean {
  if (itemValue === null || itemValue === undefined) {
    return operator === 'is_null' || operator === 'is_empty';
  }

  switch (operator) {
    case 'equals':
      return itemValue === filterValue;
    case 'not_equals':
      return itemValue !== filterValue;
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'not_contains':
      return !String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'starts_with':
      return String(itemValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
    case 'ends_with':
      return String(itemValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
    case 'greater_than':
      return Number(itemValue) > Number(filterValue);
    case 'less_than':
      return Number(itemValue) < Number(filterValue);
    case 'greater_equal':
      return Number(itemValue) >= Number(filterValue);
    case 'less_equal':
      return Number(itemValue) <= Number(filterValue);
    case 'between':
      const numValue = Number(itemValue);
      const [min, max] = Array.isArray(filterValue) ? filterValue : [filterValue, filterValue];
      return numValue >= Number(min) && numValue <= Number(max);
    case 'in':
      return Array.isArray(filterValue) ? filterValue.includes(itemValue) : false;
    case 'not_in':
      return Array.isArray(filterValue) ? !filterValue.includes(itemValue) : true;
    case 'is_empty':
      return itemValue === '' || itemValue === null || itemValue === undefined;
    case 'not_empty':
      return !(itemValue === '' || itemValue === null || itemValue === undefined);
    case 'is_true':
      return itemValue === true || itemValue === 'true' || itemValue === 1;
    case 'is_false':
      return itemValue === false || itemValue === 'false' || itemValue === 0;
    case 'after':
      return new Date(itemValue as any) > new Date(filterValue as any);
    case 'before':
      return new Date(itemValue as any) < new Date(filterValue as any);
    case 'on':
      const itemDate = new Date(itemValue as any).toDateString();
      const filterDate = new Date(filterValue as any).toDateString();
      return itemDate === filterDate;
    case 'is_null':
      return itemValue === null;
    case 'is_not_null':
      return itemValue !== null;
    default:
      return true;
  }
}

export default useAdvancedFiltering;
