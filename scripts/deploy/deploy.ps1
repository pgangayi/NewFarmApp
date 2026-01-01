$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "FARMERS BOOT - DEPLOYMENT SCRIPT"
Write-Host "========================================"
Write-Host ""

# 1. Deploy Backend (Worker)
Write-Host "[1/3] Deploying Backend (Cloudflare Worker)..."
Push-Location backend
try {
    cmd /c "npx wrangler deploy"
    if ($LASTEXITCODE -ne 0) { throw "Backend deployment failed" }
}
finally {
    Pop-Location
}

# 2. Build Frontend
Write-Host "[2/3] Building Frontend..."
Push-Location frontend
try {
    cmd /c "npm run build"
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
}
finally {
    Pop-Location
}

# 3. Deploy Frontend (Pages)
Write-Host "[3/3] Deploying Frontend (Cloudflare Pages)..."
Push-Location frontend
try {
    # Using 'dist' as the output directory as per vite config
    cmd /c "npx wrangler pages deploy dist"
    if ($LASTEXITCODE -ne 0) { throw "Frontend deployment failed" }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Deployment Completed Successfully!"
