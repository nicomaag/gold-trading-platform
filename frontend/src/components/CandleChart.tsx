import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData } from 'lightweight-charts';

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
    const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingMoreRef = useRef(false);

    const {
        backgroundColor = 'white',
        textColor = 'black',
    } = colors;

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
        });

        chart.timeScale().fitContent();

        const newSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        newSeries.setData(data);

        chartRef.current = chart;
        seriesRef.current = newSeries;

        // Infinite scroll logic with debouncing
        if (onLoadMore) {
            chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
                // Trigger when user scrolls near the left edge (old data)
                if (range && range.from < 0.5 && !isLoadingMoreRef.current) {
                    // Clear any pending timeout
                    if (loadMoreTimeoutRef.current) {
                        clearTimeout(loadMoreTimeoutRef.current);
                    }

                    // Debounce the load more call
                    loadMoreTimeoutRef.current = setTimeout(() => {
                        isLoadingMoreRef.current = true;
                        onLoadMore();
                        // Reset flag after a delay to allow next load
                        setTimeout(() => {
                            isLoadingMoreRef.current = false;
                        }, 2000);
                    }, 500);
                }
            });
        }

        window.addEventListener('resize', handleResize);

        return () => {
            if (loadMoreTimeoutRef.current) {
                clearTimeout(loadMoreTimeoutRef.current);
            }
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, textColor, onLoadMore]);

    useEffect(() => {
        if (seriesRef.current) {
            seriesRef.current.setData(data);
        }
    }, [data]);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }} />
    );
};
