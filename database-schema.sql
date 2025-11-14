-- HR Recruitment AI Agent Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_name TEXT NOT NULL,
    company_email TEXT NOT NULL,
    hr_email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE
);

-- Job postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    company_email TEXT NOT NULL,
    hr_email TEXT NOT NULL,
    job_title TEXT NOT NULL,
    job_description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interview_meeting_link TEXT,
    google_calendar_link TEXT NOT NULL,
    application_deadline TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('active', 'paused', 'closed')) DEFAULT 'active',
    n8n_webhook_sent BOOLEAN DEFAULT FALSE
);

-- Applicants table
CREATE TABLE IF NOT EXISTS applicants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    cv_url TEXT,
    matching_score INTEGER CHECK (matching_score >= 0 AND matching_score <= 100),
    status TEXT CHECK (status IN ('pending', 'shortlisted', 'rejected', 'flagged')) DEFAULT 'pending',
    ai_reasoning TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(job_posting_id, email)
);

-- Recruitment analytics table
CREATE TABLE IF NOT EXISTS recruitment_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    job_posting_id UUID REFERENCES job_postings(id) ON DELETE CASCADE UNIQUE,
    total_applicants INTEGER DEFAULT 0,
    total_shortlisted INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_flagged INTEGER DEFAULT 0,
    ai_overall_analysis TEXT,
    processing_status TEXT CHECK (processing_status IN ('processing', 'in_progress', 'finished')) DEFAULT 'processing',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_applicants_job_posting_id ON applicants(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_analytics_job_posting_id ON recruitment_analytics(job_posting_id);

-- Row Level Security (RLS) policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_analytics ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company" ON companies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company" ON companies
    FOR UPDATE USING (auth.uid() = user_id);

-- Job postings policies
CREATE POLICY "Users can view job postings for their company" ON job_postings
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert job postings for their company" ON job_postings
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update job postings for their company" ON job_postings
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete job postings for their company" ON job_postings
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM companies WHERE user_id = auth.uid()
        )
    );

-- Applicants policies
CREATE POLICY "Users can view applicants for their job postings" ON applicants
    FOR SELECT USING (
        job_posting_id IN (
            SELECT jp.id FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert applicants" ON applicants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update applicants" ON applicants
    FOR UPDATE USING (true);

-- Recruitment analytics policies
CREATE POLICY "Users can view analytics for their job postings" ON recruitment_analytics
    FOR SELECT USING (
        job_posting_id IN (
            SELECT jp.id FROM job_postings jp
            JOIN companies c ON jp.company_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics" ON recruitment_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update analytics" ON recruitment_analytics
    FOR UPDATE USING (true);

-- Create a function to automatically update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for recruitment_analytics
CREATE TRIGGER update_recruitment_analytics_last_updated 
    BEFORE UPDATE ON recruitment_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();
