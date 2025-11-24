import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.broker.base import BrokerAdapter, CandleDict, OrderSide, OrderType, TimeInForce
from app.config import settings

class OandaBrokerAdapter(BrokerAdapter):
    def __init__(self):
        self.env = settings.OANDA_ENVIRONMENT
        self.token = settings.OANDA_API_TOKEN
        self.account_id = settings.OANDA_ACCOUNT_ID
        
        if self.env == "practice":
            self.base_url = "https://api-fxpractice.oanda.com/v3"
        else:
            self.base_url = "https://api-fxtrade.oanda.com/v3"
            
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept-Datetime-Format": "RFC3339"
        }

    async def _request(self, method: str, endpoint: str, params: Dict = None, data: Dict = None) -> Dict:
        url = f"{self.base_url}{endpoint}"
        async with httpx.AsyncClient() as client:
            response = await client.request(method, url, headers=self.headers, params=params, json=data)
            response.raise_for_status()
            return response.json()

    async def get_historical_candles(
        self,
        symbol: str,
        timeframe: str,
        start: datetime,
        end: datetime,
        limit: int | None = None,
    ) -> List[CandleDict]:
        # Map timeframe to OANDA granularity (e.g. H1 -> H1, M15 -> M15)
        # OANDA format: H1, M15, S5, etc.
        granularity = timeframe 
        
        # OANDA instrument format: XAU_USD
        instrument = symbol
        
        params = {
            "granularity": granularity,
            "from": start.isoformat(),
            "to": end.isoformat(),
            "price": "M" # Mid price
        }
        if limit:
            params["count"] = limit
            # If count is specified, 'to' is ignored by OANDA usually, but we'll keep it if limit is not set
            if "to" in params:
                del params["to"]

        data = await self._request("GET", f"/instruments/{instrument}/candles", params=params)
        
        candles = []
        for c in data.get("candles", []):
            if not c["complete"]:
                continue
            candles.append({
                "time": datetime.fromisoformat(c["time"].replace("Z", "+00:00")),
                "open": float(c["mid"]["o"]),
                "high": float(c["mid"]["h"]),
                "low": float(c["mid"]["l"]),
                "close": float(c["mid"]["c"]),
                "volume": int(c["volume"])
            })
        return candles

    async def get_current_price(self, symbol: str) -> float:
        # Get pricing
        params = {"instruments": symbol}
        data = await self._request("GET", f"/accounts/{self.account_id}/pricing", params=params)
        prices = data.get("prices", [])
        if not prices:
            raise ValueError(f"No price found for {symbol}")
        
        price_data = prices[0]
        # Return mid price
        bid = float(price_data["bids"][0]["price"])
        ask = float(price_data["asks"][0]["price"])
        return (bid + ask) / 2.0

    async def place_order(
        self,
        symbol: str,
        side: OrderSide,
        volume: float,
        order_type: OrderType = "market",
        price: Optional[float] = None,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None,
        time_in_force: TimeInForce = "GTC",
        client_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        
        units = str(volume) if side == "buy" else str(-volume)
        
        order_body = {
            "instrument": symbol,
            "units": units,
            "type": order_type.upper(),
            "timeInForce": time_in_force
        }
        
        if order_type == "limit" and price:
            order_body["price"] = str(price)
        
        if stop_loss:
            order_body["stopLossOnFill"] = {"price": str(stop_loss)}
            
        if take_profit:
            order_body["takeProfitOnFill"] = {"price": str(take_profit)}
            
        if client_id:
            order_body["clientExtensions"] = {"id": client_id}

        data = await self._request("POST", f"/accounts/{self.account_id}/orders", data={"order": order_body})
        return data

    async def cancel_order(self, broker_order_id: str) -> None:
        await self._request("PUT", f"/accounts/{self.account_id}/orders/{broker_order_id}/cancel")

    async def get_open_positions(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        data = await self._request("GET", f"/accounts/{self.account_id}/openPositions")
        positions = data.get("positions", [])
        if symbol:
            positions = [p for p in positions if p["instrument"] == symbol]
        return positions

    async def get_open_orders(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        data = await self._request("GET", f"/accounts/{self.account_id}/pendingOrders")
        orders = data.get("orders", [])
        if symbol:
            orders = [o for o in orders if o["instrument"] == symbol]
        return orders

    async def get_account_summary(self) -> Dict[str, Any]:
        data = await self._request("GET", f"/accounts/{self.account_id}/summary")
        return data.get("account", {})
