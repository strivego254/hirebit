#!/bin/bash

# ============================================================================
# Digital Ocean Deployment Script for HireBit
# ============================================================================
# This script deploys both backend and frontend to a Digital Ocean server
# 
# Usage:
#   ./deploy-digitalocean.sh <SERVER_IP> <SSH_USER> <GIT_REPO_URL>
#
# Example:
#   ./deploy-digitalocean.sh 123.45.67.89 root https://github.com/user/hirebit.git
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="${1:-}"
SSH_USER="${2:-root}"
GIT_REPO="${3:-}"
DEPLOY_DIR="/var/www/hirebit"
DOMAIN="${4:-}"  # Optional domain for SSL

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}Error: Server IP is required${NC}"
    echo "Usage: $0 <SERVER_IP> [SSH_USER] [GIT_REPO_URL] [DOMAIN]"
    exit 1
fi

echo -e "${GREEN}Starting deployment to Digital Ocean server: $SERVER_IP${NC}"

# Function to run commands on remote server
remote_exec() {
    ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
}

# Function to copy files to remote server
remote_copy() {
    scp -o StrictHostKeyChecking=no "$1" "$SSH_USER@$SERVER_IP:$2"
}

echo -e "${YELLOW}Step 1: Installing system dependencies...${NC}"
remote_exec << 'INSTALL_DEPS'
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Verify installations
    node --version
    npm --version
    pm2 --version
INSTALL_DEPS

echo -e "${GREEN}✓ System dependencies installed${NC}"

echo -e "${YELLOW}Step 2: Creating deployment directory...${NC}"
remote_exec "mkdir -p $DEPLOY_DIR && cd $DEPLOY_DIR"

echo -e "${GREEN}✓ Directory created${NC}"

if [ -n "$GIT_REPO" ]; then
    echo -e "${YELLOW}Step 3: Cloning repository...${NC}"
    remote_exec "cd $DEPLOY_DIR && git clone $GIT_REPO . || (cd $DEPLOY_DIR && git pull)"
    echo -e "${GREEN}✓ Repository cloned/updated${NC}"
else
    echo -e "${YELLOW}Step 3: Skipping git clone (no repo URL provided)${NC}"
    echo -e "${YELLOW}You'll need to manually upload files or configure git later${NC}"
fi

echo -e "${YELLOW}Step 4: Installing backend dependencies...${NC}"
remote_exec "cd $DEPLOY_DIR/backend && npm install --production"
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${YELLOW}Step 5: Building backend...${NC}"
remote_exec "cd $DEPLOY_DIR/backend && npm run build"
echo -e "${GREEN}✓ Backend built${NC}"

echo -e "${YELLOW}Step 6: Installing frontend dependencies...${NC}"
remote_exec "cd $DEPLOY_DIR/frontend && npm install --production"
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

echo -e "${YELLOW}Step 7: Building frontend...${NC}"
remote_exec "cd $DEPLOY_DIR/frontend && npm run build"
echo -e "${GREEN}✓ Frontend built${NC}"

echo -e "${YELLOW}Step 8: Creating PM2 ecosystem file...${NC}"
remote_exec "cat > $DEPLOY_DIR/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'hirebit-backend',
      cwd: '$DEPLOY_DIR/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/hirebit-backend-error.log',
      out_file: '/var/log/pm2/hirebit-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'hirebit-frontend',
      cwd: '$DEPLOY_DIR/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/hirebit-frontend-error.log',
      out_file: '/var/log/pm2/hirebit-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
PM2_CONFIG
"

echo -e "${GREEN}✓ PM2 config created${NC}"

echo -e "${YELLOW}Step 9: Creating log directory...${NC}"
remote_exec "mkdir -p /var/log/pm2"
echo -e "${GREEN}✓ Log directory created${NC}"

echo -e "${YELLOW}Step 10: Configuring Nginx...${NC}"
remote_exec "cat > /etc/nginx/sites-available/hirebit << 'NGINX_CONFIG'
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name ${DOMAIN:-$SERVER_IP};

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        client_max_body_size 10M;
    }

    # Health check
    location /health {
        access_log off;
        return 200 \"healthy\\n\";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG
"

remote_exec "ln -sf /etc/nginx/sites-available/hirebit /etc/nginx/sites-enabled/"
remote_exec "rm -f /etc/nginx/sites-enabled/default"
remote_exec "nginx -t && systemctl reload nginx"
echo -e "${GREEN}✓ Nginx configured${NC}"

if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}Step 11: Setting up SSL certificate...${NC}"
    remote_exec "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup skipped (may need manual configuration)'"
    echo -e "${GREEN}✓ SSL configured${NC}"
else
    echo -e "${YELLOW}Step 11: Skipping SSL (no domain provided)${NC}"
fi

echo -e "${YELLOW}Step 12: Starting services with PM2...${NC}"
remote_exec "cd $DEPLOY_DIR && pm2 delete all || true"
remote_exec "cd $DEPLOY_DIR && pm2 start ecosystem.config.js"
remote_exec "pm2 save"
remote_exec "pm2 startup systemd -u $SSH_USER --hp /home/$SSH_USER || pm2 startup systemd -u root --hp /root"
echo -e "${GREEN}✓ Services started${NC}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Backend: http://$SERVER_IP:3001"
echo -e "Frontend: http://$SERVER_IP"
if [ -n "$DOMAIN" ]; then
    echo -e "Domain: https://$DOMAIN"
fi
echo ""
echo -e "${YELLOW}Important:${NC}"
echo -e "1. Configure environment variables in:"
echo -e "   - $DEPLOY_DIR/backend/.env"
echo -e "   - $DEPLOY_DIR/frontend/.env.local"
echo ""
echo -e "2. Restart services after setting env vars:"
echo -e "   ssh $SSH_USER@$SERVER_IP 'cd $DEPLOY_DIR && pm2 restart all'"
echo ""
echo -e "3. Check service status:"
echo -e "   ssh $SSH_USER@$SERVER_IP 'pm2 status'"
echo ""
echo -e "4. View logs:"
echo -e "   ssh $SSH_USER@$SERVER_IP 'pm2 logs'"
echo ""

