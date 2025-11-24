from pydantic import BaseModel
from datetime import datetime
from typing import Literal, Optional

class Trade(BaseModel):
    entry_time: datetime
    exit_time: Optional[datetime] = None
    side: Literal["buy", "sell"]
    entry_price: float
    exit_price: Optional[float] = None
    volume: float
    pnl: Optional[float] = None
    status: str = "open"  # open, closed
    
    def dict(self, **kwargs):
        """Convert to dictionary with datetime serialization."""
        return {
            "entry_time": self.entry_time.isoformat() if self.entry_time else None,
            "exit_time": self.exit_time.isoformat() if self.exit_time else None,
            "side": self.side,
            "entry_price": self.entry_price,
            "exit_price": self.exit_price,
            "volume": self.volume,
            "pnl": self.pnl,
            "status": self.status
        }
