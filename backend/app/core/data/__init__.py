from .base import DataProvider
from .twelve_data import TwelveDataProvider
from .oanda import OandaDataProvider


def get_data_provider() -> DataProvider:
    """
    Factory function to create the configured data provider.
    
    Returns:
        DataProvider instance based on settings.DATA_PROVIDER
    """
    from app.config import settings
    
    provider_name = settings.DATA_PROVIDER.lower()
    
    if provider_name == "twelve_data":
        if not settings.TWELVE_DATA_API_KEY:
            raise ValueError("TWELVE_DATA_API_KEY is required when DATA_PROVIDER=twelve_data")
        return TwelveDataProvider(settings.TWELVE_DATA_API_KEY)
    
    elif provider_name == "oanda":
        from app.core.broker.oanda import OandaBrokerAdapter
        return OandaDataProvider(OandaBrokerAdapter())
    
    else:
        raise ValueError(
            f"Unknown data provider: {provider_name}. "
            f"Valid options are: twelve_data, oanda"
        )


__all__ = ["DataProvider", "TwelveDataProvider", "OandaDataProvider", "get_data_provider"]
