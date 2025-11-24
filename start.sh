#!/bin/bash
# Gold Trading Platform - Startup Script (Unix/Linux/Mac)
# This script installs dependencies and starts both backend and frontend

echo "========================================"
echo "Gold Trading Platform - Startup Script"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure your settings."
    echo ""
    read -p "Press Enter to exit"
    exit 1
fi

# Backend setup
echo "[1/4] Installing backend dependencies..."
cd backend
if pip install -r requirements.txt --quiet; then
    echo "✓ Backend dependencies installed"
else
    echo "✗ Failed to install backend dependencies"
    cd ..
    read -p "Press Enter to exit"
    exit 1
fi
cd ..

# Frontend setup
echo "[2/4] Installing frontend dependencies..."
cd frontend
if npm install --silent; then
    echo "✓ Frontend dependencies installed"
else
    echo "✗ Failed to install frontend dependencies"
    cd ..
    read -p "Press Enter to exit"
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "Starting Application..."
echo "========================================"
echo ""

# Start backend in background
echo "[3/4] Starting backend server..."
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "✓ Backend starting at http://127.0.0.1:8000 (PID: $BACKEND_PID)"
cd ..

# Wait a moment for backend to initialize
sleep 2

# Start frontend in background
echo "[4/4] Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend starting at http://127.0.0.1:5173 (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "========================================"
echo "Application Started Successfully!"
echo "========================================"
echo ""
echo "Backend:  http://127.0.0.1:8000"
echo "Frontend: http://127.0.0.1:5173"
echo ""
echo "Press Ctrl+C to stop all servers."
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
