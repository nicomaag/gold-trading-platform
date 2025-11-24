from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseStrategy(ABC):
    """
    Base class for all strategies.
    Strategies are stateful objects that receive candles and can emit actions.
    """

    def __init__(self, symbol: str, timeframe: str, params: Dict[str, Any] | None = None):
        self.symbol = symbol
        self.timeframe = timeframe
        self.params = params or {}
        self._context: Dict[str, Any] = {}  # internal state storage

    @abstractmethod
    def on_backtest_start(self) -> None:
        """Called once at the start of a backtest."""

    @abstractmethod
    def on_backtest_end(self) -> None:
        """Called once at the end of a backtest."""

    @abstractmethod
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Called for each new candle.
        Candle contains at least: time, open, high, low, close, volume.
        Returns a list of actions, e.g.:
          { "action": "order", "side": "buy", "volume": 0.1, "type": "market" }
        """
