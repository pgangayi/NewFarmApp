-- Enhanced Indexes for Livestock and Crops Modules
-- Addresses audit findings for database performance optimization

-- ===============================================
-- LIVESTOCK (ANIMALS) MODULE OPTIMIZATIONS
-- ===============================================

-- Composite indexes for common animal query patterns
CREATE INDEX IF NOT EXISTS idx_animals_farm_status_created 
ON animals(farm_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_animals_farm_species_status 
ON animals(farm_id, species, health_status);

CREATE INDEX IF NOT EXISTS idx_animals_breed_sex 
ON animals(breed, sex);

CREATE INDEX IF NOT EXISTS idx_animals_identification_tag 
ON animals(identification_tag) WHERE identification_tag IS NOT NULL;

-- Performance index for animal health records queries
CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal_date 
ON animal_health_records(animal_id, record_date DESC);

-- Performance index for production records queries  
CREATE INDEX IF NOT EXISTS idx_animal_production_animal_date_type 
ON animal_production(animal_id, production_date DESC, production_type);

-- Index for breeding records
CREATE INDEX IF NOT EXISTS idx_animal_breeding_father_mother 
ON animal_breeding(father_id, mother_id);

CREATE INDEX IF NOT EXISTS idx_animal_breeding_animal_date 
ON animal_breeding(animal_id, breeding_date DESC);

-- ===============================================
-- CROPS MODULE OPTIMIZATIONS  
-- ===============================================

-- Composite indexes for common crops query patterns
CREATE INDEX IF NOT EXISTS idx_crops_farm_field_status 
ON crops(farm_id, field_id, status);

CREATE INDEX IF NOT EXISTS idx_crops_farm_type_planting 
ON crops(farm_id, crop_type, planting_date DESC);

CREATE INDEX IF NOT EXISTS idx_crops_field_status_growth 
ON crops(field_id, status, growth_stage);

-- Performance indexes for crop activities
CREATE INDEX IF NOT EXISTS idx_crop_activities_crop_date 
ON crop_activities(crop_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_crop_activities_farm_date 
ON crop_activities(farm_id, activity_date DESC) WHERE farm_id IS NOT NULL;

-- Performance indexes for crop observations
CREATE INDEX IF NOT EXISTS idx_crop_observations_crop_date_health 
ON crop_observations(crop_id, observation_date DESC, health_status);

-- Index for yield records
CREATE INDEX IF NOT EXISTS idx_crop_yield_records_crop_harvest 
ON crop_yield_records(crop_id, harvest_date DESC);

-- ===============================================
-- SPECIALIZED CROPS SUB-MODULES
-- ===============================================

-- Irrigation schedules optimization
CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_crop_active 
ON irrigation_schedules(crop_id, is_active, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_irrigation_schedules_farm_date 
ON irrigation_schedules(farm_id, scheduled_date) WHERE farm_id IS NOT NULL;

-- Pest and disease tracking
CREATE INDEX IF NOT EXISTS idx_pest_issues_crop_severity_date 
ON pest_issues(crop_id, severity_level, reported_date DESC);

CREATE INDEX IF NOT EXISTS idx_disease_outbreaks_crop_status 
ON disease_outbreaks(crop_id, outbreak_status, detected_date DESC);

-- Crop rotation planning
CREATE INDEX IF NOT EXISTS idx_crop_rotation_plans_field_season 
ON crop_rotation_plans(field_id, season_year, planned_crop);

-- Soil health monitoring
CREATE INDEX IF NOT EXISTS idx_soil_test_results_field_date 
ON soil_test_results(field_id, test_date DESC, ph_level);

-- ===============================================
-- CROSS-MODULE PERFORMANCE INDEXES
-- ===============================================

-- Farm-scoped queries (used by both modules)
CREATE INDEX IF NOT EXISTS idx_farm_members_user_farm_role 
ON farm_members(user_id, farm_id, role);

CREATE INDEX IF NOT EXISTS idx_audit_logs_farm_timestamp 
ON audit_logs(farm_id, timestamp DESC, event_type);

-- ===============================================
-- SEARCH OPTIMIZATION INDEXES  
-- ===============================================

-- Full-text search support for animals
CREATE VIRTUAL TABLE IF NOT EXISTS animals_search USING fts5(
  name,
  species,
  breed, 
  identification_tag,
  health_status,
  content='animals'
);

-- Full-text search support for crops
CREATE VIRTUAL TABLE IF NOT EXISTS crops_search USING fts5(
  crop_type,
  crop_variety,
  field_name,
  status,
  growth_stage,
  content='crops'
);

-- ===============================================
-- ANALYTICS AND REPORTING INDEXES
-- ===============================================

-- Performance tracking indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_farm_type_date 
ON performance_metrics(farm_id, metric_type, recorded_at DESC);

-- Financial tracking indexes (cross-module)
CREATE INDEX IF NOT EXISTS idx_finance_entries_farm_type_date 
ON finance_entries(farm_id, entry_type, entry_date DESC);

-- Task management indexes (cross-module)
CREATE INDEX IF NOT EXISTS idx_tasks_farm_status_priority 
ON tasks(farm_id, status, priority, due_date);

-- ===============================================
-- REAL-TIME FEATURES INDEXES
-- ===============================================

-- WebSocket and notification optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_status 
ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_websocket_sessions_user_farm 
ON websocket_sessions(user_id, farm_id, last_activity);

-- ===============================================
-- MAINTENANCE AND CLEANUP INDEXES
-- ===============================================

-- Soft deletion pattern support
CREATE INDEX IF NOT EXISTS idx_animals_deleted_status 
ON animals(deleted_at, status) WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crops_deleted_status 
ON crops(deleted_at, status) WHERE deleted_at IS NOT NULL;

-- Data retention indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_retention 
ON audit_logs(timestamp, security_level);

-- ===============================================
-- COMPOSITE FOREIGN KEY INDEXES
-- ===============================================

-- Optimize join performance
CREATE INDEX IF NOT EXISTS idx_animals_farm_id_active 
ON animals(farm_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_crops_farm_id_active 
ON crops(farm_id) WHERE status != 'harvested';

-- Seasonal query optimization
CREATE INDEX IF NOT EXISTS idx_crop_activities_seasonal 
ON crop_activities(activity_date, activity_type) 
WHERE activity_date >= date('now', '-1 year');

-- Health status tracking
CREATE INDEX IF NOT EXISTS idx_animals_health_tracking 
ON animals(health_status, last_vet_check) 
WHERE health_status != 'healthy';

-- ===============================================
-- PERFORMANCE MONITORING INDEXES
-- ===============================================

-- Query performance tracking
CREATE INDEX IF NOT EXISTS idx_query_performance_endpoint_date 
ON query_performance_logs(endpoint, execution_time_ms, timestamp DESC) 
WHERE timestamp >= date('now', '-30 days');

-- ===============================================
-- ANALYZE TABLES FOR OPTIMIZER
-- ===============================================

ANALYZE animals;
ANALYZE crops;
ANALYZE farm_members;
ANALYZE audit_logs;
ANALYZE animal_health_records;
ANALYZE animal_production;
ANALYZE crop_activities;
ANALYZE crop_observations;
ANALYZE irrigation_schedules;
ANALYZE pest_issues;
ANALYZE disease_outbreaks;

-- ===============================================
-- INDEX USAGE STATISTICS (for monitoring)
-- ===============================================

-- Create view for index usage monitoring
CREATE VIEW IF NOT EXISTS index_usage_stats AS
SELECT 
  name as index_name,
  tbl_name as table_name,
  sql
FROM sqlite_master 
WHERE type = 'index' 
  AND name NOT LIKE 'sqlite_%'
  AND tbl_name IN (
    'animals', 'crops', 'animal_health_records', 'animal_production',
    'crop_activities', 'crop_observations', 'irrigation_schedules',
    'pest_issues', 'disease_outbreaks', 'farm_members', 'audit_logs'
  )
ORDER BY tbl_name, name;