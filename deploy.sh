#!/bin/bash

# Farmers Boot Deployment Script
# This script deploys the application to Cloudflare Pages and assumes Cloudflare D1 (no Supabase)

set -e

echo "🚀 Starting Farmers Boot deployment..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if environment variables are set
if [ -z "$JWT_SECRET" ]; then
    echo "❌ Required environment variables not set. Please set:"
    echo "  - JWT_SECRET (for authentication)"
    echo "  - DATABASE_URL (optional, uses D1 in production)"
    echo "  - SENTRY_DSN (optional)"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy to Cloudflare Pages
echo "☁️  Deploying to Cloudflare Pages..."
wrangler pages deploy frontend/dist --compatibility-date 2024-01-01

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at your Cloudflare Pages URL"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Cloudflare Dashboard"
echo "2. Run health check: curl https://your-domain.pages.dev/health"
echo "3. Test the application functionality"