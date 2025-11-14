-- CHECK DUPLICATE PROTECTION STATUS
-- Run this in Supabase SQL Editor to verify your protection

-- ============================================================================
-- STEP 1: Verify UNIQUE Constraint Exists
-- ============================================================================
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    CASE 
        WHEN tc.constraint_type = 'UNIQUE' THEN '✅ Duplicate prevention ACTIVE'
        ELSE '❌ Check this constraint'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'applicants'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_type;

-- Expected Result: Should show UNIQUE constraint on (job_posting_id, email)

-- ============================================================================
-- STEP 2: Check Current Data for Any Duplicates
-- ============================================================================
SELECT 
    email, 
    job_posting_id, 
    COUNT(*) as duplicate_count,
    CASE 
        WHEN COUNT(*) > 1 THEN '❌ DUPLICATE FOUND!'
        ELSE '✅ No duplicates'
    END as status
FROM applicants
GROUP BY email, job_posting_id
HAVING COUNT(*) > 1;

-- Expected Result: Empty (no duplicates) ✅

-- ============================================================================
-- STEP 3: Check All Applicants by Job
-- ============================================================================
SELECT 
    jp.job_title,
    jp.company_name,
    COUNT(a.id) as total_applicants,
    COUNT(DISTINCT a.email) as unique_emails,
    CASE 
        WHEN COUNT(a.id) = COUNT(DISTINCT a.email) THEN '✅ No duplicates'
        ELSE '⚠️ Potential duplicates'
    END as status
FROM job_postings jp
LEFT JOIN applicants a ON jp.id = a.job_posting_id
GROUP BY jp.id, jp.job_title, jp.company_name
ORDER BY jp.created_at DESC
LIMIT 10;

-- Expected Result: total_applicants = unique_emails for each job ✅

-- ============================================================================
-- STEP 4: List All Constraints on Applicants Table
-- ============================================================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.column_name) as columns
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'applicants'
    AND tc.table_schema = 'public'
GROUP BY tc.constraint_name, tc.constraint_type
ORDER BY tc.constraint_type, tc.constraint_name;

-- Expected Result: Should show UNIQUE constraint on (job_posting_id, email) ✅

-- ============================================================================
-- STEP 5: Test Foreign Key Protection
-- ============================================================================
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.constraint_type = 'FOREIGN KEY' THEN '✅ Foreign key ACTIVE'
        ELSE 'Other constraint'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'applicants'
    AND kcu.column_name = 'job_posting_id';

-- Expected Result: Foreign key to job_postings.id ✅

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
SELECT 
    '✅ Protection Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'applicants' 
                AND tc.constraint_type = 'UNIQUE'
                AND kcu.column_name IN ('job_posting_id', 'email')
        ) THEN '✅ UNIQUE constraint EXISTS'
        ELSE '❌ UNIQUE constraint MISSING'
    END as status

UNION ALL

SELECT 
    '✅ Current Data Health' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT email, job_posting_id, COUNT(*)
            FROM applicants
            GROUP BY email, job_posting_id
            HAVING COUNT(*) > 1
        ) THEN '❌ DUPLICATES FOUND in data'
        ELSE '✅ No duplicates in current data'
    END as status

UNION ALL

SELECT 
    '✅ Foreign Key Protection' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'applicants' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'job_posting_id'
        ) THEN '✅ Foreign key EXISTS'
        ELSE '❌ Foreign key MISSING'
    END as status;

-- Expected Results: All should show ✅

