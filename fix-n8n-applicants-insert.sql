-- FIX N8N Applicants Insert Issue
-- DO NOT REMOVE THE FOREIGN KEY - it protects your data integrity!
-- The issue is that n8n is trying to insert applicants for a job_posting_id that doesn't exist

-- ============================================================================
-- STEP 1: Check if the job_posting_id exists in your database
-- ============================================================================
SELECT id, job_title, company_name, created_at
FROM job_postings
WHERE id = '0e8c175f-e783-4e74-a306-d23d3601355c';

-- If NO results appear, that's the problem - the job doesn't exist!

-- ============================================================================
-- SOLUTION 2 (ONLY IF YOU ABSOLUTELY NEED TO): Temporarily disable constraint checking
-- ============================================================================
-- WARNING: This is DANGEROUS and should ONLY be used temporarily for testing
-- This will allow invalid data to be inserted, which can cause major issues later

-- Step 1: Disable constraint checking (ONLY for this session)
SET session_replication_role = 'replica';

-- Step 2: Now insert your data in n8n
-- Your n8n insert should work now

-- Step 3: Re-enable constraint checking immediately after
SET session_replication_role = 'origin';

-- ============================================================================
-- RECOMMENDED: Check your n8n workflow configuration
-- ============================================================================
-- The real solution is to fix your n8n workflow:
-- 1. Make sure the job is created FIRST in Supabase
-- 2. Get the actual job_posting_id from the created job
-- 3. Use that ID when inserting applicants

-- Check all your job postings:
SELECT id, job_title, company_name, created_at
FROM job_postings
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- FIX: Update RLS policies to allow system inserts
-- ============================================================================
-- The constraint is fine, but ensure RLS allows the insert
-- This policy should already exist, but verify it:

DROP POLICY IF EXISTS "System can insert applicants" ON applicants;
CREATE POLICY "System can insert applicants" ON applicants
    FOR INSERT WITH CHECK (true);

-- Also allow updates:
DROP POLICY IF EXISTS "System can update applicants" ON applicants;
CREATE POLICY "System can update applicants" ON applicants
    FOR UPDATE USING (true);

-- Verify the policies exist:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'applicants';

-- ============================================================================
-- SAFE ALTERNATIVE: Temporarily make the constraint less strict
-- ============================================================================
-- This is better than removing the constraint entirely
-- It allows inserts even if the job doesn't exist yet (NOT RECOMMENDED FOR PRODUCTION)

-- First, find the constraint name:
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'applicants'
    AND kcu.column_name = 'job_posting_id';

-- If you absolutely must remove it temporarily:
-- ALTER TABLE applicants DROP CONSTRAINT applicants_job_posting_id_fkey;

-- Re-add it later:
-- ALTER TABLE applicants ADD CONSTRAINT applicants_job_posting_id_fkey
--     FOREIGN KEY (job_posting_id)
--     REFERENCES job_postings(id)
--     ON DELETE CASCADE;

-- ============================================================================
-- DIAGNOSIS: Check your current data
-- ============================================================================

-- Check if you have any applicants:
SELECT COUNT(*) as total_applicants FROM applicants;

-- Check if you have any job postings:
SELECT COUNT(*) as total_jobs FROM job_postings;

-- Check recent job postings:
SELECT 
    id,
    job_title,
    company_name,
    created_at,
    status
FROM job_postings
ORDER BY created_at DESC
LIMIT 5;

-- Check if the specific job_posting_id exists:
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = '0e8c175f-e783-4e74-a306-d23d3601355c'
        ) 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as job_status;

