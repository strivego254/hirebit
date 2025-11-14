import { NextRequest, NextResponse } from 'next/server'
import { WebhookPayload } from '@/types'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Webhook endpoint called at:', new Date().toISOString())
    const body = await request.json()
    console.log('📥 Received webhook request:', body)
    
    // Validate the request body
    const payload: WebhookPayload = {
      job_posting_id: body.job_posting_id,
      company_id: body.company_id,
      company_name: body.company_name,
      company_email: body.company_email,
      hr_email: body.hr_email,
      job_title: body.job_title,
      job_description: body.job_description,
      required_skills: body.required_skills,
      interview_date: body.interview_date,
      interview_meeting_link: body.interview_meeting_link,
      google_calendar_link: body.google_calendar_link,
      application_deadline: body.application_deadline,
    }

    console.log('Processed payload:', payload)

    // Validate required fields
    if (!payload.job_posting_id || !payload.company_id || !payload.job_title) {
      console.error('Missing required fields:', { 
        job_posting_id: payload.job_posting_id, 
        company_id: payload.company_id, 
        job_title: payload.job_title 
      })
      return NextResponse.json(
        { error: 'Missing required fields', details: payload },
        { status: 400 }
      )
    }

    // Get N8N webhook URL from environment variables
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    console.log('🔗 N8N Webhook URL:', n8nWebhookUrl ? 'Set' : 'Not set')
    if (n8nWebhookUrl) {
      console.log('🔗 Full N8N URL:', n8nWebhookUrl)
    }
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL environment variable is not set')
      return NextResponse.json(
        { error: 'Webhook configuration error - N8N_WEBHOOK_URL not set' },
        { status: 500 }
      )
    }

    console.log('Sending data to N8N:', n8nWebhookUrl)

    // Send data to N8N with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    // Create a more N8N-compatible payload structure
    const n8nPayload = {
      // Root level data that N8N can easily access
      ...payload,
      // Add metadata for better tracking
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'hr-recruitment-ai-agent',
        version: '1.0',
        event_type: 'job_posting_created'
      },
      // Ensure all required fields are at root level for N8N access
      id: payload.job_posting_id,
      title: payload.job_title,
      description: payload.job_description,
      skills: payload.required_skills,
      company: {
        name: payload.company_name,
        email: payload.company_email,
        hr_email: payload.hr_email
      },
      interview: {
        date: payload.interview_date,
        meeting_link: payload.interview_meeting_link,
        calendar_link: payload.google_calendar_link
      }
    }

    console.log('📤 Sending enhanced payload to N8N:', JSON.stringify(n8nPayload, null, 2))

    // Prepare headers - include ngrok bypass header if using ngrok-free.dev
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'HR-Recruitment-AI-Agent/1.0',
      'X-Webhook-Source': 'hr-recruitment-ai-agent',
      'X-Event-Type': 'job_posting_created',
      'X-Timestamp': new Date().toISOString(),
    }

    // Add ngrok bypass header for ngrok-free.dev domains
    if (n8nWebhookUrl.includes('ngrok-free.dev')) {
      headers['ngrok-skip-browser-warning'] = 'true'
      console.log('🔓 Added ngrok bypass header')
    }

    console.log('📡 Making request to:', n8nWebhookUrl)
    console.log('📡 Request headers:', headers)

    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(n8nPayload),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    console.log('N8N Response Status:', n8nResponse.status)
    console.log('N8N Response Headers:', Object.fromEntries(n8nResponse.headers.entries()))

    // Get response text for debugging
    const responseText = await n8nResponse.text()
    console.log('N8N Response Body:', responseText)

    // Parse N8N response to check for specific error codes
    let n8nError = null
    let n8nErrorCode = null
    try {
      const n8nResponseData = JSON.parse(responseText)
      if (n8nResponseData.code === 0) {
        n8nError = n8nResponseData.message
        n8nErrorCode = n8nResponseData.code
      }
    } catch (e) {
      // Response is not JSON, that's okay
    }

    // Handle N8N specific errors - check for the "Unused Respond to Webhook node" error
    if (n8nError && (
      n8nError.includes('Unused Respond to Webhook node') ||
      n8nError.includes('Respond to Webhook node found in the workflow') ||
      responseText.includes('Unused Respond to Webhook node')
    )) {
      console.log('N8N webhook received data but has configuration issue with Respond to Webhook node')
      // This is actually a success - data was received by N8N, just needs workflow configuration
      return NextResponse.json({ 
        success: true, 
        message: 'Data sent to N8N successfully! The webhook received your data.',
        n8nResponse: responseText,
        warning: 'N8N workflow needs a "Respond to Webhook" node or change webhook settings to "When Last Node Finishes"'
      })
    }

    // Check if response indicates a workflow configuration error but data was received
    if (n8nResponse.status === 500 && responseText.includes('WorkflowConfigurationError')) {
      console.log('N8N received data but has workflow configuration error')
      return NextResponse.json({ 
        success: true, 
        message: 'Data sent to N8N successfully! The webhook received your data.',
        n8nResponse: responseText,
        warning: 'N8N workflow configuration needs adjustment - data was received successfully'
      })
    }

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText} - ${responseText}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data sent to N8N successfully',
      n8nResponse: responseText
    })

  } catch (error) {
    console.error('Error sending data to N8N:', error)
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    
    return NextResponse.json(
      { 
        error: isTimeout ? 'Request timeout - N8N webhook took too long to respond' : 'Failed to send data to N8N',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
