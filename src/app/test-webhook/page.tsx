'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TestTube, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

export default function TestWebhookPage() {
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const handleTestWebhook = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-webhook')
      const result = await response.json()
      
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleTestJobCreation = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const testPayload = {
        job_posting_id: 'test-' + Date.now(),
        company_id: 'test-company',
        job_title: 'Test Software Engineer',
        job_description: 'This is a test job posting for webhook testing',
        required_skills: ['JavaScript', 'React', 'Node.js'],
        interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interview_meeting_link: 'https://meet.google.com/test-meeting',
        google_calendar_link: 'https://calendar.google.com/test-calendar',
      }

      const response = await fetch('/api/webhooks/n8n-outgoing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to test job creation webhook',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-figtree font-semibold mb-2 gradient-text">
            Webhook Testing
          </h1>
          <p className="text-xl font-figtree font-light text-muted-foreground">
            Test your N8N webhook integration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Direct Webhook Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-figtree font-light">
                Test the webhook connection directly to your N8N instance.
              </p>
              <Button
                onClick={handleTestWebhook}
                disabled={isTesting}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                {isTesting && <Loader2 className="w-4 h-4 animate-spin-smooth" />}
                {isTesting ? 'Testing...' : 'Test Webhook Connection'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Job Creation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-figtree font-light">
                Test the complete job creation flow with webhook.
              </p>
              <Button
                onClick={handleTestJobCreation}
                disabled={isTesting}
                variant="gradient"
                className="w-full flex items-center gap-2"
              >
                {isTesting && <Loader2 className="w-4 h-4 animate-spin-smooth" />}
                {isTesting ? 'Testing...' : 'Test Job Creation Flow'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={testResult.success ? "success" : "destructive"}>
                    {testResult.success ? "SUCCESS" : "FAILED"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(testResult.timestamp || Date.now()).toLocaleString()}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-figtree font-semibold mb-2">Message:</h4>
                  <p className="text-sm font-figtree font-light">{testResult.message}</p>
                </div>

                {testResult.webhookUrl && (
                  <div>
                    <h4 className="font-figtree font-semibold mb-2">Webhook URL:</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{testResult.webhookUrl}</p>
                  </div>
                )}

                {testResult.status && (
                  <div>
                    <h4 className="font-figtree font-semibold mb-2">Response Status:</h4>
                    <p className="text-sm font-figtree font-light">{testResult.status} {testResult.statusText}</p>
                  </div>
                )}

                {testResult.response && (
                  <div>
                    <h4 className="font-figtree font-semibold mb-2">N8N Response:</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(JSON.parse(testResult.response), null, 2)}
                    </pre>
                  </div>
                )}

                {testResult.error && (
                  <div>
                    <h4 className="font-figtree font-semibold mb-2">Error Details:</h4>
                    <p className="text-sm text-red-600 font-figtree font-light">{testResult.error}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-figtree font-semibold mb-2">Full Response:</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
