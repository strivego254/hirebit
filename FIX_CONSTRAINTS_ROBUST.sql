-- ============================================================================
-- ROBUST FIX: Remove Foreign Key Constraints (handles any constraint name)
-- This version finds and drops foreign keys even if they have different names
-- Copy and paste ALL of this into Supabase SQL Editor and click RUN
-- ============================================================================

-- STEP 1: Drop Foreign Key Constraints from applicants table (any name)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'applicants'::regclass 
        AND contype = 'f'
        AND conkey::int[] @> ARRAY[
            (SELECT attnum FROM pg_attribute 
             WHERE attrelid = 'applicants'::regclass 
             AND attname = 'job_posting_id')
        ]
    ) LOOP
        EXECUTE format('ALTER TABLE applicants DROP CONSTRAINT %I', r.conname);
        RAISE NOTICE 'Dropped foreign key constraint: %', r.conname;
    END LOOP;
END $$;

-- STEP 2: Drop Foreign Key Constraints from recruitment_analytics table (any name)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'recruitment_analytics'::regclass 
        AND contype = 'f'
        AND conkey::int[] @> ARRAY[
            (SELECT attnum FROM pg_attribute 
             WHERE attrelid = 'recruitment_analytics'::regclass 
             AND attname = 'job_posting_id')
        ]
    ) LOOP
        EXECUTE format('ALTER TABLE recruitment_analytics DROP CONSTRAINT %I', r.conname);
        RAISE NOTICE 'Dropped foreign key constraint: %', r.conname;
    END LOOP;
END $$;

-- STEP 3: Drop all existing RLS policies on applicants
DROP POLICY IF EXISTS "Users can view applicants for their job postings" ON applicants;
DROP POLICY IF EXISTS "System can insert applicants" ON applicants;
DROP POLICY IF EXISTS "System can update applicants" ON applicants;
DROP POLICY IF EXISTS "Allow service role inserts" ON applicants;
DROP POLICY IF EXISTS "Allow service role updates" ON applicants;
DROP POLICY IF EXISTS "Allow all inserts for applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all updates for applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all selects on applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all inserts on applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all updates on applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all deletes on applicants" ON applicants;

-- STEP 4: Create new RLS policies for applicants (allow everything)
CREATE POLICY "Allow all selects on applicants" ON applicants FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on applicants" ON applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on applicants" ON applicants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deletes on applicants" ON applicants FOR DELETE USING (true);

-- STEP 5: Drop all existing RLS policies on recruitment_analytics
DROP POLICY IF EXISTS "Users can view analytics for their job postings" ON recruitment_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow service role inserts" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow service role updates" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all inserts for recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all updates for recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all selects on recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all inserts on recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all updates on recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all deletes on recruitment_analytics" ON recruitment_analytics;

-- STEP 6: Create new RLS policies for recruitment_analytics (allow everything)
CREATE POLICY "Allow all selects on recruitment_analytics" ON recruitment_analytics FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on recruitment_analytics" ON recruitment_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on recruitment_analytics" ON recruitment_analytics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deletes on recruitment_analytics" ON recruitment_analytics FOR DELETE USING (true);

-- ============================================================================
-- DONE! Your tables are now ready for n8n inserts without any restrictions
-- ============================================================================

