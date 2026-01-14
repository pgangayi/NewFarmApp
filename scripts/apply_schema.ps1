# Script to apply D1 schema without CF_API_TOKEN interference
# Run this script directly: .\scripts\apply_schema.ps1

# Temporarily remove CF_API_TOKEN for this session
$originalToken = $env:CF_API_TOKEN
$env:CF_API_TOKEN = $null

Write-Host "Applying consolidated schema to D1 database 'farmers_boot'..." -ForegroundColor Cyan

try {
    npx wrangler d1 execute farmers_boot --remote --file=migrations/0000_consolidated_schema.sql -y
    Write-Host "`n✅ Schema applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Failed to apply schema: $_" -ForegroundColor Red
    exit 1
} finally {
    # Restore original token
    $env:CF_API_TOKEN = $originalToken
}
