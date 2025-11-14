# 🎯 N8N Supabase Node Setup Guide - Create Applicants Without Duplicates

This guide shows you how to configure the Supabase node in n8n to create applicant rows without duplicates.

## 🔍 The Problem

When using "Create" operation, you get this error:
```
duplicate key value violates unique constraint 'applicants_job_posting_id_email_key'
```

This happens because:
1. The table has a UNIQUE constraint on `(job_posting_id, email)`
2. "Create" operation fails when a duplicate exists
3. You need to use "Upsert" instead to handle duplicates gracefully

## ✅ Solution: Use "Upsert" Operation

### Step 1: Run SQL Fix in Supabase

First, run `fix-n8n-supabase-node.sql` in your Supabase SQL Editor to ensure RLS policies allow inserts.

### Step 2: Configure Supabase Node in n8n

#### A. Supabase Connection Settings

1. **Add Supabase Node** to your n8n workflow
2. **Create New Connection** or use existing
3. **Connection Settings**:
   - **Project URL**: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key**: ⚠️ **IMPORTANT**: Use your **Service Role Key**, NOT Anon Key
     - Get it from: Supabase Dashboard → Settings → API → `service_role` key (secret)
     - This bypasses RLS policies

#### B. Configure the Node Operation

**Operation**: Select **"Upsert Row"** (NOT "Create Row")

**Table**: `applicants`

#### C. Configure Upsert Settings

**Unique Conflict Columns**: `job_posting_id, email`

This tells Supabase:
- If a row with the same `(job_posting_id, email)` exists → **UPDATE** it
- If no row exists → **CREATE** a new one

#### D. Map Your Fields (Data to Send)

**Set "Data to Send" to**: `Define Below for Each Column`

**Field Mappings**:

| Column Name in Database | n8n Expression | Example Value |
|------------------------|----------------|---------------|
| `job_posting_id` | `{{ $json.output.job_posting_id }}` | `0e8c175f-e783-4e74-a306-d23d3601355c` |
| `email` | `{{ $json.output.email }}` | `email@example.com` |
| `name` | `{{ $json.output.candidate_name }}` | `KIPTOO CALEB` |
| `matching_score` | `{{ $json.output.score }}` | `48` |
| `status` | `{{ $json.output.status === 'SHORTLIST' ? 'shortlisted' : ($json.output.status === 'REJECT' ? 'rejected' : 'flagged') }}` | `rejected` |
| `ai_reasoning` | `{{ $json.output.reasoning }}` | `Detailed reasoning text...` |
| `cv_url` | `{{ $json.output.cv_url }}` (if available) | (optional) |
| `processed_at` | `{{ $now.toISO() }}` | Current timestamp |

### Step 3: Complete Field Configuration

Here's the exact configuration for your workflow based on the error image:

**Fields to Send** (define each column):

```json
{
  "job_posting_id": "{{ $json.output.job_posting_id }}",
  "email": "{{ $json.output.email }}",
  "name": "{{ $json.output.candidate_name }}",
  "matching_score": "{{ $json.output.score }}",
  "status": "{{ $json.output.status === 'SHORTLIST' ? 'shortlisted' : ($json.output.status === 'REJECT' ? 'rejected' : 'flagged') }}",
  "ai_reasoning": "{{ $json.output.reasoning }}",
  "processed_at": "{{ $now.toISO() }}"
}
```

## ⚠️ Important Column Name Fixes

**WRONG** (from your error):
- ❌ `APPLICANT_NAME` → Should be `name`
- ❌ `APPLICANT_EMAIL` → Should be `email`

**CORRECT**:
- ✅ `name` (lowercase)
- ✅ `email` (lowercase)
- ✅ `job_posting_id` (snake_case)
- ✅ `matching_score` (snake_case)
- ✅ `ai_reasoning` (snake_case)

## 📋 Complete Node Configuration Summary

```
Node: "Create or Update Applicant Row"
Operation: Upsert Row
Table: applicants
Unique Conflict Columns: job_posting_id, email

Fields to Send:
  job_posting_id: {{ $json.output.job_posting_id }}
  email: {{ $json.output.email }}
  name: {{ $json.output.candidate_name }}
  matching_score: {{ $json.output.score }}
  status: {{ $json.output.status === 'SHORTLIST' ? 'shortlisted' : ($json.output.status === 'REJECT' ? 'rejected' : 'flagged') }}
  ai_reasoning: {{ $json.output.reasoning }}
  processed_at: {{ $now.toISO() }}
```

## 🎯 How Upsert Works

With **Upsert** and conflict columns `job_posting_id, email`:

1. **New Applicant**: If `(job_posting_id, email)` doesn't exist → Creates new row ✅
2. **Duplicate Applicant**: If `(job_posting_id, email)` exists → Updates existing row ✅
3. **No Errors**: No more duplicate key violations! ✅

## 🔧 Status Value Mapping

Map n8n status values to database values:

| n8n Status | Database Status |
|------------|----------------|
| `SHORTLIST` | `shortlisted` |
| `REJECT` | `rejected` |
| `FLAG TO HR` | `flagged` |
| (default) | `pending` |

Use this expression in n8n:
```javascript
{{ $json.output.status === 'SHORTLIST' ? 'shortlisted' : ($json.output.status === 'REJECT' ? 'rejected' : ($json.output.status === 'FLAG TO HR' ? 'flagged' : 'pending')) }}
```

## ✅ Testing

After configuration:

1. **Test with new applicant**: Should create a new row
2. **Test with duplicate**: Should update existing row (no error)
3. **Verify in Supabase**: Check the `applicants` table to see results

## 🚨 Troubleshooting

### Error: "new row violates row-level security policy"
- **Solution**: Make sure you're using **Service Role Key** (not Anon Key)
- **Fix**: Run `fix-n8n-supabase-node.sql` in Supabase SQL Editor

### Error: "duplicate key value violates unique constraint"
- **Solution**: Change operation from "Create" to "Upsert"
- **Check**: Set "Unique Conflict Columns" to `job_posting_id, email`

### Error: "column 'APPLICANT_EMAIL' does not exist"
- **Solution**: Use correct column name `email` (lowercase, not `APPLICANT_EMAIL`)

### Error: "invalid input syntax for type uuid"
- **Solution**: Verify `job_posting_id` is a valid UUID format
- **Check**: Expression `{{ $json.output.job_posting_id }}` returns valid UUID

### Error: "null value in column 'email' violates not-null constraint"
- **Solution**: Ensure email field is mapped correctly
- **Check**: `{{ $json.output.email }}` has a value

## 📊 Expected Results

After successful configuration:

**First Run** (new applicant):
- ✅ Creates new row
- ✅ Returns created applicant data
- ✅ No errors

**Subsequent Runs** (duplicate):
- ✅ Updates existing row
- ✅ Returns updated applicant data
- ✅ No errors (no duplicate key violation)

## 🎉 Summary

1. ✅ Use **"Upsert Row"** operation (not "Create Row")
2. ✅ Set **Unique Conflict Columns** to `job_posting_id, email`
3. ✅ Use **Service Role Key** for authentication
4. ✅ Use correct column names (`email`, `name`, not `APPLICANT_EMAIL`, `APPLICANT_NAME`)
5. ✅ Run `fix-n8n-supabase-node.sql` to fix RLS policies

Your n8n workflow will now create/update applicants without duplicate errors! 🚀

