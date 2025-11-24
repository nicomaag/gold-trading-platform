from fastapi import APIRouter
from app.api import routes_health, routes_strategies, routes_backtests, routes_bots, routes_market

api_router = APIRouter()

api_router.include_router(routes_health.router, tags=["health"])
api_router.include_router(routes_strategies.router, tags=["strategies"])
api_router.include_router(routes_backtests.router, tags=["backtests"])
api_router.include_router(routes_bots.router, tags=["bots"])
api_router.include_router(routes_market.router, tags=["market"])

