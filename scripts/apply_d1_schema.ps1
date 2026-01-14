# Apply D1 Schema - Simplified Script
# This script applies the consolidated schema to your D1 database
# Run: .\scripts\apply_d1_schema.ps1

Write-Host "`n=== D1 Schema Application ===" -ForegroundColor Cyan
Write-Host "Database: farmers_boot" -ForegroundColor Yellow
Write-Host "ID: d6cd5f39-e69f-463e-8953-04c785015e71`n" -ForegroundColor Yellow

# Temporarily clear CF_API_TOKEN to avoid conflicts
$originalToken = $env:CF_API_TOKEN
$env:CF_API_TOKEN = $null

try {
    Write-Host "Checking current tables..." -ForegroundColor Cyan
    $tables = npx wrangler d1 execute farmers_boot --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Current tables:" -ForegroundColor Green
        Write-Host $tables
    }
    
    Write-Host "`nApplying schema from migrations/0000_consolidated_schema.sql..." -ForegroundColor Cyan
    npx wrangler d1 execute farmers_boot --remote --file="migrations/0000_consolidated_schema.sql" -y
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Schema applied successfully!" -ForegroundColor Green
        
        Write-Host "`nVerifying tables..." -ForegroundColor Cyan
        $verifyTables = npx wrangler d1 execute farmers_boot --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
        Write-Host $verifyTables -ForegroundColor Green
    } else {
        Write-Host "`n❌ Schema application failed!" -ForegroundColor Red
        Write-Host "Please apply the schema manually via Cloudflare Dashboard:" -ForegroundColor Yellow
        Write-Host "1. Go to https://dash.cloudflare.com" -ForegroundColor White
        Write-Host "2. Navigate to Workers & Pages > D1" -ForegroundColor White
        Write-Host "3. Select 'farmers_boot' database" -ForegroundColor White
        Write-Host "4. Click Console tab" -ForegroundColor White
        Write-Host "5. Copy contents from migrations/0000_consolidated_schema.sql" -ForegroundColor White
        Write-Host "6. Paste and Execute" -ForegroundColor White
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
} finally {
    $env:CF_API_TOKEN = $originalToken
}
