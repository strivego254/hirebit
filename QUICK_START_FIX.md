# ⚡ QUICK START: Fix n8n Foreign Key Errors

## 🎯 The Problem

You're getting this error in n8n:
```
insert or update on table "applicants" violates foreign key constraint "applicants_job_posting_id_fkey"
```

## ✅ The Solution (3 Simple Steps)

### Step 1: Open the SQL File
Open the file: **`FIX_CONSTRAINTS_SIMPLE.sql`**

### Step 2: Copy ALL the SQL Code
1. Press **Ctrl+A** (or Cmd+A on Mac) to select all
2. Press **Ctrl+C** (or Cmd+C on Mac) to copy

### Step 3: Run in Supabase
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Press **Ctrl+V** (or Cmd+V on Mac) to paste
4. Click **RUN** button (or press Ctrl+Enter)

## 🎉 Done!

After running the SQL:
- ✅ Foreign key constraints removed
- ✅ RLS policies fixed
- ✅ You can now insert into `applicants` and `recruitment_analytics` tables
- ✅ No more foreign key errors in n8n!

## 📁 Which File to Use?

- **`FIX_CONSTRAINTS_SIMPLE.sql`** ← **Start with this one** (simplest)
- **`FIX_CONSTRAINTS_ROBUST.sql`** ← Use this if the simple one doesn't work

## ⚠️ Important

**DO NOT**:
- ❌ Try to run the filename as SQL
- ❌ Run only part of the file

**DO**:
- ✅ Copy the ENTIRE file contents
- ✅ Paste it into Supabase SQL Editor
- ✅ Run it all at once

## 🆘 Still Having Issues?

If `FIX_CONSTRAINTS_SIMPLE.sql` doesn't work, try `FIX_CONSTRAINTS_ROBUST.sql` which automatically finds and drops foreign keys regardless of their names.

