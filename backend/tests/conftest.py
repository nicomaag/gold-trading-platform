import pytest
import os
import tempfile
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.models.db_base import Base
from app.core.broker.base import BrokerAdapter
from typing import List, Dict, Any, Optional
from datetime import datetime

# Mock Broker Adapter for testing
class MockBrokerAdapter(BrokerAdapter):
    """Mock broker for testing without real API calls."""
    
    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
        limit: int | None = None,
    ) -> List[Dict[str, Any]]:
        # Return mock candle data
        return [
            {
                "time": start,
                "open": 2000.0,
                "high": 2010.0,
                "low": 1990.0,
                "close": 2005.0,
                "volume": 1000
            }
        ]
    
    async def get_current_price(self, symbol: str) -> float:
        return 2000.0
    
    async def place_order(
        self,
        symbol: str,
        side: str,
        volume: float,
        order_type: str = "market",
        price: Optional[float] = None,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        time_in_force: str = "GTC",
        client_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        return {"order_id": "mock_123", "status": "filled"}
    
    async def cancel_order(self, broker_order_id: str) -> None:
        pass
    
    async def get_open_positions(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        return []
    
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        return []
    
    async def get_account_summary(self) -> Dict[str, Any]:
        return {"balance": 10000.0, "equity": 10000.0}

@pytest.fixture
def test_client():
    """Provide a test client for API testing."""
    return TestClient(app)

@pytest.fixture
async def async_db():
    """Provide an async database session for testing."""
    # Create a temporary database
    temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
    temp_db.close()
    
    database_url = f"sqlite+aiosqlite:///{temp_db.name}"
    engine = create_async_engine(database_url, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()
    os.unlink(temp_db.name)

@pytest.fixture
def mock_broker():
    """Provide a mock broker adapter."""
    return MockBrokerAdapter()

@pytest.fixture
def temp_strategies_dir(tmp_path):
    """Create a temporary strategies directory for testing."""
    strategies_dir = tmp_path / "strategies"
    strategies_dir.mkdir()
    
    # Create base_strategy.py
    base_strategy_content = '''from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseStrategy(ABC):
    def __init__(self, symbol: str, timeframe: str, params: Dict[str, Any] | None = None):
        self.symbol = symbol
        self.timeframe = timeframe
        self.params = params or {}
    
    @abstractmethod
    def on_backtest_start(self) -> None:
        pass
    
    @abstractmethod
    def on_backtest_end(self) -> None:
        pass
    
    @abstractmethod
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass
'''
    (strategies_dir / "base_strategy.py").write_text(base_strategy_content)
    
    return strategies_dir
