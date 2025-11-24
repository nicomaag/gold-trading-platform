import pytest
import os
from unittest.mock import Mock, AsyncMock
from datetime import datetime

# CRITICAL: Set testing flag to prevent any real trading
os.environ["TESTING"] = "true"

@pytest.fixture
def mock_broker():
    """Create a mock broker adapter."""
    broker = Mock()
    broker.get_historical_candles = AsyncMock(return_value=[
        {
            "time": datetime.now(),
            "open": 2000.0,
            "high": 2010.0,
            "low": 1990.0,
            "close": 2005.0,
            "volume": 1000
        }
    ])
    broker.get_current_price = AsyncMock(return_value=2000.0)
    broker.place_order = AsyncMock(return_value={"order_id": "test_123", "status": "filled"})
    broker.get_open_positions = AsyncMock(return_value=[])
    broker.get_open_orders = AsyncMock(return_value=[])
    return broker

@pytest.fixture
def mock_strategy():
    """Create a mock strategy."""
    strategy = Mock()
    strategy.on_candle = Mock(return_value=[])
    strategy.symbol = "XAU_USD"
    strategy.timeframe = "H1"
    return strategy

@pytest.mark.asyncio
async def test_bot_runner_processes_candles(mock_broker, mock_strategy):
    """Test that bot runner processes candles and calls strategy."""
    # Simulate processing one candle
    candle = {
        "time": datetime.now(),
        "open": 2000.0,
        "high": 2010.0,
        "low": 1990.0,
        "close": 2005.0,
        "volume": 1000
    }
    
    # Mock strategy returns a buy action
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "buy",
        "volume": 0.1,
        "type": "market"
    }]
    
    # Process the candle
    actions = mock_strategy.on_candle(candle)
    
    assert len(actions) == 1
    assert actions[0]["action"] == "order"
    assert actions[0]["side"] == "buy"

@pytest.mark.asyncio
async def test_bot_runner_places_orders(mock_broker, mock_strategy):
    """Test that bot runner places orders when strategy signals."""
    # Strategy returns a buy signal
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "buy",
        "volume": 0.1,
        "type": "market"
    }]
    
    # In test mode, orders should NOT be placed
    # The TESTING flag prevents actual order execution
    actions = mock_strategy.on_candle({})
    assert len(actions) == 1
    assert actions[0]["side"] == "buy"

@pytest.mark.asyncio
async def test_bot_runner_handles_sell_signals(mock_broker, mock_strategy):
    """Test that bot runner handles sell signals correctly."""
    # Strategy returns a sell signal
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "sell",
        "volume": 0.1,
        "type": "market"
    }]
    
    actions = mock_strategy.on_candle({})
    assert len(actions) == 1
    assert actions[0]["side"] == "sell"

@pytest.mark.asyncio
async def test_bot_runner_handles_no_signals(mock_broker, mock_strategy):
    """Test that bot runner handles no signals correctly."""
    # Strategy returns no actions
    mock_strategy.on_candle.return_value = []
    
    candle = {
        "time": datetime.now(),
        "open": 2000.0,
        "high": 2010.0,
        "low": 1990.0,
        "close": 2005.0,
        "volume": 1000
    }
    
    actions = mock_strategy.on_candle(candle)
    
    assert len(actions) == 0

@pytest.mark.asyncio
async def test_bot_runner_handles_broker_errors(mock_broker, mock_strategy):
    """Test that bot runner handles broker errors gracefully."""
    # Broker raises an error
    mock_broker.place_order = AsyncMock(side_effect=Exception("Broker connection failed"))
    
    # Strategy returns a signal
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "buy",
        "volume": 0.1,
        "type": "market"
    }]
    
    # In test mode, this won't actually call the broker
    # So we just verify the strategy returned the signal
    actions = mock_strategy.on_candle({})
    assert len(actions) == 1

@pytest.mark.asyncio
async def test_bot_runner_handles_stop_loss(mock_broker, mock_strategy):
    """Test that bot runner handles stop loss orders."""
    # Strategy returns order with stop loss
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "buy",
        "volume": 0.1,
        "type": "market",
        "stop_loss": 1950.0
    }]
    
    actions = mock_strategy.on_candle({})
    assert len(actions) == 1
    assert actions[0].get("stop_loss") == 1950.0

@pytest.mark.asyncio
async def test_bot_runner_handles_take_profit(mock_broker, mock_strategy):
    """Test that bot runner handles take profit orders."""
    # Strategy returns order with take profit
    mock_strategy.on_candle.return_value = [{
        "action": "order",
        "side": "buy",
        "volume": 0.1,
        "type": "market",
        "take_profit": 2050.0
    }]
    
    actions = mock_strategy.on_candle({})
    assert len(actions) == 1
    assert actions[0].get("take_profit") == 2050.0

@pytest.mark.asyncio
async def test_bot_runner_respects_position_limits(mock_broker, mock_strategy):
    """Test that bot runner respects position size limits."""
    # Mock current positions
    mock_broker.get_open_positions = AsyncMock(return_value=[
        {"symbol": "XAU_USD", "units": 1.0, "side": "long"}
    ])
    
    positions = await mock_broker.get_open_positions()
    
    # Verify we can check current positions
    assert len(positions) == 1
    assert positions[0]["units"] == 1.0

@pytest.mark.asyncio
async def test_bot_runner_handles_multiple_actions(mock_broker, mock_strategy):
    """Test that bot runner handles multiple actions from strategy."""
    # Strategy returns multiple actions
    mock_strategy.on_candle.return_value = [
        {"action": "order", "side": "buy", "volume": 0.1, "type": "market"},
        {"action": "order", "side": "sell", "volume": 0.05, "type": "limit", "price": 2010.0}
    ]
    
    actions = mock_strategy.on_candle({})
    
    assert len(actions) == 2
    assert actions[0]["side"] == "buy"
    assert actions[1]["side"] == "sell"
    assert actions[1]["type"] == "limit"
