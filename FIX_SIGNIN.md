# Fix Sign-In Error: "column role does not exist"

## Problem
The sign-in is failing because the database schema hasn't been fully executed. The `users` table is missing the `role` and `is_active` columns.

## Solution

### Option 1: Run Complete Schema (Recommended)
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qijibjotmwbikzwtkcut
2. Click on "SQL Editor" in the left sidebar
3. Open the file: `backend/src/db/complete_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute
7. Wait for it to complete (should show "Success")
8. Try signing in again

### Option 2: Quick Fix - Add Missing Columns
If you just need to add the columns quickly, run this SQL in Supabase SQL Editor:

```sql
-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'is_active') THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Update existing users
UPDATE users SET role = 'user' WHERE role IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Create admin user if it doesn't exist
INSERT INTO users (email, password_hash, role, is_active)
VALUES (
  'hirebitapplications@gmail.com',
  '$2b$10$jVhbE8a4vYJ1JRFkh.JsI.N9DrEJa6NrLcFzrbgdy6NgmO5SohAQm',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  role = 'admin',
  is_active = true;
```

## After Running Schema
1. Restart backend (if needed)
2. Try signing in with:
   - Email: `hirebitapplications@gmail.com`
   - Password: `Admin@hirebit2025`

## Verify
After running the schema, test the connection:
```bash
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"hirebitapplications@gmail.com","password":"Admin@hirebit2025"}'
```

Should return a token if successful.
