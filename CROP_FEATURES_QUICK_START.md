# Crop Module - Architecture Integration Quick Reference

**Last Updated:** November 1, 2025  
**Status:** Foundation Complete, Features 30% Implemented

---

## 🎯 Quick Start: Using Crop Features

### Current Status - What Works Now

```typescript
// ✅ This works - basic crop management
import { useCrops } from '../hooks/useCrops';

export function MyComponent() {
  const { crops, isLoading, error, createCrop, updateCrop, deleteCrop } = useCrops();
  
  // List crops
  crops.forEach(crop => console.log(crop.name, crop.status));
  
  // Create new crop
  createCrop({
    farm_id: 'farm-123',
    field_id: 'field-456',
    name: 'Corn',
    crop_type: 'grain',
    planting_date: '2025-05-01',
    status: 'planned'
  });
  
  // Update crop
  updateCrop({
    id: 'crop-789',
    status: 'active'
  });
  
  // Delete crop
  deleteCrop('crop-789');
  
  // Get statistics
  const stats = useCropsStats();
  console.log('Active crops:', stats.activeCount); // 5
  console.log('By status:', stats.byStatus);       // { planned: 2, active: 5, harvested: 8, failed: 1 }
}
```

### What Doesn't Work Yet (Coming Soon)

```typescript
// ❌ These don't work yet - need implementation

// Crop rotation
const { plans, createPlan } = useCropRotation();      // ❌ Not implemented

// Irrigation scheduling  
const { schedules, optimize } = useIrrigation();      // ❌ Not implemented

// Pest & disease tracking
const { issues, report } = usePestDisease();          // ❌ Not implemented

// Soil health monitoring
const { tests, recommendations } = useSoilHealth();   // ❌ Not implemented
```

---

## 📋 Architecture Layers

### Layer 1: Frontend Components
```
┌─────────────────────────────────────┐
│ CropsPage, CropRotationPlanner, etc.│
│ (React Components)                  │
└──────────────┬──────────────────────┘
               │
```

### Layer 2: React Query Hooks (Domain Layer)
```
               ▼
┌─────────────────────────────────────┐
│ useCrops()        ✅ Implemented    │
│ useCropRotation() ❌ Needs work     │
│ useIrrigation()   ❌ Needs work     │
│ usePestDisease()  ❌ Needs work     │
│ useSoilHealth()   ❌ Needs work     │
└──────────────┬──────────────────────┘
               │
```

### Layer 3: API Client (Centralized)
```
               ▼
┌─────────────────────────────────────┐
│ ApiClient                           │
│ • Retry logic (exponential backoff) │
│ • Auth injection                    │
│ • Error handling                    │
│ • Timeout management (30s)          │
└──────────────┬──────────────────────┘
               │
```

### Layer 4: Backend API Endpoints
```
               ▼
┌─────────────────────────────────────┐
│ /api/crops-main              ✅     │
│ /api/crops/rotation/*        ❌     │
│ /api/crops/irrigation/*      ❌     │
│ /api/crops/pests-diseases/*  ❌     │
│ /api/crops/soil-health/*     ❌     │
└──────────────┬──────────────────────┘
               │
```

### Layer 5: Database (Supabase PostgreSQL)
```
               ▼
┌─────────────────────────────────────┐
│ crops table          ✅             │
│ crop_rotation_*      ❌             │
│ irrigation_*         ❌             │
│ pest_issues          ❌             │
│ disease_outbreaks    ❌             │
│ soil_test_results    ❌             │
└─────────────────────────────────────┘
```

---

## 🛠️ Feature Status & Implementation Guide

### FEATURE 1: Basic Crop Management
**Status:** ✅ COMPLETE (30 LOC in page)

**Usage:**
```typescript
// In CropsPage or CropsPage-Enhanced
import { useCrops, useCropsStats } from '../hooks/useCrops';

const { crops, createCrop, updateCrop, deleteCrop } = useCrops();
const stats = useCropsStats();

// Display crops and stats
```

**What's Implemented:**
- ✅ Create/Read/Update/Delete operations
- ✅ Stats (active, planned, harvested, failed)
- ✅ Field filtering
- ✅ Search functionality
- ✅ Loading/error states

**Next Steps:** Already done - just use it!

---

### FEATURE 2: Crop Rotation Planning
**Status:** ❌ NOT IMPLEMENTED (Est. 2-3 days)

**What's Needed:**

1. **Database Schema**
   ```sql
   CREATE TABLE crop_rotation_plans (
     id UUID PRIMARY KEY,
     farm_id UUID NOT NULL,
     field_id UUID NOT NULL,
     plan_name TEXT,
     start_year INTEGER,
     end_year INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   CREATE TABLE crop_rotation_entries (
     id UUID PRIMARY KEY,
     plan_id UUID NOT NULL REFERENCES crop_rotation_plans(id),
     year INTEGER,
     crop_type TEXT,
     expected_yield REAL,
     notes TEXT
   );
   ```

2. **Backend Endpoint** (`functions/api/crops/rotation.js`)
   ```javascript
   export async function onRequest(context) {
     const { request, env } = context;
     const method = request.method;
     
     // GET /api/crops/rotation/plans?farm_id=xyz
     // POST /api/crops/rotation/plans
     // PUT /api/crops/rotation/plans/{id}
     // DELETE /api/crops/rotation/plans/{id}
   }
   ```

3. **React Hook** (`src/hooks/useCropRotation.ts`)
   ```typescript
   export function useCropRotation() {
     // Follow useCrops pattern
     // useQuery for plans
     // useMutation for CRUD
     // useQuery for rotation history
   }
   ```

4. **Update Component** (`CropRotationPlanner.tsx`)
   ```typescript
   import { useCropRotation } from '../hooks/useCropRotation';
   
   export function CropRotationPlanner() {
     const { plans, createPlan } = useCropRotation();
     // Render plans, add UI for creation
   }
   ```

**Start Here:** Copy pattern from `src/hooks/useCrops.ts`

---

### FEATURE 3: Irrigation Optimization
**Status:** ❌ NOT IMPLEMENTED (Est. 3-4 days)

**Key Additions:**
- Database: `irrigation_schedules`, `irrigation_logs`, `weather_data`
- Backend: Smart scheduling algorithm
- Hook: `useIrrigation()` with optimization options
- Component: Integrate with `IrrigationOptimizer`

**Start Here:** Use `useCrops` as template, add optimization logic

---

### FEATURE 4: Pest & Disease Management
**Status:** ❌ NOT IMPLEMENTED (Est. 3-4 days)

**Key Additions:**
- Database: `pest_issues`, `disease_outbreaks`, `prevention_tasks`
- Backend: Issue tracking, treatment logging
- Hook: `usePestDisease()` with reporting
- Component: Integrate with `PestDiseaseManager`
- Optional: Image upload support

**Start Here:** Standard hook pattern + backend API

---

### FEATURE 5: Soil Health Monitoring
**Status:** ❌ NOT IMPLEMENTED (Est. 2-3 days)

**Key Additions:**
- Database: `soil_test_results`
- Backend: Test CRUD, recommendation engine
- Hook: `useSoilHealth()` with trend analysis
- Component: Integrate with `SoilHealthMonitor`

**Start Here:** Similar to useCrops but with trend calculations

---

## 🚀 Implementation Roadmap

### Week 1: Complete Foundation
- [ ] Complete CropsPage refactoring (1 day)
- [ ] Test `/api/crops-main` endpoint (0.5 days)
- [ ] Create crop rotation feature (2-3 days)

### Week 2: Add Advanced Features
- [ ] Irrigation scheduling (3-4 days)
- [ ] Begin pest/disease management (2 days)

### Week 3: Complete Features
- [ ] Finish pest/disease management (2 days)
- [ ] Soil health monitoring (2-3 days)
- [ ] Testing and bug fixes (2 days)

### Week 4+: Optimization & Analytics
- [ ] Advanced analytics
- [ ] Cost tracking
- [ ] Reporting & exports
- [ ] Mobile optimizations

---

## 📚 Reference Pattern: Hook Template

Use this as a starting point for new feature hooks:

```typescript
// src/hooks/use[Feature].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../lib/api/client';
import { [Entity] } from '../types/entities';
import { apiEndpoints, cacheConfig } from '../config/env';

export interface Create[Feature]Form {
  // Form fields
}

export function use[Feature]() {
  const queryClient = useQueryClient();
  const apiClient = getApiClient();

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['[feature]'],
    queryFn: async () => {
      const response = await apiClient.get<[Entity][]>(apiEndpoints.[feature].list);
      return response;
    },
    staleTime: cacheConfig.staleTime.medium,
    gcTime: cacheConfig.gcTime.medium,
    retry: 2,
  });

  // Mutations
  const { mutate: createItem, isPending: isCreating } = useMutation({
    mutationFn: async (data: Create[Feature]Form) => {
      const response = await apiClient.post<[Entity]>(
        apiEndpoints.[feature].create,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[feature]'] });
    },
  });

  // ... more mutations for update, delete

  return {
    data: data || [],
    isLoading,
    error,
    createItem,
    // ... other methods
  };
}

// Additional specialized hooks
export function use[Feature]Stats() {
  const { data } = use[Feature]();
  // Computed statistics
  return { /* stats */ };
}
```

---

## ✅ Checklist: Adding New Feature

1. **Database** (Backend)
   - [ ] Create migration file
   - [ ] Add tables with proper schema
   - [ ] Add RLS policies for security
   - [ ] Create indexes for performance

2. **Backend API** (`functions/api/`)
   - [ ] Create endpoint file
   - [ ] Implement CRUD operations
   - [ ] Add auth validation
   - [ ] Error handling

3. **Frontend**
   - [ ] Create React hook in `src/hooks/`
   - [ ] Add types to `src/types/entities.ts` if needed
   - [ ] Add endpoints to `src/config/env.ts`
   - [ ] Update component to use hook
   - [ ] Test end-to-end

4. **Documentation**
   - [ ] Update this reference guide
   - [ ] Add examples to QUICK_REFERENCE.md
   - [ ] Document any complex logic

---

## 🎯 Next Priority

**What to do first:**

1. ✅ Verify CropsPage works end-to-end (15 min)
2. ✅ Test crop creation/update/delete (30 min)
3. ⏳ Create useCropRotation hook (3-4 hours) ← START HERE
4. ⏳ Implement rotation backend (4-5 hours)
5. ⏳ Test and integrate (2 hours)

**Total estimate for next feature:** 1 day

---

## 📞 Questions?

Refer to:
- `QUICK_REFERENCE.md` - Common patterns and usage
- `ARCHITECTURE_ALIGNMENT_COMPLETE.md` - Architecture details
- `src/hooks/useCrops.ts` - Reference implementation
- `src/hooks/useInventory.ts` - Original pattern source
