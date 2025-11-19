# Database Schema Summary

## 📊 Complete Schema Overview

This document summarizes the complete Supabase schema for the HireBit recruitment system.

## 🗂️ Tables

### 1. **companies**
Stores company information and settings.

**Columns:**
- `company_id` (uuid, PK) - Unique company identifier
- `company_name` (text) - Company name
- `company_email` (text) - Company contact email
- `hr_email` (text) - HR department email
- `hiring_manager_email` (text) - Hiring manager email
- `company_domain` (text) - Company domain
- `settings` (jsonb) - Company-specific settings
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- `idx_companies_domain` - On company_domain
- `idx_companies_hr_email` - On hr_email

---

### 2. **job_postings**
Stores job posting information with full-text search support.

**Columns:**
- `job_posting_id` (uuid, PK) - Unique job posting identifier
- `company_id` (uuid, FK → companies) - Associated company
- `job_title` (text) - Job title
- `job_description` (text) - Full job description
- `responsibilities` (text) - Job responsibilities
- `skills_required` (text[]) - Array of required skills
- `application_deadline` (timestamptz) - Application deadline
- `interview_slots` (jsonb) - Available interview time slots
- `interview_meeting_link` (text) - Interview meeting link
- `meeting_link` (text) - General meeting link
- `interview_start_time` (timestamptz) - Interview start time
- `status` (text) - Job status (ACTIVE, CLOSED, DRAFT)
- `webhook_receiver_url` (text) - Webhook URL for notifications
- `webhook_secret` (text) - Webhook secret
- `job_description_tsv` (tsvector) - Full-text search vector
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- `idx_job_postings_company` - On company_id
- `idx_job_postings_company_status_deadline` - Composite on (company_id, status, application_deadline)
- `idx_job_postings_status` - On status
- `idx_job_postings_deadline` - On application_deadline (partial, where not null)
- `idx_job_postings_skills_gin` - GIN index on skills_required array
- `idx_job_postings_description_tsv` - GIN index on full-text search vector

**Triggers:**
- `trg_job_postings_tsv` - Updates full-text search vector on insert/update
- `trg_job_postings_updated_at` - Updates updated_at timestamp

---

### 3. **applications**
Stores candidate applications with AI scoring.

**Columns:**
- `application_id` (uuid, PK) - Unique application identifier
- `job_posting_id` (uuid, FK → job_postings) - Associated job posting
- `company_id` (uuid, FK → companies) - Associated company
- `candidate_name` (text) - Candidate name
- `email` (text) - Candidate email
- `phone` (text) - Candidate phone
- `resume_url` (text) - URL to resume file
- `parsed_resume_json` (jsonb) - Parsed resume data
- `ai_score` (numeric) - AI-generated score (0-100)
- `ai_status` (ai_status_enum) - AI status: SHORTLIST, FLAG, REJECT
- `reasoning` (text) - AI reasoning for score/status
- `external_id` (text, UNIQUE) - External system ID
- `interview_time` (timestamptz) - Scheduled interview time
- `interview_link` (text) - Interview meeting link
- `interview_status` (text) - Interview status (PENDING, SCHEDULED, COMPLETED, CANCELLED)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Constraints:**
- `applications_unique` - Unique on (job_posting_id, email)

**Indexes:**
- `idx_applications_job` - On job_posting_id
- `idx_applications_company` - On company_id
- `idx_applications_email` - On email
- `idx_applications_ai_status` - On ai_status
- `idx_applications_interview_time` - On interview_time (partial, where not null)
- `idx_applications_interview_status` - On interview_status
- `idx_applications_created_at` - On created_at (descending)

**Triggers:**
- `trg_applications_updated_at` - Updates updated_at timestamp

---

### 4. **reports**
Stores post-deadline hiring reports.

**Columns:**
- `id` (uuid, PK) - Unique report identifier
- `job_posting_id` (uuid, FK → job_postings) - Associated job posting
- `company_id` (uuid, FK → companies) - Associated company
- `report_url` (text) - URL to report file
- `report_type` (text) - Type of report (post_deadline, weekly, monthly, etc.)
- `status` (text) - Report status (completed, pending, failed)
- `metadata` (jsonb) - Additional report metadata
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

**Indexes:**
- `idx_reports_job_posting` - On job_posting_id
- `idx_reports_company` - On company_id
- `idx_reports_created_at` - On created_at (descending)
- `idx_reports_status` - On status
- `idx_reports_job_unique` - Unique on job_posting_id where status = 'completed'

**Triggers:**
- `trg_reports_updated_at` - Updates updated_at timestamp

---

### 5. **job_schedules**
Stores scheduled tasks for job postings (cron jobs, reminders, etc.).

**Columns:**
- `id` (uuid, PK) - Unique schedule identifier
- `job_posting_id` (uuid, FK → job_postings) - Associated job posting
- `type` (text) - Schedule type (report_generation, reminder, etc.)
- `run_at` (timestamptz) - When to run the scheduled task
- `payload` (jsonb) - Task payload/data
- `executed` (boolean) - Whether task has been executed
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_job_schedules_due` - Composite on (run_at, executed)
- `idx_job_schedules_job` - On job_posting_id
- `idx_job_schedules_type` - On type

---

### 6. **audit_logs**
Stores audit trail for all system actions.

**Columns:**
- `id` (bigserial, PK) - Unique log identifier
- `action` (text) - Action performed
- `company_id` (uuid, FK → companies) - Associated company
- `job_posting_id` (uuid, FK → job_postings) - Associated job posting
- `candidate_id` (uuid, FK → applications) - Associated application
- `metadata` (jsonb) - Additional action metadata
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_audit_company` - On company_id
- `idx_audit_job` - On job_posting_id
- `idx_audit_candidate` - On candidate_id
- `idx_audit_created` - On created_at (descending)
- `idx_audit_action` - On action

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

1. **Service Role**: Full access to all tables (for backend operations)
2. **Authenticated Users**: Limited access based on company association

**Customization Required:**
- Link `auth.users` to companies via a junction table or email matching
- Update RLS policies to match your authentication setup

---

## 🔧 Functions

### `job_postings_tsv_trigger()`
Updates full-text search vector when job posting is inserted or updated.

### `update_updated_at_column()`
Updates `updated_at` timestamp on table updates.

### `get_user_company_id(user_email text)`
Helper function to get company ID from user email (for RLS).

---

## 📈 Performance Optimizations

1. **Full-Text Search**: GIN index on `job_description_tsv` for fast text search
2. **Array Indexing**: GIN index on `skills_required` for array queries
3. **Composite Indexes**: Multi-column indexes for common query patterns
4. **Partial Indexes**: Indexes with WHERE clauses for filtered queries
5. **Automatic Timestamps**: Triggers maintain `updated_at` automatically

---

## 🔄 Relationships

```
companies (1) ──< (many) job_postings
companies (1) ──< (many) applications
companies (1) ──< (many) reports
job_postings (1) ──< (many) applications
job_postings (1) ──< (many) reports
job_postings (1) ──< (many) job_schedules
applications (1) ──< (many) audit_logs (via candidate_id)
```

---

## 📝 Notes

- All UUIDs use `gen_random_uuid()` (Supabase default)
- All timestamps use `timestamptz` (timezone-aware)
- JSONB columns allow flexible schema for metadata
- Full-text search uses PostgreSQL's built-in tsvector
- RLS policies can be customized based on your auth setup

