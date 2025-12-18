#!/bin/bash

# ScholarShield Deployment Verification Script
# Checks that the codebase is ready for production deployment

echo "🔍 ScholarShield Deployment Verification"
echo "=========================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error
error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
    ((ERRORS++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
    ((WARNINGS++))
}

# Function to print success
success() {
    echo -e "${GREEN}✅${NC} $1"
}

# 1. Check if gunicorn is in requirements.txt
echo "1. Checking backend/requirements.txt for gunicorn..."
if grep -q "gunicorn" backend/requirements.txt; then
    success "gunicorn found in requirements.txt"
else
    error "gunicorn NOT found in requirements.txt (required for production)"
fi
echo ""

# 2. Check if frontend/.env.local is in .gitignore
echo "2. Checking if frontend/.env.local is in .gitignore..."
if grep -q "\.env\.local" frontend/.gitignore 2>/dev/null || grep -q "\.env\.local" .gitignore 2>/dev/null; then
    success "frontend/.env.local is in .gitignore"
else
    warning "frontend/.env.local might not be in .gitignore (check manually)"
fi
echo ""

# 3. Check if backend/.env is in .gitignore
echo "3. Checking if backend/.env is in .gitignore..."
if grep -q "^\.env$" .gitignore 2>/dev/null || grep -q "^\.env$" backend/.gitignore 2>/dev/null; then
    success "backend/.env is in .gitignore"
else
    error "backend/.env is NOT in .gitignore (security risk!)"
fi
echo ""

# 4. Check for localhost usage (outside of development fallbacks)
echo "4. Scanning for 'localhost' usage (should only be in fallbacks)..."
LOCALHOST_FOUND=0

# Check frontend API routes
while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    content=$(echo "$line" | cut -d: -f2-)
    
    # Skip if it's a fallback pattern (process.env.X || 'http://localhost')
    if echo "$content" | grep -q "process\.env\.[A-Z_]*.*||.*localhost"; then
        success "Found localhost in fallback pattern: $file"
    elif echo "$content" | grep -q "localhost"; then
        warning "Found localhost usage: $file - Verify this is a development fallback"
        ((LOCALHOST_FOUND++))
    fi
done < <(grep -rn "localhost" frontend/app/api/ frontend/lib/ 2>/dev/null | grep -v node_modules | grep -v ".next")

if [ $LOCALHOST_FOUND -eq 0 ]; then
    success "No hardcoded localhost found (or all are in fallback patterns)"
fi
echo ""

# 5. Check for hardcoded secrets
echo "5. Scanning for potential hardcoded secrets..."
SECRETS_FOUND=0

# Check for API keys starting with sk- or containing long alphanumeric strings
while IFS= read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    # Skip .env files and node_modules
    if [[ "$file" == *".env"* ]] || [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".next"* ]]; then
        continue
    fi
    
    # Check for sk- pattern
    if echo "$line" | grep -qi "sk-[a-zA-Z0-9]\{20,\}"; then
        error "Potential secret key found: $file"
        ((SECRETS_FOUND++))
    fi
    
    # Check for long alphanumeric strings that look like keys
    if echo "$line" | grep -qiE "(key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9]{30,}['\"]"; then
        warning "Potential hardcoded credential: $file"
        ((SECRETS_FOUND++))
    fi
done < <(grep -rn -i "sk-\|key.*=.*[A-Za-z0-9]\{30,\}" frontend/ backend/ 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".env" | grep -v "__pycache__")

if [ $SECRETS_FOUND -eq 0 ]; then
    success "No hardcoded secrets detected"
fi
echo ""

# 6. Check if production.env.example exists
echo "6. Checking for production.env.example..."
if [ -f "backend/production.env.example" ]; then
    success "backend/production.env.example exists"
else
    warning "backend/production.env.example not found (recommended for deployment docs)"
fi
echo ""

# 7. Check Dockerfile uses gunicorn
echo "7. Checking backend/Dockerfile for gunicorn..."
if grep -q "gunicorn" backend/Dockerfile; then
    success "Dockerfile uses gunicorn for production"
else
    error "Dockerfile does NOT use gunicorn (still using uvicorn dev mode)"
fi
echo ""

# 8. Check CORS configuration in main.py
echo "8. Checking CORS configuration in backend/main.py..."
if grep -q "ALLOWED_ORIGINS" backend/main.py && grep -q "os.getenv" backend/main.py; then
    success "CORS uses environment variable ALLOWED_ORIGINS"
else
    error "CORS might not be using environment variables"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}✅ Passed checks:${NC} $((8 - ERRORS - WARNINGS))"
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
fi
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Errors:${NC} $ERRORS"
    echo ""
    echo "Please fix the errors before deploying to production."
    exit 1
else
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo "Review warnings above for best practices."
    fi
    exit 0
fi

