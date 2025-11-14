'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function WebhookTest() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })

  const handleTestWebhook = async () => {
    setIsTesting(true)
    setTestResult({ status: 'idle', message: '' })

    try {
      // Test the webhook directly
      const response = await fetch('/api/test-webhook')
      const result = await response.json()
      
      console.log('Webhook test result:', result)
      
      setTestResult({
        status: result.success ? 'success' : 'error',
        message: result.success 
          ? `Webhook test successful! Status: ${result.status}`
          : `Webhook test failed: ${result.message}`,
      })
    } catch (error) {
      console.error('Webhook test error:', error)
      setTestResult({
        status: 'error',
        message: 'Failed to test webhook connection',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 font-figtree font-light">
        Test the connection to your N8N webhook to ensure job postings are sent correctly.
      </p>
      
      <Button
        onClick={handleTestWebhook}
        disabled={isTesting}
        className="w-full sm:w-auto bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white flex items-center gap-2"
      >
        {isTesting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isTesting ? 'Testing Connection...' : 'Test Webhook Connection'}
      </Button>

      {testResult.status !== 'idle' && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.status === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {testResult.status === 'success' && <CheckCircle className="w-4 h-4" />}
          {testResult.status === 'error' && <XCircle className="w-4 h-4" />}
          <span className="text-sm font-figtree font-medium">{testResult.message}</span>
        </div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-figtree font-extralight mb-3 text-gray-900 dark:text-white">Setup Instructions</h4>
        <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 font-figtree font-light list-decimal list-inside">
          <li>Create a Webhook node in your N8N workflow</li>
          <li>Set the HTTP method to POST</li>
          <li>Copy the webhook URL from N8N</li>
          <li>Add it to your .env.local file as N8N_WEBHOOK_URL</li>
          <li>Test the connection using the button above</li>
        </ol>
      </div>
    </div>
  )
}
