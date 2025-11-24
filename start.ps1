# Gold Trading Platform - Startup Script
# This script installs dependencies and starts both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gold Trading Platform - Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure your settings." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Backend setup
Write-Host "[1/4] Installing backend dependencies..." -ForegroundColor Green
Push-Location backend
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Backend dependencies installed" -ForegroundColor Green
Pop-Location

# Frontend setup
Write-Host "[2/4] Installing frontend dependencies..." -ForegroundColor Green
Push-Location frontend
npm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Frontend dependencies installed" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Application..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the current directory
$rootDir = (Get-Location).Path

# Start backend in new window
Write-Host "[3/4] Starting backend server..." -ForegroundColor Green
$backendPath = Join-Path $rootDir "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Write-Host "Backend starting at http://127.0.0.1:8000" -ForegroundColor Green

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start frontend in new window
Write-Host "[4/4] Starting frontend server..." -ForegroundColor Green
$frontendPath = Join-Path $rootDir "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"
Write-Host "Frontend starting at http://127.0.0.1:5173" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://127.0.0.1:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in the server windows to stop them." -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to close this window"
