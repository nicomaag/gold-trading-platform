import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LogicalRange } from 'lightweight-charts';

interface CandleChartProps {
    data: CandlestickData[];
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
    onLoadMore?: () => void;
}

export const CandleChart: React.FC<CandleChartProps> = ({ data, colors = {}, onLoadMore }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const prevDataLengthRef = useRef<number>(0);
    const isInitialLoadRef = useRef<boolean>(true);

    const {
        backgroundColor = 'white',
        textColor = 'black',
    } = colors;

    // Initialize Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            grid: {
                vertLines: { color: '#e1e1e1' },
                horzLines: { color: '#e1e1e1' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            }
        });

        const newSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        chartRef.current = chart;
        seriesRef.current = newSeries;

        // Subscribe to visible logical range changes for infinite scroll
        chart.timeScale().subscribeVisibleLogicalRangeChange((newVisibleLogicalRange) => {
            if (newVisibleLogicalRange && onLoadMore) {
                // If we are near the start (left side) of the data, trigger load more
                // Using a threshold of 50 candles to trigger earlier
                if (newVisibleLogicalRange.from < 50) {
                    onLoadMore();
                }
            }
        });

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, textColor]); // Re-create chart only if colors change (rare)

    // Handle Data Updates
    useEffect(() => {
        if (!seriesRef.current || !chartRef.current) return;

        const currentDataLength = data.length;
        const prevDataLength = prevDataLengthRef.current;

        // If data is empty, just return
        if (currentDataLength === 0) return;

        // Case 1: Initial Load
        if (prevDataLength === 0) {
            seriesRef.current.setData(data);
            chartRef.current.timeScale().fitContent();
            isInitialLoadRef.current = false;
        }
        // Case 2: Prepending Data (Loading History)
        else if (currentDataLength > prevDataLength) {
            // We assume data was prepended. 
            // To maintain the scroll position, we need to shift the visible range 
            // by the number of new candles added to the left.

            const addedCount = currentDataLength - prevDataLength;
            const currentRange = chartRef.current.timeScale().getVisibleLogicalRange();

            seriesRef.current.setData(data);

            if (currentRange) {
                // Shift the range to keep the user looking at the same candles
                chartRef.current.timeScale().setVisibleLogicalRange({
                    from: currentRange.from + addedCount,
                    to: currentRange.to + addedCount,
                });
            }
        }
        // Case 3: Reset or other updates
        else {
            seriesRef.current.setData(data);
        }

        prevDataLengthRef.current = currentDataLength;
    }, [data]);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }} />
    );
};
