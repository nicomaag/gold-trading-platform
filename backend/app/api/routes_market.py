from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.data import get_data_provider
from app.db.session import get_db

router = APIRouter()

@router.get("/market/candles")
async def get_candles(
    symbol: str = Query(..., description="Symbol to fetch (e.g. XAUUSD)"),
    timeframe: str = Query(..., description="Timeframe (e.g. 1h, 15m)"),
    start: Optional[datetime] = Query(None, description="Start time"),
    end: Optional[datetime] = Query(None, description="End time"),
    limit: int = Query(1000, description="Number of candles to fetch"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch historical candles for a symbol.
    """
    provider = get_data_provider()
    
    # Convert timezone-aware datetimes to naive (database stores naive datetimes)
    start_naive = start.replace(tzinfo=None) if start else None
    end_naive = end.replace(tzinfo=None) if end else None
        
    try:
        candles = await provider.get_historical_candles(
            symbol=symbol,
            timeframe=timeframe,
            start=start_naive,
            end=end_naive,
            limit=limit,
            db=db
        )
        return candles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market/candles/bulk")
async def get_candles_bulk(
    symbol: str = Query(..., description="Symbol to fetch (e.g. XAUUSD)"),
    timeframe: str = Query(..., description="Timeframe (e.g. 1h, 15m)"),
    start: datetime = Query(..., description="Start time"),
    end: datetime = Query(..., description="End time"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch large date ranges by making chunked requests.
    This is useful for loading an entire year of data.
    """
    provider = get_data_provider()
    
    # Calculate chunk size based on timeframe
    chunk_sizes = {
        "1m": timedelta(days=7),   # 1 week chunks for 1-minute data
        "5m": timedelta(days=14),  # 2 weeks for 5-minute
        "15m": timedelta(days=30), # 1 month for 15-minute
        "30m": timedelta(days=60), # 2 months for 30-minute
        "1h": timedelta(days=90),  # 3 months for hourly
        "4h": timedelta(days=180), # 6 months for 4-hour
        "1d": timedelta(days=365), # 1 year for daily
    }
    
    chunk_size = chunk_sizes.get(timeframe, timedelta(days=30))
    
    all_candles = []
    current_start = start
    
    try:
        while current_start < end:
            current_end = min(current_start + chunk_size, end)
            
            print(f"📥 Fetching chunk: {current_start} to {current_end}")
            
            chunk_candles = await provider.get_historical_candles(
                symbol=symbol,
                timeframe=timeframe,
                start=current_start,
                end=current_end,
                limit=5000,  # Max per chunk
                db=db
            )
            
            all_candles.extend(chunk_candles)
            current_start = current_end
        
        # Remove duplicates and sort
        seen_times = set()
        unique_candles = []
        for candle in all_candles:
            candle_time = candle["time"].isoformat() if isinstance(candle["time"], datetime) else candle["time"]
            if candle_time not in seen_times:
                seen_times.add(candle_time)
                unique_candles.append(candle)
        
        unique_candles.sort(key=lambda x: x["time"])
        
        print(f"✅ Loaded {len(unique_candles)} candles for {symbol} {timeframe} from {start} to {end}")
        
        return unique_candles
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market/metrics")
async def get_cache_metrics(db: AsyncSession = Depends(get_db)):
    """Get cache performance metrics."""
    provider = get_data_provider()
    
    # Check if provider has get_cache_metrics method
    if hasattr(provider, 'get_cache_metrics'):
        return await provider.get_cache_metrics(db)
    else:
        return {"error": "Cache metrics not available for this provider"}
