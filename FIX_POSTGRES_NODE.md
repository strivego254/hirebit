# Fix Postgres Node Configuration in n8n

## The Problem

Your Postgres "Update id column in a table" node is configured incorrectly:
- ❌ **Matching on**: `total_applicants` (not unique, can match multiple rows)
- ❌ **Updating**: `job_posting_id` to a value that already exists (violates unique constraint)

## Solution 1: Remove Unique Constraint (What You Requested)

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this SQL**:
   ```sql
   ALTER TABLE recruitment_analytics 
   DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_key;
   ```
3. **Or use the file**: `remove-unique-constraint.sql`

## Solution 2: Fix n8n Node Configuration (Recommended)

Even after removing the constraint, you should fix your node configuration:

### Current Configuration (Wrong):
- **Columns to match on**: `total_applicants`
- **Values to Update**: `job_posting_id`, `id`, `total_applicants`

### Correct Configuration:

**Option A: Match on `job_posting_id` (Best)**:
1. **Columns to match on**: Change from `total_applicants` to `job_posting_id`
2. **Value for matching**: `{{ $json.job_posting_id }}`
3. **Values to Update**: Remove `job_posting_id` from updates (only update other fields)

**Option B: Match on `id` (If you want to update specific row)**:
1. **Columns to match on**: `id`
2. **Value for matching**: `{{ $('Create A Row').item.json.id }}` or `{{ $json.id }}`
3. **Values to Update**: All other fields except `id`

## Recommended Fix

### Step 1: Remove Unique Constraint (Run SQL)
```sql
ALTER TABLE recruitment_analytics 
DROP CONSTRAINT IF EXISTS recruitment_analytics_job_posting_id_key;
```

### Step 2: Update n8n Node Configuration

**In your "Update id column in a table" node**:

1. **Columns to match on**: 
   - Remove `total_applicants`
   - Add `job_posting_id`
   - Value: `{{ $json.job_posting_id }}`

2. **Values to Update**:
   - Keep: `total_applicants` → `{{ $('Create A Row').item.json.total_applicants }}`
   - Keep: `id` → `{{ $('Webhook').item.json.body.id }}`
   - **Remove**: `job_posting_id` (since you're matching on it, don't update it)
   - Add other fields as needed:
     - `total_applicants_shortlisted`: `{{ $json.total_applicants_shortlisted }}`
     - `total_applicants_rejected`: `{{ $json.total_applicants_rejected }}`
     - `total_applicants_flagged_to_hr`: `{{ $json.total_applicants_flagged_to_hr }}`
     - `ai_overall_analysis`: `{{ $json.ai_overall_analysis }}`
     - `processing_status`: `finished`
     - `last_updated`: `{{ new Date().toISOString() }}`

## Why This Happens

- **Unique constraint**: `job_posting_id` has a UNIQUE constraint (one analytics record per job)
- **Wrong matching**: Matching on `total_applicants` finds wrong/multiple rows
- **Conflict**: Trying to set `job_posting_id` to a value that exists in another row

## Expected Result After Fix

✅ **No duplicate key errors**
✅ **Correct row is updated** (matched by `job_posting_id`)
✅ **All analytics fields update correctly**
✅ **Dashboard displays updated data**

## Alternative: Use UPSERT Instead

If you want to keep the unique constraint, use UPSERT:

1. **Change operation** to **Insert** with **ON CONFLICT**
2. **Match on**: `job_posting_id`
3. **Update all fields** when conflict occurs

This approach maintains data integrity while allowing updates.
