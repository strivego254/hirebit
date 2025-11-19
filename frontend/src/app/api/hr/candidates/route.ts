import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'

// GET /api/hr/candidates?jobId=...
export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'jobId query parameter is required' }, { status: 400 })
    }

    // Verify user has access to this job's company
    // For now, we'll check if the job exists and allow access
    // In production, you'd check user_companies or user_roles table
    const { rows: jobRows } = await query<{ company_id: string }>(
      `SELECT company_id FROM job_postings WHERE job_posting_id = $1`,
      [jobId]
    )

    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Fetch candidates ordered by score DESC
    const { rows } = await query<{
      application_id: string
      candidate_name: string | null
      email: string
      ai_score: number | null
      ai_status: string | null
      interview_time: string | null
      interview_link: string | null
    }>(
      `SELECT 
        application_id as id,
        candidate_name,
        email,
        ai_score as score,
        ai_status as status,
        interview_time,
        interview_link
      FROM applications 
      WHERE job_posting_id = $1 
      ORDER BY ai_score DESC NULLS LAST, created_at ASC`,
      [jobId]
    )

    // Map to response format (normalize status from enum to text)
    const candidates = rows.map(row => ({
      id: row.id,
      candidate_name: row.candidate_name || 'Unknown',
      email: row.email,
      score: row.score ?? null,
      status: row.status || 'PENDING',
      interview_time: row.interview_time,
      interview_link: row.interview_link,
    }))

    return NextResponse.json(candidates)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error fetching candidates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

