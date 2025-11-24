import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_strategies():
    """Test GET /api/strategies endpoint."""
    response = client.get("/api/strategies")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should have at least the example strategy
    assert len(data) >= 1

def test_get_strategy_detail():
    """Test GET /api/strategies/{name} endpoint."""
    response = client.get("/api/strategies/example_ma_cross")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "example_ma_cross"
    assert "description" in data
    assert "class_name" in data

def test_get_strategy_not_found():
    """Test GET /api/strategies/{name} with non-existent strategy."""
    response = client.get("/api/strategies/nonexistent")
    assert response.status_code == 404

def test_get_strategy_code():
    """Test GET /api/strategies/{name}/code endpoint."""
    response = client.get("/api/strategies/example_ma_cross/code")
    assert response.status_code == 200
    data = response.json()
    assert "code" in data
    assert "class MACrossStrategy" in data["code"]

def test_get_strategy_code_not_found():
    """Test GET /api/strategies/{name}/code with non-existent strategy."""
    response = client.get("/api/strategies/nonexistent/code")
    assert response.status_code == 404

def test_create_and_delete_strategy():
    """Test POST /api/strategies and DELETE /api/strategies/{name} endpoints."""
    # Create a new strategy
    new_strategy_code = '''from app.strategies.base_strategy import BaseStrategy
from typing import Dict, Any, List

class TestAPIStrategy(BaseStrategy):
    """Test strategy created via API."""
    
    def on_backtest_start(self) -> None:
        pass
    
    def on_backtest_end(self) -> None:
        pass
    
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
'''
    
    create_response = client.post(
        "/api/strategies",
        json={"name": "test_api_strategy", "code": new_strategy_code}
    )
    assert create_response.status_code == 200
    assert create_response.json()["status"] == "ok"
    
    # Verify it exists
    get_response = client.get("/api/strategies/test_api_strategy")
    assert get_response.status_code == 200
    
    # Delete it
    delete_response = client.delete("/api/strategies/test_api_strategy")
    assert delete_response.status_code == 200
    assert delete_response.json()["status"] == "ok"
    
    # Verify it's gone
    get_response_after = client.get("/api/strategies/test_api_strategy")
    assert get_response_after.status_code == 404

def test_create_duplicate_strategy():
    """Test creating a strategy that already exists."""
    # Try to create example_ma_cross which already exists
    response = client.post(
        "/api/strategies",
        json={"name": "example_ma_cross", "code": "some code"}
    )
    assert response.status_code == 400

def test_update_strategy_code():
    """Test PUT /api/strategies/{name}/code endpoint."""
    # First create a strategy
    initial_code = '''from app.strategies.base_strategy import BaseStrategy
from typing import Dict, Any, List

class UpdateTestStrategy(BaseStrategy):
    """Initial version."""
    
    def on_backtest_start(self) -> None:
        pass
    
    def on_backtest_end(self) -> None:
        pass
    
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
'''
    
    client.post("/api/strategies", json={"name": "update_test", "code": initial_code})
    
    # Update it
    updated_code = initial_code.replace("Initial version", "Updated version")
    update_response = client.put(
        "/api/strategies/update_test/code",
        json={"code": updated_code}
    )
    assert update_response.status_code == 200
    
    # Verify update
    get_response = client.get("/api/strategies/update_test/code")
    assert "Updated version" in get_response.json()["code"]
    
    # Cleanup
    client.delete("/api/strategies/update_test")

def test_delete_base_strategy_prevented():
    """Test that deleting base_strategy is prevented."""
    response = client.delete("/api/strategies/base_strategy")
    assert response.status_code == 400

def test_path_traversal_attack():
    """Test that path traversal attacks are blocked."""
    response = client.post(
        "/api/strategies",
        json={"name": "../evil", "code": "malicious"}
    )
    assert response.status_code == 400
