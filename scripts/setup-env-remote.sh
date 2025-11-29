#!/bin/bash

# ============================================================================
# Remote Environment Variables Setup Script
# ============================================================================
# This script helps set up environment variables on the remote server
#
# Usage:
#   ./setup-env-remote.sh <SERVER_IP> <SSH_USER>
# ============================================================================

set -e

SERVER_IP="${1:-}"
SSH_USER="${2:-root}"
DEPLOY_DIR="/var/www/hirebit"

if [ -z "$SERVER_IP" ]; then
    echo "Error: Server IP is required"
    echo "Usage: $0 <SERVER_IP> [SSH_USER]"
    exit 1
fi

remote_exec() {
    ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

echo "Setting up environment variables on remote server..."

# Create backend .env if it doesn't exist
remote_exec "cat > $DEPLOY_DIR/backend/.env << 'BACKEND_ENV'
# Database Configuration
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
DB_SSL=true

# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET=change_this_to_a_secure_random_string

# AI Configuration (Optional)
GEMINI_API_KEY=
GEMINI_API_KEY_002=
GEMINI_API_KEY_003=
REPORT_AI_MODEL=gemini-1.5-flash
SCORING_MODEL=gemini-1.5-flash
RESUME_PARSER_MODEL=gemini-1.5-flash

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# IMAP Configuration (Optional)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=
IMAP_PASS=
IMAP_SECURE=true
IMAP_POLL_MS=10000
ENABLE_EMAIL_READER=false

# Storage Configuration (Optional)
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_ENDPOINT=
S3_REGION=us-east-1
S3_BUCKET_URL=
PDF_BUCKET_URL=
PDF_BUCKET_KEY=
FILE_STORAGE_DIR=./storage

# Cron/Security
CRON_SECRET=
DISABLE_REPORT_SCHEDULER=false
BACKEND_ENV
"

# Create frontend .env.local if it doesn't exist
remote_exec "cat > $DEPLOY_DIR/frontend/.env.local << 'FRONTEND_ENV'
# Backend URL (update with your server IP or domain)
NEXT_PUBLIC_BACKEND_URL=http://$SERVER_IP:3001

# Supabase (Optional)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# NextAuth
NEXTAUTH_URL=http://$SERVER_IP
NEXTAUTH_SECRET=change_this_to_a_secure_random_string
FRONTEND_ENV
"

echo "✓ Environment files created"
echo ""
echo "Next steps:"
echo "1. SSH into server: ssh $SSH_USER@$SERVER_IP"
echo "2. Edit backend/.env: nano $DEPLOY_DIR/backend/.env"
echo "3. Edit frontend/.env.local: nano $DEPLOY_DIR/frontend/.env.local"
echo "4. Restart services: cd $DEPLOY_DIR && pm2 restart all"

