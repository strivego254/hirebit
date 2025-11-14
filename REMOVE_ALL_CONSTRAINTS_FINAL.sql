-- ============================================================================
-- REMOVE ALL RESTRICTIONS FROM APPLICANTS AND RECRUITMENT_ANALYTICS TABLES
-- ============================================================================
-- This script removes foreign key constraints and ensures RLS allows all operations
-- Run this in Supabase SQL Editor to fix n8n Postgres node insert errors
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP FOREIGN KEY CONSTRAINTS FROM APPLICANTS TABLE
-- ============================================================================

-- Drop the foreign key constraint on job_posting_id in applicants table
DO $$ 
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'applicants_job_posting_id_fkey'
    ) THEN
        ALTER TABLE applicants 
        DROP CONSTRAINT applicants_job_posting_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint: applicants_job_posting_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint applicants_job_posting_id_fkey does not exist';
    END IF;
END $$;

-- Alternative: Drop by constraint name pattern (in case name differs)
DO $$ 
BEGIN
    -- Find and drop any foreign key on job_posting_id
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'applicants'::regclass 
        AND contype = 'f'
        AND conkey::int[] @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'applicants'::regclass AND attname = 'job_posting_id')]
    LOOP
        EXECUTE format('ALTER TABLE applicants DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP FOREIGN KEY CONSTRAINTS FROM RECRUITMENT_ANALYTICS TABLE
-- ============================================================================

-- Drop the foreign key constraint on job_posting_id in recruitment_analytics table
DO $$ 
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'recruitment_analytics_job_posting_id_fkey'
    ) THEN
        ALTER TABLE recruitment_analytics 
        DROP CONSTRAINT recruitment_analytics_job_posting_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint: recruitment_analytics_job_posting_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint recruitment_analytics_job_posting_id_fkey does not exist';
    END IF;
END $$;

-- Alternative: Drop by constraint name pattern
DO $$ 
BEGIN
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'recruitment_analytics'::regclass 
        AND contype = 'f'
        AND conkey::int[] @> ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'recruitment_analytics'::regclass AND attname = 'job_posting_id')]
    LOOP
        EXECUTE format('ALTER TABLE recruitment_analytics DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped foreign key constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: FIX RLS POLICIES FOR APPLICANTS TABLE
-- ============================================================================

-- Drop all existing policies on applicants table
DROP POLICY IF EXISTS "Users can view applicants for their job postings" ON applicants;
DROP POLICY IF EXISTS "System can insert applicants" ON applicants;
DROP POLICY IF EXISTS "System can update applicants" ON applicants;
DROP POLICY IF EXISTS "Allow service role inserts" ON applicants;
DROP POLICY IF EXISTS "Allow service role updates" ON applicants;
DROP POLICY IF EXISTS "Allow all inserts for applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all updates for applicants" ON applicants;

-- Create policies that allow ALL operations without restrictions
CREATE POLICY "Allow all selects on applicants" ON applicants
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow all inserts on applicants" ON applicants
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow all updates on applicants" ON applicants
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on applicants" ON applicants
    FOR DELETE 
    USING (true);

-- ============================================================================
-- STEP 4: FIX RLS POLICIES FOR RECRUITMENT_ANALYTICS TABLE
-- ============================================================================

-- Drop all existing policies on recruitment_analytics table
DROP POLICY IF EXISTS "Users can view analytics for their job postings" ON recruitment_analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "System can update analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow service role inserts" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow service role updates" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all inserts for recruitment_analytics" ON recruitment_analytics;
DROP POLICY IF EXISTS "Allow all updates for recruitment_analytics" ON recruitment_analytics;

-- Create policies that allow ALL operations without restrictions
CREATE POLICY "Allow all selects on recruitment_analytics" ON recruitment_analytics
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow all inserts on recruitment_analytics" ON recruitment_analytics
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow all updates on recruitment_analytics" ON recruitment_analytics
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all deletes on recruitment_analytics" ON recruitment_analytics
    FOR DELETE 
    USING (true);

-- ============================================================================
-- STEP 5: VERIFY CONSTRAINTS ARE REMOVED
-- ============================================================================

-- Show remaining foreign key constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('applicants', 'recruitment_analytics')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- STEP 6: VERIFY RLS POLICIES
-- ============================================================================

-- Show all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('applicants', 'recruitment_analytics')
ORDER BY tablename, policyname;

-- ============================================================================
-- COMPLETE: You should now be able to insert rows without foreign key errors
-- ============================================================================
-- Note: The unique constraint on (job_posting_id, email) in applicants table
-- will still prevent exact duplicates. If you want to remove that too, run:
-- ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_job_posting_id_email_key;
-- ============================================================================

