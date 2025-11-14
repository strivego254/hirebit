# Complete Webhook Fix Guide

## The Root Cause
Your n8n workflow is running successfully, but the data isn't reaching your webhook endpoints because you're using an ngrok URL that requires manual activation.

## Solution 1: Fix Webhook URL Configuration

### Step 1: Get Your Production n8n Webhook URL

1. **Open your production n8n instance** (not ngrok)
2. **Go to your workflow**
3. **Click on your webhook node**
4. **Copy the production webhook URL** (should look like):
   - `https://your-n8n-instance.com/webhook/company-details`
   - `https://n8n.yourcompany.com/webhook/hr-data`

### Step 2: Update Your .env.local File

Replace the ngrok URL with your production URL:

```env
# N8N Webhook URLs - PRODUCTION (NOT NGROK)
N8N_WEBHOOK_URL=https://YOUR-ACTUAL-PRODUCTION-N8N-URL/webhook/company-details
N8N_INCOMING_WEBHOOK_URL=https://YOUR-ACTUAL-PRODUCTION-N8N-URL/webhook/incoming-data

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Step 3: Update n8n Webhook Node Settings

In your n8n workflow:

1. **Webhook Node Settings**:
   - HTTP Method: POST
   - Path: `/company-details`
   - **Response Mode: "When Last Node Finishes"** (IMPORTANT!)
   - Workflow Status: **ACTIVE/RUNNING**

2. **Respond to Webhook Node** (if using):
   - Response Body should include the candidate data as we configured earlier

### Step 4: Test the Fix

1. **Restart your development server**:
   ```bash
   npm run dev
   ```

2. **Create a new job posting**
3. **Check browser console** for webhook logs
4. **Check Supabase** - data should appear in `recruitment_analytics` table

## Solution 2: Add Supabase Node as Backup (Alternative)

If you prefer to have n8n directly write to Supabase, add a Supabase node to your workflow:

### Step 1: Add Supabase Node to n8n Workflow

1. **Add Supabase node** after your "Information Extractor" node
2. **Configure Supabase connection**:
   - Host: Your Supabase project URL
   - Database: postgres
   - User: postgres
   - Password: Your Supabase database password
   - Database: postgres

### Step 2: Configure Supabase Node

**Operation**: Insert
**Table**: `recruitment_analytics`
**Data**:
```json
{
  "job_posting_id": "{{ $('Webhook').item.json.body.job_posting_id }}",
  "total_applicants": 1,
  "total_shortlisted": "{{ $json.status === 'SHORTLIST' ? 1 : 0 }}",
  "total_rejected": "{{ $json.status === 'REJECT' ? 1 : 0 }}",
  "total_flagged": "{{ $json.status === 'FLAG TO HR' ? 1 : 0 }}",
  "ai_overall_analysis": "{{ $json.reasoning }}",
  "processing_status": "finished",
  "last_updated": "{{ new Date().toISOString() }}"
}
```

### Step 3: Add Second Supabase Node for Applicants

**Operation**: Insert
**Table**: `applicants`
**Data**:
```json
{
  "job_posting_id": "{{ $('Webhook').item.json.body.job_posting_id }}",
  "email": "{{ $json.email }}",
  "name": "{{ $json.candidate_name }}",
  "matching_score": "{{ $json.score }}",
  "status": "{{ $json.status === 'SHORTLIST' ? 'shortlisted' : $json.status === 'REJECT' ? 'rejected' : 'flagged' }}",
  "ai_reasoning": "{{ $json.reasoning }}",
  "processed_at": "{{ new Date().toISOString() }}"
}
```

## Solution 3: Hybrid Approach (Best of Both)

Use both approaches for maximum reliability:

1. **Primary**: Fix webhook URL to use production n8n
2. **Backup**: Add Supabase nodes in n8n workflow
3. **Fallback**: Keep current webhook endpoints as additional backup

## Testing Your Fix

### Check Webhook Endpoints Are Receiving Data

1. **Create a job posting**
2. **Check browser console** for logs like:
   ```
   📥 Received N8N webhook data from company-details endpoint
   🎯 Processing candidate data from n8n workflow
   ✅ Analytics updated successfully
   ```

3. **Check Supabase tables**:
   - `recruitment_analytics` should have new rows
   - `applicants` should have candidate data

### Verify Real-time Updates

1. **Dashboard should update automatically** when data arrives
2. **Applicant statistics should show** the processed candidates
3. **Job cards should display** webhook status as "Sent"

## Troubleshooting

### If Data Still Doesn't Appear:

1. **Check n8n logs** - is the workflow actually running?
2. **Check webhook URL** - is it pointing to production n8n?
3. **Check n8n webhook settings** - is Response Mode correct?
4. **Check Supabase RLS policies** - are they blocking inserts?

### Common Issues:

- **"Unused Respond to Webhook node"**: Change Response Mode to "When Last Node Finishes"
- **404 errors**: Webhook URL is incorrect or ngrok is not active
- **Empty tables**: Data isn't reaching webhook endpoints
- **No real-time updates**: Supabase real-time subscriptions not working

## Expected Results After Fix

✅ **Job creation shows immediate success message**
✅ **n8n workflow runs automatically**
✅ **Data appears in Supabase tables**
✅ **Dashboard updates in real-time**
✅ **Candidate information displays correctly**

The key is getting your production n8n webhook URL instead of using ngrok!
