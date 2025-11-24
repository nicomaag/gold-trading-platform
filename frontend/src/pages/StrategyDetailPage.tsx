import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { api } from '../api/client';
import type { Strategy } from '../api/client';
import { StrategyEditor } from '../components/StrategyEditor';

export const StrategyDetailPage = () => {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [strategy, setStrategy] = useState<Strategy | null>(null);
    const [code, setCode] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'code'>('details');

    useEffect(() => {
        const fetchData = async () => {
            if (!name) return;

            try {
                setLoading(true);
                const [strategyData, codeData] = await Promise.all([
                    api.getStrategy(name),
                    api.getStrategyCode(name)
                ]);
                setStrategy(strategyData);
                setCode(codeData.code);
            } catch (err) {
                setError('Failed to load strategy');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [name]);

    const handleSave = async (newCode: string) => {
        if (!name) return;

        try {
            setSaving(true);
            await api.updateStrategyCode(name, newCode);
            setCode(newCode);
        } catch (err) {
            console.error('Failed to save strategy:', err);
            alert('Failed to save strategy');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!name) return;

        if (!confirm(`Are you sure you want to delete the strategy "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeleting(true);
            await api.deleteStrategy(name);
            navigate('/strategies');
        } catch (err: any) {
            console.error('Failed to delete strategy:', err);
            alert(err.response?.data?.detail || 'Failed to delete strategy');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Loading strategy...</p>
            </div>
        );
    }

    if (error || !strategy) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-red-400">{error || 'Strategy not found'}</p>
                <button
                    onClick={() => navigate('/strategies')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                >
                    Back to Strategies
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">{strategy.class_name}</h1>
                    <p className="text-gray-400 mt-1">{name}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/strategies')}
                        className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                        Back to Strategies
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${deleting
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                    >
                        <Trash2 size={16} />
                        {deleting ? 'Deleting...' : 'Delete Strategy'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'details'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setActiveTab('code')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'code'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        Code Editor
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
                        <p className="text-gray-300 whitespace-pre-wrap">{strategy.description}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-2">Class Name</h2>
                        <p className="text-gray-300 font-mono">{strategy.class_name}</p>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-2">File Name</h2>
                        <p className="text-gray-300 font-mono">{name}.py</p>
                    </div>
                </div>
            )}

            {activeTab === 'code' && (
                <div className="bg-gray-800 rounded-lg p-6" style={{ height: 'calc(100vh - 300px)' }}>
                    <StrategyEditor
                        initialCode={code}
                        onSave={handleSave}
                        isSaving={saving}
                    />
                </div>
            )}
        </div>
    );
};
