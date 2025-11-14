# Database Migration Instructions

## How to Run the Application Deadline Migration

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New query"** to create a fresh SQL tab

### Step 2: Copy the SQL Below
Copy this entire SQL block:

```sql
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
```

### Step 3: Paste and Execute
1. Paste the SQL into the editor
2. Click **"Run"** button (or press `Ctrl+Enter`)
3. Wait for execution to complete

### Step 4: Verify Success
You should see results like:

```
column_name           | data_type              | is_nullable
----------------------+------------------------+------------
application_deadline  | timestamp with time zone| YES
```

**Expected Messages:**
- ✅ `ALTER TABLE` - Success
- ✅ `COMMENT` - Success  
- ✅ `CREATE INDEX` - Success
- ✅ `SELECT` - Returns the column info

### Troubleshooting

**Error: "relation job_postings does not exist"**
- Make sure you're in the correct database
- Verify your `job_postings` table exists

**Error: "permission denied"**
- Ensure you have admin/superuser permissions
- Try using the service role key

**Column already exists**
- The `IF NOT EXISTS` clause prevents errors
- The migration is safe to run multiple times

### What This Migration Does

1. ✅ Adds `application_deadline` column to `job_postings` table
2. ✅ Makes the column nullable (optional)
3. ✅ Creates an index for better query performance
4. ✅ Adds documentation comment to the column
5. ✅ Verifies the column was created successfully

### After Migration

Your job postings can now have an application deadline! The column is **nullable**, so existing jobs without deadlines will continue to work perfectly.

---

**Need Help?** Check the APPLICATION_DEADLINE_IMPLEMENTATION.md for full details.

