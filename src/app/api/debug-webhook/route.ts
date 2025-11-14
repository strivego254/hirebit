import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 DEBUG: Received webhook data:', JSON.stringify(body, null, 2))
    
    // Log all available data
    console.log('🔍 DEBUG: Body keys:', Object.keys(body))
    console.log('🔍 DEBUG: Body type:', typeof body)
    console.log('🔍 DEBUG: Is array:', Array.isArray(body))
    
    // Check for candidates data
    if (body.candidates) {
      console.log('🔍 DEBUG: Found candidates array:', body.candidates.length)
      console.log('🔍 DEBUG: First candidate:', body.candidates[0])
    }
    
    // Check for job posting ID
    if (body.job_posting_id) {
      console.log('🔍 DEBUG: Job posting ID:', body.job_posting_id)
      
      // Verify job exists in database
      const { data: job, error: jobError } = await supabase
        .from('job_postings')
        .select('id, job_title, company_name')
        .eq('id', body.job_posting_id)
        .single()
      
      if (jobError) {
        console.log('🔍 DEBUG: Job not found:', jobError)
      } else {
        console.log('🔍 DEBUG: Job found:', job)
      }
    }
    
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('job_postings')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('🔍 DEBUG: Database connection error:', testError)
    } else {
      console.log('🔍 DEBUG: Database connection OK')
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug webhook received successfully',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🔍 DEBUG: Error processing webhook:', error)
    return NextResponse.json(
      { 
        error: 'Debug webhook failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Debug webhook endpoint is ready',
    timestamp: new Date().toISOString()
  })
}