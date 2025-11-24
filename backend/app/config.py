import os
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    
    # Broker
    BROKER_NAME: str = "oanda"
    
    # OANDA
    OANDA_ENVIRONMENT: Literal["practice", "live"] = "practice"
    OANDA_API_TOKEN: str
    OANDA_ACCOUNT_ID: str
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./gold_trading.db"
    
    # Frontend
    FRONTEND_ORIGIN: str = "http://127.0.0.1:5173"
    
    # Data Provider for Backtesting
    DATA_PROVIDER: str = "twelve_data"  # Options: twelve_data, oanda
    TWELVE_DATA_API_KEY: str = ""
    
    # Safety: Prevent accidental trading
    TRADING_ENABLED: bool = False  # Set to True to enable REAL trading

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
