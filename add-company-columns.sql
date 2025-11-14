-- Add company columns to job_postings table
-- Run this SQL in your Supabase SQL editor

-- Add the three company columns to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS hr_email TEXT;

-- Update existing records to have default values (optional)
-- You can run this if you have existing job postings that need default values
UPDATE job_postings 
SET 
    company_name = 'Default Company',
    company_email = 'company@example.com',
    hr_email = 'hr@example.com'
WHERE company_name IS NULL OR company_email IS NULL OR hr_email IS NULL;

-- Make the columns NOT NULL after updating existing records
-- (Uncomment these lines after running the UPDATE above)
-- ALTER TABLE job_postings ALTER COLUMN company_name SET NOT NULL;
-- ALTER TABLE job_postings ALTER COLUMN company_email SET NOT NULL;
-- ALTER TABLE job_postings ALTER COLUMN hr_email SET NOT NULL;
