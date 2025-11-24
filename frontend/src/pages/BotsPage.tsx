import React, { useEffect, useState } from 'react';
import { api, type Bot } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Square, Trash2 } from 'lucide-react';

const BotsPage: React.FC = () => {
    const [bots, setBots] = useState<Bot[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchBots = () => {
        api.getBots()
            .then(setBots)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBots();
        const interval = setInterval(fetchBots, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleStop = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to stop this bot?')) {
            await api.stopBot(id);
            fetchBots();
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
            try {
                await api.deleteBot(id);
                fetchBots();
            } catch (error: any) {
                alert(error.response?.data?.detail || 'Failed to delete bot');
            }
        }
    };

    if (loading) return <div className="text-center p-10">Loading bots...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Live Bots</h2>
                <button
                    onClick={() => navigate('/bots/new')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium"
                >
                    <Plus size={18} />
                    Start New Bot
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
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Started</th>
                            <th className="p-4 font-medium">Last Update</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {bots.map((bot) => (
                            <tr
                                key={bot.id}
                                onClick={() => navigate(`/bots/${bot.id}`)}
                                className="hover:bg-gray-750 cursor-pointer transition-colors"
                            >
                                <td className="p-4 text-gray-500 font-mono text-xs">{bot.id.slice(0, 8)}...</td>
                                <td className="p-4 font-medium text-white">{bot.strategy_name}</td>
                                <td className="p-4 text-gray-300">{bot.symbol}</td>
                                <td className="p-4 text-gray-300">{bot.timeframe}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${bot.status === 'running' ? 'bg-green-500/20 text-green-400 animate-pulse' :
                                        bot.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {bot.status.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {bot.start_time ? format(new Date(bot.start_time), 'MMM d HH:mm') : '-'}
                                </td>
                                <td className="p-4 text-gray-400 text-sm">
                                    {bot.last_update_time ? format(new Date(bot.last_update_time), 'HH:mm:ss') : '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex gap-2 justify-end">
                                        {bot.status === 'running' && (
                                            <button
                                                onClick={(e) => handleStop(e, bot.id)}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                title="Stop Bot"
                                            >
                                                <Square size={16} fill="currentColor" />
                                            </button>
                                        )}
                                        {bot.status === 'stopped' && (
                                            <button
                                                onClick={(e) => handleDelete(e, bot.id)}
                                                className="p-2 bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 rounded transition-colors"
                                                title="Delete Bot"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {bots.length === 0 && (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500">
                                    No bots running. Start one to begin live trading.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BotsPage;
