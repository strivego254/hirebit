# ⚡ Quick Setup: Fix n8n Supabase Node for Applicants

## 🚀 Quick Steps

### 1. Run SQL in Supabase
Execute `fix-n8n-supabase-node.sql` in Supabase SQL Editor.

### 2. Configure n8n Supabase Node

**Operation**: Change from `Create Row` to **`Upsert Row`**

**Table**: `applicants`

**Unique Conflict Columns**: `job_posting_id, email`

**Authentication**: Use **Service Role Key** (not Anon Key)

### 3. Fix Column Names

Use these exact column names (lowercase, snake_case):

| Database Column | n8n Expression |
|----------------|----------------|
| `job_posting_id` | `{{ $json.output.job_posting_id }}` |
| `email` | `{{ $json.output.email }}` |
| `name` | `{{ $json.output.candidate_name }}` |
| `matching_score` | `{{ $json.output.score }}` |
| `status` | `{{ $json.output.status === 'SHORTLIST' ? 'shortlisted' : ($json.output.status === 'REJECT' ? 'rejected' : 'flagged') }}` |
| `ai_reasoning` | `{{ $json.output.reasoning }}` |
| `processed_at` | `{{ $now.toISO() }}` |

⚠️ **Fix**: Replace `APPLICANT_NAME` → `name` and `APPLICANT_EMAIL` → `email`

## ✅ Result
- ✅ No duplicate errors
- ✅ Updates existing applicants automatically
- ✅ Creates new applicants when needed

See `N8N_SUPABASE_NODE_SETUP.md` for detailed instructions.

