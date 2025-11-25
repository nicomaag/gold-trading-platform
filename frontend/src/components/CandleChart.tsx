import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData, type LogicalRange, type SeriesMarker, type Time } from 'lightweight-charts';

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

    const [tooltip, setTooltip] = React.useState<{
        x: number;
        y: number;
        data: CandlestickData;
    } | null>(null);

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
                if (newVisibleLogicalRange.from < 50) {
                    onLoadMore();
                }
            }
        });

        // Handle clicks for tooltip
        chart.subscribeClick((param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                setTooltip(null);
                (newSeries as any).setMarkers([]); // Clear markers
            } else {
                const data = param.seriesData.get(newSeries) as CandlestickData;
                if (data) {
                    setTooltip({
                        x: param.point.x,
                        y: param.point.y,
                        data: data,
                    });

                    // Add marker to visualize selection
                    (newSeries as any).setMarkers([
                        {
                            time: param.time as Time,
                            position: 'aboveBar',
                            color: '#2196F3',
                            shape: 'arrowDown',
                            text: 'Selected',
                        }
                    ]);
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

        if (currentDataLength === 0) return;

        if (prevDataLength === 0) {
            seriesRef.current.setData(data);
            chartRef.current.timeScale().fitContent();
            isInitialLoadRef.current = false;
        }
        else if (currentDataLength > prevDataLength) {
            const addedCount = currentDataLength - prevDataLength;
            const currentRange = chartRef.current.timeScale().getVisibleLogicalRange();

            seriesRef.current.setData(data);

            if (currentRange) {
                chartRef.current.timeScale().setVisibleLogicalRange({
                    from: currentRange.from + addedCount,
                    to: currentRange.to + addedCount,
                });
            }
        }
        else {
            seriesRef.current.setData(data);
        }

        prevDataLengthRef.current = currentDataLength;
    }, [data]);

    return (
        <div ref={chartContainerRef} style={{ width: '100%', position: 'relative' }}>
            {tooltip && (
                <div
                    className="text-gray-900" // Force dark text
                    style={{
                        position: 'absolute',
                        left: tooltip.x,
                        top: tooltip.y,
                        zIndex: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque
                        border: '1px solid #999', // Darker border
                        borderRadius: '4px',
                        padding: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)', // Stronger shadow
                        fontSize: '12px',
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-15px', // Move up slightly more to clear the arrow
                        minWidth: '150px'
                    }}
                >
                    <div className="font-bold mb-2 border-b border-gray-300 pb-1">
                        {typeof tooltip.data.time === 'string'
                            ? tooltip.data.time
                            : (tooltip.data.time as any).year
                                ? `${(tooltip.data.time as any).year}-${(tooltip.data.time as any).month}-${(tooltip.data.time as any).day}`
                                : new Date(tooltip.data.time as number * 1000).toLocaleString()}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-gray-600 font-semibold">Open:</span>
                        <span className="font-mono text-right">{tooltip.data.open.toFixed(2)}</span>
                        <span className="text-gray-600 font-semibold">High:</span>
                        <span className="font-mono text-right">{tooltip.data.high.toFixed(2)}</span>
                        <span className="text-gray-600 font-semibold">Low:</span>
                        <span className="font-mono text-right">{tooltip.data.low.toFixed(2)}</span>
                        <span className="text-gray-600 font-semibold">Close:</span>
                        <span className="font-mono text-right">{tooltip.data.close.toFixed(2)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
