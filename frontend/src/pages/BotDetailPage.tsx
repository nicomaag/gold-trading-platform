import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Bot } from '../api/client';
import { format } from 'date-fns';
import { ArrowLeft, Square } from 'lucide-react';

const BotDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [bot, setBot] = useState<Bot | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchBot = () => {
        if (id) {
            api.getBot(id)
                .then(setBot)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    };

    useEffect(() => {
        fetchBot();
        const interval = setInterval(fetchBot, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [id]);

    const handleStop = async () => {
        if (id && confirm('Are you sure you want to stop this bot?')) {
            await api.stopBot(id);
            fetchBot();
        }
    };

    if (loading) return <div className="text-center p-10">Loading details...</div>;
    if (!bot) return <div className="text-center p-10">Bot not found</div>;

    return (
        <div>
            <button
                onClick={() => navigate('/bots')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Back to List
            </button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold mb-2">Bot Details</h2>
                    <div className="text-gray-400 font-mono text-sm">{bot.id}</div>
                </div>
                <div>
                    {bot.status === 'running' && (
                        <button
                            onClick={handleStop}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                        >
                            <Square size={20} fill="currentColor" />
                            Stop Bot
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-4">Configuration</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-gray-400 text-sm">Strategy</div>
                            <div className="text-white font-medium">{bot.strategy_name}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Symbol</div>
                            <div className="text-white font-medium">{bot.symbol}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Timeframe</div>
                            <div className="text-white font-medium">{bot.timeframe}</div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Created At</div>
                            <div className="text-white font-medium">
                                {format(new Date(bot.created_at), 'MMM d, yyyy HH:mm')}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-gray-400 text-sm mb-2">Parameters</div>
                        <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono text-gray-300">
                            {JSON.stringify(bot.params, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                    <h3 className="text-xl font-bold border-b border-gray-700 pb-4">Status</h3>

                    <div>
                        <div className="text-gray-400 text-sm mb-2">Current Status</div>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${bot.status === 'running' ? 'bg-green-500/20 text-green-400 animate-pulse' :
                                bot.status === 'stopped' ? 'bg-gray-500/20 text-gray-400' :
                                    'bg-red-500/20 text-red-400'
                            }`}>
                            {bot.status.toUpperCase()}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-gray-400 text-sm">Started At</div>
                            <div className="text-white font-medium">
                                {bot.start_time ? format(new Date(bot.start_time), 'MMM d HH:mm:ss') : '-'}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Last Update</div>
                            <div className="text-white font-medium">
                                {bot.last_update_time ? format(new Date(bot.last_update_time), 'HH:mm:ss') : '-'}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm">
                        Live positions and orders would be displayed here in a full implementation.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BotDetailPage;
