from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

CandleDict = Dict[str, Any]

OrderSide = Literal["buy", "sell"]
OrderType = Literal["market", "limit", "stop"]
TimeInForce = Literal["GTC", "GFD", "FOK"]

class BrokerAdapter(ABC):
    """Abstract broker interface so that broker implementations can be swapped."""

    @abstractmethod
    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
        limit: int | None = None,
    ) -> List[CandleDict]:
        """Return candles for the given symbol, timeframe, and period."""

    @abstractmethod
    async def get_current_price(self, symbol: str) -> float:
        """Return the latest price (mid or derived from bid/ask)."""

    @abstractmethod
    async def place_order(
        self,
        symbol: str,
        side: OrderSide,
        volume: float,
        order_type: OrderType = "market",
        price: Optional[float] = None,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        time_in_force: TimeInForce = "GTC",
        client_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Place an order and return broker-specific order info."""

    @abstractmethod
    async def cancel_order(self, broker_order_id: str) -> None:
        """Cancel an open order."""

    @abstractmethod
    async def get_open_positions(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return current open positions."""

    @abstractmethod
    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """Return current open orders."""

    @abstractmethod
    async def get_account_summary(self) -> Dict[str, Any]:
        """Return basic account info (balance, equity, margin, etc.)."""
