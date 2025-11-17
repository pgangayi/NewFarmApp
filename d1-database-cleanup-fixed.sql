-- ============================================================================
-- COMPLETE DATABASE DATA CLEANUP SCRIPT (SQLite Compatible)
-- WARNING: This will permanently delete ALL data from the database!
-- ============================================================================
-- 
-- This script removes all data while preserving the database schema.
-- Execute this in your Cloudflare D1 database to clean all data.
--
-- Before executing:
-- 1. Ensure you have backups if needed
-- 2. Confirm you want to delete ALL data
-- 3. This will NOT affect the database structure
--
-- After execution:
-- - All tables will be empty but schema intact
-- - Use the verification section to confirm cleanup
-- - Your application will work normally with empty data
-- ============================================================================

-- ============================================================================
-- CLEANUP DEPENDENT TABLES FIRST (respecting foreign key dependencies)
-- ============================================================================

-- Step 1: Clear audit logs (highest dependency)
DELETE FROM audit_logs;
SELECT 'Step 1: audit_logs cleared' AS result;

-- Step 2: Clear notifications  
DELETE FROM notifications;
SELECT 'Step 2: notifications cleared' AS result;

-- Step 3: Clear animal movements
DELETE FROM animal_movements;
SELECT 'Step 3: animal_movements cleared' AS result;

-- Step 4: Clear animal events
DELETE FROM animal_events;
SELECT 'Step 4: animal_events cleared' AS result;

-- Step 5: Clear animal health records
DELETE FROM animal_health_records;
SELECT 'Step 5: animal_health_records cleared' AS result;

-- Step 6: Clear tasks
DELETE FROM tasks;
SELECT 'Step 6: tasks cleared' AS result;

-- Step 7: Clear finance entries
DELETE FROM finance_entries;
SELECT 'Step 7: finance_entries cleared' AS result;

-- Step 8: Clear crops
DELETE FROM crops;
SELECT 'Step 8: crops cleared' AS result;

-- Step 9: Clear weather data
DELETE FROM weather_data;
SELECT 'Step 9: weather_data cleared' AS result;

-- Step 10: Clear inventory
DELETE FROM inventory;
SELECT 'Step 10: inventory cleared' AS result;

-- Step 11: Clear equipment
DELETE FROM equipment;
SELECT 'Step 11: equipment cleared' AS result;

-- Step 12: Clear farm operations
DELETE FROM farm_operations;
SELECT 'Step 12: farm_operations cleared' AS result;

-- Step 13: Clear farm statistics
DELETE FROM farm_statistics;
SELECT 'Step 13: farm_statistics cleared' AS result;

-- Step 14: Clear farm members
DELETE FROM farm_members;
SELECT 'Step 14: farm_members cleared' AS result;

-- Step 15: Clear fields
DELETE FROM fields;
SELECT 'Step 15: fields cleared' AS result;

-- Step 16: Clear locations
DELETE FROM locations;
SELECT 'Step 16: locations cleared' AS result;

-- Step 17: Clear animals
DELETE FROM animals;
SELECT 'Step 17: animals cleared' AS result;

-- Step 18: Clear farms
DELETE FROM farms;
SELECT 'Step 18: farms cleared' AS result;

-- Step 19: Clear users (OPTIONAL - uncomment if you want to delete users too)
-- DELETE FROM users;
-- SELECT 'Step 19: users cleared (OPTIONAL)' AS result;

-- ============================================================================
-- VERIFICATION SECTION
-- ============================================================================

-- Check remaining data counts to confirm cleanup
SELECT '========================================' AS separator;
SELECT 'DATABASE CLEANUP VERIFICATION' AS status;
SELECT '========================================' AS separator;

-- Show remaining counts for all main tables
SELECT 'Remaining data counts:' AS info;

-- Get individual counts (SQLite doesn't support UNION in this context)
SELECT 'farms: ' || CAST((SELECT COUNT(*) FROM farms) AS TEXT) AS remaining;
SELECT 'users: ' || CAST((SELECT COUNT(*) FROM users) AS TEXT) AS remaining;
SELECT 'animals: ' || CAST((SELECT COUNT(*) FROM animals) AS TEXT) AS remaining;
SELECT 'fields: ' || CAST((SELECT COUNT(*) FROM fields) AS TEXT) AS remaining;
SELECT 'crops: ' || CAST((SELECT COUNT(*) FROM crops) AS TEXT) AS remaining;
SELECT 'tasks: ' || CAST((SELECT COUNT(*) FROM tasks) AS TEXT) AS remaining;
SELECT 'finance_entries: ' || CAST((SELECT COUNT(*) FROM finance_entries) AS TEXT) AS remaining;
SELECT 'inventory: ' || CAST((SELECT COUNT(*) FROM inventory) AS TEXT) AS remaining;
SELECT 'equipment: ' || CAST((SELECT COUNT(*) FROM equipment) AS TEXT) AS remaining;
SELECT 'notifications: ' || CAST((SELECT COUNT(*) FROM notifications) AS TEXT) AS remaining;
SELECT 'audit_logs: ' || CAST((SELECT COUNT(*) FROM audit_logs) AS TEXT) AS remaining;

-- Final completion message
SELECT '========================================' AS separator;
SELECT 'DATABASE DATA CLEANUP COMPLETED!' AS status;
SELECT 'All data has been permanently deleted.' AS warning;
SELECT 'Database schema and structure preserved.' AS info;
SELECT 'Cleanup completed at: ' || datetime('now') AS timestamp;
SELECT '========================================' AS separator;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
--
-- To execute this script:
-- 1. Go to Cloudflare Dashboard
-- 2. Navigate to D1 → Databases  
-- 3. Select: farmers-boot-local
-- 4. Open Query Editor
-- 5. Copy and paste this entire script
-- 6. Execute to clean all data
--
-- This script will:
-- ✅ Remove ALL data from the database
-- ✅ Preserve the database schema (tables, columns, indexes)
-- ✅ Maintain database functionality
-- ✅ Provide step-by-step progress feedback
-- ✅ Verify cleanup completion
-- 
-- To restore data after cleanup:
-- - Re-run your seed scripts
-- - Use backup restoration tools
-- - Re-create data manually through the application
-- ============================================================================