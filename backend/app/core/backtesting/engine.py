from datetime import datetime
from typing import Dict, Any, List, TYPE_CHECKING
from app.core.data.base import DataProvider
from app.strategies.base_strategy import BaseStrategy
from app.models.trade import Trade
from app.models.backtest import Backtest
import pandas as pd

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

class BacktestResult:
    def __init__(self):
        self.total_return = 0.0
        self.max_drawdown = 0.0
        self.trades: List[Trade] = []
        self.equity_curve: List[Dict[str, Any]] = []
        self.win_rate = 0.0

class BacktestEngine:
    def __init__(self, data_provider: DataProvider):
        self.data_provider = data_provider

    async def run(
        self,
        strategy_class: type[BaseStrategy],
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
        params: Dict[str, Any],
        db: 'AsyncSession' = None
    ) -> BacktestResult:
        # 1. Fetch Data from data provider
        # Use full date range - provider will use cached data and only fetch missing ranges
        candles = await self.data_provider.get_historical_candles(
            symbol, timeframe, start, end, limit=10000, db=db
        )
        if not candles:
            return BacktestResult()
        
        # Commit data and metrics to database immediately after loading
        # We commit here so that the data is persisted even if the simulation takes a long time
        # We DO NOT close the session here because the caller (API route) needs it to update the backtest status
        if db:
            await db.commit()
            print(f"✅ Committed {len(candles)} candles and metrics to database")
            print(f"🔓 Database session ready for simulation (running in thread)")

        # 2. Init Strategy
        strategy = strategy_class(symbol, timeframe, params)
        strategy.on_backtest_start()

        # 3. Run Simulation in Thread Pool
        # This prevents the CPU-intensive simulation from blocking the main event loop
        # allowing other API requests (like metrics) to be processed concurrently
        import asyncio
        loop = asyncio.get_running_loop()
        
        result = await loop.run_in_executor(
            None,  # Use default executor
            self._run_simulation,
            strategy,
            candles
        )
        
        return result

    def _run_simulation(
        self, 
        strategy: BaseStrategy, 
        candles: List[Dict[str, Any]]
    ) -> BacktestResult:
        """
        Synchronous simulation loop designed to run in a separate thread.
        """
        print(f"🧵 [Thread] Starting simulation with {len(candles)} candles")
        try:
            balance = 10000.0 # Initial capital
            equity = balance
            position = 0.0
            entry_price = 0.0
            trade_entry_time = None
            stop_loss = None
            take_profit = None
            
            trades: List[Trade] = []
            equity_curve = []
            
            for candle in candles:
                # 0. Check SL/TP execution FIRST (Intra-candle price action)
                if position != 0:
                    executed_price = None
                    
                    if position > 0: # Long Position
                        # Check SL (Low hit SL)
                        if stop_loss and candle["low"] <= stop_loss:
                            executed_price = stop_loss
                        # Check TP (High hit TP)
                        elif take_profit and candle["high"] >= take_profit:
                            executed_price = take_profit
                            
                    elif position < 0: # Short Position
                        # Check SL (High hit SL)
                        if stop_loss and candle["high"] >= stop_loss:
                            executed_price = stop_loss
                        # Check TP (Low hit TP)
                        elif take_profit and candle["low"] <= take_profit:
                            executed_price = take_profit

                    if executed_price:
                        # Close Position
                        pnl = 0
                        if position > 0:
                            pnl = (executed_price - entry_price) * position
                        else:
                            pnl = (entry_price - executed_price) * abs(position)
                        
                        balance += pnl
                        trades.append(Trade(
                            entry_time=trade_entry_time,
                            exit_time=candle["time"],
                            side="buy" if position > 0 else "sell",
                            entry_price=entry_price,
                            exit_price=executed_price,
                            volume=abs(position),
                            pnl=pnl,
                            status="closed"
                        ))
                        position = 0
                        stop_loss = None
                        take_profit = None
                        trade_entry_time = None

                # Update equity based on current close
                current_price = candle["close"]
                unrealized_pnl = 0
                if position != 0:
                    if position > 0:
                        unrealized_pnl = (current_price - entry_price) * position
                    else:
                        unrealized_pnl = (entry_price - current_price) * abs(position)
                
                equity = balance + unrealized_pnl
                equity_curve.append({"time": candle["time"].isoformat(), "equity": equity})

                # Strategy Step
                actions = strategy.on_candle(candle)
                
                for action in actions:
                    if action["action"] == "order":
                        side = action["side"]
                        volume = float(action["volume"])
                        # Simplified execution: fill at close
                        fill_price = current_price 
                        
                        if side == "buy":
                            # Close short if exists
                            if position < 0:
                                pnl = (entry_price - fill_price) * abs(position)
                                balance += pnl
                                trades.append(Trade(
                                    entry_time=trade_entry_time,
                                    exit_time=candle["time"],
                                    side="sell", # It was a short
                                    entry_price=entry_price,
                                    exit_price=fill_price,
                                    volume=abs(position),
                                    pnl=pnl,
                                    status="closed"
                                ))
                                position = 0
                                stop_loss = None
                                take_profit = None
                                trade_entry_time = None
                            
                            # Open long
                            position += volume
                            entry_price = fill_price
                            trade_entry_time = candle["time"]
                            stop_loss = action.get("stop_loss")
                            take_profit = action.get("take_profit")
                            
                        elif side == "sell":
                            # Close long if exists
                            if position > 0:
                                pnl = (fill_price - entry_price) * position
                                balance += pnl
                                trades.append(Trade(
                                    entry_time=trade_entry_time,
                                    exit_time=candle["time"],
                                    side="buy", # It was a long
                                    entry_price=entry_price,
                                    exit_price=fill_price,
                                    volume=position,
                                    pnl=pnl,
                                    status="closed"
                                ))
                                position = 0
                                stop_loss = None
                                take_profit = None
                                trade_entry_time = None
                                
                            # Open short
                            position -= volume
                            entry_price = fill_price
                            trade_entry_time = candle["time"]
                            stop_loss = action.get("stop_loss")
                            take_profit = action.get("take_profit")

            strategy.on_backtest_end()
            
            # Close open positions at end
            if position != 0:
                last_price = candles[-1]["close"]
                pnl = 0
                if position > 0:
                    pnl = (last_price - entry_price) * position
                else:
                    pnl = (entry_price - last_price) * abs(position)
                balance += pnl
                trades.append(Trade(
                    entry_time=candles[-1]["time"],
                    exit_time=candles[-1]["time"],
                    side="buy" if position > 0 else "sell",
                    entry_price=entry_price,
                    exit_price=last_price,
                    volume=abs(position),
                    pnl=pnl,
                    status="closed"
                ))

            # Calculate metrics
            result = BacktestResult()
            result.total_return = (balance - 10000.0) / 10000.0 * 100
            result.trades = trades
            result.equity_curve = equity_curve
            
            wins = [t for t in trades if (t.pnl or 0) > 0]
            result.win_rate = len(wins) / len(trades) if trades else 0.0
            
            # Max Drawdown
            max_eq = 0
            max_dd = 0
            for point in equity_curve:
                eq = point["equity"]
                if eq > max_eq:
                    max_eq = eq
                dd = (max_eq - eq) / max_eq if max_eq > 0 else 0
                if dd > max_dd:
                    max_dd = dd
            result.max_drawdown = max_dd * 100

            print(f"🧵 [Thread] Simulation complete. Return: {result.total_return}%, Trades: {len(result.trades)}")
            return result
        except Exception as e:
            print(f"❌ [Thread] Simulation failed: {e}")
            import traceback
            traceback.print_exc()
            raise e
