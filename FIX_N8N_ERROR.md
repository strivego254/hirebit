# Fix N8N Applicants Insert Error

## The Error You're Seeing

```
foreign key constraint "applicants_job_posting_id_fkey"
Key (job_posting_id)=(0e8c175f-e783-4e74-a306-d23d3601355c) is not present in table "job_postings"
```

## What This Means

Your n8n workflow is trying to insert an applicant with `job_posting_id = 0e8c175f-e783-4e74-a306-d23d3601355c`, but **that job posting doesn't exist** in your database!

## Why You Shouldn't Remove the Foreign Key

The foreign key is **PROTECTING YOU** from data corruption. Removing it would allow:
- Orphaned applicant records (applicants with no job)
- Invalid data relationships
- Dashboard showing applicants for non-existent jobs
- Analytics with broken references

## The REAL Problem

Your n8n workflow is receiving or generating a `job_posting_id` that doesn't exist in your `job_postings` table.

## How to Fix It

### Step 1: Verify the Issue

Run this in Supabase SQL Editor:

```sql
-- Check if the job exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM job_postings 
            WHERE id = '0e8c175f-e783-4e74-a306-d23d3601355c'
        ) 
        THEN 'EXISTS ✅' 
        ELSE 'DOES NOT EXIST ❌' 
    END as job_status;

-- See your actual job postings
SELECT 
    id,
    job_title,
    company_name,
    created_at,
    status
FROM job_postings
ORDER BY created_at DESC
LIMIT 10;
```

### Step 2: Check Your N8N Workflow

Look at where the `job_posting_id` is coming from:

1. **Webhook Trigger**: Is the webhook being called with the correct job ID?
2. **Data Transformation**: Is any node modifying or creating the job_posting_id?
3. **Hardcoded Value**: Is there a hardcoded old UUID somewhere?

### Step 3: Common Solutions

#### Option A: Use a Recent Job ID

```sql
-- Get the most recent job posting ID
SELECT id, job_title, company_name, created_at
FROM job_postings
ORDER BY created_at DESC
LIMIT 1;
```

Use this ID in your n8n workflow instead.

#### Option B: Fix the n8n Workflow Trigger

Your n8n workflow should:
1. Receive webhook from your app when a job is created
2. Extract the actual `job_posting_id` from the webhook payload
3. Use that ID when inserting applicants

Check that your webhook is sending the correct `job_posting_id`.

#### Option C: Create the Job First

Make sure your workflow:
1. **First** creates a job in `job_postings` table
2. **Then** uses that job's ID for applicant inserts
3. Don't use test/fake UUIDs

### Step 4: Temporary Workaround (NOT RECOMMENDED)

If you MUST insert applicants immediately for testing:

```sql
-- ONLY FOR EMERGENCY TESTING - Re-enable constraints after!
SET session_replication_role = 'replica';

-- Now run your n8n insert

-- Re-enable immediately:
SET session_replication_role = 'origin';
```

**⚠️ WARNING**: This allows invalid data. Only use temporarily!

## Recommended Fix

### Check Your N8N Incoming Webhook

Your webhook receives data with `job_posting_id`. Trace where it comes from:

1. Open your n8n workflow
2. Look at the "Information Extractor" node output
3. Check where `job_posting_id` is set
4. Verify it matches an actual job in your database

### Update Your N8N Workflow

In your "Insert rows in a table" node:

1. **Column**: `job_posting_id`
2. **Value**: `{{ $json.job_posting_id }}` (from webhook)
3. **Verify**: This value exists in `job_postings` table

### Test the Fix

1. Create a new job posting in your app
2. Verify it appears in Supabase `job_postings` table
3. Copy that job's ID
4. Use that ID in your n8n test
5. The insert should work

## Still Having Issues?

Check these:

1. **RLS Policies**: Ensure n8n can insert (policies exist in schema)
2. **Database Connection**: n8n has correct Supabase credentials
3. **Table Schema**: Column names match exactly (case-sensitive!)

Run this to verify RLS is set up correctly:

```sql
-- Check applicants RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'applicants';
```

You should see:
- "System can insert applicants" policy

## Summary

✅ **DO**: Fix your n8n workflow to use correct job_posting_id  
❌ **DON'T**: Remove the foreign key constraint  
✅ **DO**: Verify the job exists before inserting applicants  
❌ **DON'T**: Use fake/test UUIDs in production

The foreign key is working correctly - it's protecting you from bad data!

