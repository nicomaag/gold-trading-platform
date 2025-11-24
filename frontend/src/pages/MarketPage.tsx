import React, { useState, useEffect, useRef } from 'react';
import { CandleChart } from '../components/CandleChart';
import { type CandlestickData } from 'lightweight-charts';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

export const MarketPage: React.FC = () => {
    const [symbol, setSymbol] = useState('XAUUSD');
    const [timeframe, setTimeframe] = useState('1h');
    const [data, setData] = useState<CandlestickData[]>([]);
    const [loading, setLoading] = useState(false);
    const [autoUpdate, setAutoUpdate] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadingRef = useRef(false);
    const dataRangeRef = useRef<{ min: number; max: number } | null>(null);

    const fetchDataForRange = async (startTime: number, endTime: number) => {
        if (loadingRef.current) {
            console.log('⏸️ Already loading, skipping request');
            return;
        }

        loadingRef.current = true;
        setError(null);

        try {
            const startDate = new Date(startTime * 1000).toISOString();
            const endDate = new Date(endTime * 1000).toISOString();

            const url = `http://localhost:8000/api/market/candles?symbol=${symbol}&timeframe=${timeframe}&start=${startDate}&end=${endDate}&limit=5000`;

            console.log(`🌐 Fetching data for visible range: ${startDate} to ${endDate}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const rawData = await response.json();

            if (rawData.length === 0) {
                console.log('📭 No data available for this range');
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

            // Merge with existing data
            setData(prev => {
                const existingTimes = new Set(prev.map(d => d.time as number));
                const uniqueNewData = chartData.filter(d => !existingTimes.has(d.time as number));
                const combined = [...prev, ...uniqueNewData];
                combined.sort((a, b) => (a.time as number) - (b.time as number));

                console.log(`✅ Loaded ${rawData.length} candles. Total in chart: ${combined.length}`);

                // Update data range
                if (combined.length > 0) {
                    dataRangeRef.current = {
                        min: combined[0].time as number,
                        max: combined[combined.length - 1].time as number
                    };
                }

                return combined;
            });
        } catch (err: any) {
            setError(err.message);
            console.error('❌ Error:', err);
        } finally {
            loadingRef.current = false;
        }
    };

    const handleVisibleRangeChange = (fromTime: number, toTime: number) => {
        // Check if we need to load more data
        const currentRange = dataRangeRef.current;

        if (!currentRange) {
            // No data yet, load initial range
            fetchDataForRange(fromTime, toTime);
            return;
        }

        // Calculate buffer (load data before we actually need it)
        const rangeSize = toTime - fromTime;
        const buffer = rangeSize * 0.5; // 50% buffer

        // Check if we're approaching the edges
        if (fromTime < currentRange.min + buffer) {
            // Need older data
            const newStart = fromTime - rangeSize;
            const newEnd = currentRange.min;
            console.log(`⬅️ Loading older data: ${new Date(newStart * 1000).toISOString()} to ${new Date(newEnd * 1000).toISOString()}`);
            fetchDataForRange(newStart, newEnd);
        }

        if (toTime > currentRange.max - buffer) {
            // Need newer data
            const newStart = currentRange.max;
            const newEnd = toTime + rangeSize;
            console.log(`➡️ Loading newer data: ${new Date(newStart * 1000).toISOString()} to ${new Date(newEnd * 1000).toISOString()}`);
            fetchDataForRange(newStart, newEnd);
        }
    };

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);

        try {
            const url = `http://localhost:8000/api/market/candles?symbol=${symbol}&timeframe=${timeframe}&limit=1000`;

            console.log(`🌐 Loading initial data`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const rawData = await response.json();

            const chartData: CandlestickData[] = rawData.map((d: any) => ({
                time: new Date(d.time).getTime() / 1000,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
            }));

            chartData.sort((a, b) => (a.time as number) - (b.time as number));

            if (chartData.length > 0) {
                dataRangeRef.current = {
                    min: chartData[0].time as number,
                    max: chartData[chartData.length - 1].time as number
                };
                console.log(`✅ Loaded ${chartData.length} initial candles`);
            }

            setData(chartData);
        } catch (err: any) {
            setError(err.message);
            console.error('❌ Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [symbol, timeframe]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoUpdate) {
            interval = setInterval(() => {
                loadInitialData();
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
                        onClick={loadInitialData}
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
                        onVisibleRangeChange={handleVisibleRangeChange}
                    />
                )}
            </div>
        </div>
    );
};
