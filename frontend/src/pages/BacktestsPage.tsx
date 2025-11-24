import React, { useEffect, useState } from 'react';
import { api, type Backtest } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const BacktestsPage: React.FC = () => {
    const [backtests, setBacktests] = useState<Backtest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const notifications = useNotifications();

    const fetchBacktests = () => {
        api.getBacktests()
            .then(setBacktests)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBacktests();
    }, []);

    const handleRerun = async (e: React.MouseEvent, backtest: Backtest) => {
        e.stopPropagation();

        notifications.addNotification({
            type: 'warning',
            title: 'Confirm Rerun',
            message: `Rerun backtest for ${backtest.strategy_name} on ${backtest.symbol}?`,
            duration: 0,
            actions: [
                {
                    label: 'Rerun',
                    variant: 'primary',
                    onClick: async () => {
                        try {
                            await api.runBacktest({
                                strategy_name: backtest.strategy_name,
                                symbol: backtest.symbol,
                                timeframe: backtest.timeframe,
                                start: backtest.start_date,
                                end: backtest.end_date,
                                params: backtest.params || {}
                            });
                            notifications.success('Backtest started successfully');
                            fetchBacktests();
                        } catch (error: any) {
                            notifications.error(error.response?.data?.detail || 'Failed to rerun backtest');
                        }
                    }
                },
                {
                    label: 'Cancel',
                    variant: 'secondary',
                    onClick: () => { }
                }
            ]
        });
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();

        notifications.addNotification({
            type: 'error',
            title: 'Confirm Deletion',
            message: 'Are you sure you want to delete this backtest? This action cannot be undone.',
            duration: 0,
            actions: [
                {
                    label: 'Delete',
                    variant: 'primary',
                    onClick: async () => {
                        try {
                            await api.deleteBacktest(id.toString());
                            notifications.success('Backtest deleted successfully');
                            fetchBacktests();
                        } catch (error: any) {
                            notifications.error(error.response?.data?.detail || 'Failed to delete backtest');
                        }
                    }
                },
                {
                    label: 'Cancel',
                    variant: 'secondary',
                    onClick: () => { }
                }
            ]
        });
    };

    if (loading) return <div className="text-center p-10">Loading backtests...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Backtests</h2>
                <button
                    onClick={() => navigate('/backtests/new')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium"
                >
                    <Plus size={18} />
                    New Backtest
                </button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-750 border-b border-gray-700 text-gray-400">
                        <tr>
                            <th className="p-4 font-medium">ID</th>
                            <th className="p-4 font-medium">Strategy</th>
                            <th className="p-4 font-medium">Symbol</th>
                            <th className="p-4 font-medium">Timeframe</th>
                            <th className="p-4 font-medium">Date Range</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Return</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {backtests.map((bt) => (
                            <tr
                                key={bt.id}
                                onClick={() => navigate(`/backtests/${bt.id}`)}
                                className="hover:bg-gray-750 cursor-pointer transition-colors"
                            >
                                <td className="p-4 text-gray-500">#{bt.id}</td>
                                <td className="p-4 font-medium text-white">{bt.strategy_name}</td>
                                <td className="p-4 text-gray-300">{bt.symbol}</td>
                                <td className="p-4 text-gray-300">{bt.timeframe}</td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {format(new Date(bt.start_date), 'MMM d, yyyy')} - {format(new Date(bt.end_date), 'MMM d, yyyy')}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${bt.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                        bt.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {bt.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className={`p-4 text-right font-mono ${(bt.total_return || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {bt.total_return ? `${bt.total_return.toFixed(2)}%` : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={(e) => handleRerun(e, bt)}
                                            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-colors"
                                            title="Rerun Backtest"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, bt.id)}
                                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                            title="Delete Backtest"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {backtests.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500">
                                    No backtests found. Start one to see results here.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BacktestsPage;
