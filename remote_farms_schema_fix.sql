-- Fix Remote Database Schema for Farms Table
-- Date: November 2, 2025
-- Purpose: Remove duplicate user_id column and fix NOT NULL constraint

-- Step 1: Remove the user_id column that's causing issues
ALTER TABLE farms DROP COLUMN user_id;

-- Step 2: Ensure owner_id is properly configured
ALTER TABLE farms ALTER COLUMN owner_id SET NOT NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);