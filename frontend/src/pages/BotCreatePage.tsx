import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Strategy } from '../api/client';
import { ArrowLeft, Bot } from 'lucide-react';

const BotCreatePage: React.FC = () => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        strategy_name: '',
        symbol: 'XAU_USD',
        timeframe: 'H1',
        params: '{}'
    });

    useEffect(() => {
        api.getStrategies().then(setStrategies).catch(console.error);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const params = JSON.parse(formData.params);
            await api.createBot({
                ...formData,
                params
            });
            navigate('/bots');
        } catch (err) {
            alert('Error starting bot: ' + err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate('/bots')}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={18} />
                Cancel
            </button>

            <h2 className="text-3xl font-bold mb-8">Start Live Bot</h2>

            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl border border-gray-700 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Strategy</label>
                    <select
                        value={formData.strategy_name}
                        onChange={e => setFormData({ ...formData, strategy_name: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
                        required
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
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Timeframe</label>
                        <select
                            value={formData.timeframe}
                            onChange={e => setFormData({ ...formData, timeframe: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 focus:outline-none"
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

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Parameters (JSON)</label>
                    <textarea
                        value={formData.params}
                        onChange={e => setFormData({ ...formData, params: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:border-yellow-500 focus:outline-none h-32"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-colors"
                >
                    <Bot size={20} />
                    Start Bot
                </button>
            </form>
        </div>
    );
};

export default BotCreatePage;
