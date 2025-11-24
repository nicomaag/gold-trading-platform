import asyncio
from datetime import datetime
from typing import Any
from sqlalchemy.orm import Session
from app.core.broker.base import BrokerAdapter
from app.strategies.base_strategy import BaseStrategy
from app.models.bot import Bot
from app.core.live_trading.registry import bot_registry

class BotRunner:
    def __init__(self, broker: BrokerAdapter, db_session_factory):
        self.broker = broker
        self.db_session_factory = db_session_factory

    async def start_bot(self, bot_id: str, strategy_class: type[BaseStrategy], symbol: str, timeframe: str, params: Any):
        # Create strategy instance
        strategy = strategy_class(symbol, timeframe, params)
        
        # Create background task
        task = asyncio.create_task(self._bot_loop(bot_id, strategy, symbol, timeframe))
        
        # Register
        bot_registry.register_bot(bot_id, task, strategy)
        
        # Update DB status
        async with self.db_session_factory() as session:
            bot = await session.get(Bot, bot_id)
            if bot:
                bot.status = "running"
                bot.start_time = datetime.utcnow()
                await session.commit()

    async def stop_bot(self, bot_id: str):
        bot_data = bot_registry.get_bot(bot_id)
        if bot_data:
            task = bot_data["task"]
            task.cancel()
            bot_registry.remove_bot(bot_id)
            
        # Update DB
        async with self.db_session_factory() as session:
            bot = await session.get(Bot, bot_id)
            if bot:
                bot.status = "stopped"
                await session.commit()

    async def _bot_loop(self, bot_id: str, strategy: BaseStrategy, symbol: str, timeframe: str):
        try:
            while True:
                # 1. Fetch latest candle
                # For simplicity, fetch last 2 candles to ensure we have a closed one
                now = datetime.utcnow()
                # This logic needs refinement for real intervals, but for v1 polling:
                candles = await self.broker.get_historical_candles(symbol, timeframe, start=datetime(2000,1,1), end=now, limit=2)
                
                if candles:
                    latest_candle = candles[-1]
                    # 2. Strategy step
                    actions = strategy.on_candle(latest_candle)
                    
                    # 3. Execute actions
                    for action in actions:
                        if action["action"] == "order":
                            # CRITICAL: NEVER trade during tests
                            import os
                            if os.getenv("TESTING") == "true":
                                print(f"🧪 TEST MODE: Skipping order placement - {action['side']} {action['volume']} {symbol}")
                                continue
                            
                            # SAFETY CHECK: Only execute if trading is enabled
                            from app.config import settings
                            if not settings.TRADING_ENABLED:
                                print(f"🛡️ SAFETY: Trading disabled. Would have placed {action['side']} order for {action['volume']} {symbol}")
                                continue
                            
                            print(f"⚠️ EXECUTING REAL TRADE: {action['side']} {action['volume']} {symbol}")
                            await self.broker.place_order(
                                symbol=symbol,
                                side=action["side"],
                                volume=float(action["volume"]),
                                order_type=action.get("type", "market")
                            )
                
                # Update heartbeat
                async with self.db_session_factory() as session:
                    bot = await session.get(Bot, bot_id)
                    if bot:
                        bot.last_update_time = datetime.utcnow()
                        await session.commit()

                # Wait for next poll (e.g. 60s)
                await asyncio.sleep(60) 
                
        except asyncio.CancelledError:
            print(f"Bot {bot_id} stopped.")
        except Exception as e:
            print(f"Bot {bot_id} error: {e}")
            async with self.db_session_factory() as session:
                bot = await session.get(Bot, bot_id)
                if bot:
                    bot.status = "error"
                    await session.commit()
