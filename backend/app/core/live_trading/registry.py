from typing import Dict, Any, Optional
from app.models.bot import Bot

class BotRegistry:
    def __init__(self):
        # In-memory storage for running bot instances (tasks, strategy objects)
        # Key: bot_id
        self.running_bots: Dict[str, Any] = {} 

    def register_bot(self, bot_id: str, task: Any, strategy: Any):
        self.running_bots[bot_id] = {
            "task": task,
            "strategy": strategy
        }

    def get_bot(self, bot_id: str) -> Optional[Dict[str, Any]]:
        return self.running_bots.get(bot_id)

    def remove_bot(self, bot_id: str):
        if bot_id in self.running_bots:
            del self.running_bots[bot_id]

bot_registry = BotRegistry()
