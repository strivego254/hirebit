import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { query } from '@/lib/db'
import { z } from 'zod'
import { sendInterviewScheduledEmails } from '@/lib/mailer'

const scheduleSchema = z.object({
  applicantId: z.string().uuid(),
  interviewTime: z.string().datetime(),
})

// POST /api/hr/schedule-interview
export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const body = await request.json()
    
    // Validate request body
    const validation = scheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { applicantId, interviewTime } = validation.data

    // Validate interview time is in the future
    const interviewDate = new Date(interviewTime)
    if (interviewDate <= new Date()) {
      return NextResponse.json(
        { error: 'Interview time must be in the future' },
        { status: 400 }
      )
    }

    // Load application and job posting
    const { rows: appRows } = await query<{
      application_id: string
      candidate_name: string | null
      email: string
      ai_status: string | null
      interview_time: string | null
      interview_status: string | null
      job_posting_id: string
      company_id: string | null
    }>(
      `SELECT 
        application_id,
        candidate_name,
        email,
        ai_status,
        interview_time,
        interview_status,
        job_posting_id,
        company_id
      FROM applications 
      WHERE application_id = $1`,
      [applicantId]
    )

    if (appRows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const application = appRows[0]

    // Only allow scheduling for SHORTLISTED candidates
    if (application.ai_status !== 'SHORTLIST') {
      return NextResponse.json(
        { error: 'Only shortlisted candidates can be scheduled for interviews' },
        { status: 400 }
      )
    }

    // Load job posting to get meeting_link
    const { rows: jobRows } = await query<{
      job_posting_id: string
      job_title: string
      meeting_link: string | null
      company_id: string
    }>(
      `SELECT 
        job_posting_id,
        job_title,
        meeting_link,
        company_id
      FROM job_postings 
      WHERE job_posting_id = $1`,
      [application.job_posting_id]
    )

    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 })
    }

    const job = jobRows[0]

    // Verify meeting_link exists
    if (!job.meeting_link) {
      return NextResponse.json(
        { error: 'Set meeting link on job posting first' },
        { status: 400 }
      )
    }

    // Idempotency check: if same interview_time already set and status is SCHEDULED, return success
    if (
      application.interview_time &&
      new Date(application.interview_time).getTime() === interviewDate.getTime() &&
      application.interview_status === 'SCHEDULED'
    ) {
      return NextResponse.json({
        success: true,
        message: 'Already scheduled',
        applicationId: application.application_id,
      })
    }

    // Update application
    const { rows: updatedRows } = await query<{ application_id: string }>(
      `UPDATE applications 
       SET interview_time = $1, 
           interview_link = $2, 
           interview_status = 'SCHEDULED',
           updated_at = NOW()
       WHERE application_id = $3 AND job_posting_id = $4
       RETURNING application_id`,
      [interviewTime, job.meeting_link, applicantId, application.job_posting_id]
    )

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    // Get company info for email
    const { rows: companyRows } = await query<{
      company_id: string
      company_name: string
      hr_email: string
    }>(
      `SELECT company_id, company_name, hr_email 
       FROM companies 
       WHERE company_id = $1`,
      [job.company_id]
    )

    const company = companyRows[0] || { company_name: 'Company', hr_email: user.email }

    // Insert audit log
    await query(
      `INSERT INTO audit_logs (action, company_id, job_posting_id, metadata)
       VALUES ($1, $2, $3, $4)`,
      [
        'schedule_interview',
        job.company_id,
        job.job_posting_id,
        JSON.stringify({
          user_id: user.user_id,
          user_email: user.email,
          applicant_id: applicantId,
          interview_time: interviewTime,
          candidate_name: application.candidate_name,
          candidate_email: application.email,
        }),
      ]
    )

    // Send emails
    try {
      await sendInterviewScheduledEmails({
        candidate: {
          name: application.candidate_name || 'Candidate',
          email: application.email,
        },
        hr: {
          name: 'HR Manager',
          email: company.hr_email,
        },
        job: {
          title: job.job_title,
          companyName: company.company_name,
        },
        interviewTime: interviewTime,
        meetingLink: job.meeting_link,
      })
    } catch (emailError) {
      console.error('Failed to send emails:', emailError)
      // Don't fail the request if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Interview scheduled',
      applicationId: applicantId,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Error scheduling interview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

