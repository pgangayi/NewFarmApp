-- 0001_enable_postgis.sql
-- Enable extensions required for PostGIS and UUID generation
-- Run on the Supabase/Postgres instance before applying spatial migrations.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify: SELECT extname FROM pg_extension WHERE extname IN ('postgis','pgcrypto');
