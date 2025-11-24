from typing import Dict, Any, List
from app.strategies.base_strategy import BaseStrategy
import pandas as pd

class MACrossStrategy(BaseStrategy):
    """
    Moving Average Crossover Strategy.
    Buys when short MA crosses above long MA.
    Sells when short MA crosses below long MA.
    """
    
    def __init__(self, symbol: str, timeframe: str, params: Dict[str, Any] | None = None):
        super().__init__(symbol, timeframe, params)
        self.short_window = self.params.get("short_window", 10)
        self.long_window = self.params.get("long_window", 30)
        self.position_size = self.params.get("position_size", 0.1)
        self.prices: List[float] = []
        self.position = 0 # 0: flat, 1: long, -1: short

    def on_backtest_start(self) -> None:
        print(f"Starting MA Cross Strategy on {self.symbol} {self.timeframe}")
        self.prices = []
        self.position = 0

    def on_backtest_end(self) -> None:
        print("MA Cross Strategy finished.")

    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        close_price = candle["close"]
        self.prices.append(close_price)
        
        actions = []
        
        if len(self.prices) < self.long_window:
            return actions
            
        # Calculate MAs
        # In a real scenario, we might use pandas or numpy for efficiency, 
        # but for a simple example, we can slice the list.
        # Or just keep a rolling window.
        
        short_ma = sum(self.prices[-self.short_window:]) / self.short_window
        long_ma = sum(self.prices[-self.long_window:]) / self.long_window
        
        # Previous MAs to detect crossover
        if len(self.prices) < self.long_window + 1:
            return actions

        prev_short_ma = sum(self.prices[-self.short_window-1:-1]) / self.short_window
        prev_long_ma = sum(self.prices[-self.long_window-1:-1]) / self.long_window
        
        # Crossover logic
        # Cross over (Buy)
        if prev_short_ma <= prev_long_ma and short_ma > long_ma:
            if self.position <= 0:
                # Close short if any
                if self.position < 0:
                    actions.append({
                        "action": "order",
                        "side": "buy",
                        "volume": self.position_size, # Close short
                        "type": "market"
                    })
                # Open long
                actions.append({
                    "action": "order",
                    "side": "buy",
                    "volume": self.position_size,
                    "type": "market"
                })
                self.position = 1
                
        # Cross under (Sell)
        elif prev_short_ma >= prev_long_ma and short_ma < long_ma:
            if self.position >= 0:
                # Close long if any
                if self.position > 0:
                    actions.append({
                        "action": "order",
                        "side": "sell",
                        "volume": self.position_size, # Close long
                        "type": "market"
                    })
                # Open short
                actions.append({
                    "action": "order",
                    "side": "sell",
                    "volume": self.position_size,
                    "type": "market"
                })
                self.position = -1
                
        return actions
