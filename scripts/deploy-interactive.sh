#!/bin/bash

# ============================================================================
# Interactive Digital Ocean Deployment Script
# ============================================================================
# This script prompts for credentials and deploys the application
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}HireBit Digital Ocean Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get server details
read -p "Server IP address: " SERVER_IP
read -p "SSH user [root]: " SSH_USER
SSH_USER=${SSH_USER:-root}

read -p "Git repository URL (or press Enter to skip): " GIT_REPO
read -p "Domain name (optional, for SSL): " DOMAIN

echo ""
echo -e "${YELLOW}You'll be prompted for the SSH password${NC}"
echo ""

# Check if sshpass is available, if not, use expect or manual SSH
if command -v sshpass &> /dev/null; then
    read -sp "SSH password: " SSH_PASS
    echo ""
    SSH_CMD="sshpass -p '$SSH_PASS' ssh -o StrictHostKeyChecking=no"
    SCP_CMD="sshpass -p '$SSH_PASS' scp -o StrictHostKeyChecking=no"
else
    echo -e "${YELLOW}Note: sshpass not found. You'll need to enter password multiple times.${NC}"
    echo -e "${YELLOW}Install it with: sudo apt-get install sshpass${NC}"
    echo ""
    SSH_CMD="ssh -o StrictHostKeyChecking=no"
    SCP_CMD="scp -o StrictHostKeyChecking=no"
fi

DEPLOY_DIR="/var/www/hirebit"

# Function to run commands on remote server
remote_exec() {
    if command -v sshpass &> /dev/null; then
        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
    else
        ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$@"
    fi
}

echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}[1/12] Installing system dependencies...${NC}"
remote_exec << 'INSTALL_DEPS'
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx > /dev/null 2>&1
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    npm install -g pm2 > /dev/null 2>&1
    echo "✓ Dependencies installed"
INSTALL_DEPS

# Step 2: Create directory
echo -e "${YELLOW}[2/12] Creating deployment directory...${NC}"
remote_exec "mkdir -p $DEPLOY_DIR && echo '✓ Directory created'"

# Step 3: Clone or prepare for upload
if [ -n "$GIT_REPO" ]; then
    echo -e "${YELLOW}[3/12] Cloning repository...${NC}"
    remote_exec "cd $DEPLOY_DIR && (git clone $GIT_REPO . 2>/dev/null || (git pull 2>/dev/null && echo '✓ Updated') || echo '✓ Cloned')"
else
    echo -e "${YELLOW}[3/12] Skipping git clone${NC}"
    echo -e "${YELLOW}   You'll need to upload files manually${NC}"
fi

# Step 4-7: Install and build
echo -e "${YELLOW}[4/12] Installing backend dependencies...${NC}"
remote_exec "cd $DEPLOY_DIR/backend && npm install --production --silent && echo '✓ Backend deps installed'"

echo -e "${YELLOW}[5/12] Building backend...${NC}"
remote_exec "cd $DEPLOY_DIR/backend && npm run build && echo '✓ Backend built'"

echo -e "${YELLOW}[6/12] Installing frontend dependencies...${NC}"
remote_exec "cd $DEPLOY_DIR/frontend && npm install --production --silent && echo '✓ Frontend deps installed'"

echo -e "${YELLOW}[7/12] Building frontend...${NC}"
remote_exec "cd $DEPLOY_DIR/frontend && npm run build && echo '✓ Frontend built'"

# Step 8: PM2 config
echo -e "${YELLOW}[8/12] Configuring PM2...${NC}"
remote_exec "cat > $DEPLOY_DIR/ecosystem.config.js << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: 'hirebit-backend',
      cwd: '$DEPLOY_DIR/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3001 },
      error_file: '/var/log/pm2/hirebit-backend-error.log',
      out_file: '/var/log/pm2/hirebit-backend-out.log',
      autorestart: true
    },
    {
      name: 'hirebit-frontend',
      cwd: '$DEPLOY_DIR/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 3000 },
      error_file: '/var/log/pm2/hirebit-frontend-error.log',
      out_file: '/var/log/pm2/hirebit-frontend-out.log',
      autorestart: true
    }
  ]
};
PM2_CONFIG
" && echo "✓ PM2 config created"

# Step 9: Logs directory
echo -e "${YELLOW}[9/12] Setting up logging...${NC}"
remote_exec "mkdir -p /var/log/pm2 && echo '✓ Log directory created'"

# Step 10: Nginx
echo -e "${YELLOW}[10/12] Configuring Nginx...${NC}"
remote_exec "cat > /etc/nginx/sites-available/hirebit << 'NGINX_CONFIG'
upstream backend { server localhost:3001; }
upstream frontend { server localhost:3000; }

server {
    listen 80;
    server_name ${DOMAIN:-$SERVER_IP};

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

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }
}
NGINX_CONFIG
" && remote_exec "ln -sf /etc/nginx/sites-available/hirebit /etc/nginx/sites-enabled/ && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx && echo '✓ Nginx configured'"

# Step 11: SSL
if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}[11/12] Setting up SSL...${NC}"
    remote_exec "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN 2>/dev/null && echo '✓ SSL configured' || echo '⚠ SSL setup may need manual configuration'"
else
    echo -e "${YELLOW}[11/12] Skipping SSL (no domain)${NC}"
fi

# Step 12: Start services
echo -e "${YELLOW}[12/12] Starting services...${NC}"
remote_exec "cd $DEPLOY_DIR && pm2 delete all 2>/dev/null || true"
remote_exec "cd $DEPLOY_DIR && pm2 start ecosystem.config.js && pm2 save && echo '✓ Services started'"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend: http://$SERVER_IP"
echo -e "Backend API: http://$SERVER_IP:3001"
[ -n "$DOMAIN" ] && echo -e "Domain: https://$DOMAIN"
echo ""
echo -e "${YELLOW}⚠ IMPORTANT: Configure environment variables!${NC}"
echo -e "1. SSH: ssh $SSH_USER@$SERVER_IP"
echo -e "2. Edit: nano $DEPLOY_DIR/backend/.env"
echo -e "3. Edit: nano $DEPLOY_DIR/frontend/.env.local"
echo -e "4. Restart: cd $DEPLOY_DIR && pm2 restart all"
echo ""

