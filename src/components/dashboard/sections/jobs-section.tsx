'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Plus, 
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Brain
} from 'lucide-react'
import { CreateJobModal } from '../create-job-modal'
import { JobDetailsModal } from '../job-details-modal'
import { EditJobModal } from '../edit-job-modal'
import { JobPosting, JobPostingFormData } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useJobsRealtime, useApplicantsRealtime, useAnalyticsRealtime } from '@/hooks/use-realtime-data'

interface JobWithApplicants extends JobPosting {
  applicantStats: {
    total: number
    shortlisted: number
    flagged: number
    rejected: number
    pending: number
  }
  analytics?: string | null
  processingStatus?: 'processing' | 'in_progress' | 'finished'
}

export function JobsSection() {
  const { user } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobs, setJobs] = useState<JobWithApplicants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null)

  // Real-time updates for jobs and applicants
  useJobsRealtime(() => {
    console.log('🔄 Real-time job update detected, refreshing jobs...')
    refreshJobs()
  })

  useApplicantsRealtime(() => {
    console.log('🔄 Real-time applicant update detected, refreshing jobs...')
    refreshJobs()
  })

  useAnalyticsRealtime(() => {
    console.log('🔄 Real-time analytics update detected, refreshing jobs...')
    refreshJobs()
  })

  // Async webhook trigger function
  const triggerWebhookAsync = async (jobData: JobPostingFormData, newJob: any, company: any) => {
    try {
      console.log('🚀 Starting background webhook trigger for job:', newJob.id)
      
      // Import WebhookService dynamically
      const { WebhookService } = await import('@/lib/webhook-service')
      
      console.log('🔄 Calling autoTriggerWebhook with data:', {
        jobId: newJob.id,
        companyId: company.id,
        jobTitle: jobData.job_title
      })
      
      const webhookResult = await WebhookService.autoTriggerWebhook(
        jobData,
        newJob.id,
        company.id
      )
      
      console.log('📊 Webhook result:', webhookResult)
      
      if (webhookResult.success) {
        console.log('✅ Webhook successful, updating database...')
        // Update job status in database
        await supabase
          .from('job_postings')
          .update({ n8n_webhook_sent: true })
          .eq('id', newJob.id)
        
        // Update local state
        setJobs(prev => prev.map(job => 
          job.id === newJob.id ? { ...job, n8n_webhook_sent: true } : job
        ))
        
        console.log('✅ Webhook auto-triggered successfully for job:', newJob.id)
      } else {
        console.error('❌ Webhook auto-trigger failed for job:', newJob.id, webhookResult.error)
        console.error('❌ Full webhook result:', webhookResult)
        
        // Set up a retry mechanism for failed webhooks
        setTimeout(async () => {
          try {
            console.log('🔄 Retrying webhook for job:', newJob.id)
            const retryResult = await WebhookService.autoTriggerWebhook(
              jobData,
              newJob.id,
              company.id
            )
            
            if (retryResult.success) {
              console.log('✅ Webhook retry successful for job:', newJob.id)
              await supabase
                .from('job_postings')
                .update({ n8n_webhook_sent: true })
                .eq('id', newJob.id)
              
              setJobs(prev => prev.map(job => 
                job.id === newJob.id ? { ...job, n8n_webhook_sent: true } : job
              ))
            }
          } catch (retryError) {
            console.error('❌ Webhook retry also failed for job:', newJob.id, retryError)
          }
        }, 5000) // Retry after 5 seconds
      }
    } catch (webhookError) {
      console.error('❌ Error auto-triggering webhook:', webhookError)
      console.error('❌ Webhook error stack:', webhookError instanceof Error ? webhookError.stack : 'No stack trace')
    }
  }

  // Load jobs from database on component mount
  useEffect(() => {
    const loadJobs = async () => {
      if (!user) return
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔄 Loading jobs for user:', user.id)
        
        // First get the company for this user
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (companyError) {
          console.error('❌ Error fetching company:', companyError)
          setError('Failed to load company data')
          return
        }
        
        console.log('✅ Found company:', company)
        
        // Then get all job postings for this company
        const { data: jobPostings, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
        
        if (jobsError) {
          console.error('❌ Error fetching jobs:', jobsError)
          setError('Failed to load job postings')
          return
        }
        
        console.log('📋 Found job postings:', jobPostings?.length || 0, jobPostings)
        
        // Get applicant statistics for each job from recruitment_analytics and applicants tables
        const jobsWithApplicants: JobWithApplicants[] = []
        
        for (const job of jobPostings || []) {
          // First try to get analytics from recruitment_analytics table
          const { data: analytics, error: analyticsError } = await supabase
            .from('recruitment_analytics')
            .select('total_applicants, total_applicants_shortlisted, total_applicants_rejected, total_applicants_flagged_to_hr, ai_overall_analysis, processing_status')
            .eq('job_posting_id', job.id)
            .single()
          
          // If analytics exist, use them; otherwise fall back to applicants table
          if (analytics && !analyticsError) {
            const applicantStats = {
              total: analytics.total_applicants || 0,
              shortlisted: analytics.total_applicants_shortlisted || 0,
              rejected: analytics.total_applicants_rejected || 0,
              flagged: analytics.total_applicants_flagged_to_hr || 0,
              pending: Math.max(0, (analytics.total_applicants || 0) - 
                (analytics.total_applicants_shortlisted || 0) - 
                (analytics.total_applicants_rejected || 0) - 
                (analytics.total_applicants_flagged_to_hr || 0)),
            }
            
            jobsWithApplicants.push({
              ...job,
              applicantStats,
              analytics: analytics.ai_overall_analysis || null,
              processingStatus: analytics.processing_status || 'processing'
            })
          } else {
            // Fallback to applicants table if no analytics found
            const { data: applicants, error: applicantsError } = await supabase
              .from('applicants')
              .select('status')
              .eq('job_posting_id', job.id)
            
            const applicantStats = {
              total: applicants?.length || 0,
              shortlisted: applicants?.filter(a => a.status === 'shortlisted').length || 0,
              flagged: applicants?.filter(a => a.status === 'flagged').length || 0,
              rejected: applicants?.filter(a => a.status === 'rejected').length || 0,
              pending: applicants?.filter(a => a.status === 'pending').length || 0,
            }
            
            jobsWithApplicants.push({
              ...job,
              applicantStats
            })
          }
        }
        
        console.log('✅ Processed jobs with applicants:', jobsWithApplicants.length)
        setJobs(jobsWithApplicants)
      } catch (err) {
        console.error('❌ Error loading jobs:', err)
        setError('An error occurred while loading jobs')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadJobs()
  }, [user])

  // Add a refresh function that can be called externally
  const refreshJobs = async () => {
    console.log('🔄 Manual refresh triggered')
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // First get the company for this user
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (companyError) {
        console.error('❌ Error fetching company:', companyError)
        setError('Failed to load company data')
        return
      }
      
      // Then get all job postings for this company
      const { data: jobPostings, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
      
      if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError)
        setError('Failed to load job postings')
        return
      }
      
      console.log('🔄 Refresh - Found job postings:', jobPostings?.length || 0)
      
      // Get applicant statistics for each job from recruitment_analytics and applicants tables
      const jobsWithApplicants: JobWithApplicants[] = []
      
      for (const job of jobPostings || []) {
        // First try to get analytics from recruitment_analytics table
        const { data: analytics, error: analyticsError } = await supabase
          .from('recruitment_analytics')
          .select('total_applicants, total_applicants_shortlisted, total_applicants_rejected, total_applicants_flagged_to_hr, ai_overall_analysis, processing_status')
          .eq('job_posting_id', job.id)
          .single()
        
        // If analytics exist, use them; otherwise fall back to applicants table
        if (analytics && !analyticsError) {
          const applicantStats = {
            total: analytics.total_applicants || 0,
            shortlisted: analytics.total_applicants_shortlisted || 0,
            rejected: analytics.total_applicants_rejected || 0,
            flagged: analytics.total_applicants_flagged_to_hr || 0,
            pending: Math.max(0, (analytics.total_applicants || 0) - 
              (analytics.total_applicants_shortlisted || 0) - 
              (analytics.total_applicants_rejected || 0) - 
              (analytics.total_applicants_flagged_to_hr || 0)),
          }
          
          jobsWithApplicants.push({
            ...job,
            applicantStats,
            analytics: analytics.ai_overall_analysis || null,
            processingStatus: analytics.processing_status || 'processing'
          })
        } else {
          // Fallback to applicants table if no analytics found
          const { data: applicants, error: applicantsError } = await supabase
            .from('applicants')
            .select('status')
            .eq('job_posting_id', job.id)
          
          const applicantStats = {
            total: applicants?.length || 0,
            shortlisted: applicants?.filter(a => a.status === 'shortlisted').length || 0,
            flagged: applicants?.filter(a => a.status === 'flagged').length || 0,
            rejected: applicants?.filter(a => a.status === 'rejected').length || 0,
            pending: applicants?.filter(a => a.status === 'pending').length || 0,
          }
          
          jobsWithApplicants.push({
            ...job,
            applicantStats
          })
        }
      }
      
      console.log('✅ Refresh - Processed jobs:', jobsWithApplicants.length)
      setJobs(jobsWithApplicants)
    } catch (err) {
      console.error('❌ Error refreshing jobs:', err)
      setError('An error occurred while refreshing jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = async (jobData: JobPostingFormData) => {
    if (!user) {
      setError('You must be logged in to create jobs')
      throw new Error('You must be logged in to create jobs')
    }
    
    try {
      setError(null)
      
      // First get or create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .upsert({
          user_id: user.id,
          company_name: jobData.company_name,
          company_email: jobData.company_email,
          hr_email: jobData.hr_email,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()
      
      if (companyError) {
        throw companyError
      }
      
      // Create the job posting
      const { data: newJob, error: jobError } = await supabase
        .from('job_postings')
        .insert({
          company_id: company.id,
          company_name: jobData.company_name,
          company_email: jobData.company_email,
          hr_email: jobData.hr_email,
          job_title: jobData.job_title,
          job_description: jobData.job_description,
          required_skills: jobData.required_skills,
          interview_date: jobData.interview_date,
          interview_meeting_link: jobData.interview_meeting_link || null,
          google_calendar_link: jobData.google_calendar_link,
          application_deadline: jobData.application_deadline || null,
          status: 'active',
          n8n_webhook_sent: false,
        })
        .select()
        .single()
      
      if (jobError) {
        throw jobError
      }
      
      // Update local state with applicant stats
      const newJobWithStats: JobWithApplicants = {
        ...newJob,
        applicantStats: {
          total: 0,
          shortlisted: 0,
          flagged: 0,
          rejected: 0,
          pending: 0
        }
      }
      setJobs(prev => [newJobWithStats, ...prev])
      console.log('✅ New job created and saved to database:', newJob)
      
      // Return immediately - don't wait for webhook
      const result = { job: newJob, company: company }
      
      // Trigger webhook asynchronously in the background
      triggerWebhookAsync(jobData, newJob, company)
      
      // Refresh jobs list after a short delay to ensure UI is updated
      setTimeout(() => {
        console.log('🔄 Refreshing jobs list after creation...')
        refreshJobs()
      }, 1000)
      
      return result
    } catch (err) {
      console.error('Error creating job:', err)
      setError('Failed to create job posting')
      throw err
    }
  }

  const handleViewDetails = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsDetailsModalOpen(true)
    }
  }

  const handleEditJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsEditModalOpen(true)
    }
  }

  const handleSaveJob = async (jobId: string, updatedData: Partial<JobPosting>) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('job_postings')
        .update(updatedData)
        .eq('id', jobId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, ...updatedData } : job
      ))
      console.log('Job updated in database:', updatedData)
    } catch (err) {
      console.error('Error updating job:', err)
      setError('Failed to update job posting')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      setError(null)
      console.log('Attempting to delete job:', jobId)
      
      // First, verify the job exists and belongs to the user's company
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!company) {
        throw new Error('Company not found for user')
      }
      
      // Check if job exists and belongs to user's company
      const { data: existingJob, error: fetchError } = await supabase
        .from('job_postings')
        .select('id, company_id')
        .eq('id', jobId)
        .eq('company_id', company.id)
        .single()
      
      if (fetchError || !existingJob) {
        console.warn('Job not found or does not belong to user:', jobId)
        // Still update UI in case it was already deleted
        setJobs(prev => prev.filter(job => job.id !== jobId))
        return
      }
      
      // Now attempt to delete
      const { data, error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId)
        .eq('company_id', company.id) // Extra security check
        .select()
      
      console.log('Delete result:', { data, error })
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('No rows were deleted - job might not exist or already deleted')
        // Still update UI in case it was already deleted
        setJobs(prev => prev.filter(job => job.id !== jobId))
        return
      }
      
      // Update local state
      setJobs(prev => prev.filter(job => job.id !== jobId))
      console.log('Job successfully deleted from database:', jobId)
      
      // Refresh jobs from database to ensure consistency
      setTimeout(async () => {
        try {
          if (!user) return
          
          const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('user_id', user.id)
            .single()
          
          if (company) {
            const { data: jobPostings } = await supabase
              .from('job_postings')
              .select('*')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
            
            setJobs(jobPostings || [])
            console.log('Jobs refreshed after deletion')
          }
        } catch (refreshErr) {
          console.error('Error refreshing jobs after deletion:', refreshErr)
        }
      }, 1000)
    } catch (err) {
      console.error('Error deleting job:', err)
      setError(`Failed to delete job posting: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
            Job Postings
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
            Manage your active recruitment campaigns
          </p>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={refreshJobs}
            disabled={isLoading}
            size="sm"
            className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin-smooth' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-[#2D2DDD] text-white hover:border-white hover:bg-[#2D2DDD] hover:text-white flex-1 sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}


      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <div className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job postings...</p>
          </div>
        </motion.div>
      )}

      {/* Jobs List */}
      {!isLoading && (
        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No job postings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first job posting to start recruiting
              </p>
              <Button 
                variant="gradient" 
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </motion.div>
          ) : (
            jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold font-figtree">{job.job_title}</h3>
                      <Badge 
                        variant={job.status === 'active' ? 'success' : job.status === 'paused' ? 'warning' : 'destructive'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-figtree font-light mb-4">
                      {job.job_description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground font-figtree font-light mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Interview: {new Date(job.interview_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {job.required_skills.length} skills required
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.n8n_webhook_sent ? 'Webhook Sent' : 'Webhook Pending'}
                      </div>
                    </div>
                    
                    {/* AI Analysis Section */}
                    {job.analytics && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          <h4 className="text-sm font-semibold text-gray-700 font-figtree">AI Analysis</h4>
                          {job.processingStatus && (
                            <Badge 
                              variant={job.processingStatus === 'finished' ? 'success' : 'warning'}
                              className="ml-auto"
                            >
                              {job.processingStatus === 'finished' ? 'Complete' : job.processingStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-figtree font-light leading-relaxed">
                          {job.analytics}
                        </p>
                      </div>
                    )}
                    
                    {/* Processing Status Indicator */}
                    {job.processingStatus && job.processingStatus !== 'finished' && !job.analytics && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin-smooth rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                          <span className="text-sm text-yellow-700 font-figtree">
                            Processing applicant data... ({job.processingStatus})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-4 sm:mt-0">
                    <div className="flex flex-row gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditJob(job.id)}
                        className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(job.id)}
                        className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setJobToDelete(job)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:bg-red-900/20 w-auto sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedJob(null)
        }}
        jobPosting={selectedJob}
        onEdit={handleEditJob}
      />

      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedJob(null)
        }}
        jobPosting={selectedJob}
        onSave={handleSaveJob}
      />

      {/* Delete Confirmation Dialog */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setJobToDelete(null)}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Job Posting</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the job posting for:
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900">{jobToDelete.job_title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {jobToDelete.job_description.substring(0, 100)}...
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setJobToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteJob(jobToDelete.id)
                  setJobToDelete(null)
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
