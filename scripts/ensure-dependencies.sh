#!/bin/bash

# Ensure all required dependencies are installed before build
# This script prevents build failures due to missing dependencies

set -e

REQUIRED_DEPS=("jspdf" "jspdf-autotable" "recharts" "next-themes")
MISSING_DEPS=()

echo "Checking required dependencies..."

for dep in "${REQUIRED_DEPS[@]}"; do
    if [ ! -d "node_modules/$dep" ]; then
        MISSING_DEPS+=("$dep")
        echo "✗ Missing: $dep"
    else
        echo "✓ Found: $dep"
    fi
done

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo ""
    echo "Installing missing dependencies: ${MISSING_DEPS[*]}"
    npm install jspdf@^3.0.4 jspdf-autotable@^5.0.2 recharts@^2.15.4 next-themes@^0.4.6 --save
    
    # Fix next-themes if corrupted
    if [ ! -f "node_modules/next-themes/package.json" ]; then
        echo "Fixing corrupted next-themes..."
        rm -rf node_modules/next-themes
        npm install next-themes@^0.4.6 --save --force
    fi
    
    echo "✓ All dependencies installed"
else
    echo "✓ All required dependencies are present"
fi

