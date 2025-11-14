# Webhook Troubleshooting Guide

## Problem: "Unused Respond to Webhook node found in the workflow" Error

This is the most common n8n webhook configuration error. It occurs when your webhook node is set to "Response Node" mode but there's no "Respond to Webhook" node connected, or the workflow structure is incorrect.

## Problem: Data Not Reaching N8N Webhook Node Output

If your webhook is being triggered but the data isn't appearing in the N8N webhook node output, here are the most common causes and solutions:

## Quick Fix for "Unused Respond to Webhook node" Error

**IMMEDIATE SOLUTION**: In your n8n webhook node, change the **Response Mode** from "Response Node" to **"When Last Node Finishes"**.

### Step-by-Step Fix:

1. **Open your n8n workflow**
2. **Click on your webhook node**
3. **In the Parameters tab, find "Response Mode"**
4. **Change it from "Response Node" to "When Last Node Finishes"**
5. **Save the workflow**
6. **Activate the workflow**

This will immediately resolve the error and allow your webhook to work properly.

## Quick Diagnosis

1. **Use the Webhook Debug Tool**: Go to Settings → Webhook Debug Tool and run a full test
2. **Check Browser Console**: Look for webhook-related log messages
3. **Verify N8N Workflow**: Ensure your N8N workflow is active and properly configured

## Common Issues & Solutions

### 1. N8N Webhook Node Configuration Issues

**Problem**: Webhook node is not configured correctly
**Symptoms**: 
- Webhook receives data but doesn't pass it to next nodes
- "Unused Respond to Webhook node" error

**Solutions**:
1. **Change Response Mode**: In your N8N webhook node, change the "Response Mode" to "When Last Node Finishes"
2. **Add Respond to Webhook Node**: Add a "Respond to Webhook" node at the end of your workflow
3. **Check Workflow Activation**: Ensure your workflow is active and running

### 2. Payload Format Issues

**Problem**: N8N can't access the data in the expected format
**Symptoms**: 
- Data reaches N8N but appears empty or malformed
- Workflow runs but no data flows to subsequent nodes

**Solutions**:
1. **Check Data Structure**: The webhook now sends data in multiple formats:
   ```json
   {
     "job_posting_id": "uuid",
     "job_title": "title",
     "company_name": "name",
     // ... original fields
     "metadata": {
       "timestamp": "2024-01-01T00:00:00Z",
       "source": "hr-recruitment-ai-agent"
     },
     "company": {
       "name": "company_name",
       "email": "company_email"
     },
     "interview": {
       "date": "2024-01-01T00:00:00Z",
       "meeting_link": "url"
     }
   }
   ```

2. **Use Root Level Fields**: Access data using root-level fields like `{{ $json.job_title }}` instead of nested paths

### 3. Network and Connectivity Issues

**Problem**: Webhook requests are failing or timing out
**Symptoms**:
- Console shows webhook errors
- Debug tool shows connectivity failures

**Solutions**:
1. **Check Webhook URL**: Verify your `N8N_WEBHOOK_URL` environment variable is correct
2. **Test Connectivity**: Use the debug tool to test basic connectivity
3. **Check Firewall**: Ensure your server can make outbound HTTP requests to N8N

### 4. N8N Workflow Issues

**Problem**: Workflow is not processing the webhook data correctly
**Symptoms**:
- Data reaches N8N but workflow doesn't continue
- Workflow errors or stops unexpectedly

**Solutions**:
1. **Check Node Connections**: Ensure all nodes are properly connected
2. **Verify Node Configuration**: Check each node's settings and parameters
3. **Test with Sample Data**: Use the debug tool to send test data and verify workflow behavior

## Step-by-Step Troubleshooting

### Step 1: Run the Debug Tool

1. Go to your dashboard
2. Navigate to Settings
3. Scroll down to "Webhook Debug Tool"
4. Click "Run Debug Test" with "Full Test" selected
5. Review the results for any failures

### Step 2: Check N8N Webhook Node

1. Open your N8N workflow
2. Click on the webhook node
3. Verify these settings:
   - **HTTP Method**: POST
   - **Response Mode**: "When Last Node Finishes" (recommended)
   - **Path**: Should match your webhook URL path
   - **Authentication**: None (unless you've set up custom auth)

### Step 3: Test with Sample Data

1. Use the debug tool to send test data
2. Check if the data appears in your N8N webhook node
3. Verify the data structure matches what your workflow expects

### Step 4: Check Workflow Execution

1. In N8N, go to "Executions" tab
2. Look for recent executions
3. Check if the workflow completed successfully
4. Review any error messages

## Advanced Debugging

### Enable Detailed Logging

The system now includes comprehensive logging. Check your browser console for:

- `🚀 Starting automatic webhook trigger for job: [job-id]`
- `📤 Sending enhanced payload to N8N: [payload]`
- `📡 N8N Response Status: [status]`
- `✅ Webhook auto-triggered successfully` or `❌ Webhook failed`

### Manual Testing

You can also test the webhook manually:

1. **Test Basic Connectivity**:
   ```bash
   curl -X POST your_n8n_webhook_url \
     -H "Content-Type: application/json" \
     -d '{"test": true, "message": "connectivity test"}'
   ```

2. **Test with Sample Job Data**:
   ```bash
   curl -X POST your_n8n_webhook_url \
     -H "Content-Type: application/json" \
     -d '{
       "job_posting_id": "test-123",
       "job_title": "Test Job",
       "company_name": "Test Company",
       "job_description": "Test description",
       "required_skills": ["Test", "Skills"],
       "interview_date": "2024-01-01T00:00:00Z",
       "company_email": "test@company.com",
       "hr_email": "hr@company.com",
       "interview_meeting_link": "https://meet.google.com/test",
       "google_calendar_link": "https://calendar.google.com/test"
     }'
   ```

## Expected Behavior

When everything is working correctly:

1. ✅ Job posting is created in the database
2. ✅ Webhook is triggered immediately
3. ✅ Data is sent to N8N with enhanced payload format
4. ✅ N8N receives the data and processes it
5. ✅ Data flows to subsequent nodes in your workflow
6. ✅ Database is updated with `n8n_webhook_sent = true`

## Still Having Issues?

If you're still experiencing problems:

1. **Check the Debug Tool Results**: Look for specific error messages
2. **Verify Environment Variables**: Ensure all required environment variables are set
3. **Test N8N Workflow Manually**: Try triggering your N8N workflow manually
4. **Check Network Logs**: Look for any network-related errors in your server logs

The enhanced webhook system now provides detailed logging and multiple fallback mechanisms to ensure reliable data delivery to N8N.

