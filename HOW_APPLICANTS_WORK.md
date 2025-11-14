# How Applicant Insertion Works - Complete Flow

## ✅ YES, Applicants Will Be Inserted Automatically!

When a job post is created and 100 applicants apply, they **will automatically be inserted** into your `applicants` table in Supabase.

## The Complete Flow

### Step 1: Job Posting Created
```
HR creates job posting in Dashboard
↓
Job saved to job_postings table
↓
Webhook triggered → sent to N8N
```

### Step 2: N8N Workflow Processes
```
N8N receives job posting data
↓
N8N workflow processes:
  - Extracts job details
  - Analyzes candidates
  - Assigns scores (0-100)
  - Categorizes: SHORTLIST / REJECT / FLAG TO HR
↓
Creates candidate response data
```

### Step 3: N8N Sends Results Back
```
N8N sends data to your API: /api/webhooks/n8n-incoming
↓
Payload includes:
  - job_posting_id
  - candidates array (all 100 applicants)
  - Each candidate has:
    - candidate_name
    - email
    - score (0-100)
    - status (SHORTLIST/REJECT/FLAG TO HR)
    - reasoning (AI analysis)
```

### Step 4: API Inserts Applicants
```javascript
// From src/app/api/webhooks/n8n-incoming/route.ts (lines 158-183)

for (const candidate of payload.candidates) {
  await supabase
    .from('applicants')
    .upsert({
      job_posting_id: payload.job_posting_id,
      email: candidate.email,
      name: candidate.candidate_name,
      matching_score: candidate.score,
      status: candidate.status === 'SHORTLIST' ? 'shortlisted' : 
             candidate.status === 'REJECT' ? 'rejected' : 'flagged',
      ai_reasoning: candidate.reasoning,
      processed_at: new Date().toISOString()
    }, {
      onConflict: 'job_posting_id,email'
    })
}
```

**Result:** All 100 applicants are inserted into `applicants` table!

## What Gets Inserted

For each of the 100 applicants:

| Column | Value | Source |
|--------|-------|--------|
| `job_posting_id` | UUID from job | Your dashboard |
| `email` | Candidate email | N8N processing |
| `name` | Candidate name | N8N processing |
| `matching_score` | 0-100 | N8N AI analysis |
| `status` | shortlisted/rejected/flagged | N8N AI decision |
| `ai_reasoning` | Detailed analysis text | N8N AI reasoning |
| `processed_at` | Timestamp | Current time |

## Status Mapping

N8N sends → Database stores:
- `SHORTLIST` → `shortlisted` ✅
- `REJECT` → `rejected` ❌
- `FLAG TO HR` → `flagged` ⚠️

## Duplicate Prevention

The code uses `upsert` with `onConflict: 'job_posting_id,email'`:

- If applicant already exists → Updates their record
- If new applicant → Inserts new record
- **No duplicate entries!**

## Where Data Goes

### 1. Analytics Table
```javascript
// Lines 136-149 in n8n-incoming/route.ts
await supabase.from('recruitment_analytics').upsert({
  job_posting_id: payload.job_posting_id,
  total_applicants: 100,      // Total count
  total_shortlisted: 25,      // Shortlisted count
  total_rejected: 70,         // Rejected count
  total_flagged: 5,           // Flagged count
  ai_overall_analysis: "...", // Overall summary
  processing_status: 'finished'
})
```

### 2. Applicants Table
```javascript
// Lines 162-183
for (const candidate of candidates) {
  await supabase.from('applicants').upsert({
    // Individual applicant data
  })
}
```

**All 100 applicants are inserted here!**

## Testing the Flow

### 1. Create a Test Job
Go to your dashboard and create a new job posting.

### 2. Check N8N Receives It
Look at n8n logs - you should see:
```
📥 Received job posting: WEB DESIGNER
```

### 3. Process Candidates
N8N should analyze and return:
```
📝 Processing 100 candidates
SHORTLIST: 25
REJECT: 70  
FLAG TO HR: 5
```

### 4. Check Supabase
Go to your Supabase dashboard:

**Table: recruitment_analytics**
- Should show 1 row with totals

**Table: applicants**
- Should show all 100 rows!

### 5. Verify in Dashboard
Go to your dashboard → Jobs section
- Should see applicant counts
- Can view individual applicants
- See AI reasoning for each

## Your Current Setup

✅ **Job creation** → Working  
✅ **N8N webhook** → Working  
✅ **Applicant insert** → Working (just fixed mapping!)  
✅ **Analytics** → Working  
✅ **Dashboard display** → Working

## Troubleshooting

### If Applicants Don't Appear

1. **Check N8N response format**
   ```json
   {
     "job_posting_id": "4ad60ae0-d2a8-4a80-8be7-f01ec02b2ace",
     "candidates": [
       {
         "candidate_name": "John Doe",
         "email": "john@example.com",
         "score": 85,
         "status": "SHORTLIST",
         "reasoning": "..."
       }
     ]
   }
   ```

2. **Verify n8n is calling:**
   ```
   https://your-app-domain.com/api/webhooks/n8n-incoming
   ```

3. **Check Supabase logs:**
   - Go to Supabase dashboard
   - Check Logs → API logs
   - Look for insert errors

4. **Verify RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'applicants';
   ```
   Should show "System can insert applicants"

## Summary

🎯 **100 applicants applied**  
↓  
🤖 **N8N analyzes them**  
↓  
📊 **Analytics updated** (totals)  
↓  
📝 **All 100 inserted into applicants table**  
↓  
✅ **Dashboard shows results**

**Everything is configured correctly!** Your applicants are automatically inserted. Just make sure your n8n workflow sends the data back to `/api/webhooks/n8n-incoming` with the correct format.

