-- Optimized Database Functions for HR Recruitment AI Agent
-- These functions provide ultra-fast database operations with minimal queries

-- Function to create job with company in a single transaction
CREATE OR REPLACE FUNCTION create_job_with_company(
  p_user_id UUID,
  p_company_name TEXT,
  p_company_email TEXT,
  p_hr_email TEXT,
  p_job_title TEXT,
  p_job_description TEXT,
  p_required_skills TEXT[],
  p_interview_date TIMESTAMP WITH TIME ZONE,
  p_interview_meeting_link TEXT DEFAULT NULL,
  p_google_calendar_link TEXT,
  p_status TEXT DEFAULT 'active'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_job_id UUID;
  v_result JSON;
BEGIN
  -- Upsert company
  INSERT INTO companies (user_id, company_name, company_email, hr_email)
  VALUES (p_user_id, p_company_name, p_company_email, p_hr_email)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    company_name = EXCLUDED.company_name,
    company_email = EXCLUDED.company_email,
    hr_email = EXCLUDED.hr_email
  RETURNING id INTO v_company_id;

  -- Create job posting
  INSERT INTO job_postings (
    company_id, company_name, company_email, hr_email,
    job_title, job_description, required_skills,
    interview_date, interview_meeting_link, google_calendar_link,
    status, n8n_webhook_sent
  )
  VALUES (
    v_company_id, p_company_name, p_company_email, p_hr_email,
    p_job_title, p_job_description, p_required_skills,
    p_interview_date, p_interview_meeting_link, p_google_calendar_link,
    p_status, FALSE
  )
  RETURNING id INTO v_job_id;

  -- Return both company and job data
  SELECT json_build_object(
    'company', json_build_object(
      'id', v_company_id,
      'company_name', p_company_name,
      'company_email', p_company_email,
      'hr_email', p_hr_email
    ),
    'job', json_build_object(
      'id', v_job_id,
      'company_id', v_company_id,
      'company_name', p_company_name,
      'company_email', p_company_email,
      'hr_email', p_hr_email,
      'job_title', p_job_title,
      'job_description', p_job_description,
      'required_skills', p_required_skills,
      'interview_date', p_interview_date,
      'interview_meeting_link', p_interview_meeting_link,
      'google_calendar_link', p_google_calendar_link,
      'status', p_status,
      'n8n_webhook_sent', FALSE,
      'created_at', NOW()
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to get jobs with aggregated applicant statistics
CREATE OR REPLACE FUNCTION get_jobs_with_applicant_stats(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  company_id UUID,
  company_name TEXT,
  company_email TEXT,
  hr_email TEXT,
  job_title TEXT,
  job_description TEXT,
  required_skills TEXT[],
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_meeting_link TEXT,
  google_calendar_link TEXT,
  status TEXT,
  n8n_webhook_sent BOOLEAN,
  applicant_stats JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id,
    jp.created_at,
    jp.company_id,
    jp.company_name,
    jp.company_email,
    jp.hr_email,
    jp.job_title,
    jp.job_description,
    jp.required_skills,
    jp.interview_date,
    jp.interview_meeting_link,
    jp.google_calendar_link,
    jp.status,
    jp.n8n_webhook_sent,
    COALESCE(
      json_build_object(
        'total', COALESCE(stats.total_applicants, 0),
        'shortlisted', COALESCE(stats.total_shortlisted, 0),
        'flagged', COALESCE(stats.total_flagged, 0),
        'rejected', COALESCE(stats.total_rejected, 0),
        'pending', COALESCE(stats.total_applicants - stats.total_shortlisted - stats.total_flagged - stats.total_rejected, 0)
      ),
      json_build_object(
        'total', 0,
        'shortlisted', 0,
        'flagged', 0,
        'rejected', 0,
        'pending', 0
      )
    ) as applicant_stats
  FROM job_postings jp
  JOIN companies c ON jp.company_id = c.id
  LEFT JOIN recruitment_analytics ra ON jp.id = ra.job_posting_id
  WHERE c.user_id = p_user_id
  ORDER BY jp.created_at DESC;
END;
$$;

-- Function to get dashboard metrics in a single query
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'activeJobs', COALESCE(job_stats.active_jobs, 0),
    'totalJobs', COALESCE(job_stats.total_jobs, 0),
    'totalReports', COALESCE(report_stats.total_reports, 0),
    'readyReports', COALESCE(report_stats.ready_reports, 0),
    'totalApplicants', COALESCE(applicant_stats.total_applicants, 0),
    'shortlistedApplicants', COALESCE(applicant_stats.shortlisted_applicants, 0),
    'flaggedApplicants', COALESCE(applicant_stats.flagged_applicants, 0),
    'rejectedApplicants', COALESCE(applicant_stats.rejected_applicants, 0)
  ) INTO v_result
  FROM (
    -- Job statistics
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(*) FILTER (WHERE status = 'active') as active_jobs
    FROM job_postings jp
    JOIN companies c ON jp.company_id = c.id
    WHERE c.user_id = p_user_id
  ) job_stats
  CROSS JOIN (
    -- Report statistics
    SELECT 
      COUNT(*) as total_reports,
      COUNT(*) FILTER (WHERE processing_status = 'finished') as ready_reports
    FROM recruitment_analytics ra
    JOIN job_postings jp ON ra.job_posting_id = jp.id
    JOIN companies c ON jp.company_id = c.id
    WHERE c.user_id = p_user_id
  ) report_stats
  CROSS JOIN (
    -- Applicant statistics
    SELECT 
      COUNT(*) as total_applicants,
      COUNT(*) FILTER (WHERE status = 'shortlisted') as shortlisted_applicants,
      COUNT(*) FILTER (WHERE status = 'flagged') as flagged_applicants,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applicants
    FROM applicants a
    JOIN job_postings jp ON a.job_posting_id = jp.id
    JOIN companies c ON jp.company_id = c.id
    WHERE c.user_id = p_user_id
  ) applicant_stats;

  RETURN v_result;
END;
$$;

-- Function to get interviews with statistics
CREATE OR REPLACE FUNCTION get_interviews_with_stats(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  company_id UUID,
  company_name TEXT,
  company_email TEXT,
  hr_email TEXT,
  job_title TEXT,
  job_description TEXT,
  required_skills TEXT[],
  interview_date TIMESTAMP WITH TIME ZONE,
  interview_meeting_link TEXT,
  google_calendar_link TEXT,
  status TEXT,
  n8n_webhook_sent BOOLEAN,
  applicant_count INTEGER,
  upcoming_interviews INTEGER,
  applicant_stats JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id,
    jp.created_at,
    jp.company_id,
    jp.company_name,
    jp.company_email,
    jp.hr_email,
    jp.job_title,
    jp.job_description,
    jp.required_skills,
    jp.interview_date,
    jp.interview_meeting_link,
    jp.google_calendar_link,
    jp.status,
    jp.n8n_webhook_sent,
    COALESCE(stats.total_applicants, 0) as applicant_count,
    CASE WHEN jp.interview_date > NOW() THEN 1 ELSE 0 END as upcoming_interviews,
    COALESCE(
      json_build_object(
        'total', COALESCE(stats.total_applicants, 0),
        'shortlisted', COALESCE(stats.total_shortlisted, 0),
        'flagged', COALESCE(stats.total_flagged, 0),
        'rejected', COALESCE(stats.total_rejected, 0),
        'pending', COALESCE(stats.total_applicants - stats.total_shortlisted - stats.total_flagged - stats.total_rejected, 0)
      ),
      json_build_object(
        'total', 0,
        'shortlisted', 0,
        'flagged', 0,
        'rejected', 0,
        'pending', 0
      )
    ) as applicant_stats
  FROM job_postings jp
  JOIN companies c ON jp.company_id = c.id
  LEFT JOIN recruitment_analytics ra ON jp.id = ra.job_posting_id
  WHERE c.user_id = p_user_id
    AND jp.status = 'active'
    AND jp.interview_date IS NOT NULL
  ORDER BY jp.interview_date ASC;
END;
$$;

-- Create additional indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_interview_date ON job_postings(interview_date);
CREATE INDEX IF NOT EXISTS idx_applicants_job_status ON applicants(job_posting_id, status);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_status ON recruitment_analytics(processing_status);

-- Create a materialized view for frequently accessed dashboard data
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_metrics_cache AS
SELECT 
  c.user_id,
  COUNT(jp.id) as total_jobs,
  COUNT(jp.id) FILTER (WHERE jp.status = 'active') as active_jobs,
  COUNT(ra.id) as total_reports,
  COUNT(ra.id) FILTER (WHERE ra.processing_status = 'finished') as ready_reports,
  COUNT(a.id) as total_applicants,
  COUNT(a.id) FILTER (WHERE a.status = 'shortlisted') as shortlisted_applicants,
  COUNT(a.id) FILTER (WHERE a.status = 'flagged') as flagged_applicants,
  COUNT(a.id) FILTER (WHERE a.status = 'rejected') as rejected_applicants,
  NOW() as last_updated
FROM companies c
LEFT JOIN job_postings jp ON c.id = jp.company_id
LEFT JOIN recruitment_analytics ra ON jp.id = ra.job_posting_id
LEFT JOIN applicants a ON jp.id = a.job_posting_id
GROUP BY c.user_id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_metrics_cache_user_id ON dashboard_metrics_cache(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics_cache()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics_cache;
END;
$$;

-- Create trigger to automatically refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh cache asynchronously
  PERFORM pg_notify('refresh_dashboard_cache', '');
  RETURN NULL;
END;
$$;

-- Create triggers for cache refresh
CREATE TRIGGER refresh_dashboard_cache_job_postings
  AFTER INSERT OR UPDATE OR DELETE ON job_postings
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_cache();

CREATE TRIGGER refresh_dashboard_cache_applicants
  AFTER INSERT OR UPDATE OR DELETE ON applicants
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_cache();

CREATE TRIGGER refresh_dashboard_cache_analytics
  AFTER INSERT OR UPDATE OR DELETE ON recruitment_analytics
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_dashboard_cache();
