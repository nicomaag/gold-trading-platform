from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class GoldenMomentumStrategy(BaseStrategy):
    """
    H1 Strategy focusing on high win rate and low drawdown.
    
    Logic:
    1. Trend: EMA 50 > EMA 200 (Golden Cross Alignment)
    2. Price Structure: Close > EMA 50 (Respecting trend)
    3. Momentum: 40 < RSI < 65 (Healthy pullback, not overbought)
    
    Risk Management:
    - Stop Loss: 2 * ATR (Dynamic volatility based)
    - Take Profit: 3 * ATR (1.5 Risk/Reward)
    - Volume: Risk 2% of Equity per trade
    """
    
    def __init__(self, symbol: str, timeframe: str, params: Dict[str, Any]):
        super().__init__(symbol, timeframe, params)
        # Parameters
        self.ema_fast_period = int(params.get("ema_fast_period", 50))
        self.ema_slow_period = int(params.get("ema_slow_period", 200))
        self.rsi_period = int(params.get("rsi_period", 14))
        self.atr_period = int(params.get("atr_period", 14))
        
        self.rsi_min = float(params.get("rsi_min", 40))
        self.rsi_max = float(params.get("rsi_max", 65))
        
        self.risk_percent = float(params.get("risk_percent", 0.02))
        self.atr_sl_mult = float(params.get("atr_sl_mult", 2.0))
        self.atr_tp_mult = float(params.get("atr_tp_mult", 3.0))
        
        self.candles = []

    def on_backtest_start(self):
        """Initialize for backtest."""
        self.candles = []

    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process new candle and generate signals."""
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
        df["atr"] = ta.atr(df["high"], df["low"], df["close"], length=self.atr_period)
        
        # Get latest values
        current_price = candle["close"]
        current_ema_fast = df["ema_fast"].iloc[-1]
        current_ema_slow = df["ema_slow"].iloc[-1]
        current_rsi = df["rsi"].iloc[-1]
        current_atr = df["atr"].iloc[-1]
        
        # Check validity
        if pd.isna(current_ema_slow) or pd.isna(current_rsi) or pd.isna(current_atr):
            return []
            
        actions = []
        
        # ENTRY LOGIC (Long Only)
        # 1. Trend Alignment
        is_uptrend = current_ema_fast > current_ema_slow
        
        # 2. Price Structure (Price above fast EMA)
        price_respects_trend = current_price > current_ema_fast
        
        # 3. Momentum (Pullback but not crash)
        valid_momentum = self.rsi_min < current_rsi < self.rsi_max
        
        if is_uptrend and price_respects_trend and valid_momentum:
            # Dynamic Volume Calculation
            estimated_balance = 10000 # In real bot this would be actual balance
            risk_amount = estimated_balance * self.risk_percent
            
            # Safety: Ensure ATR is large enough to avoid division by zero or massive size
            if current_atr < 0.5: # Minimum $0.50 move in Gold
                return []

            stop_loss_dist = current_atr * self.atr_sl_mult
            
            if stop_loss_dist > 0:
                # 1. Risk-based sizing
                risk_units = risk_amount / stop_loss_dist
                
                # 2. Leverage-based capping (Max 100x to prevent explosions)
                max_leverage = 100.0
                max_position_value = estimated_balance * max_leverage
                max_units = max_position_value / current_price
                
                # Use the smaller of the two
                units = min(risk_units, max_units)
                units = round(units, 2)
                
                if units > 0:
                    actions.append({
                        "action": "order",
                        "side": "buy",
                        "volume": units,
                        "type": "market",
                        "stop_loss": current_price - stop_loss_dist,
                        "take_profit": current_price + (current_atr * self.atr_tp_mult),
                        "reason": f"Golden Momentum (ATR: {current_atr:.2f})"
                    })
                
        return actions

    def on_backtest_end(self):
        """Cleanup."""
        pass
