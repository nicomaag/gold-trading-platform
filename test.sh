#!/bin/bash
# Run All Tests Script
# This script runs both backend and frontend tests

echo "========================================"
echo "Running All Tests"
echo "========================================"
echo ""

failed=0

# Backend Tests
echo "[1/2] Running Backend Tests..."
cd backend
export TESTING=true
pytest -v tests/
if [ $? -ne 0 ]; then
    echo "✗ Backend tests failed"
    failed=1
else
    echo "✓ Backend tests passed"
fi
cd ..

echo ""

# Frontend Tests
echo "[2/2] Running Frontend Tests..."
cd frontend
npm test -- --run
if [ $? -ne 0 ]; then
    echo "✗ Frontend tests failed"
    failed=1
else
    echo "✓ Frontend tests passed"
fi
cd ..

echo ""
echo "========================================"
if [ $failed -eq 1 ]; then
    echo "Some tests failed"
    exit 1
else
    echo "All tests passed!"
    exit 0
fi
