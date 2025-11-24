import React, { useEffect, useState } from 'react';
import { api, type Strategy } from '../api/client';
import { Play, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StrategiesPage: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.getStrategies()
            .then(setStrategies)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center p-10">Loading strategies...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Trading Strategies</h2>
                <button
                    onClick={() => navigate('/strategies/new')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                    <Plus size={20} />
                    Create Strategy
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                    <div key={strategy.name} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-semibold text-white">{strategy.name}</h3>
                            <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300 font-mono">
                                {strategy.class_name}
                            </span>
                        </div>

                        <p className="text-gray-400 mb-6 h-20 overflow-hidden text-ellipsis">
                            {strategy.description}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate(`/strategies/${strategy.name}`)}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors font-medium"
                            >
                                <Eye size={16} />
                                View
                            </button>
                            <button
                                onClick={() => navigate(`/backtests/new?strategy=${strategy.name}`)}
                                className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg transition-colors font-medium"
                            >
                                <Play size={16} />
                                Backtest
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StrategiesPage;
