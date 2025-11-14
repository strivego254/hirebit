# Fix for Update Row Node in n8n Workflow

## The Problem

1. **Wrong Filter Syntax**: You're using `id=fc12301c-4a76-4ada-8960-74ed72536056` but PostgREST requires `id.eq.fc12301c-4a76-4ada-8960-74ed72536056`

2. **Wrong ID Reference**: You're trying to update a row with ID `fc12301c-4a76-4ada-8960-74ed72536056`, but the row that was just created has ID `87a95cc0-d0cc-45b4-9d35-628d6ea8be85`

3. **Missing job_posting_id**: The created row has `job_posting_id: [null]`, and you want to update it with the actual job_posting_id from the job_postings table

## The Solution

### Step 1: Fix the Filter Syntax

In your "Update A Real Row" node:

1. **In the Filters section**, change from:
   ```
   id=fc12301c-4a76-4ada-8960-74ed72536056
   ```
   
   To:
   ```
   id.eq.{{ $('Create A Row').item.json.id }}
   ```

   This uses the **ID of the row that was just created** by the "Create A Row" node.

### Step 2: Update the job_posting_id Field

In the **"Fields to Send"** section, make sure you're updating the `job_posting_id`:

- **Field Name**: `job_posting_id`
- **Field Value**: `{{ $('Webhook').item.json.body.job_posting_id }}`

### Step 3: Complete Configuration

Your "Update A Real Row" node should have:

**Filters (String)**:
```
id.eq.{{ $('Create A Row').item.json.id }}
```

**Fields to Send**:
- `job_posting_id`: `{{ $('Webhook').item.json.body.job_posting_id }}`
- `total_applicants`: `{{ $json.total_applicants }}`
- `total_shortlisted`: `{{ $json.total_applicants_shortlisted }}`
- `total_rejected`: `{{ $json.total_applicants_rejected }}`
- `total_flagged`: `{{ $json.total_applicants_flagged_to_hr }}`
- `ai_overall_analysis`: `{{ $json.ai_overall_analysis }}`
- `processing_status`: `finished`
- `last_updated`: `{{ new Date().toISOString() }}`

## Alternative Solution: Use Upsert Instead

If you want to simplify this, you can use **Upsert** operation instead of Create + Update:

1. **Remove both nodes** (Create and Update)
2. **Add a single "Upsert" node**
3. **Configure it** to use `job_posting_id` as the unique identifier

This way, it will:
- Create a new row if job_posting_id doesn't exist
- Update existing row if job_posting_id already exists

## Why This Happens

- PostgREST (Supabase's REST API) uses specific filter syntax: `column.operator.value`
- Common operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `like`, `ilike`
- The `=` syntax doesn't work - you need `eq`
- When updating, you need to reference the row that was just created, not search for a different row

## Expected Result After Fix

After fixing the filter:
- ✅ **Create A Row** creates a new row with ID `87a95cc0-d0cc-45b4-9d35-628d6ea8be85`
- ✅ **Update A Real Row** finds that row using `id.eq.87a95cc0-d0cc-45b4-9d35-628d6ea8be85`
- ✅ **Updates the job_posting_id** with the correct value from job_postings table
- ✅ **Complete data** is stored in recruitment_analytics table
