# Deploy to Cloudflare Pages
# This script deploys the built frontend to Cloudflare Pages with D1 configuration
# Run: .\scripts\deploy_to_cloudflare.ps1

Write-Host "`n=== Cloudflare Pages Deployment ===" -ForegroundColor Cyan
Write-Host "Project: farmers-boot" -ForegroundColor Yellow
Write-Host "D1 Database: farmers_boot (d6cd5f39-e69f-463e-8953-04c785015e71)`n" -ForegroundColor Yellow

# Temporarily clear CF_API_TOKEN to avoid conflicts
$originalToken = $env:CF_API_TOKEN
$env:CF_API_TOKEN = $null

try {
    # Check if build exists
    if (-not (Test-Path "frontend/dist")) {
        Write-Host "❌ Build not found. Running build first..." -ForegroundColor Red
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed"
        }
    }
    
    Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Cyan
    npx wrangler pages deploy frontend/dist --project-name=farmers-boot
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
        Write-Host "`nYour app is live at: https://farmers-boot.pages.dev" -ForegroundColor Cyan
        Write-Host "The D1 database binding is configured in wrangler.toml" -ForegroundColor White
    } else {
        Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
        Write-Host "`nAlternative: Deploy via Cloudflare Dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "2. Navigate to Workers & Pages" -ForegroundColor White
        Write-Host "3. Click 'Create application' > 'Pages' > 'Upload assets'" -ForegroundColor White
        Write-Host "4. Upload the 'frontend/dist' folder" -ForegroundColor White
        Write-Host "5. In Settings > Functions, bind the D1 database 'farmers_boot'" -ForegroundColor White
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
} finally {
    $env:CF_API_TOKEN = $originalToken
}
