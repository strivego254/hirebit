-- Database Trigger Function for Automatic Webhook Calls
-- This SQL script creates a function and trigger that automatically calls our webhook API
-- when a new job posting is created in the database.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- Create a function to trigger webhook when job posting is created
CREATE OR REPLACE FUNCTION trigger_job_posting_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
    payload JSON;
    response http_response;
BEGIN
    -- Get the webhook URL from environment (you'll need to set this in Supabase)
    -- For now, we'll use a placeholder that you need to replace with your actual API URL
    webhook_url := 'https://your-app-domain.com/api/webhooks/database-trigger';
    
    -- Create the payload
    payload := json_build_object(
        'job_posting_id', NEW.id,
        'company_id', NEW.company_id,
        'trigger_type', 'job_posting_created',
        'timestamp', NOW()
    );
    
    -- Log the webhook attempt
    RAISE LOG 'Triggering webhook for job posting %', NEW.id;
    
    -- Make the HTTP request to our webhook endpoint
    BEGIN
        response := http_post(
            webhook_url,
            payload::text,
            'application/json'
        );
        
        -- Log the response
        RAISE LOG 'Webhook response status: %, body: %', response.status, response.content;
        
        -- If successful, update the job posting
        IF response.status >= 200 AND response.status < 300 THEN
            UPDATE job_postings 
            SET n8n_webhook_sent = true 
            WHERE id = NEW.id;
            
            RAISE LOG 'Webhook triggered successfully for job posting %', NEW.id;
        ELSE
            RAISE WARNING 'Webhook failed for job posting %: status %, body %', 
                NEW.id, response.status, response.content;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the insert
        RAISE WARNING 'Webhook request failed for job posting %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after a job posting is inserted
CREATE TRIGGER trigger_job_posting_webhook_trigger
    AFTER INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_job_posting_webhook();

-- Alternative approach: Create a function that can be called manually
-- This is useful for testing and for cases where the automatic trigger doesn't work
CREATE OR REPLACE FUNCTION manual_trigger_webhook(job_id UUID)
RETURNS JSON AS $$
DECLARE
    webhook_url TEXT;
    payload JSON;
    response http_response;
    job_data RECORD;
BEGIN
    -- Get the webhook URL
    webhook_url := 'https://your-app-domain.com/api/webhooks/database-trigger';
    
    -- Get job posting data
    SELECT jp.*, c.company_name, c.company_email, c.hr_email
    INTO job_data
    FROM job_postings jp
    JOIN companies c ON jp.company_id = c.id
    WHERE jp.id = job_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Job posting not found');
    END IF;
    
    -- Create the payload
    payload := json_build_object(
        'job_posting_id', job_data.id,
        'company_id', job_data.company_id,
        'trigger_type', 'manual_trigger',
        'timestamp', NOW()
    );
    
    -- Make the HTTP request
    BEGIN
        response := http_post(
            webhook_url,
            payload::text,
            'application/json'
        );
        
        IF response.status >= 200 AND response.status < 300 THEN
            UPDATE job_postings 
            SET n8n_webhook_sent = true 
            WHERE id = job_id;
            
            RETURN json_build_object(
                'success', true, 
                'message', 'Webhook triggered successfully',
                'status', response.status,
                'response', response.content
            );
        ELSE
            RETURN json_build_object(
                'success', false, 
                'error', 'Webhook failed',
                'status', response.status,
                'response', response.content
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Webhook request failed: ' || SQLERRM
        );
    END;
END;
$$ LANGUAGE plpgsql;

-- Create a view to help monitor webhook status
CREATE OR REPLACE VIEW job_posting_webhook_status AS
SELECT 
    jp.id,
    jp.job_title,
    jp.company_name,
    jp.created_at,
    jp.n8n_webhook_sent,
    CASE 
        WHEN jp.n8n_webhook_sent = true THEN 'Sent'
        WHEN jp.created_at < NOW() - INTERVAL '5 minutes' THEN 'Failed'
        ELSE 'Pending'
    END as webhook_status
FROM job_postings jp
ORDER BY jp.created_at DESC;

-- Grant necessary permissions
GRANT SELECT ON job_posting_webhook_status TO authenticated;
GRANT EXECUTE ON FUNCTION manual_trigger_webhook TO authenticated;

-- Instructions for setup:
-- 1. Replace 'https://your-app-domain.com' with your actual app domain
-- 2. Make sure the http extension is enabled in your Supabase project
-- 3. Test the trigger by inserting a new job posting
-- 4. Use the manual_trigger_webhook function if needed: SELECT manual_trigger_webhook('your-job-id');
