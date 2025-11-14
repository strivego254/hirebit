-- Fix RLS policies for applicants table to allow n8n Supabase node inserts
-- NOTE: For complete fix including foreign key removal, use REMOVE_ALL_CONSTRAINTS_FINAL.sql instead
-- Run this SQL in your Supabase SQL editor

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "System can insert applicants" ON applicants;
DROP POLICY IF EXISTS "System can update applicants" ON applicants;
DROP POLICY IF EXISTS "Allow service role inserts" ON applicants;
DROP POLICY IF EXISTS "Allow service role updates" ON applicants;
DROP POLICY IF EXISTS "Allow all inserts for applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all updates for applicants" ON applicants;

-- Create policies that allow ALL operations
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

-- Verify the policies were created
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
WHERE tablename = 'applicants'
ORDER BY policyname;

