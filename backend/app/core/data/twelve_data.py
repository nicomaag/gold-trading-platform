import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Any
import asyncio
import json
import os
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.dialects.sqlite import insert
from .base import DataProvider
from app.models.market_data import MarketData


# Metrics file path
METRICS_FILE = Path("cache_metrics.json")

# Load metrics from file if exists
def load_metrics() -> Dict[str, int]:
    if METRICS_FILE.exists():
        try:
            with open(METRICS_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {
        "cache_hits": 0,
        "cache_misses": 0,
        "partial_cache_hits": 0,
        "api_calls": 0,
    }

# Save metrics to file
def save_metrics(metrics: Dict[str, int]):
    try:
        with open(METRICS_FILE, 'w') as f:
            json.dump(metrics, f, indent=2)
    except Exception as e:
        print(f"⚠️ Failed to save metrics: {e}")

# Global cache metrics (module-level, persists across provider instances)
CACHE_METRICS = load_metrics()


class TwelveDataProvider(DataProvider):
    """Twelve Data API provider for historical market data."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.twelvedata.com"
        self.request_count = 0
        self.last_request_time = None
        self.lock = asyncio.Lock()
        
    def convert_symbol(self, symbol: str) -> str:
        """Convert XAU_USD or XAUUSD to XAU/USD format."""
        if symbol == "XAUUSD":
            return "XAU/USD"
        return symbol.replace("_", "/")
    
    def convert_timeframe(self, timeframe: str) -> str:
        """
        Convert our timeframe format to Twelve Data format.
        M1 -> 1min, M5 -> 5min, H1 -> 1h, D -> 1day
        """
        mapping = {
            "1m": "1min",
            "5m": "5min",
            "15m": "15min",
            "30m": "30min",
            "1h": "1h",
            "4h": "4h",
            "1d": "1day",
            "1w": "1week",
            "M1": "1min",
            "M5": "5min",
            "M15": "15min",
            "M30": "30min",
            "H1": "1h",
            "H4": "4h",
            "D": "1day",
            "W": "1week",
            "M": "1month"
        }
        return mapping.get(timeframe, timeframe)
    
    async def _rate_limit(self):
        """Implement rate limiting: 8 requests per minute."""
        if self.last_request_time:
            elapsed = (datetime.now() - self.last_request_time).total_seconds()
            if elapsed < 8.0:
                wait_time = 8.0 - elapsed
                print(f"⏳ Rate limit: waiting {wait_time:.2f}s...")
                await asyncio.sleep(wait_time)
        
        self.last_request_time = datetime.now()
        self.request_count += 1
    
    def _detect_middle_gaps(self, db_data: List, timeframe: str) -> List[tuple]:
        """
        Detect gaps in the middle of the data.
        Returns list of (start, end) tuples for missing ranges.
        """
        gaps = []
        
        # Calculate expected interval based on timeframe
        interval_map = {
            "1m": timedelta(minutes=1),
            "5m": timedelta(minutes=5),
            "15m": timedelta(minutes=15),
            "30m": timedelta(minutes=30),
            "1h": timedelta(hours=1),
            "4h": timedelta(hours=4),
            "1d": timedelta(days=1),
            "1w": timedelta(weeks=1),
            "M1": timedelta(minutes=1),
            "M5": timedelta(minutes=5),
            "M15": timedelta(minutes=15),
            "M30": timedelta(minutes=30),
            "H1": timedelta(hours=1),
            "H4": timedelta(hours=4),
            "D": timedelta(days=1),
            "W": timedelta(weeks=1),
        }
        
        expected_interval = interval_map.get(timeframe, timedelta(hours=1))
        max_gap = expected_interval * 3
        
        for i in range(len(db_data) - 1):
            current_time = db_data[i].timestamp
            next_time = db_data[i + 1].timestamp
            time_diff = next_time - current_time
            
            if time_diff > max_gap:
                gaps.append((current_time, next_time))
        
        return gaps
    
    def get_cache_metrics(self) -> Dict[str, Any]:
        """Get cache performance metrics from global metrics dict."""
        total_requests = CACHE_METRICS["cache_hits"] + CACHE_METRICS["cache_misses"] + CACHE_METRICS["partial_cache_hits"]
        hit_rate = (CACHE_METRICS["cache_hits"] / total_requests * 100) if total_requests > 0 else 0
        partial_hit_rate = (CACHE_METRICS["partial_cache_hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "cache_hits": CACHE_METRICS["cache_hits"],
            "cache_misses": CACHE_METRICS["cache_misses"],
            "partial_cache_hits": CACHE_METRICS["partial_cache_hits"],
            "total_requests": total_requests,
            "hit_rate_percent": round(hit_rate, 2),
            "partial_hit_rate_percent": round(partial_hit_rate, 2),
            "api_calls": CACHE_METRICS["api_calls"],
            "total_api_requests": self.request_count
        }
    
    async def _fetch_from_api(
        self,
        symbol: str,
        timeframe: str,
        start: datetime | None,
        end: datetime | None,
        limit: int
    ) -> List[Dict[str, Any]]:
        """Fetch data from Twelve Data API."""
        td_symbol = self.convert_symbol(symbol)
        td_interval = self.convert_timeframe(timeframe)
        
        await self._rate_limit()
        
        url = f"{self.base_url}/time_series"
        params = {
            "symbol": td_symbol,
            "interval": td_interval,
            "apikey": self.api_key,
            "format": "JSON",
            "outputsize": min(limit, 5000),
        }
        
        # Calculate start_date if only end_date is provided
        # This ensures we get the requested number of candles
        if end and not start:
            # Calculate how far back to go based on timeframe and limit
            interval_map = {
                "1min": timedelta(minutes=1),
                "5min": timedelta(minutes=5),
                "15min": timedelta(minutes=15),
                "30min": timedelta(minutes=30),
                "1h": timedelta(hours=1),
                "4h": timedelta(hours=4),
                "1day": timedelta(days=1),
                "1week": timedelta(weeks=1),
            }
            interval = interval_map.get(td_interval, timedelta(hours=1))
            # Add 50% buffer to account for weekends/holidays
            start = end - (interval * limit * 1.5)
            print(f"📅 Calculated start_date: {start} (to get {limit} candles before {end})")
        
        if start:
            params["start_date"] = start.strftime("%Y-%m-%d %H:%M:%S")
        if end:
            params["end_date"] = end.strftime("%Y-%m-%d %H:%M:%S")
        
        print(f"🌐 Fetching {symbol} {timeframe} from Twelve Data API...")
        print(f"   Parameters: start={start}, end={end}, limit={limit}")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"Twelve Data API error: {response.status} - {error_text}")
                
                data = await response.json()
                
                if "status" in data and data["status"] == "error":
                    raise Exception(f"Twelve Data API error: {data.get('message', 'Unknown error')}")
                
                candles = []
                if "values" in data:
                    for item in reversed(data["values"]):
                        candle = {
                            "time": datetime.strptime(item["datetime"], "%Y-%m-%d %H:%M:%S"),
                            "open": float(item["open"]),
                            "high": float(item["high"]),
                            "low": float(item["low"]),
                            "close": float(item["close"]),
                            "volume": int(float(item.get("volume", 0)))
                        }
                        candles.append(candle)
                
                print(f"✅ Fetched {len(candles)} candles from API")
                return candles
    
    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime | None,
        end: datetime | None,
        limit: int = 500,
        db: AsyncSession = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical candles with smart DB caching.
        
        Strategy:
        1. Query DB for existing data in range
        2. Identify gaps (missing start/end)
        3. Fetch missing data from API
        4. Upsert into DB
        5. Return complete dataset from DB
        """
        if not db:
            print("⚠️ No DB session provided, fetching directly from API")
            async with self.lock:
                return await self._fetch_from_api(symbol, timeframe, start, end, limit)
        
        # Query existing data from DB
        query = select(MarketData).where(
            and_(
                MarketData.symbol == symbol,
                MarketData.timeframe == timeframe
            )
        )
        
        if start:
            query = query.where(MarketData.timestamp >= start)
        if end:
            query = query.where(MarketData.timestamp <= end)
        
        query = query.order_by(MarketData.timestamp.asc())
        
        # Log query parameters
        print(f"🔍 Querying DB: symbol={symbol}, timeframe={timeframe}, start={start}, end={end}, limit={limit}")
        
        result = await db.execute(query)
        db_data = result.scalars().all()
        
        if len(db_data) > 0:
            db_start_date = db_data[0].timestamp
            db_end_date = db_data[-1].timestamp
            print(f"📊 Found {len(db_data)} candles in DB from {db_start_date} to {db_end_date}")
        else:
            print(f"📊 Found 0 candles in DB for {symbol} {timeframe}")
        
        # Determine what data we need to fetch
        fetch_ranges = []
        
        if len(db_data) == 0:
            # No data in DB, fetch entire range
            CACHE_METRICS["cache_misses"] += 1
            save_metrics(CACHE_METRICS)
            if start and end:
                fetch_ranges.append((start, end))
            else:
                fetch_ranges.append((None, None))
        else:
            # Check for gaps at start, middle, and end
            db_start = db_data[0].timestamp
            db_end = db_data[-1].timestamp
            
            has_gaps = False
            
            if start and db_start > start:
                fetch_ranges.append((start, db_start))
                print(f"📉 Gap at start: {start} to {db_start}")
                has_gaps = True
            
            if end and db_end < end:
                fetch_ranges.append((db_end, end))
                print(f"📈 Gap at end: {db_end} to {end}")
                has_gaps = True
            
            if len(db_data) > 1 and (start or end):
                middle_gaps = self._detect_middle_gaps(db_data, timeframe)
                if middle_gaps:
                    fetch_ranges.extend(middle_gaps)
                    print(f"🔍 Found {len(middle_gaps)} middle gap(s)")
                    has_gaps = True
            
            # If no explicit range but we have less than requested limit
            if not start and not end:
                if len(db_data) < limit:
                    fetch_ranges.append((db_end, None))
                    print(f"📊 Extending data: have {len(db_data)}, want {limit}")
                    has_gaps = True
                else:
                    print(f"✅ Using {len(db_data)} candles from DB (>= {limit} requested)")
            
            # Update metrics
            if has_gaps:
                CACHE_METRICS["partial_cache_hits"] += 1
            else:
                CACHE_METRICS["cache_hits"] += 1
            save_metrics(CACHE_METRICS)
        
        # Fetch missing data from API
        if fetch_ranges:
            async with self.lock:
                for fetch_start, fetch_end in fetch_ranges:
                    try:
                        CACHE_METRICS["api_calls"] += 1
                        save_metrics(CACHE_METRICS)
                        new_candles = await self._fetch_from_api(
                            symbol, timeframe, fetch_start, fetch_end, limit
                        )
                        
                        if new_candles:
                            for candle in new_candles:
                                stmt = insert(MarketData).values(
                                    symbol=symbol,
                                    timeframe=timeframe,
                                    timestamp=candle["time"],
                                    open=candle["open"],
                                    high=candle["high"],
                                    low=candle["low"],
                                    close=candle["close"],
                                    volume=candle["volume"]
                                )
                                stmt = stmt.on_conflict_do_nothing(
                                    index_elements=['symbol', 'timeframe', 'timestamp']
                                )
                                await db.execute(stmt)
                            
                            await db.commit()
                            print(f"💾 Saved {len(new_candles)} candles to DB")
                    
                    except Exception as e:
                        print(f"❌ Error fetching data: {e}")
        else:
            print("✅ All data available in DB cache")
        
        # Re-query DB to get complete dataset
        result = await db.execute(query)
        final_data = result.scalars().all()
        
        # Convert to dict format
        candles = []
        for row in final_data:
            candles.append({
                "time": row.timestamp,
                "open": row.open,
                "high": row.high,
                "low": row.low,
                "close": row.close,
                "volume": row.volume
            })
        
        # Sort by time and limit
        candles.sort(key=lambda x: x["time"])
        if not start and not end and len(candles) > limit:
            candles = candles[-limit:]
        
        print(f"📦 Returning {len(candles)} candles")
        return candles
