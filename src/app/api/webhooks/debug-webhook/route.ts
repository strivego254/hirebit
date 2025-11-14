import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Webhook Debug Tool - Starting comprehensive test')
    
    const body = await request.json()
    const { testType = 'full', webhookUrl } = body
    
    // Get N8N webhook URL
    const n8nWebhookUrl = webhookUrl || process.env.N8N_WEBHOOK_URL
    
    if (!n8nWebhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'N8N_WEBHOOK_URL not set in environment variables',
        debug_info: {
          environment_check: 'FAILED',
          webhook_url_provided: !!webhookUrl,
          environment_webhook_url: !!process.env.N8N_WEBHOOK_URL
        }
      }, { status: 400 })
    }

    const debugResults: any = {
      timestamp: new Date().toISOString(),
      test_type: testType,
      webhook_url: n8nWebhookUrl,
      tests: {}
    }

    // Test 1: Basic connectivity test
    console.log('🧪 Test 1: Basic connectivity test')
    try {
      const basicResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Recruitment-AI-Agent-Debug/1.0',
        },
        body: JSON.stringify({
          test: true,
          message: 'Basic connectivity test',
          timestamp: new Date().toISOString()
        }),
        signal: AbortSignal.timeout(10000)
      })

      debugResults.tests.basic_connectivity = {
        status: basicResponse.status,
        statusText: basicResponse.statusText,
        headers: Object.fromEntries(basicResponse.headers.entries()),
        response_text: await basicResponse.text(),
        success: basicResponse.ok
      }
    } catch (error) {
      debugResults.tests.basic_connectivity = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }

    // Test 2: Minimal job posting payload test
    console.log('🧪 Test 2: Minimal job posting payload test')
    try {
      const minimalPayload = {
        job_posting_id: 'debug-test-' + Date.now(),
        company_id: 'debug-company',
        job_title: 'Debug Test Job',
        job_description: 'This is a debug test job posting',
        required_skills: ['Debug', 'Testing'],
        interview_date: new Date().toISOString(),
        company_name: 'Debug Company',
        company_email: 'debug@company.com',
        hr_email: 'hr@company.com',
        interview_meeting_link: 'https://meet.google.com/debug-test',
        google_calendar_link: 'https://calendar.google.com/debug-test'
      }

      const minimalResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HR-Recruitment-AI-Agent-Debug/1.0',
        },
        body: JSON.stringify(minimalPayload),
        signal: AbortSignal.timeout(10000)
      })

      debugResults.tests.minimal_payload = {
        payload_sent: minimalPayload,
        status: minimalResponse.status,
        statusText: minimalResponse.statusText,
        headers: Object.fromEntries(minimalResponse.headers.entries()),
        response_text: await minimalResponse.text(),
        success: minimalResponse.ok
      }
    } catch (error) {
      debugResults.tests.minimal_payload = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }

    // Test 3: Full job posting payload test (if testType is 'full')
    if (testType === 'full') {
      console.log('🧪 Test 3: Full job posting payload test')
      try {
        const fullPayload = {
          job_posting_id: 'debug-full-test-' + Date.now(),
          company_id: 'debug-company-full',
          company_name: 'Debug Company Full Test',
          company_email: 'debug@company.com',
          hr_email: 'hr@company.com',
          job_title: 'Senior Software Engineer - Debug Test',
          job_description: 'This is a comprehensive debug test for the full job posting payload. It includes all the fields that would normally be sent when creating a real job posting.',
          required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Debug'],
          interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          interview_meeting_link: 'https://meet.google.com/debug-full-test',
          google_calendar_link: 'https://calendar.google.com/event?eid=debug-full-test'
        }

        const fullResponse = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HR-Recruitment-AI-Agent-Debug/1.0',
          },
          body: JSON.stringify(fullPayload),
          signal: AbortSignal.timeout(10000)
        })

        debugResults.tests.full_payload = {
          payload_sent: fullPayload,
          status: fullResponse.status,
          statusText: fullResponse.statusText,
          headers: Object.fromEntries(fullResponse.headers.entries()),
          response_text: await fullResponse.text(),
          success: fullResponse.ok
        }
      } catch (error) {
        debugResults.tests.full_payload = {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        }
      }
    }

    // Test 4: GET request test (to check if webhook accepts GET)
    console.log('🧪 Test 4: GET request test')
    try {
      const getResponse = await fetch(n8nWebhookUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'HR-Recruitment-AI-Agent-Debug/1.0',
        },
        signal: AbortSignal.timeout(10000)
      })

      debugResults.tests.get_request = {
        status: getResponse.status,
        statusText: getResponse.statusText,
        headers: Object.fromEntries(getResponse.headers.entries()),
        response_text: await getResponse.text(),
        success: getResponse.ok
      }
    } catch (error) {
      debugResults.tests.get_request = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }

    // Analyze results and provide recommendations
    const analysis = {
      overall_success: Object.values(debugResults.tests).some((test: any) => test.success),
      recommendations: [] as string[],
      common_issues: [] as string[]
    }

    // Check for common issues
    if (!debugResults.tests.basic_connectivity?.success) {
      analysis.common_issues.push('Basic connectivity failed - check webhook URL and network')
      analysis.recommendations.push('Verify your N8N webhook URL is correct and accessible')
    }

    if (debugResults.tests.basic_connectivity?.success && !debugResults.tests.minimal_payload?.success) {
      analysis.common_issues.push('Minimal payload test failed - possible payload format issue')
      analysis.recommendations.push('Check N8N webhook node configuration and payload format')
    }

    if (debugResults.tests.minimal_payload?.status === 200 && debugResults.tests.minimal_payload?.response_text?.includes('Unused Respond to Webhook node')) {
      analysis.common_issues.push('N8N webhook node configuration issue detected')
      analysis.recommendations.push('Add a "Respond to Webhook" node to your N8N workflow or change webhook settings to "When Last Node Finishes"')
    }

    if (debugResults.tests.get_request?.success) {
      analysis.common_issues.push('Webhook accepts GET requests - this might indicate incorrect configuration')
      analysis.recommendations.push('Ensure your N8N webhook node is configured for POST requests only')
    }

    debugResults.analysis = analysis

    console.log('🔍 Webhook Debug Results:', debugResults)

    return NextResponse.json({
      success: true,
      message: 'Webhook debug test completed',
      debug_results: debugResults
    })

  } catch (error) {
    console.error('❌ Webhook debug tool error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Debug tool failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Webhook Debug Tool',
    usage: 'POST to this endpoint with optional testType (basic|full) and webhookUrl',
    examples: {
      basic_test: {
        method: 'POST',
        body: { testType: 'basic' }
      },
      full_test: {
        method: 'POST',
        body: { testType: 'full' }
      },
      custom_url_test: {
        method: 'POST',
        body: { testType: 'full', webhookUrl: 'your-custom-webhook-url' }
      }
    }
  })
}

