import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/webhook-service'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Database trigger webhook endpoint called at:', new Date().toISOString())
    const body = await request.json()
    console.log('📥 Received database trigger request:', body)
    
    const { job_posting_id, company_id } = body
    
    if (!job_posting_id || !company_id) {
      console.error('Missing required fields:', { job_posting_id, company_id })
      return NextResponse.json(
        { error: 'Missing required fields: job_posting_id and company_id' },
        { status: 400 }
      )
    }

    // Fetch the complete job posting data from database
    console.log('📋 Fetching job posting data from database...')
    const { data: jobPosting, error: fetchError } = await supabase
      .from('job_postings')
      .select(`
        *,
        companies (
          id,
          company_name,
          company_email,
          hr_email
        )
      `)
      .eq('id', job_posting_id)
      .single()

    if (fetchError || !jobPosting) {
      console.error('Failed to fetch job posting:', fetchError)
      return NextResponse.json(
        { error: 'Job posting not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    console.log('📊 Retrieved job posting data:', {
      id: jobPosting.id,
      job_title: jobPosting.job_title,
      company_name: jobPosting.company_name
    })

    // Prepare job data for webhook
    const jobData = {
      company_name: jobPosting.company_name,
      company_email: jobPosting.company_email,
      hr_email: jobPosting.hr_email,
      job_title: jobPosting.job_title,
      job_description: jobPosting.job_description,
      required_skills: jobPosting.required_skills,
      interview_date: jobPosting.interview_date,
      interview_meeting_link: jobPosting.interview_meeting_link,
      google_calendar_link: jobPosting.google_calendar_link,
      application_deadline: jobPosting.application_deadline,
    }

    console.log('🎯 Triggering webhook for job posting:', job_posting_id)
    
    // Trigger webhook using the enhanced webhook service
    const webhookResult = await WebhookService.autoTriggerWebhook(
      jobData,
      job_posting_id,
      company_id
    )

    console.log('📊 Webhook result:', webhookResult)

    if (webhookResult.success) {
      // Update the job posting to mark webhook as sent
      console.log('✅ Webhook successful, updating database...')
      const { error: updateError } = await supabase
        .from('job_postings')
        .update({ n8n_webhook_sent: true })
        .eq('id', job_posting_id)

      if (updateError) {
        console.error('Failed to update webhook status:', updateError)
        // Don't fail the request, webhook was successful
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook triggered successfully',
        job_posting_id,
        webhook_result: webhookResult
      })
    } else {
      console.error('❌ Webhook failed:', webhookResult.error)
      return NextResponse.json({
        success: false,
        error: 'Webhook trigger failed',
        details: webhookResult.error,
        job_posting_id
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Database trigger webhook error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process database trigger webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'database-trigger-webhook',
    timestamp: new Date().toISOString()
  })
}
