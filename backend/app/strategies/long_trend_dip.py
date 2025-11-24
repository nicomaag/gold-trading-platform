from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class LongTrendDipStrategy(BaseStrategy):
    """
    Long-only strategy that buys dips in an uptrend.
    
    Logic:
    1. Trend: EMA 50 > EMA 200 (Trend Alignment) - Allows buying dips below EMA lines
    2. Entry: RSI < 50 (Aggressive Dip)
    3. Exit: RSI > 70 (Peak) or Stop Loss
    
    Volume is calculated dynamically based on balance and leverage.
    """
    
    def __init__(self, symbol: str, timeframe: str, params: Dict[str, Any]):
        super().__init__(symbol, timeframe, params)
        # Parameters
        self.ema_fast_period = int(params.get("ema_fast_period", 50))
        self.ema_slow_period = int(params.get("ema_slow_period", 200))
        self.rsi_period = int(params.get("rsi_period", 14))
        self.rsi_entry = float(params.get("rsi_entry", 50)) # Relaxed from 40
        self.rsi_exit = float(params.get("rsi_exit", 70))
        self.leverage = float(params.get("leverage", 1000))
        self.risk_percent = float(params.get("risk_percent", 0.02))
        self.stop_loss_pct = float(params.get("stop_loss_pct", 0.01))
        
        self.candles = []
        self.df = pd.DataFrame()

    def on_backtest_start(self):
        """Initialize for backtest."""
        self.candles = []
        self.df = pd.DataFrame()

    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process new candle and generate signals."""
        # Add candle to history
        self.candles.append(candle)
        
        # Need enough data for indicators
        if len(self.candles) < self.ema_slow_period + 50:
            return []
            
        # Update DataFrame
        df = pd.DataFrame(self.candles)
        
        # Calculate Indicators
        df["ema_fast"] = ta.ema(df["close"], length=self.ema_fast_period)
        df["ema_slow"] = ta.ema(df["close"], length=self.ema_slow_period)
        df["rsi"] = ta.rsi(df["close"], length=self.rsi_period)
        
        # Get latest values
        current_price = candle["close"]
        current_ema_fast = df["ema_fast"].iloc[-1]
        current_ema_slow = df["ema_slow"].iloc[-1]
        current_rsi = df["rsi"].iloc[-1]
        
        # Check if indicators are valid
        if pd.isna(current_ema_slow) or pd.isna(current_rsi):
            return []
            
        actions = []
        
        # EXIT LOGIC
        if current_rsi > self.rsi_exit:
            actions.append({
                "action": "order",
                "side": "sell", # Closes long
                "volume": 0,
                "type": "market",
                "reason": "RSI Peak"
            })
            
        # ENTRY LOGIC
        # 1. Trend Alignment: Fast EMA > Slow EMA (Bullish structure)
        # 2. Dip: RSI < Entry Threshold
        elif current_ema_fast > current_ema_slow and current_rsi < self.rsi_entry:
            
            # Volume Calculation
            estimated_balance = 10000
            max_position_value = estimated_balance * self.leverage
            max_units = max_position_value / current_price
            
            risk_amount = estimated_balance * self.risk_percent
            sl_distance = current_price * self.stop_loss_pct
            risk_units = risk_amount / sl_distance
            
            units = min(max_units, risk_units)
            units = round(units, 2)
            
            if units > 0:
                actions.append({
                    "action": "order",
                    "side": "buy",
                    "volume": units,
                    "type": "market",
                    "stop_loss": current_price * (1 - self.stop_loss_pct),
                    "take_profit": None,
                    "reason": "Trend Dip Entry"
                })
                
        return actions

    def on_backtest_end(self):
        """Cleanup."""
        pass
