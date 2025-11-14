import { NextRequest, NextResponse } from 'next/server'
import { WebhookService } from '@/lib/webhook-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing automatic webhook...')
    
    const testJobData = {
      company_name: 'Test Company',
      company_email: 'test@company.com',
      hr_email: 'hr@company.com',
      job_title: 'Test Auto Webhook Job',
      job_description: 'This is a test job for automatic webhook',
      required_skills: ['Testing', 'Webhook', 'Automation'],
      interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      interview_meeting_link: 'https://meet.google.com/test',
      google_calendar_link: 'https://calendar.google.com/test',
    }
    
    const testJobId = 'test-auto-' + Date.now()
    const testCompanyId = 'test-company-auto'
    
    console.log('🔄 Calling autoTriggerWebhook...')
    const result = await WebhookService.autoTriggerWebhook(
      testJobData,
      testJobId,
      testCompanyId
    )
    
    console.log('📊 Test result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Auto webhook test completed',
      result: result
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
