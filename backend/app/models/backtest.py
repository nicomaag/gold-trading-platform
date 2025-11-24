from sqlalchemy import Column, Integer, String, DateTime, Float, JSON
from datetime import datetime
from app.models.db_base import Base

class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    strategy_name = Column(String, index=True)
    symbol = Column(String)
    timeframe = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    params = Column(JSON)
    status = Column(String, default="pending") # pending, running, completed, failed
    
    # Results
    total_return = Column(Float, nullable=True)
    max_drawdown = Column(Float, nullable=True)
    win_rate = Column(Float, nullable=True)
    trades_count = Column(Integer, nullable=True)
    
    # Detailed results stored as JSON blob for simplicity in v1
    equity_curve = Column(JSON, nullable=True)
    trades = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
