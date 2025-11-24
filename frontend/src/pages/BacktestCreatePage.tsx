import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api, type Strategy } from '../api/client';
import { ArrowLeft, Play } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

import { LoadingOverlay } from '../components/LoadingOverlay';

const BacktestCreatePage: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const notifications = useNotifications();

    const initialData = location.state?.initialData;

    const [formData, setFormData] = useState({
        strategy_name: initialData?.strategy_name || searchParams.get('strategy') || '',
        symbol: initialData?.symbol || 'XAU_USD',
        timeframe: initialData?.timeframe || 'H1',
        start: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 16) : '2025-01-01T00:00',
        end: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 16) : '2025-12-31T23:59',
        params: initialData?.params || '{}'
    });

    useEffect(() => {
        api.getStrategies().then(setStrategies).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const params = JSON.parse(formData.params);
            const res = await api.runBacktest({
                ...formData,
                params
            });
            notifications.success('Backtest started successfully');
            navigate(`/backtests/${res.id}`);
        } catch (err: any) {
            notifications.error(err.response?.data?.detail || 'Error starting backtest');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto relative">
            <button
                onClick={() => navigate('/backtests')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Cancel
            </button>

            <h2 className="text-3xl font-bold mb-8">New Backtest</h2>

            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6 relative overflow-hidden">
                <LoadingOverlay isVisible={isLoading} message="Running Backtest..." />

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Strategy</label>
                    <select
                        value={formData.strategy_name}
                        onChange={e => setFormData({ ...formData, strategy_name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        required
                        disabled={isLoading}
                    >
                        <option value="">Select a strategy...</option>
                        {strategies.map(s => (
                            <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Symbol</label>
                        <input
                            type="text"
                            value={formData.symbol}
                            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Timeframe</label>
                        <select
                            value={formData.timeframe}
                            onChange={e => setFormData({ ...formData, timeframe: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                            disabled={isLoading}
                        >
                            <option value="M1">M1</option>
                            <option value="M5">M5</option>
                            <option value="M15">M15</option>
                            <option value="H1">H1</option>
                            <option value="H4">H4</option>
                            <option value="D">D</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date</label>
                        <input
                            type="datetime-local"
                            value={formData.start}
                            onChange={e => setFormData({ ...formData, start: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date</label>
                        <input
                            type="datetime-local"
                            value={formData.end}
                            onChange={e => setFormData({ ...formData, end: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Parameters (JSON)</label>
                    <textarea
                        value={formData.params}
                        onChange={e => setFormData({ ...formData, params: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:border-yellow-500 focus:outline-none h-32"
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Play size={20} />
                    {isLoading ? 'Running...' : 'Run Backtest'}
                </button>
            </form>
        </div>
    );
};

export default BacktestCreatePage;
