'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock, ExternalLink, Bug, Zap } from 'lucide-react'

interface DebugResult {
  success: boolean
  message?: string
  debug_results?: {
    timestamp: string
    test_type: string
    webhook_url: string
    tests: {
      basic_connectivity?: any
      minimal_payload?: any
      full_payload?: any
      get_request?: any
    }
    analysis?: {
      overall_success: boolean
      recommendations: string[]
      common_issues: string[]
    }
  }
  error?: string
  details?: string
}

export function WebhookDebug() {
  const [isLoading, setIsLoading] = useState(false)
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null)
  const [testType, setTestType] = useState<'basic' | 'full'>('full')

  const runDebugTest = async () => {
    setIsLoading(true)
    setDebugResult(null)

    try {
      const response = await fetch('/api/webhooks/debug-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      })

      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      setDebugResult({
        success: false,
        error: 'Failed to run debug test',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <Clock className="w-4 h-4 text-gray-400" />
    return success ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />
  }

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === undefined) return <Badge variant="secondary">Pending</Badge>
    return success ? <Badge variant="default" className="bg-green-500">Success</Badge> : <Badge variant="destructive">Failed</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Webhook Debug Tool
          </CardTitle>
          <CardDescription>
            Comprehensive testing tool to diagnose webhook connectivity and configuration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Test Type:</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as 'basic' | 'full')}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="basic">Basic Test</option>
                <option value="full">Full Test</option>
              </select>
            </div>
            <Button
              onClick={runDebugTest}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? <Clock className="w-4 h-4 animate-spin-smooth" /> : <Zap className="w-4 h-4" />}
              {isLoading ? 'Running Tests...' : 'Run Debug Test'}
            </Button>
          </div>

          {debugResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Overall Status:</span>
                {getStatusBadge(debugResult.success)}
                {debugResult.success ? (
                  <span className="text-green-600 text-sm">All tests passed</span>
                ) : (
                  <span className="text-red-600 text-sm">Some tests failed</span>
                )}
              </div>

              {debugResult.debug_results && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStatusIcon(debugResult.debug_results.tests.basic_connectivity?.success)}
                          Basic Connectivity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-mono">{debugResult.debug_results.tests.basic_connectivity?.status || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success:</span>
                            {getStatusBadge(debugResult.debug_results.tests.basic_connectivity?.success)}
                          </div>
                          {debugResult.debug_results.tests.basic_connectivity?.error && (
                            <div className="text-red-600 text-xs">
                              {debugResult.debug_results.tests.basic_connectivity.error}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStatusIcon(debugResult.debug_results.tests.minimal_payload?.success)}
                          Minimal Payload
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-mono">{debugResult.debug_results.tests.minimal_payload?.status || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success:</span>
                            {getStatusBadge(debugResult.debug_results.tests.minimal_payload?.success)}
                          </div>
                          {debugResult.debug_results.tests.minimal_payload?.error && (
                            <div className="text-red-600 text-xs">
                              {debugResult.debug_results.tests.minimal_payload.error}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {testType === 'full' && debugResult.debug_results.tests.full_payload && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getStatusIcon(debugResult.debug_results.tests.full_payload?.success)}
                          Full Payload Test
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-mono">{debugResult.debug_results.tests.full_payload?.status || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success:</span>
                            {getStatusBadge(debugResult.debug_results.tests.full_payload?.success)}
                          </div>
                          {debugResult.debug_results.tests.full_payload?.error && (
                            <div className="text-red-600 text-xs">
                              {debugResult.debug_results.tests.full_payload.error}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {debugResult.debug_results.analysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Analysis & Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {debugResult.debug_results.analysis.common_issues.length > 0 && (
                          <div>
                            <h4 className="font-medium text-red-600 mb-2">Common Issues Detected:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                              {debugResult.debug_results.analysis.common_issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {debugResult.debug_results.analysis.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-blue-600 mb-2">Recommendations:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-blue-600">
                              {debugResult.debug_results.analysis.recommendations.map((rec, index) => (
                                <li key={index}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="text-xs text-gray-500">
                    <p>Webhook URL: {debugResult.debug_results.webhook_url}</p>
                    <p>Test completed at: {new Date(debugResult.debug_results.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

