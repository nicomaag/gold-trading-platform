# Gold Trading Platform

A modular trading platform for XAUUSD (Gold) featuring:
- **File-based Strategies**: Define strategies as Python classes.
- **Backtesting Engine**: Test strategies against historical data.
- **Live Trading Bots**: Run strategies in real-time against OANDA v20 API.
- **Modern Web UI**: Manage strategies, backtests, and bots via a React dashboard.

## Project Structure

```
gold-trading-platform/
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── api/        # REST API endpoints
│   │   ├── core/       # Core logic (Broker, Backtesting, Live Trading)
│   │   ├── models/     # Database models
│   │   ├── services/   # Business logic services
│   │   └── strategies/ # Strategy files
│   └── ...
├── frontend/           # React + TypeScript frontend
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # UI components
│   │   └── pages/      # Application pages
│   └── ...
└── ...
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- OANDA Account (Demo/Practice recommended)

## Quick Start

The easiest way to start the application is using the startup script:

### Windows (PowerShell)
```powershell
.\start.ps1
```

### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

The script will:
1. Check for `.env` configuration
2. Install backend dependencies (Python packages)
3. Install frontend dependencies (npm packages)
4. Start the backend server at `http://127.0.0.1:8000`
5. Start the frontend at `http://127.0.0.1:5173`

**Note:** Make sure to configure your `.env` file first (see Configuration section below).

---

## Manual Setup

If you prefer to run the services manually:

### 1. Configuration

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and fill in your OANDA credentials:

```ini
APP_ENV=development
APP_PORT=8000

# Broker
BROKER_NAME=oanda

# OANDA
OANDA_ENVIRONMENT=practice
OANDA_API_TOKEN=your_oanda_token_here
OANDA_ACCOUNT_ID=your_account_id_here

# Database
DATABASE_URL=sqlite+aiosqlite:///./gold_trading.db

# Frontend
FRONTEND_ORIGIN=http://localhost:5173
```

### 2. Run Backend Manually

```bash
cd backend
# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.
Docs: `http://localhost:8000/docs`

### 3. Run Frontend Manually

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The UI will be available at `http://localhost:5173`.

## Usage Guide

### Creating a Strategy
1. Create a new `.py` file in `backend/app/strategies/`.
2. Inherit from `BaseStrategy`.
3. Implement `on_candle` logic.
4. The strategy will automatically appear in the UI.

### Running a Backtest
1. Go to the **Strategies** page.
2. Click **Backtest** on a strategy.
3. Select parameters, date range, and timeframe.
4. Click **Run Backtest**.
5. View results in the **Backtests** page.

### Starting a Live Bot
1. Go to the **Live Bots** page.
2. Click **Start New Bot**.
3. Select strategy and configure parameters.
4. Click **Start Bot**.
5. Monitor status and stop the bot when needed.

## Testing

### Run All Tests (Recommended)

**Windows:**
```powershell
.\test.ps1
```

**Linux/Mac:**
```bash
chmod +x test.sh
./test.sh
```

This will run both backend and frontend tests automatically.

### Run Tests Individually

**Backend Tests:**
```bash
cd backend
pytest -v tests/
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

**Note:** Tests are configured to NEVER execute real trades, even if `TRADING_ENABLED=true`.

## License
MIT
