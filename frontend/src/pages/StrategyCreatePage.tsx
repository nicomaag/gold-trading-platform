import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { StrategyEditor } from '../components/StrategyEditor';

const TEMPLATE_CODE = `from app.strategies.base_strategy import BaseStrategy
from typing import Dict, Any, List

class MyStrategy(BaseStrategy):
    """
    Description of your strategy.
    """

    def on_backtest_start(self) -> None:
        """Called once at the start of a backtest."""
        # Initialize any state here
        pass

    def on_backtest_end(self) -> None:
        """Called once at the end of a backtest."""
        pass

    def on_candle(self, candle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Called for each new candle.
        
        Args:
            candle: Dict with keys: time, open, high, low, close, volume
            
        Returns:
            List of actions, e.g.:
            [{"action": "order", "side": "buy", "volume": 0.1, "type": "market"}]
        """
        actions = []
        
        # Your strategy logic here
        
        return actions
`;

export const StrategyCreatePage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [code, setCode] = useState(TEMPLATE_CODE);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Strategy name is required');
            return;
        }

        // Validate name format
        if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
            setError('Strategy name must be lowercase with underscores only (e.g., my_strategy)');
            return;
        }

        try {
            setCreating(true);
            setError(null);
            await api.createStrategy(name, code);
            navigate(`/strategies/${name}`);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create strategy');
            console.error('Failed to create strategy:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Create New Strategy</h1>
                <button
                    onClick={() => navigate('/strategies')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                    Cancel
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <div>
                    <label htmlFor="strategy-name" className="block text-sm font-medium text-gray-300 mb-2">
                        Strategy Name
                    </label>
                    <input
                        id="strategy-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., my_custom_strategy"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-400">
                        Use lowercase letters, numbers, and underscores only. This will be the filename.
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6" style={{ height: 'calc(100vh - 400px)' }}>
                <StrategyEditor
                    initialCode={code}
                    onSave={async (newCode) => setCode(newCode)}
                    isSaving={false}
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleCreate}
                    disabled={creating || !name.trim()}
                    className={`px-6 py-3 rounded-md font-medium transition-colors ${creating || !name.trim()
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {creating ? 'Creating...' : 'Create Strategy'}
                </button>
            </div>
        </div>
    );
};
