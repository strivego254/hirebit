-- Add application_deadline column to job_postings table
-- Run this SQL in your Supabase SQL editor

-- Add the application_deadline column to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE;

-- Add a comment to document the column
COMMENT ON COLUMN job_postings.application_deadline IS 'Deadline for receiving job applications from applicants';

-- Optional: Create an index if you'll be querying by deadline frequently
CREATE INDEX IF NOT EXISTS idx_job_postings_application_deadline 
ON job_postings(application_deadline);

-- Verify the column was added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'job_postings' 
AND column_name = 'application_deadline';

