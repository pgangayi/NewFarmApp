# Backend Endpoints Status Review

**Current Date:** November 1, 2025  
**Status:** Architecture alignment complete - endpoint verification needed

---

## 📌 Existing Crop Endpoints

### ✅ Verified Endpoints (In Use)

#### 1. **Crop Management** 
**Endpoint:** `/api/crops-main`  
**Status:** ✅ EXISTS (configured in env.ts)

```typescript
// From src/config/env.ts
crops: {
  list: '/api/crops-main',
  create: '/api/crops-main',
  get: (id: string) => `/api/crops-main/${id}`,
  update: (id: string) => `/api/crops-main/${id}`,
  delete: (id: string) => `/api/crops-main/${id}`,
}
```

**Methods:**
- GET `/api/crops-main` - List all crops
- POST `/api/crops-main` - Create new crop
- GET `/api/crops-main/{id}` - Get specific crop
- PUT `/api/crops-main/{id}` - Update crop
- DELETE `/api/crops-main/{id}` - Delete crop

**Implementation File:** `functions/api/crops-main.js`

---

### ⚠️ Planned But NOT Implemented

#### 2. **Crop Rotation Planning**
**Status:** ❌ NO ENDPOINTS

**Needed Endpoints:**
```typescript
rotation: {
  plans: '/api/crops/rotation/plans',           // List rotation plans
  createPlan: '/api/crops/rotation/plans',      // Create plan
  getPlan: (id: string) => `/api/crops/rotation/plans/${id}`,
  updatePlan: (id: string) => `/api/crops/rotation/plans/${id}`,
  deletePlan: (id: string) => `/api/crops/rotation/plans/${id}`,
  
  entries: (planId: string) => `/api/crops/rotation/plans/${planId}/entries`,
  createEntry: (planId: string) => `/api/crops/rotation/plans/${planId}/entries`,
  
  history: (farmId: string) => `/api/crops/rotation/history?farm_id=${farmId}`,
}
```

**Implementation Needed:**
- [ ] `functions/api/crops/rotation.js` - Main rotation endpoints
- [ ] `functions/api/crops/rotation/plans.js` - Plan CRUD operations
- [ ] `functions/api/crops/rotation/history.js` - Historical data

**Database Tables Required:**
- [ ] `crop_rotation_plans`
- [ ] `crop_rotation_entries`
- [ ] `crop_rotation_history`

---

#### 3. **Irrigation Management**
**Status:** ❌ NO ENDPOINTS

**Needed Endpoints:**
```typescript
irrigation: {
  schedules: '/api/crops/irrigation/schedules',
  createSchedule: '/api/crops/irrigation/schedules',
  getSchedule: (id: string) => `/api/crops/irrigation/schedules/${id}`,
  updateSchedule: (id: string) => `/api/crops/irrigation/schedules/${id}`,
  deleteSchedule: (id: string) => `/api/crops/irrigation/schedules/${id}`,
  
  optimize: '/api/crops/irrigation/optimize',    // Smart optimization
  
  logs: (scheduleId: string) => `/api/crops/irrigation/schedules/${scheduleId}/logs`,
  createLog: (scheduleId: string) => `/api/crops/irrigation/schedules/${scheduleId}/logs`,
  
  weather: (farmId: string) => `/api/crops/irrigation/weather?farm_id=${farmId}`,
}
```

**Implementation Needed:**
- [ ] `functions/api/crops/irrigation.js` - Main irrigation endpoints
- [ ] `functions/api/crops/irrigation/optimize.js` - Optimization algorithm
- [ ] `functions/api/weather.js` - Weather data integration

**Database Tables Required:**
- [ ] `irrigation_schedules`
- [ ] `irrigation_logs`
- [ ] `weather_data`

---

#### 4. **Pest & Disease Management**
**Status:** ❌ NO ENDPOINTS

**Needed Endpoints:**
```typescript
pestDisease: {
  issues: '/api/crops/pests-diseases/issues',
  createIssue: '/api/crops/pests-diseases/issues',
  getIssue: (id: string) => `/api/crops/pests-diseases/issues/${id}`,
  updateIssue: (id: string) => `/api/crops/pests-diseases/issues/${id}`,
  deleteIssue: (id: string) => `/api/crops/pests-diseases/issues/${id}`,
  
  outbreaks: '/api/crops/pests-diseases/outbreaks',
  createOutbreak: '/api/crops/pests-diseases/outbreaks',
  
  prevention: '/api/crops/pests-diseases/prevention-tasks',
  createPrevention: '/api/crops/pests-diseases/prevention-tasks',
  
  logs: (issueId: string) => `/api/crops/pests-diseases/issues/${issueId}/logs`,
}
```

**Implementation Needed:**
- [ ] `functions/api/crops/pests-diseases.js` - Main endpoints
- [ ] `functions/api/crops/pests-diseases/prevention.js` - Prevention tasks

**Database Tables Required:**
- [ ] `pest_issues`
- [ ] `disease_outbreaks`
- [ ] `prevention_tasks`
- [ ] `pest_disease_logs`

---

#### 5. **Soil Health Monitoring**
**Status:** ❌ NO ENDPOINTS

**Needed Endpoints:**
```typescript
soilHealth: {
  tests: '/api/crops/soil-health/tests',
  createTest: '/api/crops/soil-health/tests',
  getTest: (id: string) => `/api/crops/soil-health/tests/${id}`,
  updateTest: (id: string) => `/api/crops/soil-health/tests/${id}`,
  deleteTest: (id: string) => `/api/crops/soil-health/tests/${id}`,
  
  recommendations: (testId: string) => `/api/crops/soil-health/tests/${testId}/recommendations`,
  
  trends: (fieldId: string) => `/api/crops/soil-health/trends?field_id=${fieldId}`,
}
```

**Implementation Needed:**
- [ ] `functions/api/crops/soil-health.js` - Main endpoints
- [ ] `functions/api/crops/soil-health/recommendations.js` - Recommendation engine

**Database Tables Required:**
- [ ] `soil_test_results`

---

## 🗂️ File Structure for New Endpoints

### Recommended Organization

```
functions/api/
├── crops/
│   ├── index.js (or crops-main.js) ✅ EXISTS
│   ├── rotation.js ❌ NEEDS CREATION
│   ├── irrigation.js ❌ NEEDS CREATION
│   ├── pests-diseases.js ❌ NEEDS CREATION
│   ├── soil-health.js ❌ NEEDS CREATION
│   └── weather.js ❌ NEEDS CREATION (for weather integration)
├── crops-main.js ✅ EXISTS
├── crops.js (legacy?)
└── ...
```

---

## 📋 Implementation Checklist

### Priority 1: Core Crop CRUD (DONE)
- [x] `/api/crops-main` - All CRUD operations
- [x] Response format standardized
- [x] Error handling implemented
- [x] Auth validation present

### Priority 2: Crop Features (TODO - 1 week)
- [ ] Rotation management endpoints
- [ ] Irrigation scheduling endpoints
- [ ] Basic pest/disease tracking
- [ ] Soil test recording

### Priority 3: Advanced Features (TODO - 2 weeks)
- [ ] Irrigation optimization algorithm
- [ ] Weather integration
- [ ] Pest/disease predictions
- [ ] Soil health recommendations
- [ ] Analytics and reporting

### Priority 4: Enhancement (TODO - 3+ weeks)
- [ ] Cost tracking integration
- [ ] Image upload support
- [ ] Real-time notifications
- [ ] Mobile optimizations

---

## 🔍 Quick Verification Commands

### Check if crop endpoint exists
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8787/api/crops-main
```

### Check configured endpoints in code
```bash
grep -r "crops:" frontend/src/config/
```

### List backend API files
```bash
ls -la functions/api/crops*.js
```

---

## 📊 Summary Table

| Feature | Endpoint Status | Backend File | DB Tables | Hook | UI Component |
|---------|-----------------|--------------|-----------|------|--------------|
| **Crops** | ✅ Exists | ✅ crops-main.js | ✅ crops | ✅ useCrops | ✅ CropsPage |
| **Rotation** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Stub only |
| **Irrigation** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Stub only |
| **Pest/Disease** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Stub only |
| **Soil Health** | ❌ Missing | ❌ None | ❌ None | ❌ None | ⚠️ Stub only |

---

## 🎯 Next Action: Implementation Order

1. **Week 1:** Create crop rotation endpoints + hooks
2. **Week 2:** Create irrigation endpoints + hooks  
3. **Week 3:** Create pest/disease endpoints + hooks
4. **Week 4:** Create soil health endpoints + hooks
5. **Week 5+:** Advanced features (optimization, weather, recommendations)

Each feature follows the same pattern:
1. Create database schema/migration
2. Create backend endpoint in `functions/api/`
3. Create React Query hook following `useCrops` pattern
4. Update UI component to use new hook
5. Test end-to-end

