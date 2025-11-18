#!/bin/bash

# Quick Manual Test Script for Simplified Authentication System
# Run this to quickly test the new simplified auth endpoints
# Date: November 18, 2025

echo "🧪 Simplified Authentication System - Quick Test"
echo "================================================"

BASE_URL="http://localhost:8787"

echo ""
echo "📋 Step 1: Setup Simplified Auth Tables"
echo "---------------------------------------"
echo "POST /api/migrate-to-simplified-auth"
curl -X POST "${BASE_URL}/api/migrate-to-simplified-auth" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "📋 Step 2: Test Signup"
echo "----------------------"
echo "POST /api/auth/signup"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpassword123"
TEST_NAME="Test User"

curl -X POST "${BASE_URL}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"${TEST_NAME}\"}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "📋 Step 3: Test Login"
echo "---------------------"
echo "POST /api/auth/login"
curl -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "📋 Step 4: Test Health Check"
echo "-----------------------------"
echo "GET /api/health"
curl -X GET "${BASE_URL}/api/health" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo ""
echo "📋 Step 5: Rollback Test (Optional)"
echo "-----------------------------------"
echo "POST /api/rollback-to-complex-auth"
echo "This will remove the simplified tables"
read -p "Do you want to test rollback? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  curl -X POST "${BASE_URL}/api/rollback-to-complex-auth" \
    -H "Content-Type: application/json" \
    -w "\nHTTP Status: %{http_code}\n\n"
fi

echo ""
echo "✅ Quick test completed!"
echo "📖 For comprehensive testing, run: node test-simplified-auth.js"