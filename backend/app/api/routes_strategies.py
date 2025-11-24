from fastapi import APIRouter, HTTPException
from app.services.strategy_service import strategy_service

router = APIRouter()

@router.get("/strategies")
async def list_strategies():
    return strategy_service.get_strategies()

@router.get("/strategies/{strategy_name}")
async def get_strategy(strategy_name: str):
    strategies = strategy_service.get_strategies()
    for s in strategies:
        if s["name"] == strategy_name:
            return s
    raise HTTPException(status_code=404, detail="Strategy not found")

from pydantic import BaseModel

class StrategyCodeUpdate(BaseModel):
    code: str

class StrategyCreate(BaseModel):
    name: str
    code: str

@router.get("/strategies/{strategy_name}/code")
async def get_strategy_code(strategy_name: str):
    try:
        code = strategy_service.get_strategy_code(strategy_name)
        return {"code": code}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Strategy file not found")

@router.put("/strategies/{strategy_name}/code")
async def update_strategy_code(strategy_name: str, update: StrategyCodeUpdate):
    try:
        strategy_service.save_strategy_code(strategy_name, update.code)
        return {"status": "ok", "message": "Strategy updated"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategies")
async def create_strategy(create: StrategyCreate):
    try:
        strategy_service.create_strategy(create.name, create.code)
        return {"status": "ok", "message": "Strategy created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/strategies/{strategy_name}")
async def delete_strategy(strategy_name: str):
    try:
        strategy_service.delete_strategy(strategy_name)
        return {"status": "ok", "message": "Strategy deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Strategy not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
