import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'

// GET /api/hr/candidates/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)
    const applicantId = params.id

    // Fetch candidate detail
    const { rows } = await query<{
      application_id: string
      candidate_name: string | null
      email: string
      ai_score: number | null
      ai_status: string | null
      interview_time: string | null
      interview_link: string | null
      parsed_resume_json: any
      reasoning: string | null
      resume_url: string | null
      job_posting_id: string
    }>(
      `SELECT 
        application_id,
        candidate_name,
        email,
        ai_score,
        ai_status,
        interview_time,
        interview_link,
        parsed_resume_json,
        reasoning,
        resume_url,
        job_posting_id
      FROM applications 
      WHERE application_id = $1`,
      [applicantId]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const app = rows[0]

    // Verify user has access to this job's company
    const { rows: jobRows } = await query<{ company_id: string }>(
      `SELECT company_id FROM job_postings WHERE job_posting_id = $1`,
      [app.job_posting_id]
    )

    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: app.application_id,
      candidate_name: app.candidate_name || 'Unknown',
      email: app.email,
      score: app.ai_score ?? null,
      status: app.ai_status || 'PENDING',
      interview_time: app.interview_time,
      interview_link: app.interview_link,
      parsed_resume: app.parsed_resume_json || {},
      reasoning: app.reasoning || '',
      resume_url: app.resume_url || '',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching candidate detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

