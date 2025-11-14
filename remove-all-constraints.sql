-- Verify and completely remove unique constraint on recruitment_analytics.job_posting_id
-- Run these commands in Supabase SQL Editor

-- Step 1: Check if the constraint still exists
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'recruitment_analytics'::regclass
AND conname LIKE '%job_posting_id%';

-- Step 2: Drop the constraint (try all possible variations)
ALTER TABLE recruitment_analytics 
DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_key;

ALTER TABLE recruitment_analytics 
DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_fkey;

-- Step 3: Check for unique indexes (these can also cause the error)
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'recruitment_analytics'
AND indexdef LIKE '%job_posting_id%';

-- Step 4: Drop any unique index on job_posting_id
DROP INDEX IF EXISTS recruitment_analytics_job_posting_id_key;
DROP INDEX IF EXISTS idx_recruitment_analytics_job_posting_id_key;

-- Step 5: Verify all constraints and indexes are removed
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'recruitment_analytics'::regclass;

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'recruitment_analytics';
