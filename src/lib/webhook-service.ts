import { JobPostingFormData, WebhookPayload } from '@/types'

export interface WebhookResponse {
  success: boolean
  message: string
  error?: string
  warning?: string
  retryCount?: number
}

export class WebhookService {
  private static readonly WEBHOOK_ENDPOINT = '/api/webhooks/n8n-outgoing'
  private static readonly MAX_RETRIES = 5
  private static readonly RETRY_DELAY = 2000 // 2 seconds
  private static readonly RETRY_DELAY_INCREMENT = 1000 // Increase delay by 1s each retry

  /**
   * Send job posting data to N8N via webhook with automatic retry
   */
  static async sendJobPostingToN8N(
    jobData: JobPostingFormData,
    jobPostingId: string,
    companyId: string,
    retryCount: number = 0
  ): Promise<WebhookResponse> {
    try {
      // Prepare webhook payload
      const payload: WebhookPayload = {
        job_posting_id: jobPostingId,
        company_id: companyId,
        company_name: jobData.company_name,
        company_email: jobData.company_email,
        hr_email: jobData.hr_email,
        job_title: jobData.job_title,
        job_description: jobData.job_description,
        required_skills: jobData.required_skills,
        interview_date: jobData.interview_date,
        interview_meeting_link: jobData.interview_meeting_link,
        google_calendar_link: jobData.google_calendar_link,
        application_deadline: jobData.application_deadline,
      }

      console.log(`📤 Sending webhook payload (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1}):`, payload)
      console.log(`🌐 Webhook endpoint: ${this.WEBHOOK_ENDPOINT}`)

      // Send to our webhook endpoint which will forward to N8N
      console.log('🔄 Making fetch request to webhook endpoint...')
      const response = await fetch(this.WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'database-trigger',
          'X-Job-ID': jobPostingId,
        },
        body: JSON.stringify(payload),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      console.log('📡 Webhook response status:', response.status)
      console.log('📡 Webhook response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('📊 Webhook response body:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send data to N8N')
      }

      return {
        success: true,
        message: result.message || 'Job posting sent to N8N successfully',
        retryCount: retryCount,
        warning: result.warning
      }
    } catch (error) {
      console.error(`Webhook service error (attempt ${retryCount + 1}):`, error)
      
      // Retry logic with exponential backoff
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY + (retryCount * this.RETRY_DELAY_INCREMENT)
        console.log(`⏳ Retrying webhook in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.sendJobPostingToN8N(jobData, jobPostingId, companyId, retryCount + 1)
      }
      
      return {
        success: false,
        message: `Failed to send job posting to N8N after ${this.MAX_RETRIES + 1} attempts`,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount: retryCount
      }
    }
  }

  /**
   * Automatically trigger webhook for job posting (for production use)
   */
  static async autoTriggerWebhook(
    jobData: JobPostingFormData,
    jobPostingId: string,
    companyId: string
  ): Promise<WebhookResponse> {
    console.log('🎯 Auto-triggering webhook for job:', jobPostingId)
    console.log('📋 Job data:', {
      jobTitle: jobData.job_title,
      companyName: jobData.company_name,
      skills: jobData.required_skills
    })
    
    try {
      console.log('🔄 Calling sendJobPostingToN8N...')
      const result = await this.sendJobPostingToN8N(jobData, jobPostingId, companyId)
      
      console.log('📊 Auto-trigger result:', result)
      
      if (result.success) {
        console.log('✅ Webhook auto-triggered successfully:', result.message)
      } else {
        console.error('❌ Webhook auto-trigger failed:', result.error)
        console.error('❌ Full result:', result)
      }
      
      return result
    } catch (error) {
      console.error('❌ Auto-trigger webhook error:', error)
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      return {
        success: false,
        message: 'Failed to auto-trigger webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Trigger webhook from database event (for database triggers)
   */
  static async triggerFromDatabase(
    jobPostingId: string,
    companyId: string
  ): Promise<WebhookResponse> {
    console.log('🎯 Database-triggered webhook for job:', jobPostingId)
    
    try {
      // This method will be called by the database trigger API endpoint
      // The actual job data will be fetched in the API endpoint
      const payload = {
        job_posting_id: jobPostingId,
        company_id: companyId,
        trigger_type: 'database_trigger',
        timestamp: new Date().toISOString()
      }

      console.log('📤 Sending database trigger payload:', payload)
      
      const response = await fetch('/api/webhooks/database-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'database-trigger',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Database trigger webhook failed')
      }

      return {
        success: true,
        message: 'Database trigger webhook sent successfully',
        warning: result.warning
      }
    } catch (error) {
      console.error('❌ Database trigger webhook error:', error)
      return {
        success: false,
        message: 'Failed to send database trigger webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Test webhook connectivity
   */
  static async testWebhookConnection(): Promise<WebhookResponse> {
    try {
      const testPayload: WebhookPayload = {
        job_posting_id: 'test-' + Date.now(),
        company_id: 'test-company',
        company_name: 'Test Company',
        company_email: 'test@company.com',
        hr_email: 'hr@company.com',
        job_title: 'Test Job',
        job_description: 'This is a test job posting',
        required_skills: ['Testing', 'Webhook'],
        interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interview_meeting_link: 'https://meet.google.com/test',
        google_calendar_link: 'https://calendar.google.com/test',
        application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      }

      const response = await fetch(this.WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Webhook test failed')
      }

      return {
        success: true,
        message: 'Webhook connection test successful',
      }
    } catch (error) {
      console.error('Webhook test error:', error)
      return {
        success: false,
        message: 'Webhook connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
