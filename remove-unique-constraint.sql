-- Remove Unique Constraint on recruitment_analytics.job_posting_id
-- This allows updating rows without duplicate key errors

-- Step 1: Drop the unique constraint
ALTER TABLE recruitment_analytics 
DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_key;

-- Step 2: Verify the constraint is removed
-- You can check this in Supabase by going to Table Editor > recruitment_analytics > View constraints

-- Note: This removes the unique constraint, allowing multiple analytics records per job posting
-- If you want to maintain uniqueness, consider using UPSERT operations instead
