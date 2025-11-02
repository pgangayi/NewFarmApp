# Farmers Boot - Architecture Alignment Plan

## Current State Assessment

### ✅ Strengths
1. **Frontend**: React 18 + TypeScript, Vite, React Query, Tailwind CSS, Lucide Icons
2. **State Management**: React Query established, useMutation patterns implemented
3. **API Layer**: Cloudflare Pages Functions with modular structure
4. **Database**: Supabase with complete schema
5. **UI/UX**: Professional components (modals, search, filters, error states, animations)
6. **Pages**: FarmsPage, InventoryPage have production-quality patterns

### ⚠️ Misalignments Identified

#### 1. **API Endpoint Organization**
**Current State**: Mixed patterns
- Some endpoints: `{resource}.js` (farms.js, crops.js)
- Enhanced versions: `{resource}-enhanced.js` (farms-enhanced.js, crops-enhanced.js)
- Collections with nested routes: `{collection}/{resource}.js` (finance/entries.js)

**Issue**: Unclear which endpoints to use, duplicate code paths

**Solution**:
- Keep `-enhanced.js` versions (they're production-ready)
- Remove base versions or mark as deprecated
- Standardize on nested collection structure

#### 2. **Frontend API Client Abstraction**
**Current State**: Direct `fetch()` calls in components
- Each page writes its own API logic
- No centralized error handling
- No type-safe API contracts

**Solution**:
- Create `src/lib/api/` with typed client
- Centralized request/response interceptors
- Single source of truth for API routes

#### 3. **Hook Organization**
**Current State**: Mixed in `src/hooks/`
- Authentication: `useAuth()`
- Theme: `useTheme()`
- Farm context: `useFarm()`
- Offline queue: `useOfflineQueue()`

**Issue**: No clear separation between hooks and stores

**Solution**:
- `src/hooks/` → UI/Component hooks only (useAsync, useDebounce, etc.)
- `src/stores/` → Global state (auth, farm, offline)
- Custom hooks per domain: `src/hooks/useInventory.ts`, `src/hooks/useCrops.ts`

#### 4. **Store Architecture**
**Current State**: Partial Zustand usage
- File: `src/stores/offlineQueueStore.ts`
- Others may use Context or Redux patterns

**Solution**:
- Consolidate to Zustand for all global state
- Create stores per domain: authStore, farmStore, uiStore, offlineStore
- Clear separation of concerns

#### 5. **Error Handling**
**Current State**: Component-level error states
- Each page handles errors individually
- No global error boundary
- No centralized logging

**Solution**:
- Global error boundary with Sentry integration
- Error interceptor in API client
- Standard error response format

#### 6. **Type Safety**
**Current State**: Inconsistent interfaces
- Types defined in page components
- No shared type definitions
- API response types not validated

**Solution**:
- Create `src/types/` directory
- Define `entities.ts`, `api.ts`, `forms.ts`
- Use Zod for runtime validation

#### 7. **Code Organization by Domain**
**Current State**: File-type based
```
src/
  pages/
  components/
  hooks/
  stores/
  lib/
```

**Issue**: Hard to find all code related to a feature (inventory, crops, etc.)

**Solution**: Consider domain-based organization:
```
src/
  features/
    inventory/
      pages/
      components/
      hooks/
      types/
      api.ts
    crops/
      pages/
      components/
      hooks/
      types/
      api.ts
    auth/
    farms/
```

#### 8. **Backend API Consistency**
**Current State**: Multiple naming patterns
- `GET /api/farms` - simple list
- `GET /api/inventory-enhanced` - enhanced features
- `POST /api/crops-main` - main crop operations
- Some endpoints use RESTful patterns, others use custom routes

**Solution**:
- Standardize all to use `-enhanced` or remove suffix
- Use consistent HTTP method patterns
- Create API documentation (OpenAPI/Swagger)

#### 9. **Environment Configuration**
**Current State**: Likely scattered env vars
- No centralized config
- Hardcoded API endpoints
- No config validation

**Solution**:
- Create `src/config/env.ts` with Zod validation
- Export typed config object
- Build-time and runtime separation

#### 10. **Testing Architecture**
**Current State**: E2E tests present
- `frontend/e2e/treatment-flow.spec.ts`
- No visible unit tests for hooks/utils
- No component tests

**Solution**:
- Component tests with Vitest + React Testing Library
- Hook tests with @testing-library/react
- Integration tests for API client
- E2E tests for critical flows

---

## Alignment Implementation Roadmap

### Phase 1: Foundation (1-2 hours)
- [ ] Create API client abstraction (`src/lib/api/client.ts`)
- [ ] Create centralized types (`src/types/`)
- [ ] Create environment config (`src/config/env.ts`)
- [ ] Create error boundary component

### Phase 2: Consolidate State (1-2 hours)
- [ ] Create Zustand stores (`src/stores/` consolidated)
- [ ] Create domain-specific hooks
- [ ] Move API logic to hooks/services

### Phase 3: Backend Cleanup (1 hour)
- [ ] Standardize API endpoint naming
- [ ] Create API middleware utilities
- [ ] Document endpoint contracts

### Phase 4: Refactor Pages (2-3 hours)
- [ ] Refactor FarmsPage to use new patterns
- [ ] Refactor InventoryPage to use new patterns
- [ ] Refactor remaining pages

### Phase 5: Testing (1-2 hours)
- [ ] Add hook tests
- [ ] Add component tests
- [ ] Update E2E tests

---

## Detailed Implementation

### 1. API Client Abstraction

**File**: `src/lib/api/client.ts`
```typescript
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../types/api';

export class ApiClient {
  constructor(private getAuthHeaders: () => Record<string, string>) {}

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    // Centralized fetch with auth, error handling, retries
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  put<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export function useApiClient(): ApiClient {
  const { getAuthHeaders } = useAuth();
  return new ApiClient(getAuthHeaders);
}
```

### 2. Centralized Types

**File**: `src/types/entities.ts`
```typescript
export interface Farm {
  id: string;
  name: string;
  location: string;
  area_hectares?: number;
  owner_id: string;
  created_at: string;
  updated_at?: string;
}

export interface InventoryItem {
  id: string;
  farm_id: string;
  name: string;
  category: string;
  sku?: string;
  qty: number;
  unit: string;
  reorder_threshold?: number;
  current_cost_per_unit?: number;
  stock_status?: 'critical' | 'low' | 'normal';
}

// ... more entities
```

**File**: `src/types/api.ts`
```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 3. Domain-Specific API Hooks

**File**: `src/hooks/useInventory.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../lib/api/client';
import { InventoryItem } from '../types/entities';
import { useFarm } from './useFarm';

export function useInventory() {
  const { currentFarm } = useFarm();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['inventory', currentFarm?.id],
    queryFn: () => apiClient.get<InventoryItem[]>('/api/inventory-enhanced'),
    enabled: !!currentFarm?.id,
    staleTime: 30000
  });

  const createItemMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      apiClient.post<InventoryItem>('/api/inventory-enhanced', {
        farm_id: currentFarm?.id,
        ...data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...data }: InventoryItem & { id: string }) =>
      apiClient.put<InventoryItem>(`/api/inventory-enhanced`, { id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/inventory-enhanced?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  return {
    items,
    isLoading,
    error,
    refetch,
    createItemMutation,
    updateItemMutation,
    deleteItemMutation
  };
}
```

### 4. Consolidated Zustand Stores

**File**: `src/stores/index.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null })
}));

// Farm Store
export const useFarmStore = create<FarmState>((set) => ({
  currentFarm: null,
  farms: [],
  setCurrentFarm: (farm) => set({ currentFarm: farm }),
  setFarms: (farms) => set({ farms })
}));

// UI Store
export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}));

// Offline Queue Store
export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      queue: [],
      addOperation: (op) => set((state) => ({
        queue: [...state.queue, op]
      })),
      removeOperation: (id) => set((state) => ({
        queue: state.queue.filter((op) => op.id !== id)
      }))
    }),
    { name: 'offline-queue' }
  )
);
```

### 5. Backend API Standardization

**Naming Convention**:
```
All current "-enhanced" endpoints become the standard
Remove base versions or deprecate with redirects

Pattern:
GET    /api/{resource}           - List all
POST   /api/{resource}           - Create
GET    /api/{resource}/:id       - Get one
PUT    /api/{resource}/:id       - Update
DELETE /api/{resource}/:id       - Delete

Nested:
GET    /api/{parent}/{resource}  - List filtered by parent
```

**Middleware Utility**: `functions/api/_middleware.ts`
```typescript
export function createAuthMiddleware(context) {
  // Extract and validate JWT
  // Attach user to context
  // Return next() or error
}

export function createErrorMiddleware(context) {
  // Wrap handler in try-catch
  // Format errors consistently
  // Log to Sentry
}

export function createRateLimitMiddleware(context) {
  // Check rate limits
  // Return 429 if exceeded
}
```

### 6. Error Boundary

**File**: `src/components/ErrorBoundary.tsx`
```typescript
import { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // Log to Sentry
    console.error('Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 7. Environment Configuration

**File**: `src/config/env.ts`
```typescript
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('http://localhost:8000'),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string(),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_MAPBOX_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(import.meta.env);

export const apiEndpoints = {
  farms: '/api/farms',
  inventory: '/api/inventory-enhanced',
  crops: '/api/crops-main',
  animals: '/api/animals-enhanced',
  fields: '/api/fields-enhanced',
  tasks: '/api/tasks-enhanced',
  finance: '/api/finance-enhanced',
} as const;
```

---

## Benefits After Alignment

| Aspect | Before | After |
|--------|--------|-------|
| **API Calls** | Scattered in components | Centralized in hooks |
| **Type Safety** | Local interfaces | Shared, validated types |
| **Error Handling** | Per-component | Global with Sentry |
| **State Management** | Mixed patterns | Unified Zustand |
| **Code Reusability** | Low | High |
| **Testing** | Difficult | Easy with hooks |
| **Maintainability** | 😞 Hard | 😊 Easy |
| **Onboarding** | Confusing | Clear patterns |
| **Feature Development** | Slow | Fast |

---

## Implementation Timeline

- **Phase 1 (Foundation)**: 1-2 hours
- **Phase 2 (State)**: 1-2 hours
- **Phase 3 (Backend)**: 1 hour
- **Phase 4 (Pages)**: 2-3 hours
- **Phase 5 (Testing)**: 1-2 hours

**Total**: 6-10 hours for full alignment

---

## Quick Wins (Start Here)

1. ✅ Create API client (`src/lib/api/client.ts`) - 30 min
2. ✅ Create types directory (`src/types/`) - 20 min
3. ✅ Create env config (`src/config/env.ts`) - 15 min
4. ✅ Create error boundary - 15 min
5. ✅ Refactor InventoryPage to use new patterns - 45 min

**Total: ~2.5 hours** for immediate impact

