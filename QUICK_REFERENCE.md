# Architecture Alignment Quick Reference Guide

## 🚀 Using the New Architecture

### 1. Make an API Call

**Option A: Direct (Recommended for one-off calls)**
```typescript
import { getApiClient } from '../lib/api/client';
import { apiEndpoints } from '../config/env';

const api = getApiClient();
const farms = await api.get<Farm[]>(apiEndpoints.farms.list);
```

**Option B: In a Hook (Recommended for features)**
```typescript
import { useInventory } from '../hooks/useInventory';

export function MyPage() {
  const { items, createItem } = useInventory();
  // Use items and createItem
}
```

---

### 2. Create a Domain Hook

```typescript
// File: src/hooks/useMyFeature.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { apiEndpoints, cacheConfig } from '../config/env';

export function useMyFeature() {
  const apiClient = getApiClient();
  const queryClient = useQueryClient();

  // Query
  const { data: items } = useQuery({
    queryKey: ['myFeature'],
    queryFn: () => apiClient.get<MyEntity[]>(apiEndpoints.myFeature.list),
    staleTime: cacheConfig.staleTime.medium,
  });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(apiEndpoints.myFeature.create, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myFeature'] })
  });

  return {
    items,
    createItem: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
```

---

### 3. Add a New Type

**File**: `src/types/entities.ts`

```typescript
export interface MyEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateMyEntityForm {
  name: string;
  description?: string;
}
```

Then import and use:
```typescript
import { MyEntity, CreateMyEntityForm } from '../types/entities';
```

---

### 4. Add a New API Endpoint

**File**: `src/config/env.ts`

```typescript
export const apiEndpoints = {
  // ... existing ...
  myFeature: {
    list: '/api/my-feature',
    create: '/api/my-feature',
    get: (id: string) => `/api/my-feature/${id}`,
    update: '/api/my-feature',
    delete: (id: string) => `/api/my-feature/${id}`,
  },
};
```

Then use:
```typescript
import { apiEndpoints } from '../config/env';

const items = await api.get(apiEndpoints.myFeature.list);
```

---

### 5. Handle Errors

```typescript
import { ApiError, getApiClient } from '../lib/api/client';

const api = getApiClient();

try {
  const data = await api.post('/api/farms', farmData);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`[${error.statusCode}] ${error.message}`);
    // Handle specific error types
    if (error.statusCode === 401) {
      // Redirect to login
    } else if (error.statusCode === 429) {
      // Rate limited, show retry message
    }
  }
}
```

---

### 6. Configure Cache Timing

```typescript
import { cacheConfig } from '../config/env';

// Short cache (5 minutes) - for frequently changing data
staleTime: cacheConfig.staleTime.short,

// Medium cache (30 minutes) - default for lists
staleTime: cacheConfig.staleTime.medium,

// Long cache (1 hour) - for static-ish data
staleTime: cacheConfig.staleTime.long,
```

---

### 7. Use Feature Flags

```typescript
import { features } from '../config/env';

function MyComponent() {
  return (
    <>
      {features.PWA && <PWANotification />}
      {features.mapbox && <MapComponent />}
      {features.sentry && <ErrorReporting />}
    </>
  );
}
```

---

### 8. Access Environment Variables

```typescript
import { env, appConfig } from '../config/env';

console.log(env.VITE_API_BASE_URL);
console.log(env.NODE_ENV);
console.log(appConfig.isDevelopment);
console.log(appConfig.isProduction);
```

---

## 📋 File Locations

| What | Where |
|------|-------|
| **HTTP Client** | `src/lib/api/client.ts` |
| **Entity Types** | `src/types/entities.ts` |
| **Configuration** | `src/config/env.ts` |
| **Domain Hooks** | `src/hooks/use[Feature].ts` |
| **Pages** | `src/pages/[Feature]Page.tsx` |
| **Components** | `src/components/[Feature]/` |

---

## 🔧 Common Patterns

### Pattern 1: Simple List Page

```typescript
import { getApiClient } from '../lib/api/client';
import { apiEndpoints } from '../config/env';

export function ListPage() {
  const api = getApiClient();
  
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get(apiEndpoints.items.list),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Pattern 2: Create/Edit Modal

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { apiEndpoints } from '../config/env';

export function CreateModal({ onClose }) {
  const api = getApiClient();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post(apiEndpoints.items.create, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      onClose();
    },
    onError: (err) => setError(err.message)
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate({ /* form data */ });
    }}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

### Pattern 3: Delete Operation

```typescript
const { mutate: deleteItem } = useMutation({
  mutationFn: (id) => api.delete(apiEndpoints.items.delete(id)),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    showNotification('Item deleted');
  },
  onError: (error) => {
    showError(error.message);
  }
});

// Usage
<button onClick={() => deleteItem(itemId)}>Delete</button>
```

---

## ✅ Checklist for New Features

- [ ] Add types to `src/types/entities.ts`
- [ ] Add endpoints to `src/config/env.ts`
- [ ] Create hook `src/hooks/use[Feature].ts`
- [ ] Create page `src/pages/[Feature]Page.tsx`
- [ ] Import and use types, endpoints, hook in page
- [ ] Test in development
- [ ] Commit and deploy

---

## 🐛 Debugging

### API Client Issues
```typescript
// Enable debug logging
const api = getApiClient();
// Errors automatically formatted with status + message
// Retries happen automatically (max 3 attempts)
```

### Type Errors
```typescript
// Import from single source
import { Farm, InventoryItem } from '../types/entities';

// TypeScript will catch mismatches at compile time
const farm: Farm = {
  id: '1',
  name: 'My Farm',
  location: 'PA',
  created_at: new Date().toISOString(),
};
```

### Configuration Issues
```typescript
// Validation happens on app startup
// Missing required vars will show error immediately
// Check browser console for startup messages
```

---

## 📚 Documentation Files

| File | Content |
|------|---------|
| `ARCHITECTURE_ALIGNMENT.md` | Full analysis and plan |
| `ARCHITECTURE_ALIGNMENT_COMPLETE.md` | Implementation details |
| `ARCHITECTURE_ALIGNMENT_EXECUTIVE_SUMMARY.md` | High-level overview |
| **This file** | Quick reference guide |

---

## 💡 Pro Tips

### 1. Type Everything
```typescript
// ✅ Good
const farms: Farm[] = await api.get<Farm[]>(apiEndpoints.farms.list);

// ❌ Avoid
const farms = await api.get(apiEndpoints.farms.list);
```

### 2. Reuse Hooks
```typescript
// ✅ Good - In multiple components
const { items } = useInventory();

// ❌ Avoid - Duplicate logic in each component
const { data: items } = useQuery({ /* ... */ });
```

### 3. Use Centralized Config
```typescript
// ✅ Good
staleTime: cacheConfig.staleTime.medium

// ❌ Avoid
staleTime: 1000 * 60 * 30
```

### 4. Always Handle Errors
```typescript
// ✅ Good
catch (error) {
  if (error instanceof ApiError) {
    // Handle
  }
}

// ❌ Avoid
catch (error) {
  console.log(error);
}
```

---

## 🚀 Next Steps

1. **Today**: Use API client and types in 1-2 components
2. **This Week**: Create 2-3 domain hooks following the pattern
3. **Next Week**: Refactor all pages to use domain hooks
4. **Following Week**: Add unit tests for hooks

---

## Getting Help

1. Check `src/lib/api/client.ts` for API usage
2. Check `src/hooks/useInventory.ts` for hook pattern
3. Check `src/config/env.ts` for endpoints and config
4. Check `src/types/entities.ts` for type definitions
5. Read the full docs: `ARCHITECTURE_ALIGNMENT.md`

---

**Happy coding! 🎉**
