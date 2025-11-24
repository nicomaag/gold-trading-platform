import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Backtest } from '../api/client';
import { format } from 'date-fns';
import { ArrowLeft, RotateCcw, Trash2, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNotifications } from '../contexts/NotificationContext';
import { LoadingOverlay } from '../components/LoadingOverlay';

const BacktestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [backtest, setBacktest] = useState<Backtest | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();
    const notifications = useNotifications();

    useEffect(() => {
        if (id) {
            api.getBacktest(id)
                .then(setBacktest)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleRerun = async () => {
        if (!backtest) return;

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
                        setActionLoading(true);
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
                            navigate('/backtests');
                        } catch (error: any) {
                            notifications.error(error.response?.data?.detail || 'Failed to rerun backtest');
                        } finally {
                            setActionLoading(false);
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

    const handleDelete = async () => {
        if (!backtest) return;

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
                        setActionLoading(true);
                        try {
                            await api.deleteBacktest(backtest.id.toString());
                            notifications.success('Backtest deleted successfully');
                            navigate('/backtests');
                        } catch (error: any) {
                            notifications.error(error.response?.data?.detail || 'Failed to delete backtest');
                        } finally {
                            setActionLoading(false);
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

    const handleDuplicate = () => {
        if (!backtest) return;
        navigate('/backtests/new', {
            state: {
                initialData: {
                    strategy_name: backtest.strategy_name,
                    symbol: backtest.symbol,
                    timeframe: backtest.timeframe,
                    start_date: backtest.start_date,
                    end_date: backtest.end_date,
                    params: JSON.stringify(backtest.params, null, 2)
                }
            }
        });
    };

    if (loading) return <div className="text-center p-10">Loading details...</div>;
    if (!backtest) return <div className="text-center p-10">Backtest not found</div>;

    const equityData = backtest.equity_curve?.map(p => ({
        time: format(new Date(p.time), 'MM/dd HH:mm'),
        equity: p.equity
    })) || [];

    return (
        <div className="relative">
            <LoadingOverlay isVisible={actionLoading} message="Processing..." />

            <button
                onClick={() => navigate('/backtests')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to List
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Backtest #{backtest.id}</h2>
                    <div className="flex gap-4 text-gray-400">
                        <span>{backtest.strategy_name}</span>
                        <span>•</span>
                        <span>{backtest.symbol}</span>
                        <span>•</span>
                        <span>{backtest.timeframe}</span>
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="text-right">
                        <div className={`text-3xl font-bold font-mono ${(backtest.total_return || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {backtest.total_return ? `${backtest.total_return.toFixed(2)}%` : '-'}
                        </div>
                        <div className="text-gray-400 text-sm">Total Return</div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDuplicate}
                            className="p-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                            title="Duplicate & Edit"
                            disabled={actionLoading}
                        >
                            <Plus size={20} />
                        </button>
                        <button
                            onClick={handleRerun}
                            className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                            title="Rerun Backtest"
                            disabled={actionLoading}
                        >
                            <RotateCcw size={20} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Delete Backtest"
                            disabled={actionLoading}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Parameters Section */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                <h3 className="text-xl font-bold mb-4">Parameters</h3>
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 font-mono">
                    {JSON.stringify(backtest.params, null, 2)}
                </pre>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Max Drawdown</div>
                    <div className="text-2xl font-mono text-red-400">
                        {backtest.max_drawdown ? `${backtest.max_drawdown.toFixed(2)}%` : '-'}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Win Rate</div>
                    <div className="text-2xl font-mono text-blue-400">
                        {backtest.win_rate ? `${(backtest.win_rate * 100).toFixed(1)}%` : '-'}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Total Trades</div>
                    <div className="text-2xl font-mono text-white">
                        {backtest.trades_count || 0}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                <h3 className="text-xl font-bold mb-4">Equity Curve</h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={equityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="time" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="equity" stroke="#EAB308" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Trades */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <h3 className="text-xl font-bold p-6 border-b border-gray-700">Trades</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-750 border-b border-gray-700 text-gray-400">
                            <tr>
                                <th className="p-4 font-medium">Entry Time</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Volume</th>
                                <th className="p-4 font-medium text-right">Entry Price</th>
                                <th className="p-4 font-medium text-right">Exit Price</th>
                                <th className="p-4 font-medium text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {backtest.trades?.map((trade, i) => (
                                <tr key={i} className="hover:bg-gray-750 transition-colors">
                                    <td className="p-4 text-gray-300">
                                        {format(new Date(trade.entry_time), 'MMM d HH:mm')}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${trade.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {trade.side.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-300">{trade.volume}</td>
                                    <td className="p-4 text-right font-mono text-gray-300">{trade.entry_price.toFixed(2)}</td>
                                    <td className="p-4 text-right font-mono text-gray-300">
                                        {trade.exit_price?.toFixed(2) || '-'}
                                    </td>
                                    <td className={`p-4 text-right font-mono ${(trade.pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {trade.pnl ? trade.pnl.toFixed(2) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BacktestDetailPage;
