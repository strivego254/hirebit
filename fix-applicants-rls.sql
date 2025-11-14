-- Fix RLS policies for applicants table to allow n8n Supabase node inserts
-- Run this SQL in your Supabase SQL editor
-- This allows the Supabase node in n8n to insert/update applicants using service role key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "System can insert applicants" ON applicants;
DROP POLICY IF EXISTS "System can update applicants" ON applicants;
DROP POLICY IF EXISTS "Allow service role inserts" ON applicants;
DROP POLICY IF EXISTS "Allow service role updates" ON applicants;
DROP POLICY IF EXISTS "Allow all inserts for applicants" ON applicants;
DROP POLICY IF EXISTS "Allow all updates for applicants" ON applicants;

-- Create a policy that allows ALL inserts (for n8n service role)
-- This bypasses RLS checks for inserts from service role key
CREATE POLICY "Allow all inserts for applicants" ON applicants
    FOR INSERT 
    WITH CHECK (true);

-- Create a policy that allows ALL updates (for n8n service role)
CREATE POLICY "Allow all updates for applicants" ON applicants
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);

-- The existing SELECT policy for users viewing their applicants remains unchanged
-- Users can view applicants for their job postings
-- (This policy should already exist from your schema)

-- Verify the policies
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

