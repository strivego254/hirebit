# Production Webhook URL Setup Guide

## Overview

This guide helps you configure your webhook URLs for production deployment, replacing the development/test URLs with your actual production n8n instance URLs.

## Step 1: Get Your Production n8n Webhook URL

### From n8n Interface:
1. **Open your production n8n workflow**
2. **Click on your webhook node**
3. **Copy the webhook URL** (it will look like: `https://your-n8n-instance.com/webhook/job-posting`)
4. **Note the path** (e.g., `/job-posting`, `/company-details`, etc.)

### Example Production URLs:
```
https://n8n.yourcompany.com/webhook/job-posting
https://your-n8n-instance.herokuapp.com/webhook/hr-data
https://your-domain.com/webhook/recruitment
```

## Step 2: Update Environment Variables

### For Local Development (.env.local):
```env
# N8N Webhook URLs - PRODUCTION
N8N_WEBHOOK_URL=https://semiopen-alisa-unhurriedly.ngrok-free.dev/webhook/company-details
N8N_INCOMING_WEBHOOK_URL=https://semiopen-alisa-unhurriedly.ngrok-free.dev/webhook/incoming-data

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### For Production Deployment (Vercel/Netlify/etc.):

Add these environment variables in your deployment platform:

1. **Vercel Dashboard**:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add `N8N_WEBHOOK_URL` with your production URL
   - Add `N8N_INCOMING_WEBHOOK_URL` with your incoming webhook URL

2. **Netlify Dashboard**:
   - Go to Site settings
   - Navigate to "Environment variables"
   - Add the webhook URLs

3. **Railway/Render/etc.**:
   - Add environment variables in your service settings

## Step 3: Verify Your n8n Production Configuration

### Check Your n8n Webhook Node:
1. **HTTP Method**: POST
2. **Response Mode**: "When Last Node Finishes" (to avoid the "Unused Respond to Webhook node" error)
3. **Path**: Should match your webhook URL path
4. **Authentication**: None (unless you've set up custom auth)
5. **Workflow Status**: Active/Running

### Test Your Production Webhook:
```bash
curl -X POST https://your-production-n8n-instance.com/webhook/job-posting \
  -H "Content-Type: application/json" \
  -d '{
    "job_posting_id": "test-prod-123",
    "job_title": "Production Test Job",
    "company_name": "Test Company",
    "job_description": "Testing production webhook",
    "required_skills": ["Testing", "Production"],
    "interview_date": "2024-01-01T00:00:00Z",
    "company_email": "test@company.com",
    "hr_email": "hr@company.com",
    "interview_meeting_link": "https://meet.google.com/test",
    "google_calendar_link": "https://calendar.google.com/test"
  }'
```

## Step 4: Update Your Application

### Restart Your Development Server:
```bash
# Stop your current dev server (Ctrl+C)
# Then restart it to pick up new environment variables
npm run dev
```

### Test the Integration:
1. **Go to your dashboard**
2. **Navigate to Settings**
3. **Use the "Test Webhook Connection" button**
4. **Check the browser console** for webhook success messages

## Step 5: Production Deployment Checklist

### Before Deploying:
- [ ] Production n8n webhook URL is correct
- [ ] n8n workflow is active and running
- [ ] Environment variables are set in your deployment platform
- [ ] Webhook node Response Mode is set to "When Last Node Finishes"
- [ ] Test webhook connection works locally

### After Deploying:
- [ ] Test webhook connection from production app
- [ ] Create a test job posting to verify end-to-end flow
- [ ] Check n8n execution logs for incoming webhook data
- [ ] Verify data flows correctly through your n8n workflow

## Common Production Issues & Solutions

### Issue 1: Webhook URL Not Found (404)
**Solution**: 
- Verify the webhook URL path matches your n8n webhook node path
- Ensure your n8n workflow is active
- Check that the webhook node is properly configured

### Issue 2: SSL Certificate Errors
**Solution**:
- Ensure your n8n instance has a valid SSL certificate
- Use HTTPS URLs in your environment variables
- Check if your n8n instance is accessible from your production app

### Issue 3: CORS Issues
**Solution**:
- Configure CORS settings in your n8n instance
- Ensure your production domain is allowed in n8n CORS settings

### Issue 4: Authentication Issues
**Solution**:
- If using authentication, ensure API keys/tokens are properly configured
- Check n8n webhook authentication settings
- Verify environment variables include any required auth tokens

## Monitoring Production Webhooks

### Enable Logging:
Your application includes comprehensive webhook logging. Check your production logs for:
- `🚀 Webhook endpoint called at: [timestamp]`
- `📤 Sending webhook payload: [payload]`
- `📡 N8N Response Status: [status]`
- `✅ Webhook auto-triggered successfully` or `❌ Webhook failed`

### Set Up Monitoring:
1. **Monitor webhook success rates** in your application logs
2. **Set up alerts** for webhook failures
3. **Check n8n execution logs** regularly
4. **Monitor response times** and timeout issues

## Security Considerations for Production

### Environment Variables:
- Never commit production webhook URLs to version control
- Use secure environment variable management
- Rotate webhook URLs periodically if possible

### Network Security:
- Use HTTPS for all webhook communications
- Consider IP whitelisting if your n8n instance supports it
- Implement proper authentication if handling sensitive data

### Data Validation:
- Validate all incoming webhook data
- Implement proper error handling
- Log webhook activities for audit purposes

## Next Steps

After setting up your production webhook:

1. **Test thoroughly** with real job posting data
2. **Monitor performance** and success rates
3. **Set up alerts** for webhook failures
4. **Document your production setup** for your team
5. **Plan for scaling** as your usage grows

Your production webhook should now be ready to handle real job posting data from your HR recruitment system!
