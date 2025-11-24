from datetime import datetime
from typing import List, Dict, Any
from .base import DataProvider
from app.core.broker.oanda import OandaBrokerAdapter


class OandaDataProvider(DataProvider):
    """OANDA broker as a data provider."""
    
    def __init__(self, broker: OandaBrokerAdapter):
        self.broker = broker
    
    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
        limit: int = 500
    ) -> List[Dict[str, Any]]:
        """Fetch historical candles from OANDA broker."""
        return await self.broker.get_historical_candles(
            symbol=symbol,
            timeframe=timeframe,
            start=start,
            end=end,
            limit=limit
        )
