import pytest
import os
from fastapi.testclient import TestClient
from app.main import app

# CRITICAL: Set testing flag to prevent any real trading
os.environ["TESTING"] = "true"

client = TestClient(app)

# Track created bots for cleanup
created_bot_ids = []

@pytest.fixture(autouse=True)
def cleanup_bots():
    """Automatically cleanup all bots created during tests."""
    global created_bot_ids
    created_bot_ids = []
    
    yield
    
    # Cleanup after each test - stop and delete
    for bot_id in created_bot_ids:
        try:
            # Stop the bot first
            client.post(f"/api/bots/{bot_id}/stop")
            # Then delete it
            client.delete(f"/api/bots/{bot_id}")
        except:
            pass  # Ignore errors during cleanup
    
    created_bot_ids = []

def create_bot_with_tracking(bot_data):
    """Helper to create bot and track it for cleanup."""
    response = client.post("/api/bots", json=bot_data)
    if response.status_code == 200:
        bot_id = response.json()["id"]
        created_bot_ids.append(bot_id)
    return response

def test_create_bot():
    """Test POST /api/bots endpoint."""
    bot_data = {
        "strategy_name": "example_ma_cross",
        "symbol": "XAU_USD",
        "timeframe": "H1",
        "params": {
            "short_window": 10,
            "long_window": 30,
            "position_size": 0.1
        }
    }
    
    response = create_bot_with_tracking(bot_data)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["status"] in ["starting", "running"]

def test_create_bot_invalid_strategy():
    """Test creating bot with non-existent strategy."""
    bot_data = {
        "strategy_name": "nonexistent_strategy",
        "symbol": "XAU_USD",
        "timeframe": "H1",
        "params": {}
    }
    
    response = client.post("/api/bots", json=bot_data)
    assert response.status_code in [400, 404]

def test_create_bot_missing_params():
    """Test creating bot with missing required parameters."""
    bot_data = {
        "strategy_name": "example_ma_cross",
        "symbol": "XAU_USD"
        # Missing timeframe
    }
    
    response = client.post("/api/bots", json=bot_data)
    assert response.status_code == 422  # Validation error

def test_list_bots():
    """Test GET /api/bots endpoint."""
    response = client.get("/api/bots")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_bot_detail():
    """Test GET /api/bots/{id} endpoint."""
    bot_data = {
        "strategy_name": "example_ma_cross",
        "symbol": "XAU_USD",
        "timeframe": "H1",
        "params": {"short_window": 10, "long_window": 30, "position_size": 0.1}
    }
    
    create_response = create_bot_with_tracking(bot_data)
    bot_id = create_response.json()["id"]
    
    # Get bot details
    response = client.get(f"/api/bots/{bot_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == bot_id
    assert data["strategy_name"] == "example_ma_cross"
    assert data["symbol"] == "XAU_USD"
    assert data["timeframe"] == "H1"
    assert "status" in data
    assert "params" in data

def test_get_bot_not_found():
    """Test GET /api/bots/{id} with non-existent bot."""
    response = client.get("/api/bots/nonexistent-id")
    assert response.status_code == 404

def test_stop_bot():
    """Test POST /api/bots/{id}/stop endpoint."""
    bot_data = {
        "strategy_name": "example_ma_cross",
        "symbol": "XAU_USD",
        "timeframe": "H1",
        "params": {"short_window": 10, "long_window": 30, "position_size": 0.1}
    }
    
    create_response = create_bot_with_tracking(bot_data)
    bot_id = create_response.json()["id"]
    
    # Stop the bot
    response = client.post(f"/api/bots/{bot_id}/stop")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "stopped"
    
    # Verify bot is stopped
    get_response = client.get(f"/api/bots/{bot_id}")
    assert get_response.json()["status"] == "stopped"

def test_stop_bot_not_found():
    """Test stopping non-existent bot."""
    response = client.post("/api/bots/nonexistent-id/stop")
    assert response.status_code == 404

def test_bot_lifecycle():
    """Test complete bot lifecycle: create -> get -> stop."""
    bot_data = {
        "strategy_name": "example_ma_cross",
        "symbol": "XAU_USD",
        "timeframe": "M15",
        "params": {"short_window": 5, "long_window": 20, "position_size": 0.05}
    }
    
    create_response = create_bot_with_tracking(bot_data)
    assert create_response.status_code == 200
    bot_id = create_response.json()["id"]
    
    # Verify it appears in list
    list_response = client.get("/api/bots")
    bot_ids = [bot["id"] for bot in list_response.json()]
    assert bot_id in bot_ids
    
    # Get details
    detail_response = client.get(f"/api/bots/{bot_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] in ["starting", "running"]
    
    # Stop
    stop_response = client.post(f"/api/bots/{bot_id}/stop")
    assert stop_response.status_code == 200
    assert stop_response.json()["status"] == "stopped"
    
    # Verify stopped
    final_response = client.get(f"/api/bots/{bot_id}")
    assert final_response.json()["status"] == "stopped"

def test_multiple_bots():
    """Test creating multiple bots simultaneously."""
    for i in range(3):
        bot_data = {
            "strategy_name": "example_ma_cross",
            "symbol": "XAU_USD",
            "timeframe": "H1",
            "params": {"short_window": 10 + i, "long_window": 30 + i, "position_size": 0.1}
        }
        
        response = create_bot_with_tracking(bot_data)
        assert response.status_code == 200
    
    # Verify all bots exist
    list_response = client.get("/api/bots")
    active_bot_ids = [bot["id"] for bot in list_response.json()]
    
    for bot_id in created_bot_ids:
        assert bot_id in active_bot_ids
