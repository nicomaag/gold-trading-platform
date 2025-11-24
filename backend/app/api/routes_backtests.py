from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db
from app.models.backtest import Backtest
from app.services.strategy_service import strategy_service
from app.core.backtesting.engine import BacktestEngine
from app.core.data import get_data_provider

router = APIRouter()

class BacktestRequest(BaseModel):
    strategy_name: str
    symbol: str
    timeframe: str
    start: datetime
    end: datetime
    params: Dict[str, Any] = {}

@router.post("/backtests")
async def run_backtest(req: BacktestRequest, db: AsyncSession = Depends(get_db)):
    strategy_class = strategy_service.get_strategy_class(req.strategy_name)
    if not strategy_class:
        raise HTTPException(status_code=404, detail="Strategy not found")

    # Create backtest record
    backtest = Backtest(
        strategy_name=req.strategy_name,
        symbol=req.symbol,
        timeframe=req.timeframe,
        start_date=req.start,
        end_date=req.end,
        params=req.params,
        status="running"
    )
    db.add(backtest)
    await db.commit()
    await db.refresh(backtest)

    # Run backtest (sync for now as per spec "synchronously acceptable")
    # In a real app, this should be a background task
    try:
        # Use configured data provider (Twelve Data or OANDA)
        data_provider = get_data_provider()
        engine = BacktestEngine(data_provider)
        result = await engine.run(
            strategy_class,
            req.symbol,
            req.timeframe,
            req.start,
            req.end,
            req.params,
            db=db
        )
        
        backtest.status = "completed"
        backtest.total_return = result.total_return
        backtest.max_drawdown = result.max_drawdown
        backtest.win_rate = result.win_rate
        backtest.trades_count = len(result.trades)
        
        # Serialize trades and equity curve
        backtest.trades = [t.dict() for t in result.trades]
        backtest.equity_curve = result.equity_curve
        
        await db.commit()
        return {"id": backtest.id, "status": "completed", "total_return": backtest.total_return}
        
    except Exception as e:
        backtest.status = "failed"
        await db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backtests")
async def list_backtests(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Backtest).order_by(Backtest.created_at.desc()))
    backtests = result.scalars().all()
    return backtests

@router.get("/backtests/{backtest_id}")
async def get_backtest(backtest_id: int, db: AsyncSession = Depends(get_db)):
    backtest = await db.get(Backtest, backtest_id)
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest

@router.delete("/backtests/{backtest_id}")
async def delete_backtest(backtest_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a backtest."""
    backtest = await db.get(Backtest, backtest_id)
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    await db.delete(backtest)
    await db.commit()
    
    return {"status": "ok", "message": f"Backtest {backtest_id} deleted"}
