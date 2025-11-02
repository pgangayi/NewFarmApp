#!/bin/bash

# Farmers Boot Local Development Setup Script
# This script sets up the local development environment

set -e

echo "🚀 Setting up Farmers Boot for local development..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. For local development, use Cloudflare D1 with Wrangler."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📋 Copying .env.example to .env..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your local values."
    echo "   For local development, set JWT_SECRET and DATABASE_URL (or use D1)."
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "⚠️  Wrangler CLI not found. Please install it:"
    echo "npm install -g wrangler"
fi

# Install dependencies
echo "� Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Local development environment is ready!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env with your JWT_SECRET and DATABASE_URL"
echo "2. Run: npm run dev (starts frontend + functions locally)"
echo "3. Visit: http://localhost:8788"
echo ""
echo "🔧 Useful commands:"
echo "  - wrangler pages dev (test Pages Functions locally)"
echo "  - npm run build      (build for production)"
echo "  - npm run deploy     (deploy to Cloudflare Pages)"