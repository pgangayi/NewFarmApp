-- Database Schema Fix for Farms User ID Issue
-- Date: November 2, 2025
-- Purpose: Fix farms.user_id NOT NULL constraint error

-- Check current farms table structure
-- SELECT sql FROM sqlite_master WHERE type='table' AND name='farms';

-- If user_id column exists and owner_id doesn't, rename it
-- If both exist, remove the duplicate
-- If neither exists, ensure owner_id is present

-- Migration to fix the column structure
ALTER TABLE farms RENAME COLUMN user_id TO owner_id;

-- Ensure the column is properly configured
ALTER TABLE farms ALTER COLUMN owner_id SET NOT NULL;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_farms_owner ON farms(owner_id);