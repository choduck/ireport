# PowerShell script to restart IReport server

Write-Host "=== IReport Server Restart ===" -ForegroundColor Green
Write-Host ""

# Step 1: Stop existing server
Write-Host "1. Stopping existing server..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue
if ($process) {
    $process | ForEach-Object { 
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "   Server stopped." -ForegroundColor Green
} else {
    Write-Host "   No server running on port 8888." -ForegroundColor Gray
}

# Step 2: Wait
Write-Host ""
Write-Host "2. Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Step 3: Start server
Write-Host ""
Write-Host "3. Starting server..." -ForegroundColor Yellow
Set-Location "C:\workspace\ireport"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node main.js"

Write-Host ""
Write-Host "=== Server restarted successfully! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Check http://localhost:8888/construction-cases in your browser." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
