import React, { useState } from 'react';
import { Stock, StockPricePoint } from '../types';
import { TrendingUp, TrendingDown, BarChart2, Activity, Calendar } from 'lucide-react';
import { FXService } from '../services/fxService';

interface StockChartProps {
  stock: Stock;
  baseCurrency: string;
}

export const StockChart: React.FC<StockChartProps> = ({ stock, baseCurrency }) => {
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1D');
  const [hoveredPoint, setHoveredPoint] = useState<StockPricePoint | null>(null);

  const history = stock.history || [];
  if (history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 text-xs">
        No chart history available
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const strokeColor = isPositive ? '#10b981' : '#ef4444';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';

  // Calculate scales
  const prices = history.map((h) => h.close);
  const minPrice = Math.min(...history.map((h) => h.low));
  const maxPrice = Math.max(...history.map((h) => h.high));
  const priceRange = maxPrice - minPrice || 1;
  const paddingY = priceRange * 0.08;
  const scaledMin = minPrice - paddingY;
  const scaledMax = maxPrice + paddingY;
  const scaledRange = scaledMax - scaledMin;

  const maxVolume = Math.max(...history.map((h) => h.volume)) || 1;

  // Chart dimensions
  const svgWidth = 800;
  const svgHeight = 280;
  const chartHeight = 210;
  const volumeHeight = 50;

  // Build SVG path for Area / Line
  const points = history.map((pt, idx) => {
    const x = (idx / (history.length - 1)) * svgWidth;
    const y = chartHeight - ((pt.close - scaledMin) / scaledRange) * chartHeight;
    return { x, y, pt };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaD = `${pathD} L ${svgWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  const activePoint = hoveredPoint || history[history.length - 1];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight">
              ${activePoint.close.toFixed(2)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
            <span>Open: <strong>${activePoint.open.toFixed(2)}</strong></span>
            <span>High: <strong className="text-emerald-600">${activePoint.high.toFixed(2)}</strong></span>
            <span>Low: <strong className="text-red-600">${activePoint.low.toFixed(2)}</strong></span>
            <span className="hidden sm:inline">Vol: <strong>{activePoint.volume.toLocaleString()}</strong></span>
            <span>Time: <strong className="text-slate-700">{activePoint.time}</strong></span>
          </div>
        </div>

        {/* Controls: Area vs Candle & Timeframe */}
        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setChartType('area')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                chartType === 'area' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Line Area Chart"
            >
              <Activity className="w-3.5 h-3.5 inline mr-1" />
              Line
            </button>
            <button
              onClick={() => setChartType('candle')}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                chartType === 'candle' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Candlestick Chart"
            >
              <BarChart2 className="w-3.5 h-3.5 inline mr-1" />
              Candle
            </button>
          </div>

          {/* Timeframe selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                  timeframe === tf ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full h-[280px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id={`grad-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={chartHeight * ratio}
              x2={svgWidth}
              y2={chartHeight * ratio}
              stroke="#f1f5f9"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Volume baseline divider */}
          <line
            x1="0"
            y1={chartHeight + 10}
            x2={svgWidth}
            y2={chartHeight + 10}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Volume Bars */}
          {history.map((pt, idx) => {
            const x = (idx / (history.length - 1)) * svgWidth;
            const barWidth = Math.max(2, (svgWidth / history.length) * 0.6);
            const vHeight = (pt.volume / maxVolume) * volumeHeight;
            const y = svgHeight - vHeight;
            const isBarGreen = pt.close >= pt.open;

            return (
              <rect
                key={`vol-${idx}`}
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={vHeight}
                fill={isBarGreen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}
              />
            );
          })}

          {/* VIEW A: Line Area Chart */}
          {chartType === 'area' && (
            <>
              <path d={areaD} fill={`url(#grad-${stock.symbol})`} />
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* VIEW B: Candlestick Chart */}
          {chartType === 'candle' && (
            <>
              {history.map((pt, idx) => {
                const x = (idx / (history.length - 1)) * svgWidth;
                const candleWidth = Math.max(3, (svgWidth / history.length) * 0.65);
                const isGreen = pt.close >= pt.open;
                const candleColor = isGreen ? '#10b981' : '#ef4444';

                const highY = chartHeight - ((pt.high - scaledMin) / scaledRange) * chartHeight;
                const lowY = chartHeight - ((pt.low - scaledMin) / scaledRange) * chartHeight;
                const openY = chartHeight - ((pt.open - scaledMin) / scaledRange) * chartHeight;
                const closeY = chartHeight - ((pt.close - scaledMin) / scaledRange) * chartHeight;

                const topBodyY = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(openY - closeY));

                return (
                  <g key={`candle-${idx}`}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={topBodyY}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="0.5"
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Interactive Mouse Hover Targets */}
          {history.map((pt, idx) => {
            const x = (idx / (history.length - 1)) * svgWidth;
            const sliceWidth = svgWidth / history.length;
            return (
              <rect
                key={`target-${idx}`}
                x={x - sliceWidth / 2}
                y={0}
                width={sliceWidth}
                height={svgHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredPoint(pt)}
              />
            );
          })}

          {/* Active Hover Crosshair Line */}
          {hoveredPoint && (
            (() => {
              const idx = history.findIndex((h) => h === hoveredPoint);
              if (idx < 0) return null;
              const x = (idx / (history.length - 1)) * svgWidth;
              const y = chartHeight - ((hoveredPoint.close - scaledMin) / scaledRange) * chartHeight;

              return (
                <g>
                  {/* Vertical Crosshair */}
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={svgHeight}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Horizontal Crosshair */}
                  <line
                    x1={0}
                    y1={y}
                    x2={svgWidth}
                    y2={y}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill={strokeColor}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-ping-once"
                  />
                </g>
              );
            })()
          )}
        </svg>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Real-time Quotes • Nasdaq & NYSE Composite Data
        </span>
        <span className="font-mono text-slate-700 font-medium">
          Market Cap: {stock.marketCap} | P/E: {stock.peRatio > 0 ? stock.peRatio : 'N/A'}
        </span>
      </div>
    </div>
  );
};
