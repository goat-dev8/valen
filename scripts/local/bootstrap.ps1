# VALEN local bootstrap (Windows)
# Requires: Node 20+, pnpm

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Backend = Join-Path $Root "backend"

Write-Host "Installing dependencies..."
Set-Location $Root
pnpm install

Write-Host "Applying database migrations..."
Set-Location $Backend
pnpm run migrate

Write-Host "Starting Redis (embedded via redis-memory-server)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; pnpm redis" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "Starting VALEN API on http://localhost:3000 ..."
Write-Host "Swagger docs: http://localhost:3000/docs"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; pnpm dev" -WindowStyle Normal

Write-Host ""
Write-Host "Bootstrap complete. Ensure backend/.env is configured."
