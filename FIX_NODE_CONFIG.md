# Fix Postgres Update Node Configuration

## Current Problem

Your node configuration has these issues:

1. **Updating the matching column**: You're matching on `job_posting_id` BUT also trying to UPDATE `job_posting_id` in "Values to Update"
2. **Wrong id assignment**: Setting `id` to the same value as `job_posting_id` doesn't make sense

## Fix Your n8n Node Configuration

### Step 1: Remove job_posting_id from "Values to Update"

In your "Update id column in a table" node:

1. **In "Values to Update" section**, REMOVE:
   - ❌ `job_posting_id (using to match)` - **DO NOT UPDATE THIS!**

2. **Keep only these in "Values to Update"**:
   - ✅ `id` → `{{ $('Webhook').item.json.body.id }}` (the job posting ID)
   - ✅ `total_applicants` → `{{ $json.total_applicants }}`
   - ✅ Add other analytics fields:
     - `total_applicants_shortlisted` → `{{ $json.total_applicants_shortlisted }}`
     - `total_applicants_rejected` → `{{ $json.total_applicants_rejected }}`
     - `total_applicants_flagged_to_hr` → `{{ $json.total_applicants_flagged_to_hr }}`
     - `ai_overall_analysis` → `{{ $json.ai_overall_analysis }}`
     - `processing_status` → `finished`
     - `last_updated` → `{{ new Date().toISOString() }}`

### Step 2: Verify Column Matching

**Columns to match on** should be:
- `job_posting_id` → `{{ $json.job_posting_id }}`

**DO NOT** include `job_posting_id` in "Values to Update" - you're matching on it, so you shouldn't update it!

## Alternative: Use ID for Matching

If you want to update the row by its `id` instead:

1. **Columns to match on**: Change to `id`
 conferencet_value: `{{ $('Create A Row').item.json.id }}` (the analytics row ID)
2. **Values to Update**: Can include `job_posting_id` in this case

## Verify Constraint Removal

Before testing, run the SQL in `remove-all-constraints.sql` to ensure all constraints and indexes are removed.
