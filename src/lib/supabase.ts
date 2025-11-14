import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (bypasses RLS)
// Only use this on the server side for API routes
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          created_at: string
          company_name: string
          company_email: string
          hr_email: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          company_name: string
          company_email: string
          hr_email: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          company_name?: string
          company_email?: string
          hr_email?: string
          user_id?: string
        }
      }
      job_postings: {
        Row: {
          id: string
          created_at: string
          company_id: string
          company_name: string
          company_email: string
          hr_email: string
          job_title: string
          job_description: string
          required_skills: string[]
          interview_date: string
          interview_meeting_link: string | null
          google_calendar_link: string
          application_deadline: string | null
          status: 'active' | 'paused' | 'closed'
          n8n_webhook_sent: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          company_name: string
          company_email: string
          hr_email: string
          job_title: string
          job_description: string
          required_skills: string[]
          interview_date: string
          interview_meeting_link?: string | null
          google_calendar_link: string
          application_deadline?: string | null
          status?: 'active' | 'paused' | 'closed'
          n8n_webhook_sent?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          company_name?: string
          company_email?: string
          hr_email?: string
          job_title?: string
          job_description?: string
          required_skills?: string[]
          interview_date?: string
          interview_meeting_link?: string | null
          google_calendar_link?: string
          application_deadline?: string | null
          status?: 'active' | 'paused' | 'closed'
          n8n_webhook_sent?: boolean
        }
      }
      applicants: {
        Row: {
          id: string
          created_at: string
          job_posting_id: string
          email: string
          name: string | null
          cv_url: string | null
          matching_score: number | null
          status: 'pending' | 'shortlisted' | 'rejected' | 'flagged'
          ai_reasoning: string | null
          processed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          job_posting_id: string
          email: string
          name?: string | null
          cv_url?: string | null
          matching_score?: number | null
          status?: 'pending' | 'shortlisted' | 'rejected' | 'flagged'
          ai_reasoning?: string | null
          processed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          job_posting_id?: string
          email?: string
          name?: string | null
          cv_url?: string | null
          matching_score?: number | null
          status?: 'pending' | 'shortlisted' | 'rejected' | 'flagged'
          ai_reasoning?: string | null
          processed_at?: string | null
        }
      }
      recruitment_analytics: {
        Row: {
          id: string
          created_at: string
          job_posting_id: string
          total_applicants: number
          total_shortlisted: number
          total_rejected: number
          total_flagged: number
          ai_overall_analysis: string | null
          processing_status: 'in_progress' | 'finished' | 'processing'
          last_updated: string
        }
        Insert: {
          id?: string
          created_at?: string
          job_posting_id: string
          total_applicants?: number
          total_shortlisted?: number
          total_rejected?: number
          total_flagged?: number
          ai_overall_analysis?: string | null
          processing_status?: 'in_progress' | 'finished' | 'processing'
          last_updated?: string
        }
        Update: {
          id?: string
          created_at?: string
          job_posting_id?: string
          total_applicants?: number
          total_shortlisted?: number
          total_rejected?: number
          total_flagged?: number
          ai_overall_analysis?: string | null
          processing_status?: 'in_progress' | 'finished' | 'processing'
          last_updated?: string
        }
      }
      contact_requests: {
        Row: {
          id: string
          created_at: string
          full_name: string
          email: string
          company: string
          role: string
          topic: string
          message: string
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          email: string
          company: string
          role: string
          topic: string
          message: string
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          email?: string
          company?: string
          role?: string
          topic?: string
          message?: string
        }
      }
    }
  }
}
