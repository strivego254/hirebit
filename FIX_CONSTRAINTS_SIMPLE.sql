-- ============================================================================
-- SIMPLE FIX: Remove Foreign Key Constraints and Fix RLS Policies
-- Copy and paste ALL of this into Supabase SQL Editor and click RUN
-- ============================================================================

-- STEP 1: Drop Foreign Key Constraints (Simple Method)
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_job_posting_id_fkey;
ALTER TABLE recruitment_analytics DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_fkey;

-- STEP 2: Drop all existing RLS policies on applicants
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

-- STEP 3: Create new RLS policies for applicants (allow everything)
CREATE POLICY "Allow all selects on applicants" ON applicants FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on applicants" ON applicants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on applicants" ON applicants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deletes on applicants" ON applicants FOR DELETE USING (true);

-- STEP 4: Drop all existing RLS policies on recruitment_analytics
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

-- STEP 5: Create new RLS policies for recruitment_analytics (allow everything)
CREATE POLICY "Allow all selects on recruitment_analytics" ON recruitment_analytics FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on recruitment_analytics" ON recruitment_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on recruitment_analytics" ON recruitment_analytics FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deletes on recruitment_analytics" ON recruitment_analytics FOR DELETE USING (true);

-- ============================================================================
-- DONE! Your tables are now ready for n8n inserts without any restrictions
-- ============================================================================

