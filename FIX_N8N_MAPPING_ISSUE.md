# Fix N8N Mapping Issue - Applicants Insert

## The Problem

Your n8n workflow is mapping the **WRONG VALUE** for `job_posting_id`!

**Left Panel (INPUT)** shows:
- `job_posting_id`: `4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace` ✅ CORRECT ID

**Center Panel (Configuration)** shows:
- `job_posting_id`: `{{ $json.output.job_posting_id }}` 
- Current value: `0e8c175f-e783-4e74-a306-d23d3601355c` ❌ WRONG ID

**The Error:**
You're trying to use `0e8c175f-e783-4e74-a306-d23d3601355c` which is a `company_id`, not a `job_posting_id`!

## The Root Cause

The n8n expression `{{ $json.output.job_posting_id }}` is pulling the wrong value from somewhere in your workflow. 

Looking at your **left panel INPUT**, the correct `job_posting_id` is at: `{{ $json.body.job_posting_id }}`

## The Fix

### Step 1: Find Where Your Data Is

Look at your **left panel INPUT** in the first image:

```
body
  job_posting_id: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace  ← CORRECT VALUE HERE
  company_id: 0e8c175f-e783-4e74-a306-d23d3601355c     ← This is what you're using by mistake!
```

The issue is your node is using `{{ $json.output.job_posting_id }}` which resolves to the wrong value.

### Step 2: Fix the Expression

In your **n8n "Insert rows in a table" node**, change:

**WRONG:**
```
{{ $json.output.job_posting_id }}
```

**CORRECT:**
You need to trace where the data is coming from. Based on your INPUT panel, try:

```
{{ $json.body.job_posting_id }}
```

OR if it comes from a different node:

```
{{ $json.job_posting_id }}
```

OR if there's a specific node output:

```
{{ $('Node Name').item.json.job_posting_id }}
```

### Step 3: How to Fix in n8n

1. **Open your n8n workflow**
2. **Click on the "Insert rows in a table" node**
3. **Find the "Values to Send" section**
4. **Look for `job_posting_id` field**
5. **Change the expression from:**
   ```
   {{ $json.output.job_posting_id }}
   ```
   **To one of these:**
   ```
   {{ $json.body.job_posting_id }}
   ```
   OR
   ```
   {{ $json.job_posting_id }}
   ```
   OR click the "Expression" helper and navigate to where the correct value is

6. **Click "Execute" or "Run" to test**

### Step 4: Verify the Fix

After changing the expression, when you run the node:

**Center Panel should show:**
```
job_posting_id: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace ✅
```

NOT:
```
job_posting_id: 0e8c175f-e783-4e74-a306-d23d3601355c ❌
```

## Alternative: N8N Expression Builder

If you're unsure, use n8n's Expression Builder:

1. In your "Insert rows in a table" node
2. Click the **Expression Builder** icon (f(x) or similar)
3. Navigate through the data structure:
   - Look for `body` → `job_posting_id`
   - Find where `4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace` appears
4. Select that path
5. The correct expression will be generated

## Quick Test

Before fixing the workflow, manually test which expression works:

Run each of these one by one and see which gives you `4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace`:

1. `{{ $json.body.job_posting_id }}`
2. `{{ $json.job_posting_id }}`
3. `{{ $json.output.job_posting_id }}`
4. `{{ $json.params.job_posting_id }}`

Whichever returns the correct UUID is the one to use!

## Visual Guide

Your workflow flow should be:
```
[Webhook/Trigger] 
  → Provides: job_posting_id = 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace
    ↓
[Information Extractor]
  → Still has: job_posting_id = 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace
    ↓
[Insert rows in a table] ← YOU ARE HERE
  → Currently getting: 0e8c175f-e783-4e74-a306-d23d3601355c ❌
  → Should get: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace ✅
```

## Still Not Working?

If changing the expression doesn't work:

1. **Check all nodes before "Insert rows in a table"**
2. **See what data each node is outputting**
3. **Find where `job_posting_id` is getting changed**
4. **There might be a transformation or mapping node that's overwriting it**

You might have a node that's mapping `company_id` to `job_posting_id` by accident!

## Summary

✅ **No SQL changes needed**  
✅ **Foreign key is working correctly**  
✅ **Just fix the n8n expression**  
✅ **Use:** `{{ $json.body.job_posting_id }}` or find where the correct value is

The foreign key is **protecting you** - once you use the correct `job_posting_id`, the insert will work perfectly!

