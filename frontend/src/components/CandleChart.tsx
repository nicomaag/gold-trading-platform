import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LogicalRange } from 'lightweight-charts';

interface CandleChartProps {
    data: CandlestickData[];
    onVisibleRangeChange?: (from: number, to: number) => void;
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
}

export const CandleChart: React.FC<CandleChartProps> = ({ data, onVisibleRangeChange, colors = {} }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const lastRangeRef = useRef<{ from: number; to: number } | null>(null);

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

        // Listen to visible range changes (scroll/zoom)
        if (onVisibleRangeChange) {
            chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange: LogicalRange | null) => {
                if (!logicalRange || !data.length) return;

                // Convert logical range to actual timestamps
                const fromIndex = Math.max(0, Math.floor(logicalRange.from));
                const toIndex = Math.min(data.length - 1, Math.ceil(logicalRange.to));

                if (fromIndex >= 0 && toIndex < data.length) {
                    const fromTime = data[fromIndex].time as number;
                    const toTime = data[toIndex].time as number;

                    // Only trigger if range changed significantly (avoid spam)
                    if (!lastRangeRef.current ||
                        Math.abs(lastRangeRef.current.from - fromTime) > 3600 || // 1 hour difference
                        Math.abs(lastRangeRef.current.to - toTime) > 3600) {

                        lastRangeRef.current = { from: fromTime, to: toTime };

                        // Check if we're near the edges (need more data)
                        const bufferZone = (toIndex - fromIndex) * 0.2; // 20% buffer

                        if (fromIndex < bufferZone || toIndex > data.length - bufferZone) {
                            console.log(`📊 Visible range: ${new Date(fromTime * 1000).toISOString()} to ${new Date(toTime * 1000).toISOString()}`);
                            onVisibleRangeChange(fromTime, toTime);
                        }
                    }
                }
            });
        }

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [backgroundColor, textColor, onVisibleRangeChange]);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            seriesRef.current.setData(data);
            // Fit content on initial load or when data changes significantly
            if (chartRef.current) {
                chartRef.current.timeScale().fitContent();
            }
        }
    }, [data]);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }} />
    );
};
