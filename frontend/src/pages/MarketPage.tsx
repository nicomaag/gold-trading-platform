import React, { useState, useEffect } from 'react';
import { CandleChart } from '../components/CandleChart';
import { type CandlestickData } from 'lightweight-charts';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const MarketPage: React.FC = () => {
    const [symbol, setSymbol] = useState('XAUUSD');
    const [timeframe, setTimeframe] = useState('1h');
    const [data, setData] = useState<CandlestickData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [autoUpdate, setAutoUpdate] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const fetchData = async (loadMore: boolean = false) => {
        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            let url = `http://localhost:8000/api/market/candles?symbol=${symbol}&timeframe=${timeframe}&limit=1000`;

            // If loading more, fetch data BEFORE the oldest candle
            if (loadMore && data.length > 0) {
                const oldestTime = data[0].time as number;
                const endDate = new Date(oldestTime * 1000).toISOString();
                url += `&end=${endDate}`;
                console.log(`📥 Loading more data before ${endDate}`);
            }

            console.log(`🌐 Fetching: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const rawData = await response.json();

            if (rawData.length === 0) {
                console.log('📭 No more data available');
                setHasMore(false);
                return;
            }

            const chartData: CandlestickData[] = rawData.map((d: any) => ({
                time: new Date(d.time).getTime() / 1000,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));

            chartData.sort((a, b) => (a.time as number) - (b.time as number));

            if (loadMore) {
                // Prepend new data, filtering out duplicates
                setData(prev => {
                    const existingTimes = new Set(prev.map(d => d.time as number));
                    const uniqueNewData = chartData.filter(d => !existingTimes.has(d.time as number));
                    const combined = [...uniqueNewData, ...prev];

                    if (combined.length > 0) {
                        const oldestDate = new Date((combined[0].time as number) * 1000).toISOString();
                        const newestDate = new Date((combined[combined.length - 1].time as number) * 1000).toISOString();
                        console.log(`✅ Added ${uniqueNewData.length} candles. Total: ${combined.length}`);
                        console.log(`   Range: ${oldestDate} to ${newestDate}`);
                    }

                    return combined;
                });
            } else {
                if (chartData.length > 0) {
                    const oldestDate = new Date((chartData[0].time as number) * 1000).toISOString();
                    const newestDate = new Date((chartData[chartData.length - 1].time as number) * 1000).toISOString();
                    console.log(`✅ Loaded ${chartData.length} candles from ${oldestDate} to ${newestDate}`);
                }
                setData(chartData);
                setHasMore(true);
            }
        } catch (err: any) {
            setError(err.message);
            console.error('❌ Error:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchData(false);
    }, [symbol, timeframe]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoUpdate) {
            interval = setInterval(() => {
                fetchData(false);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [autoUpdate, symbol, timeframe]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Market Data</h1>
                <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Symbol:</label>
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            className="border rounded px-2 py-1 text-sm w-24 text-gray-900"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Timeframe:</label>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="border rounded px-2 py-1 text-sm bg-white text-gray-900"
                        >
                            {TIMEFRAMES.map(tf => (
                                <option key={tf} value={tf}>{tf}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={autoUpdate}
                                    onChange={(e) => setAutoUpdate(e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full ${autoUpdate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${autoUpdate ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-700">Auto Update</span>
                        </label>
                    </div>

                    <button
                        onClick={() => fetchData(false)}
                        className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                {/* Load More Button */}
                {data.length > 0 && hasMore && (
                    <div className="flex justify-center">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={loadingMore}
                            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loadingMore ? 'Loading older data...' : '⬅️ Load Older Data'}
                        </button>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg shadow h-[600px]">
                    {loading && data.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
                    ) : (
                        <CandleChart data={data} />
                    )}
                </div>
            </div>
        </div>
    );
};
