# N8N Webhook Integration Setup Guide

## Overview

This guide explains how to set up the N8N webhook integration for your HR Recruitment AI Agent. The webhook will automatically send job posting data to your N8N workflow when a new job is created.

## How It Works

1. **Job Creation**: When HR creates a new job posting using the "Create New Job" button
2. **Data Processing**: The form data is processed and validated
3. **Webhook Trigger**: The system automatically sends the job data to N8N via webhook
4. **N8N Processing**: Your N8N workflow receives the data and processes it
5. **Feedback**: The system provides real-time feedback on the webhook status

## Webhook Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
# N8N Webhook URLs
N8N_WEBHOOK_URL=your_n8n_webhook_url_for_outgoing_data
N8N_INCOMING_WEBHOOK_URL=your_n8n_webhook_url_for_incoming_data
```

### Webhook Method: POST

The webhook uses **POST** method to send data to N8N. This is the recommended approach because:

- POST allows sending complex data structures
- Better for handling large payloads
- More secure than GET requests
- Standard practice for webhook integrations

## N8N Setup Instructions

### Step 1: Create Webhook Node in N8N

1. Open your N8N workflow
2. Add a **Webhook** node
3. Configure the webhook node:
   - **HTTP Method**: POST
   - **Path**: `/job-posting` (or any path you prefer)
   - **Response Mode**: Response Node
   - **Options**: 
     - Enable "Respond to Webhook" if you want to send a response back

### Step 2: Configure Webhook URL

1. After creating the webhook node, N8N will generate a webhook URL
2. Copy the webhook URL (it will look like: `https://your-n8n-instance.com/webhook/job-posting`)
3. Add this URL to your `.env.local` file as `N8N_WEBHOOK_URL`

### Step 3: Test the Connection

1. Go to the **Settings** section in your dashboard
2. Use the **N8N Webhook Test** component to test the connection
3. This will send a test payload to your N8N webhook

## Data Structure

The webhook sends the following data structure to N8N:

```json
{
  "job_posting_id": "unique_job_id",
  "company_id": "company_identifier",
  "job_title": "Software Engineer",
  "job_description": "Full-stack developer with React experience...",
  "required_skills": ["React", "Node.js", "TypeScript"],
  "interview_date": "2024-10-25T14:00:00Z",
  "interview_meeting_link": "https://meet.google.com/abc-defg-hij",
  "google_calendar_link": "https://calendar.google.com/event?eid=xyz"
}
```

## API Endpoints

### Outgoing Webhook (To N8N)
- **Endpoint**: `/api/webhooks/n8n-outgoing`
- **Method**: POST
- **Purpose**: Sends job posting data to N8N

### Incoming Webhook (From N8N)
- **Endpoint**: `/api/webhooks/n8n-incoming`
- **Method**: POST
- **Purpose**: Receives processed data back from N8N

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Handles connection failures gracefully
- **Validation Errors**: Validates data before sending
- **Timeout Handling**: Prevents hanging requests
- **User Feedback**: Real-time status updates in the UI

## Testing

### Manual Testing

1. **Create a Job Posting**:
   - Go to the Jobs section
   - Click "Create New Job"
   - Fill out the form
   - Click "Create Job Posting"
   - Watch for the webhook status indicator

2. **Test Webhook Connection**:
   - Go to Settings
   - Use the "Test Webhook Connection" button
   - Check the status message

### Debugging

If the webhook fails:

1. Check the browser console for error messages
2. Verify the `N8N_WEBHOOK_URL` environment variable is set correctly
3. Ensure your N8N webhook node is active and listening
4. Check N8N logs for incoming requests

## Security Considerations

- **Environment Variables**: Keep webhook URLs secure and don't commit them to version control
- **Validation**: All incoming data is validated before processing
- **Error Messages**: Sensitive information is not exposed in error messages

## Performance

- **Async Processing**: Webhook calls are non-blocking
- **Timeout**: 30-second timeout for webhook requests
- **Retry Logic**: Built-in error handling and user feedback
- **Loading States**: Clear visual feedback during webhook processing

## Troubleshooting

### Common Issues

1. **Webhook URL Not Set**:
   - Error: "Webhook configuration error"
   - Solution: Add `N8N_WEBHOOK_URL` to your `.env.local` file

2. **N8N Webhook Not Active**:
   - Error: "Failed to send data to N8N"
   - Solution: Ensure your N8N webhook node is active and the workflow is running

3. **Network Issues**:
   - Error: "Network error" or timeout
   - Solution: Check your internet connection and N8N instance accessibility

### Debug Mode

To enable debug logging, add to your `.env.local`:

```env
DEBUG=webhook:*
```

This will provide detailed logging information for webhook operations.

## Next Steps

After setting up the webhook:

1. **Configure N8N Workflow**: Set up your N8N workflow to process the incoming job data
2. **Set Up Incoming Webhook**: Configure the return webhook to send processed data back
3. **Test End-to-End**: Create a job posting and verify the complete flow
4. **Monitor Performance**: Use the webhook test component to monitor connection health

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your N8N webhook configuration
3. Test the webhook connection using the built-in test component
4. Review this documentation for common solutions
