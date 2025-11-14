-- ============================================================================
-- OPTIONAL: Remove unique constraint on (job_posting_id, email) in applicants
-- ============================================================================
-- Only run this if you want to allow exact duplicate applicants
-- (same email for same job_posting_id)
-- ============================================================================

-- Drop unique constraint on applicants table
DO $$ 
BEGIN
    -- Drop by common constraint names
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'applicants_job_posting_id_email_key'
    ) THEN
        ALTER TABLE applicants 
        DROP CONSTRAINT applicants_job_posting_id_email_key;
        RAISE NOTICE 'Dropped unique constraint: applicants_job_posting_id_email_key';
    END IF;

    -- Alternative: Find unique constraint on these columns
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'applicants'::regclass 
        AND contype = 'u'
        AND conkey::int[] = ARRAY[
            (SELECT attnum FROM pg_attribute WHERE attrelid = 'applicants'::regclass AND attname = 'job_posting_id'),
            (SELECT attnum FROM pg_attribute WHERE attrelid = 'applicants'::regclass AND attname = 'email')
        ]
    LOOP
        EXECUTE format('ALTER TABLE applicants DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped unique constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Verify constraint is removed
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'applicants'::regclass
AND contype = 'u';

