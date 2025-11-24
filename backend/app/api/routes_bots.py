from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel

from app.db.session import get_db, AsyncSessionLocal
from app.models.bot import Bot
from app.services.strategy_service import strategy_service
from app.core.live_trading.bot_runner import BotRunner
from app.core.broker.oanda import OandaBrokerAdapter
from app.core.live_trading.registry import bot_registry

router = APIRouter()

# Single instance of BotRunner for the app
# In a real production app, this might be managed differently (e.g. dependency injection)
bot_runner = BotRunner(OandaBrokerAdapter(), AsyncSessionLocal)

class BotCreateRequest(BaseModel):
    strategy_name: str
    symbol: str
    timeframe: str
    params: Dict[str, Any] = {}

@router.post("/bots")
async def create_bot(req: BotCreateRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db)):
    strategy_class = strategy_service.get_strategy_class(req.strategy_name)
    if not strategy_class:
        raise HTTPException(status_code=404, detail="Strategy not found")

    # Create bot record
    bot = Bot(
        strategy_name=req.strategy_name,
        symbol=req.symbol,
        timeframe=req.timeframe,
        params=req.params,
        status="starting"
    )
    db.add(bot)
    await db.commit()
    await db.refresh(bot)

    # Start bot in background
    background_tasks.add_task(
        bot_runner.start_bot,
        bot.id,
        strategy_class,
        req.symbol,
        req.timeframe,
        req.params
    )

    return {"id": bot.id, "status": "starting"}

@router.get("/bots")
async def list_bots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bot).order_by(Bot.created_at.desc()))
    bots = result.scalars().all()
    return bots

@router.get("/bots/{bot_id}")
async def get_bot(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Get runtime info if available
    runtime_info = bot_registry.get_bot(bot_id)
    
    # We could fetch open positions here via broker adapter if we wanted to show them
    # For now, just return the DB record
    return bot

@router.post("/bots/{bot_id}/stop")
async def stop_bot(bot_id: str, db: AsyncSession = Depends(get_db)):
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Stop the bot
    await bot_runner.stop_bot(bot_id)
    
    return {"id": bot_id, "status": "stopped"}

@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a bot (must be stopped first)."""
    bot = await db.get(Bot, bot_id)
    if not bot:
        raise HTTPException(status_code=404, detail="Bot not found")
    
    # Safety: Only allow deletion of stopped bots
    if bot.status == "running":
        raise HTTPException(status_code=400, detail="Cannot delete running bot. Stop it first.")
    
    # Delete from database
    await db.delete(bot)
    await db.commit()
    
    return {"status": "ok", "message": f"Bot {bot_id} deleted"}
