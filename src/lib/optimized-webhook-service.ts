import { JobPostingFormData, WebhookPayload } from '@/types'

export interface WebhookResponse {
  success: boolean
  message: string
  error?: string
  warning?: string
  retryCount?: number
  processingTime?: number
}

export interface OptimizedWebhookOptions {
  timeout?: number
  retries?: number
  batchSize?: number
  priority?: 'high' | 'normal' | 'low'
}

/**
 * Ultra-fast webhook service with advanced optimizations
 */
export class OptimizedWebhookService {
  private static readonly WEBHOOK_ENDPOINT = '/api/webhooks/n8n-outgoing'
  private static readonly MAX_RETRIES = 3 // Reduced from 5
  private static readonly RETRY_DELAY = 1000 // Reduced from 2000ms
  private static readonly TIMEOUT = 10000 // Reduced from 30000ms
  private static readonly BATCH_SIZE = 5
  
  private static webhookQueue: Array<{
    payload: WebhookPayload
    resolve: (value: WebhookResponse) => void
    reject: (error: Error) => void
    retryCount: number
    priority: 'high' | 'normal' | 'low'
  }> = []
  
  private static isProcessing = false

  /**
   * Ultra-fast webhook trigger with non-blocking processing
   */
  static async triggerWebhookFast(
    jobData: JobPostingFormData,
    jobPostingId: string,
    companyId: string,
    options: OptimizedWebhookOptions = {}
  ): Promise<WebhookResponse> {
    const startTime = performance.now()
    
    try {
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

      console.log(`🚀 Fast webhook trigger for job: ${jobPostingId}`)

      // For high priority webhooks, send immediately
      if (options.priority === 'high') {
        return this.sendWebhookImmediate(payload, options)
      }

      // For normal priority, use optimized batching
      return this.queueWebhook(payload, options)
    } catch (error) {
      const endTime = performance.now()
      console.error(`❌ Fast webhook failed: ${(endTime - startTime).toFixed(2)}ms`, error)
      
      return {
        success: false,
        message: 'Webhook trigger failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: endTime - startTime
      }
    }
  }

  /**
   * Immediate webhook sending for critical operations
   */
  private static async sendWebhookImmediate(
    payload: WebhookPayload,
    options: OptimizedWebhookOptions = {}
  ): Promise<WebhookResponse> {
    const startTime = performance.now()
    const timeout = options.timeout || this.TIMEOUT
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(this.WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'optimized-service',
          'X-Priority': 'high',
          'X-Job-ID': payload.job_posting_id,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const result = await response.json()
      const endTime = performance.now()

      if (!response.ok) {
        throw new Error(result.error || 'Webhook request failed')
      }

      console.log(`✅ Immediate webhook success: ${(endTime - startTime).toFixed(2)}ms`)

      return {
        success: true,
        message: result.message || 'Webhook sent successfully',
        processingTime: endTime - startTime,
        warning: result.warning
      }
    } catch (error) {
      const endTime = performance.now()
      console.error(`❌ Immediate webhook failed: ${(endTime - startTime).toFixed(2)}ms`, error)
      
      return {
        success: false,
        message: 'Immediate webhook failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: endTime - startTime
      }
    }
  }

  /**
   * Queue webhook for batch processing
   */
  private static async queueWebhook(
    payload: WebhookPayload,
    options: OptimizedWebhookOptions = {}
  ): Promise<WebhookResponse> {
    return new Promise((resolve, reject) => {
      this.webhookQueue.push({
        payload,
        resolve,
        reject,
        retryCount: 0,
        priority: options.priority || 'normal'
      })

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processWebhookQueue()
      }

      // Return immediately with queued status
      resolve({
        success: true,
        message: 'Webhook queued for processing',
        processingTime: 0
      })
    })
  }

  /**
   * Process webhook queue with batching
   */
  private static async processWebhookQueue() {
    if (this.isProcessing || this.webhookQueue.length === 0) {
      return
    }

    this.isProcessing = true
    const startTime = performance.now()

    try {
      // Sort by priority
      this.webhookQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })

      // Process in batches
      const batchSize = this.BATCH_SIZE
      const batches = []
      
      for (let i = 0; i < this.webhookQueue.length; i += batchSize) {
        batches.push(this.webhookQueue.slice(i, i + batchSize))
      }

      // Process each batch in parallel
      await Promise.allSettled(
        batches.map(batch => this.processBatch(batch))
      )

      const endTime = performance.now()
      console.log(`🚀 Webhook queue processed: ${this.webhookQueue.length} webhooks in ${(endTime - startTime).toFixed(2)}ms`)

      // Clear processed webhooks
      this.webhookQueue = []
    } catch (error) {
      console.error('Webhook queue processing failed:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a batch of webhooks
   */
  private static async processBatch(batch: typeof this.webhookQueue) {
    const promises = batch.map(async (item) => {
      try {
        const result = await this.sendWebhookImmediate(item.payload)
        item.resolve(result)
      } catch (error) {
        // Retry logic
        if (item.retryCount < this.MAX_RETRIES) {
          item.retryCount++
          setTimeout(() => {
            this.webhookQueue.push(item)
            this.processWebhookQueue()
          }, this.RETRY_DELAY * item.retryCount)
        } else {
          item.reject(error as Error)
        }
      }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Background webhook processing for job creation
   */
  static async triggerBackgroundWebhook(
    jobData: JobPostingFormData,
    jobPostingId: string,
    companyId: string
  ): Promise<void> {
    // Don't await - process in background
    this.triggerWebhookFast(jobData, jobPostingId, companyId, { priority: 'normal' })
      .then(result => {
        if (result.success) {
          console.log(`✅ Background webhook success for job: ${jobPostingId}`)
        } else {
          console.error(`❌ Background webhook failed for job: ${jobPostingId}`, result.error)
        }
      })
      .catch(error => {
        console.error(`❌ Background webhook error for job: ${jobPostingId}`, error)
      })
  }

  /**
   * Test webhook connectivity with optimized timeout
   */
  static async testWebhookConnection(): Promise<WebhookResponse> {
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
    }

    return this.sendWebhookImmediate(testPayload, { priority: 'high' })
  }

  /**
   * Get webhook queue status
   */
  static getQueueStatus() {
    return {
      queueLength: this.webhookQueue.length,
      isProcessing: this.isProcessing,
      highPriority: this.webhookQueue.filter(w => w.priority === 'high').length,
      normalPriority: this.webhookQueue.filter(w => w.priority === 'normal').length,
      lowPriority: this.webhookQueue.filter(w => w.priority === 'low').length
    }
  }

  /**
   * Clear webhook queue
   */
  static clearQueue() {
    this.webhookQueue.forEach(item => {
      item.reject(new Error('Queue cleared'))
    })
    this.webhookQueue = []
  }
}
