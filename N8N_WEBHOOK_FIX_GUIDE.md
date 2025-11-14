# N8N Webhook Configuration Fix Guide

## The Problem
Your n8n "Respond to Webhook" node is only sending back a `respondURL` instead of the actual analyzed candidate data. This is why the dashboard isn't showing any candidate information.

## The Solution

### Step 1: Fix the "Respond to Webhook" Node Configuration

In your n8n workflow, update the "Respond to Webhook" node's **Response Body** to send the actual candidate data:

```json
{
  "candidates": [
    {
      "candidate_name": "{{ $json.candidate_name }}",
      "email": "{{ $json.email }}",
      "score": "{{ $json.score }}",
      "status": "{{ $json.status }}",
      "interview_meeting_link": "{{ $json.interview_meeting_link }}",
      "calendar_link": "{{ $json.calendar_link }}",
      "company_name": "{{ $json.company_name }}",
      "company_email_address": "{{ $json.company_email_address }}",
      "reasoning": "{{ $json.reasoning }}"
    }
  ],
  "job_posting_id": "{{ $('Webhook').item.json.job_posting_id }}",
  "company_name": "{{ $('Webhook').item.json.company_name }}",
  "job_title": "{{ $('Webhook').item.json.job_title }}"
}
```

### Step 2: Verify Webhook Node Settings

Make sure your initial "Webhook" trigger node has:
- **Respond**: Set to "Using 'Respond to Webhook' Node"
- **HTTP Method**: POST
- **Path**: `company-details` (or whatever path you're using)

### Step 3: Test the Complete Flow

1. **Create a Job Posting** in your dashboard
2. **Check n8n Logs** to see if the webhook receives the job data
3. **Check n8n Output** to see if the "Information Extractor" processes the candidate
4. **Check Dashboard** to see if candidate data appears in real-time

### Step 4: Debugging Steps

If the data still doesn't appear:

1. **Check n8n Webhook Response**:
   - Go to your n8n workflow execution
   - Click on the "Respond to Webhook" node
   - Check the "Response" tab to see what data is being sent back

2. **Check Dashboard Console**:
   - Open browser developer tools
   - Look for webhook-related logs
   - Check for any error messages

3. **Check Server Logs**:
   - Look at your Next.js server console
   - Check for webhook endpoint logs

### Step 5: Expected Data Flow

```
Dashboard Job Creation
    ↓ (webhook to n8n)
N8N Webhook Trigger
    ↓ (processes job data)
N8N Information Extractor
    ↓ (analyzes candidate)
N8N Respond to Webhook
    ↓ (sends candidate data back)
Dashboard Webhook Endpoint
    ↓ (stores in database)
Dashboard Real-time Update
    ↓ (shows candidate data)
```

### Step 6: Data Structure

The webhook should send data in this format:

```json
{
  "candidates": [
    {
      "candidate_name": "Donald James",
      "email": "fidelogola008@gmail.com",
      "score": 0,
      "status": "REJECT",
      "interview_meeting_link": "...",
      "calendar_link": "...",
      "company_name": "Britam",
      "company_email_address": "info@britam.com",
      "reasoning": "The candidate lacks the required technical skills..."
    }
  ],
  "job_posting_id": "25130849-ca0b-4bee-9a18-6c85856ac12e",
  "company_name": "Britam",
  "job_title": "WEB DESIGNER"
}
```

### Step 7: Verification

After making these changes:

1. **Create a new job posting**
2. **Wait for n8n to process** (should take a few seconds)
3. **Check the dashboard** - you should see:
   - Applicant statistics updated
   - Real-time data refresh
   - Candidate information displayed

### Troubleshooting

**If you still don't see data:**

1. Check that your n8n webhook URL is correct in your environment variables
2. Verify that the "Respond to Webhook" node is actually executing
3. Check that the webhook endpoint is receiving the data
4. Ensure the database is being updated with candidate information

**Common Issues:**

- **"Unused Respond to Webhook node" error**: This means the webhook node isn't properly connected or configured
- **Empty response**: The "Respond to Webhook" node isn't sending the candidate data
- **Database not updating**: The webhook endpoint isn't processing the candidate data correctly

### Next Steps

Once you've updated the n8n configuration:

1. Test with a new job posting
2. Monitor the logs for any errors
3. Verify that candidate data appears on the dashboard
4. Check that real-time updates are working

The key fix is updating the "Respond to Webhook" node to send the actual candidate data instead of just the `respondURL`.
