# Run All Tests Script
# This script runs both backend and frontend tests

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running All Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$failed = $false

# Backend Tests
Write-Host "[1/2] Running Backend Tests..." -ForegroundColor Green
Push-Location backend
$env:TESTING = "true"
pytest -v tests/ 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Backend tests failed" -ForegroundColor Red
    Write-Host "Run 'cd backend && pytest -v tests/' to see details" -ForegroundColor Yellow
    $failed = $true
} else {
    Write-Host "[PASS] Backend tests passed" -ForegroundColor Green
}
Pop-Location

Write-Host ""

# Frontend Tests  
Write-Host "[2/2] Running Frontend Tests..." -ForegroundColor Green
Push-Location frontend
npm test 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAIL] Frontend tests failed" -ForegroundColor Red
    Write-Host "Run 'cd frontend && npm test' to see details" -ForegroundColor Yellow
    $failed = $true
} else {
    Write-Host "[PASS] Frontend tests passed" -ForegroundColor Green
}
Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($failed) {
    Write-Host "Some tests failed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}
