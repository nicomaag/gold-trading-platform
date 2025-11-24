from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class DataProvider(ABC):
    """Abstract base class for market data providers."""
    
    @abstractmethod
    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime | None,
        end: datetime | None,
        limit: int = 500,
        db: 'AsyncSession' = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical candle data.
        
        Args:
            symbol: Trading symbol (e.g., "XAU_USD")
            timeframe: Candle timeframe (e.g., "H1", "M15", "D")
            start: Start datetime
            end: End datetime
            limit: Maximum number of candles to return
            db: Database session for caching
            
        Returns:
            List of candle dictionaries with keys:
            - time: datetime
            - open: float
            - high: float
            - low: float
            - close: float
            - volume: int
        """
        pass
    
    def convert_symbol(self, symbol: str) -> str:
        """
        Convert symbol to provider-specific format.
        Override in subclasses if needed.
        """
        return symbol
    
    def convert_timeframe(self, timeframe: str) -> str:
        """
        Convert timeframe to provider-specific format.
        Override in subclasses if needed.
        """
        return timeframe
