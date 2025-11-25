from .base import DataProvider
from .twelve_data import TwelveDataProvider
from .oanda import OandaDataProvider


_provider_instance = None

def get_data_provider() -> DataProvider:
    """
    Factory function to create the configured data provider.
    Returns a singleton instance to preserve session metrics and cache locks.
    """
    global _provider_instance
    if _provider_instance:
        return _provider_instance

    from app.config import settings
    
    provider_name = settings.DATA_PROVIDER.lower()
    
    if provider_name == "twelve_data":
        if not settings.TWELVE_DATA_API_KEY:
            raise ValueError("TWELVE_DATA_API_KEY is required when DATA_PROVIDER=twelve_data")
        _provider_instance = TwelveDataProvider(settings.TWELVE_DATA_API_KEY)
    
    elif provider_name == "oanda":
        from app.core.broker.oanda import OandaBrokerAdapter
        _provider_instance = OandaDataProvider(OandaBrokerAdapter())
    
    else:
        raise ValueError(
            f"Unknown data provider: {provider_name}. "
            f"Valid options are: twelve_data, oanda"
        )
    
    return _provider_instance


__all__ = ["DataProvider", "TwelveDataProvider", "OandaDataProvider", "get_data_provider"]
