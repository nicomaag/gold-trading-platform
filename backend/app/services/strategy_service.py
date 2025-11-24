import os
import importlib.util
import inspect
from typing import List, Dict, Type
from app.strategies.base_strategy import BaseStrategy

STRATEGIES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "strategies")

class StrategyService:
    def __init__(self):
        self.strategies: Dict[str, Type[BaseStrategy]] = {}
        self.discover_strategies()

    def discover_strategies(self):
        """Scan the strategies directory and load strategy classes."""
        self.strategies = {}
        for filename in os.listdir(STRATEGIES_DIR):
            if filename.endswith(".py") and filename not in ["__init__.py", "base_strategy.py"]:
                module_name = filename[:-3]
                file_path = os.path.join(STRATEGIES_DIR, filename)
                
                spec = importlib.util.spec_from_file_location(module_name, file_path)
                if spec and spec.loader:
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    for name, obj in inspect.getmembers(module):
                        if inspect.isclass(obj) and issubclass(obj, BaseStrategy) and obj is not BaseStrategy:
                            self.strategies[module_name] = obj

    def get_strategies(self) -> List[Dict[str, str]]:
        """Return a list of available strategies."""
        result = []
        for name, cls in self.strategies.items():
            result.append({
                "name": name,
                "description": cls.__doc__.strip() if cls.__doc__ else "No description",
                "class_name": cls.__name__
            })
        return result

    def get_strategy_class(self, name: str) -> Type[BaseStrategy] | None:
        return self.strategies.get(name)

    def get_strategy_code(self, name: str) -> str:
        """Read the source code of a strategy file."""
        if name not in self.strategies:
            raise FileNotFoundError(f"Strategy {name} not found")
        
        file_path = os.path.join(STRATEGIES_DIR, f"{name}.py")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Strategy file {name}.py not found")
            
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()

    def save_strategy_code(self, name: str, code: str) -> None:
        """Save the source code of a strategy file."""
        # Basic validation to prevent directory traversal
        if ".." in name or "/" in name or "\\" in name:
            raise ValueError("Invalid strategy name")
            
        file_path = os.path.join(STRATEGIES_DIR, f"{name}.py")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        # Reload strategies to reflect changes
        self.discover_strategies()

    def create_strategy(self, name: str, code: str) -> None:
        """Create a new strategy file."""
        if name in self.strategies:
            raise ValueError(f"Strategy {name} already exists")
            
        self.save_strategy_code(name, code)

    def delete_strategy(self, name: str) -> None:
        """Delete a strategy file."""
        # Prevent deletion of base_strategy
        if name == "base_strategy":
            raise ValueError("Cannot delete base_strategy")
            
        # Basic validation to prevent directory traversal
        if ".." in name or "/" in name or "\\" in name:
            raise ValueError("Invalid strategy name")
            
        file_path = os.path.join(STRATEGIES_DIR, f"{name}.py")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Strategy file {name}.py not found")
            
        os.remove(file_path)
        
        # Reload strategies to reflect changes
        self.discover_strategies()

strategy_service = StrategyService()
