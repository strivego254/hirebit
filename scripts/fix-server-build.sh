#!/bin/bash

# Fix server build errors by installing missing dependencies
# Run this on the server: bash scripts/fix-server-build.sh

set -e

echo "Fixing server build errors..."

cd /var/www/hirebit/frontend || cd ~/hirebit/frontend || cd frontend

echo "1. Cleaning node_modules and cache..."
rm -rf node_modules package-lock.json .next
npm cache clean --force

echo "2. Installing all dependencies..."
npm install

echo "3. Ensuring specific packages are installed..."
npm install jspdf@^3.0.3 jspdf-autotable@^5.0.2 recharts@^2.8.0 next-themes@^0.4.6 --save

echo "4. Fixing corrupted next-themes..."
rm -rf node_modules/next-themes
npm install next-themes@^0.4.6 --save --force

echo "5. Verifying packages..."
if [ -d "node_modules/jspdf" ] && [ -d "node_modules/jspdf-autotable" ] && [ -d "node_modules/recharts" ] && [ -d "node_modules/next-themes" ]; then
    echo "✓ All dependencies installed"
else
    echo "✗ Some dependencies missing"
    exit 1
fi

echo "6. Building..."
npm run build

echo "✓ Build completed successfully!"

