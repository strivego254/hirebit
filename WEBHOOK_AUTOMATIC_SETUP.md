# Automatic Webhook Setup Guide

## Overview

This guide will help you set up automatic webhook triggers so that when you create a job posting, the webhook is automatically sent to N8N without needing to manually trigger it first.

## Problem Solved

Previously, job postings were saved to the database but the webhook to N8N had to be triggered manually. This solution implements:

1. **Immediate webhook triggering** when job postings are created
2. **Automatic retry mechanism** for failed webhooks
3. **Database triggers** as a backup method
4. **Enhanced error handling** and logging

## Setup Instructions

### Step 1: Environment Variables

Make sure your `.env.local` file has the correct webhook URL:

```env
# N8N Webhook URLs
N8N_WEBHOOK_URL=your_n8n_webhook_url_here
N8N_INCOMING_WEBHOOK_URL=your_n8n_incoming_webhook_url_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 2: Database Setup (Optional - Advanced)

If you want to use database triggers as a backup method, run the SQL script:

1. Open your Supabase SQL editor
2. Run the contents of `database-trigger-function.sql`
3. Replace `https://your-app-domain.com` with your actual app domain

### Step 3: N8N Configuration

Make sure your N8N workflow is set up correctly:

1. **Webhook Node Configuration:**
   - HTTP Method: POST
   - Response Mode: "When Last Node Finishes" (recommended)
   - Or add a "Respond to Webhook" node at the end

2. **Test your N8N webhook URL** using the test endpoint in your app

### Step 4: Test the Automatic Webhook

1. Go to your dashboard
2. Click "Create New Job"
3. Fill out the form and submit
4. Check the browser console for webhook logs
5. Verify the data reaches N8N automatically

## How It Works Now

### Immediate Triggering
- When a job posting is created, the webhook is triggered immediately
- No more waiting or manual triggering required
- Enhanced error handling with detailed logging

### Automatic Retry
- If the webhook fails, it automatically retries after 5 seconds
- Up to 5 retry attempts with exponential backoff
- Database is updated when webhook succeeds

### Multiple Trigger Methods
1. **Primary**: Immediate webhook trigger in the frontend
2. **Backup**: Database trigger (if configured)
3. **Manual**: Test webhook endpoint for debugging

## Troubleshooting

### Check Webhook Status
Look for these console messages:
- `🚀 Starting automatic webhook trigger for job: [job-id]`
- `✅ Webhook auto-triggered successfully for job: [job-id]`
- `❌ Webhook auto-trigger failed for job: [job-id]`

### Common Issues

1. **N8N Webhook URL not set**
   - Check your `.env.local` file
   - Make sure `N8N_WEBHOOK_URL` is set correctly

2. **N8N workflow not responding**
   - Check your N8N workflow is active
   - Verify the webhook node configuration
   - Test the webhook URL directly

3. **Network timeouts**
   - The system now has 30-second timeouts
   - Automatic retry with exponential backoff
   - Check your network connection

### Debug Mode

To enable detailed logging, check the browser console for:
- Webhook request/response details
- Retry attempts and timing
- Database update confirmations

## API Endpoints

### New Endpoints Added

1. **Database Trigger Webhook**: `/api/webhooks/database-trigger`
   - Used by database triggers
   - Fetches job data and triggers webhook

2. **Enhanced Webhook Service**
   - Better error handling
   - Automatic retry with exponential backoff
   - Detailed logging and monitoring

## Monitoring

### Check Webhook Status in Database

Query to check webhook status:
```sql
SELECT 
    id,
    job_title,
    company_name,
    created_at,
    n8n_webhook_sent,
    CASE 
        WHEN n8n_webhook_sent = true THEN 'Sent'
        WHEN created_at < NOW() - INTERVAL '5 minutes' THEN 'Failed'
        ELSE 'Pending'
    END as webhook_status
FROM job_postings
ORDER BY created_at DESC;
```

### Manual Webhook Trigger

If needed, you can manually trigger a webhook for a specific job:
```sql
SELECT manual_trigger_webhook('your-job-id');
```

## Success Indicators

You'll know the automatic webhook is working when:

1. ✅ Job postings are created successfully
2. ✅ Console shows "Webhook auto-triggered successfully"
3. ✅ Data appears in N8N without manual intervention
4. ✅ Database shows `n8n_webhook_sent = true`

## Support

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify your N8N webhook URL is correct
3. Test the webhook endpoint directly
4. Check your network connection and firewall settings

The system now provides comprehensive logging to help identify and resolve any issues quickly.
