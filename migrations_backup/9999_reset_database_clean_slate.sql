-- Database Reset Migration - Simplified
-- This script cleans all data from the database while preserving the schema
-- Use this for development/testing to start with a clean database
-- Created: 2025-11-11

-- ============================================================================
-- CLEAN ALL DATA TABLES (Preserve Schema)
-- ============================================================================

-- Clear all user data in proper dependency order (child tables first)
DELETE FROM password_reset_tokens;
DELETE FROM farm_members;
DELETE FROM tasks;
DELETE FROM weather_locations;
DELETE FROM inventory_transactions;
DELETE FROM treatments;
DELETE FROM finance_entries;
DELETE FROM animals;
DELETE FROM fields;
DELETE FROM inventory_items;
DELETE FROM operations;
DELETE FROM farms;
DELETE FROM users;

-- ============================================================================
-- SIMPLE VERIFICATION
-- ============================================================================

-- Simple count check for main tables
SELECT 'Database reset completed. Total users remaining:' as status, COUNT(*) as count FROM users;