# FIX YOUR N8N WORKFLOW RIGHT NOW

## The Problem in Your First Image

**Left Panel shows the CORRECT value:**
```
job_posting_id: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace  ← USE THIS!
```

**Center Panel is using the WRONG value:**
```
job_posting_id: 0e8c175f-e783-4e74-a306-d23d3601355c  ← This is company_id! STOP!
```

## The Fix (30 Seconds)

### In Your n8n Workflow:

1. **Click** on "Insert rows in a table" node
2. **Find** the `job_posting_id` field in "Values to Send"
3. **Replace** the expression with:

```javascript
{{ $json.body.job_posting_id }}
```

OR if that doesn't work, try:

```javascript
{{ $('Information Extractor').item.json.output.job_posting_id }}
```

OR even simpler:

```javascript
{{ $json.job_posting_id }}
```

4. Click **Execute** to test

The center panel should now show:
```
job_posting_id: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace ✅
```

## How to Find the Right Expression

Your left panel shows the data structure. Look for where the correct value appears:

```
body
  ↓
  job_posting_id: 4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace  ← IT'S HERE!
```

So the expression should be:
```
{{ $json.body.job_posting_id }}
```

## If Still Failing

Use the Expression Builder in n8n:
1. Click the **Expression** button next to `job_posting_id`
2. Navigate to: `body` → `job_posting_id`
3. Select it
4. Done!

## That's It!

Your SQL database is **perfect**. The foreign key is **working correctly**. 

You just need to tell n8n to use the **correct UUID** from your input data!

**No SQL changes needed. Just fix the n8n expression.**

