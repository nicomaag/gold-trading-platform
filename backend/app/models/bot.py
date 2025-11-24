from sqlalchemy import Column, String, DateTime, JSON
from datetime import datetime
import uuid
from app.models.db_base import Base

class Bot(Base):
    __tablename__ = "bots"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    strategy_name = Column(String)
    symbol = Column(String)
    timeframe = Column(String)
    params = Column(JSON)
    status = Column(String, default="stopped") # running, stopped, error
    
    start_time = Column(DateTime, nullable=True)
    last_update_time = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
