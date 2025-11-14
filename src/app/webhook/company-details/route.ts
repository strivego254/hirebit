import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { N8NResponsePayload, N8NCandidateData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📥 Received N8N webhook data from company-details endpoint:', JSON.stringify(body, null, 2))
    
    // Handle real candidate data from n8n workflow
    let candidates: N8NCandidateData[] = []
    let jobPostingId = ''
    
    // Check if this is the new candidate data structure from n8n
    if (body.candidates && Array.isArray(body.candidates) && body.candidates.length > 0) {
      console.log('🎯 Processing candidate data from n8n workflow')
      candidates = body.candidates as N8NCandidateData[]
      jobPostingId = body.job_posting_id
      
      console.log('📊 Received candidates:', candidates.length)
      console.log('🔍 Job posting ID:', jobPostingId)
    } else if (Array.isArray(body) && body.length > 0 && body[0].candidate_name) {
      console.log('🎯 Processing legacy array format from n8n workflow')
      candidates = body as N8NCandidateData[]
      
      // Extract job posting ID from the first candidate
      if (candidates[0]) {
        // Try to find the job posting by company name and job title
        const { data: jobs, error: jobsError } = await supabase
          .from('job_postings')
          .select('id')
          .eq('company_name', candidates[0].company_name)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (jobsError || !jobs || jobs.length === 0) {
          console.error('❌ Could not find job posting for company:', candidates[0].company_name)
          return NextResponse.json(
            { error: 'Job posting not found for company', company: candidates[0].company_name },
            { status: 404 }
          )
        }
        
        jobPostingId = jobs[0].id
        console.log('✅ Found job posting ID:', jobPostingId)
      }
    } else {
      // Handle legacy format
      console.log('🔄 Processing legacy webhook format')
      jobPostingId = body.job_posting_id
    }
    
    // Validate the request body
    const payload: N8NResponsePayload = {
      job_posting_id: jobPostingId,
      total_applicants: candidates.length || body.total_applicants || 0,
      total_shortlisted: candidates.filter(c => c.status === 'SHORTLIST').length || body.total_shortlisted || 0,
      total_rejected: candidates.filter(c => c.status === 'REJECT').length || body.total_rejected || 0,
      total_flagged: candidates.filter(c => c.status === 'FLAG TO HR').length || body.total_flagged || 0,
      ai_overall_analysis: body.ai_overall_analysis || 'AI analysis completed',
      processing_status: 'finished',
      applicants: candidates.map(c => ({
        email: c.email,
        name: c.candidate_name,
        matching_score: c.score,
        status: c.status === 'SHORTLIST' ? 'shortlisted' : 
                c.status === 'REJECT' ? 'rejected' : 'flagged',
        ai_reasoning: c.reasoning
      })),
      candidates: candidates
    }

    // Validate required fields
    if (!payload.job_posting_id) {
      console.error('❌ Missing job_posting_id in webhook data')
      return NextResponse.json(
        { error: 'Missing job_posting_id in webhook data' },
        { status: 400 }
      )
    }

    console.log('🔍 Processing data for job:', payload.job_posting_id)

    // First verify the job exists
    const { data: jobExists, error: jobCheckError } = await supabase
      .from('job_postings')
      .select('id')
      .eq('id', payload.job_posting_id)
      .single()

    if (jobCheckError || !jobExists) {
      console.error('❌ Error checking job existence:', jobCheckError)
      return NextResponse.json(
        { error: 'Job not found in database', jobId: payload.job_posting_id },
        { status: 404 }
      )
    }

    console.log('✅ Job exists, proceeding with analytics update')

    // Update or create recruitment analytics
    const { error: analyticsError } = await supabase
      .from('recruitment_analytics')
      .upsert({
        job_posting_id: payload.job_posting_id,
        total_applicants: payload.total_applicants,
        total_shortlisted: payload.total_shortlisted,
        total_rejected: payload.total_rejected,
        total_flagged: payload.total_flagged,
        ai_overall_analysis: payload.ai_overall_analysis,
        processing_status: payload.processing_status,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'job_posting_id'
      })

    if (analyticsError) {
      console.error('❌ Error updating analytics:', analyticsError)
      throw analyticsError
    }

    console.log('✅ Analytics updated successfully')

    // Process real candidate data from n8n workflow
    if (payload.candidates && payload.candidates.length > 0) {
      console.log(`📝 Processing ${payload.candidates.length} real candidates from n8n`)
      
      for (const candidate of payload.candidates) {
        const { error: applicantError } = await supabase
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

        if (applicantError) {
          console.error(`❌ Error processing candidate ${candidate.candidate_name}:`, applicantError)
        } else {
          console.log(`✅ Processed candidate: ${candidate.candidate_name} (${candidate.status}) - Score: ${candidate.score}`)
        }
      }
      
      console.log('✅ All real candidates processed')
    } else if (payload.applicants && payload.applicants.length > 0) {
      // Handle legacy applicant format
      console.log(`📝 Processing ${payload.applicants.length} legacy applicants`)
      
      for (const applicant of payload.applicants) {
        const { error: applicantError } = await supabase
          .from('applicants')
          .upsert({
            job_posting_id: payload.job_posting_id,
            email: applicant.email,
            name: applicant.name || null,
            matching_score: applicant.matching_score,
            status: applicant.status,
            ai_reasoning: applicant.ai_reasoning,
            processed_at: new Date().toISOString(),
          }, {
            onConflict: 'job_posting_id,email'
          })
        
        if (applicantError) {
          console.error('❌ Error updating applicant:', applicant.email, applicantError)
        } else {
          console.log('✅ Updated applicant:', applicant.email)
        }
      }
      
      console.log('✅ All legacy applicants processed')
    }

    console.log('🎉 N8N webhook data processed successfully!')
    return NextResponse.json({ 
      success: true, 
      message: 'Data received and processed successfully',
      processedJobId: payload.job_posting_id,
      candidatesProcessed: payload.candidates?.length || payload.applicants?.length || 0
    })

  } catch (error) {
    console.error('❌ Error processing N8N data:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error details:', { 
      message: error instanceof Error ? error.message : 'Unknown error', 
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to process data from N8N',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
