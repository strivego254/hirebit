# URGENT: Update Webhook URL to Production

## 🚨 Current Issue
You're still using the **test/ngrok URL** which requires manual activation:
```
https://semiopen-alisa-unhurriedly.ngrok-free.dev/webhook/company-details
```

This is why you're getting 404 errors and need to manually click "Execute workflow" each time.

## ✅ Solution: Update to Production URL

### Step 1: Get Your Production n8n Webhook URL

1. **Open your production n8n instance** (not the ngrok test URL)
2. **Go to your workflow**
3. **Click on your webhook node**
4. **Copy the production webhook URL** (it should look like):
   - `https://your-n8n-instance.com/webhook/job-posting`
   - `https://n8n.yourcompany.com/webhook/hr-data`
   - `https://your-domain.com/webhook/recruitment`

### Step 2: Update Your .env.local File

Replace the current test URL with your production URL:

```env
# N8N Webhook URLs - PRODUCTION
N8N_WEBHOOK_URL=https://YOUR-ACTUAL-PRODUCTION-N8N-URL/webhook/YOUR-PATH
N8N_INCOMING_WEBHOOK_URL=https://YOUR-ACTUAL-PRODUCTION-N8N-URL/webhook/incoming

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### Step 3: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C) then:
npm run dev
```

### Step 4: Verify Production n8n Configuration

In your **production n8n workflow**:

1. **Webhook node settings**:
   - HTTP Method: POST
   - Response Mode: "When Last Node Finishes"
   - Path: Should match your webhook URL path
   - **Workflow Status: ACTIVE/RUNNING** (not test mode)

2. **Make sure the workflow is ACTIVE** (not just saved)

## 🔍 Why This Fixes the Issue

- **Test/ngrok URLs**: Require manual activation each time
- **Production URLs**: Work automatically without manual intervention
- **Automatic triggering**: Only works with properly configured production webhooks

## 🧪 Test After Update

1. **Create a job posting** in your HR dashboard
2. **Check terminal** - should see success messages
3. **Check n8n** - data should appear automatically
4. **No manual activation needed**

## 📋 Checklist

- [ ] Production n8n webhook URL obtained
- [ ] `.env.local` updated with production URL
- [ ] Development server restarted
- [ ] Production n8n workflow is ACTIVE
- [ ] Webhook node Response Mode: "When Last Node Finishes"
- [ ] Test job posting creation

## 🚨 Important Notes

- **Never use test/ngrok URLs** for production automatic triggering
- **Production n8n instance** must be running and accessible
- **Workflow must be ACTIVE** (not in test mode)
- **Webhook path** must match your URL exactly

**What's your actual production n8n webhook URL?** Please provide it so I can help you format it correctly.
