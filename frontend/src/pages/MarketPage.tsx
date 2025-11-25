import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CandleChart } from '../components/CandleChart';
import { type CandlestickData } from 'lightweight-charts';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const MarketPage: React.FC = () => {
    const [symbol, setSymbol] = useState('XAUUSD');
    const [timeframe, setTimeframe] = useState('1h');
    const [data, setData] = useState<CandlestickData[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dataRef = useRef<CandlestickData[]>([]);
    const loadingRef = useRef(false);

    // Update dataRef whenever data changes
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    const fetchData = useCallback(async (isLoadMore = false) => {
        if (loadingRef.current) return;

        loadingRef.current = true;
        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);

        try {
            let url = `http://localhost:8000/api/market/candles?symbol=${symbol}&timeframe=${timeframe}&limit=500`;

            if (isLoadMore && dataRef.current.length > 0) {
                const oldestTime = dataRef.current[0].time as number;
                const endDate = new Date(oldestTime * 1000).toISOString();
                url += `&end=${endDate}`;
                console.log(`📥 Loading more data before ${endDate}`);
            } else {
                console.log(`🔄 Initial load for ${symbol} ${timeframe}`);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const rawData = await response.json();

            if (rawData.length === 0) {
                console.log('⚠️ No data returned');
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

            if (isLoadMore) {
                setData(prev => {
                    const existingTimes = new Set(prev.map(d => d.time as number));
                    const uniqueNewData = chartData.filter(d => !existingTimes.has(d.time as number));
                    const combined = [...uniqueNewData, ...prev];
                    combined.sort((a, b) => (a.time as number) - (b.time as number));

                    console.log(`✅ Loaded ${uniqueNewData.length} older candles. Total: ${combined.length}`);
                    return combined;
                });
            } else {
                console.log(`✅ Set initial data: ${chartData.length} candles`);
                setData(chartData);
            }

        } catch (err: any) {
            setError(err.message);
            console.error('❌ Error fetching data:', err);
        } finally {
            loadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
        }
    }, [symbol, timeframe]);

    // Initial load
    useEffect(() => {
        setData([]); // Clear data on symbol/timeframe change
        dataRef.current = [];
        fetchData(false);
    }, [fetchData]);

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

            <div className="bg-white p-4 rounded-lg shadow h-[600px]">
                {loading && data.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500">Loading...</div>
                ) : (
                    <CandleChart
                        data={data}
                        onLoadMore={() => fetchData(true)}
                    />
                )}
            </div>

            {loadingMore && (
                <div className="text-center text-sm text-gray-500 mt-2">
                    Loading older data...
                </div>
            )}
        </div>
    );
};
