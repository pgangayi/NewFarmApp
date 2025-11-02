# Farmers Boot Local Development Setup Script
# This script sets up the local development environment

Write-Host "🚀 Setting up Farmers Boot for local development..." -ForegroundColor Green

# Check if wrangler is installed (Cloudflare CLI)
if (!(Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Wrangler CLI not found. Please install it:" -ForegroundColor Yellow
    Write-Host "npm install -g wrangler" -ForegroundColor Yellow
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "📋 Copying .env.example to .env..." -ForegroundColor Blue
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please edit it with your local values." -ForegroundColor Green
    Write-Host "   For local development, set JWT_SECRET and DATABASE_URL (or use D1)." -ForegroundColor Cyan
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Local development environment is ready!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📋 Next steps:" -ForegroundColor Magenta
Write-Host "1. Edit .env with your JWT_SECRET and DATABASE_URL" -ForegroundColor White
Write-Host "2. Run: npm run dev (starts frontend + functions locally)" -ForegroundColor White
Write-Host "3. Visit: http://localhost:8788" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🔧 Useful commands:" -ForegroundColor Cyan
Write-Host "  - wrangler pages dev (test Pages Functions locally)" -ForegroundColor White
Write-Host "  - npm run build      (build for production)" -ForegroundColor White
Write-Host "  - npm run deploy     (deploy to Cloudflare Pages)" -ForegroundColor White