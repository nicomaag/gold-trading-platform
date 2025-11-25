from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.models.db_base import Base


class CacheMetrics(Base):
    """Store cache performance metrics in database instead of file."""
    __tablename__ = "cache_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_key = Column(String, nullable=False, unique=True, index=True)
    metric_value = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
