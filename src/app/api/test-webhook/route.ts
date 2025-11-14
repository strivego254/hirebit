import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    
    if (!n8nWebhookUrl) {
      return NextResponse.json({
        success: false,
        message: 'N8N_WEBHOOK_URL environment variable is not set',
        webhookUrl: null
      })
    }

    // Test the webhook with a simple payload
    const testPayload = {
      job_posting_id: 'test-' + Date.now(),
      company_id: 'test-company',
      job_title: 'Test Job',
      job_description: 'This is a test job posting',
      required_skills: ['Testing', 'Webhook'],
      interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      interview_meeting_link: 'https://meet.google.com/test',
      google_calendar_link: 'https://calendar.google.com/test',
    }

    console.log('Testing webhook with URL:', n8nWebhookUrl)
    console.log('Test payload:', testPayload)

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()

    return NextResponse.json({
      success: response.ok,
      message: response.ok ? 'Webhook test successful' : 'Webhook test failed',
      webhookUrl: n8nWebhookUrl,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Webhook test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
