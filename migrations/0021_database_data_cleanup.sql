-- Database Data Cleanup Migration Script
-- Removes all data from the database while preserving schema
-- Version: 1.0.0
-- Date: November 15, 2025
-- Safety: This script requires manual confirmation

BEGIN TRANSACTION;

-- =============================================================================
-- DATABASE CLEANUP MIGRATION
-- =============================================================================
-- WARNING: This migration will DELETE ALL DATA from the database!
-- It will NOT modify the database schema or structure.
-- 
-- Data will be deleted in the correct order to respect foreign key dependencies.
-- The script uses DELETE instead of TRUNCATE for better compatibility.
-- =============================================================================

-- Display warning message
SELECT '========================================' AS status;
SELECT 'DATABASE DATA CLEANUP STARTED' AS action;
SELECT 'All data will be permanently deleted!' AS warning;
SELECT 'Schema and structure will be preserved.' AS info;
SELECT '========================================' AS status;

-- =============================================================================
-- CLEANUP DEPENDENT TABLES FIRST (in dependency order)
-- =============================================================================

-- Step 1: Clear audit logs (highest dependency)
DELETE FROM audit_logs;
SELECT 'Step 1: Cleared audit_logs table' AS status, 
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 2: Clear notifications
DELETE FROM notifications;
SELECT 'Step 2: Cleared notifications table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 3: Clear animal movements
DELETE FROM animal_movements;
SELECT 'Step 3: Cleared animal_movements table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 4: Clear animal events
DELETE FROM animal_events;
SELECT 'Step 4: Cleared animal_events table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 5: Clear animal health records
DELETE FROM animal_health_records;
SELECT 'Step 5: Cleared animal_health_records table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 6: Clear tasks
DELETE FROM tasks;
SELECT 'Step 6: Cleared tasks table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 7: Clear finance entries
DELETE FROM finance_entries;
SELECT 'Step 7: Cleared finance_entries table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 8: Clear crops
DELETE FROM crops;
SELECT 'Step 8: Cleared crops table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 9: Clear weather data
DELETE FROM weather_data;
SELECT 'Step 9: Cleared weather_data table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 10: Clear inventory
DELETE FROM inventory;
SELECT 'Step 10: Cleared inventory table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 11: Clear equipment
DELETE FROM equipment;
SELECT 'Step 11: Cleared equipment table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 12: Clear farm operations
DELETE FROM farm_operations;
SELECT 'Step 12: Cleared farm_operations table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 13: Clear farm statistics
DELETE FROM farm_statistics;
SELECT 'Step 13: Cleared farm_statistics table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 14: Clear farm members
DELETE FROM farm_members;
SELECT 'Step 14: Cleared farm_members table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 15: Clear fields
DELETE FROM fields;
SELECT 'Step 15: Cleared fields table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 16: Clear locations
DELETE FROM locations;
SELECT 'Step 16: Cleared locations table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 17: Clear animals
DELETE FROM animals;
SELECT 'Step 17: Cleared animals table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 18: Clear farms
DELETE FROM farms;
SELECT 'Step 18: Cleared farms table' AS status,
       COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- Step 19: Clear users (optional - comment out if you want to preserve users)
-- DELETE FROM users;
-- SELECT 'Step 19: Cleared users table (OPTIONAL)' AS status,
--        COALESCE(CAST(changes AS TEXT), '0') AS rows_deleted;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show cleanup summary
SELECT '========================================' AS status;
SELECT 'DATABASE CLEANUP SUMMARY' AS action;
SELECT '========================================' AS status;

-- Count remaining data in main tables
SELECT 'Remaining data counts:' AS info;
SELECT 'Farms:' AS table_name, COUNT(*) AS row_count FROM farms
UNION ALL
SELECT 'Users:', COUNT(*) FROM users
UNION ALL
SELECT 'Animals:', COUNT(*) FROM animals
UNION ALL
SELECT 'Fields:', COUNT(*) FROM fields
UNION ALL
SELECT 'Crops:', COUNT(*) FROM crops
UNION ALL
SELECT 'Tasks:', COUNT(*) FROM tasks
UNION ALL
SELECT 'Finance Entries:', COUNT(*) FROM finance_entries
UNION ALL
SELECT 'Inventory:', COUNT(*) FROM inventory
UNION ALL
SELECT 'Notifications:', COUNT(*) FROM notifications
UNION ALL
SELECT 'Audit Logs:', COUNT(*) FROM audit_logs;

-- =============================================================================
-- CLEANUP COMPLETION
-- =============================================================================

SELECT '========================================' AS status;
SELECT 'DATABASE DATA CLEANUP COMPLETED' AS action;
SELECT 'All data has been permanently deleted!' AS warning;
SELECT 'Database schema and structure preserved.' AS info;
SELECT 'Migration completed at: ' || datetime('now') AS timestamp;
SELECT '========================================' AS status;

COMMIT;

-- =============================================================================
-- SAFETY NOTES
-- =============================================================================
-- 
-- If you need to rollback this operation, you will need to:
-- 1. Restore data from backups, OR
-- 2. Re-insert data manually, OR  
-- 3. Re-run any existing seed/data insertion scripts
--
-- This migration does NOT affect:
-- - Database schema (tables, columns, indexes, constraints)
-- - Database triggers and functions
-- - Database users and permissions
-- - Configuration data
--
-- Available cleanup endpoints after this migration:
-- GET  /api/cleanup - Get database statistics
-- POST /api/cleanup - Clean all data (admin only)
-- POST /api/cleanup {"reset": true} - Complete database reset
-- =============================================================================