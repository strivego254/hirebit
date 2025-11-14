-- Fix for job postings delete functionality
-- Run this SQL in your Supabase SQL editor

-- Add the missing DELETE policy for job_postings
CREATE POLICY "Users can delete job postings for their company" ON job_postings
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );
