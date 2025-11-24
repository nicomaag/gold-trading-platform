import pytest
import os
from app.services.strategy_service import StrategyService

def test_strategy_discovery(temp_strategies_dir, monkeypatch):
    """Test that strategies are discovered correctly."""
    # Create a test strategy
    test_strategy_content = '''from app.strategies.base_strategy import BaseStrategy
from typing import Dict, Any, List

class TestStrategy(BaseStrategy):
    """Test strategy for unit tests."""
    
    def on_backtest_start(self) -> None:
        pass
    
    def on_backtest_end(self) -> None:
        pass
    
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
'''
    (temp_strategies_dir / "test_strategy.py").write_text(test_strategy_content)
    
    # Monkeypatch the STRATEGIES_DIR
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    # Create service and discover
    service = StrategyService()
    
    # Should find test_strategy
    assert "test_strategy" in service.strategies
    assert service.strategies["test_strategy"].__name__ == "TestStrategy"

def test_get_strategies(temp_strategies_dir, monkeypatch):
    """Test getting list of strategies."""
    test_strategy_content = '''from app.strategies.base_strategy import BaseStrategy
from typing import Dict, Any, List

class MyStrategy(BaseStrategy):
    """My test strategy."""
    
    def on_backtest_start(self) -> None:
        pass
    
    def on_backtest_end(self) -> None:
        pass
    
    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        return []
'''
    (temp_strategies_dir / "my_strategy.py").write_text(test_strategy_content)
    
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    strategies = service.get_strategies()
    
    assert len(strategies) == 1
    assert strategies[0]["name"] == "my_strategy"
    assert strategies[0]["description"] == "My test strategy."
    assert strategies[0]["class_name"] == "MyStrategy"

def test_get_strategy_code(temp_strategies_dir, monkeypatch):
    """Test reading strategy source code."""
    test_code = '''from app.strategies.base_strategy import BaseStrategy

class TestStrategy(BaseStrategy):
    pass
'''
    (temp_strategies_dir / "test_strat.py").write_text(test_code)
    
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    code = service.get_strategy_code("test_strat")
    
    assert "class TestStrategy" in code

def test_save_strategy_code(temp_strategies_dir, monkeypatch):
    """Test saving strategy code."""
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    new_code = '''from app.strategies.base_strategy import BaseStrategy

class NewStrategy(BaseStrategy):
    """New strategy."""
    
    def on_backtest_start(self) -> None:
        pass
    
    def on_backtest_end(self) -> None:
        pass
    
    def on_candle(self, candle):
        return []
'''
    
    service.save_strategy_code("new_strategy", new_code)
    
    # Verify file was created
    assert (temp_strategies_dir / "new_strategy.py").exists()
    
    # Verify content
    saved_code = service.get_strategy_code("new_strategy")
    assert "class NewStrategy" in saved_code

def test_create_strategy(temp_strategies_dir, monkeypatch):
    """Test creating a new strategy."""
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    code = '''from app.strategies.base_strategy import BaseStrategy

class CreatedStrategy(BaseStrategy):
    pass
'''
    
    service.create_strategy("created_strategy", code)
    
    # Should be discoverable
    assert "created_strategy" in service.strategies

def test_create_strategy_duplicate(temp_strategies_dir, monkeypatch):
    """Test that creating duplicate strategy raises error."""
    test_code = '''from app.strategies.base_strategy import BaseStrategy

class DuplicateStrategy(BaseStrategy):
    pass
'''
    (temp_strategies_dir / "duplicate.py").write_text(test_code)
    
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    
    with pytest.raises(ValueError, match="already exists"):
        service.create_strategy("duplicate", test_code)

def test_delete_strategy(temp_strategies_dir, monkeypatch):
    """Test deleting a strategy."""
    test_code = '''from app.strategies.base_strategy import BaseStrategy

class DeleteMe(BaseStrategy):
    pass
'''
    (temp_strategies_dir / "delete_me.py").write_text(test_code)
    
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    assert "delete_me" in service.strategies
    
    service.delete_strategy("delete_me")
    
    # Should be removed
    assert "delete_me" not in service.strategies
    assert not (temp_strategies_dir / "delete_me.py").exists()

def test_delete_base_strategy(temp_strategies_dir, monkeypatch):
    """Test that deleting base_strategy is prevented."""
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    
    with pytest.raises(ValueError, match="Cannot delete base_strategy"):
        service.delete_strategy("base_strategy")

def test_path_traversal_prevention(temp_strategies_dir, monkeypatch):
    """Test that path traversal attacks are prevented."""
    monkeypatch.setattr('app.services.strategy_service.STRATEGIES_DIR', str(temp_strategies_dir))
    
    service = StrategyService()
    
    with pytest.raises(ValueError, match="Invalid strategy name"):
        service.save_strategy_code("../evil", "malicious code")
    
    with pytest.raises(ValueError, match="Invalid strategy name"):
        service.delete_strategy("../../etc/passwd")
