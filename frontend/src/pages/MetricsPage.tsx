import { useEffect, useState } from 'react';
import { Activity, TrendingUp, Database, Zap } from 'lucide-react';

interface CacheMetrics {
    cache_hits: number;
    cache_misses: number;
    partial_cache_hits: number;
    total_requests: number;
    hit_rate_percent: number;
    partial_hit_rate_percent: number;
    api_calls: number;
    total_api_requests: number;
}

export default function MetricsPage() {
    const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/market/metrics');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            setMetrics(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading metrics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
            </div>
        );
    }

    if (!metrics) return null;

    const StatCard = ({
        icon: Icon,
        label,
        value,
        color
    }: {
        icon: any;
        label: string;
        value: string | number;
        color: string;
    }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Cache Metrics</h1>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        <span className="text-sm text-gray-600">Auto-refresh (5s)</span>
                    </label>
                    <button
                        onClick={fetchMetrics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Database}
                    label="Total Requests"
                    value={metrics.total_requests}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Zap}
                    label="Cache Hit Rate"
                    value={`${metrics.hit_rate_percent}%`}
                    color="bg-green-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Partial Hit Rate"
                    value={`${metrics.partial_hit_rate_percent}%`}
                    color="bg-yellow-500"
                />
                <StatCard
                    icon={Activity}
                    label="Session API Calls"
                    value={metrics.total_api_requests}
                    color="bg-purple-500"
                />
                <StatCard
                    icon={Database}
                    label="All Time API Calls"
                    value={metrics.api_calls}
                    color="bg-indigo-500"
                />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cache Performance */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Cache Performance</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Full Cache Hits</span>
                            <span className="font-semibold text-green-600">{metrics.cache_hits}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${metrics.hit_rate_percent}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Partial Cache Hits</span>
                            <span className="font-semibold text-yellow-600">{metrics.partial_cache_hits}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: `${metrics.partial_hit_rate_percent}%` }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Cache Misses</span>
                            <span className="font-semibold text-red-600">{metrics.cache_misses}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{
                                    width: `${metrics.total_requests > 0
                                        ? (metrics.cache_misses / metrics.total_requests) * 100
                                        : 0
                                        }%`,
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* API Usage */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">API Usage</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Total API Requests</span>
                            <span className="font-semibold">{metrics.total_api_requests}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">API Calls (Gaps Filled)</span>
                            <span className="font-semibold">{metrics.api_calls}</span>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-500">
                                Cache efficiency: {metrics.total_requests > 0
                                    ? Math.round(((metrics.total_requests - metrics.cache_misses) / metrics.total_requests) * 100)
                                    : 0}% of requests served from cache
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">About Cache Metrics</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>Full Cache Hits:</strong> Requests served entirely from database cache (no API call)</li>
                    <li><strong>Partial Cache Hits:</strong> Requests with some data in cache, gaps filled from API</li>
                    <li><strong>Cache Misses:</strong> Requests with no cached data (full API fetch)</li>
                    <li><strong>API Calls:</strong> Number of API requests made to fill gaps</li>
                </ul>
            </div>
        </div>
    );
}
