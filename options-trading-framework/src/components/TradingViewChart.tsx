/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Bar } from '../types';
import { TrendingUp, RefreshCw, Zap, Sliders, Globe } from 'lucide-react';

interface ChartProps {
  bars: Bar[];
  activeSymbol: string;
  currentRegime: string;
  onConfigChange: (symbol: string, regime: string) => void;
  currentPrice: number;
}

export default function TradingViewChart({
  bars,
  activeSymbol,
  currentRegime,
  onConfigChange,
  currentPrice,
}: ChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0);

  // Redraw when resized for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setKey((prev) => prev + 1);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (bars.length === 0) {
    return (
      <div id="chart-loading" className="h-[450px] flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 rounded-xl">
        <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
        <span className="font-mono text-xs text-zinc-400">LOADING SIMULATED MARKET DATA...</span>
      </div>
    );
  }

  // Find Min / Max bounds for layout
  const pad = 1.01;
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const ema9s = bars.map(b => b.ema9 || b.close);
  const ema21s = bars.map(b => b.ema21 || b.close);
  const vwaps = bars.map(b => b.vwap || b.close);
  const bbUppers = bars.map(b => b.bbUpper || b.close);
  const bbLowers = bars.map(b => b.bbLower || b.close);

  const highestPrice = Math.max(...highs, ...bbUppers, ...vwaps, ...ema9s, ...ema21s) * (1 + 0.002);
  const lowestPrice = Math.min(...lows, ...bbLowers, ...vwaps, ...ema9s, ...ema21s) * (1 - 0.002);
  const priceRange = highestPrice - lowestPrice;

  // Chart layout dimensions
  const width = 800;
  const paddingLeft = 14;
  const paddingRight = 70;
  const paddingTop = 25;
  const mainChartHeight = 250;
  const secondaryChartHeight = 90;
  const gap = 30;
  const totalHeight = paddingTop + mainChartHeight + gap + secondaryChartHeight + 25;

  // Render scaling functions
  const getX = (index: number) => {
    const space = width - paddingLeft - paddingRight;
    const step = space / (bars.length - 1 || 1);
    return paddingLeft + index * step;
  };

  const getY = (price: number) => {
    const ratio = (price - lowestPrice) / (priceRange || 1);
    return paddingTop + mainChartHeight - ratio * mainChartHeight;
  };

  const getRsiY = (rsiVal: number) => {
    const startY = paddingTop + mainChartHeight + gap;
    const ratio = rsiVal / 100;
    return startY + secondaryChartHeight - ratio * secondaryChartHeight;
  };

  const activeBar = hoverIndex !== null ? bars[hoverIndex] : bars[bars.length - 1];

  // Draw line paths
  const createPath = (values: number[], scalarY: (v: number) => number) => {
    return values
      .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${scalarY(val).toFixed(1)}`)
      .join(' ');
  };

  // Draw Bollinger shaded area
  const createShadedArea = () => {
    const topPoints = bbUppers.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`);
    const bottomPoints = bbLowers.map((v, i) => `${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).reverse();
    return `M ${topPoints.join(' L ')} L ${bottomPoints.join(' L ')} Z`;
  };

  const tickers = ['SPY', 'QQQ', 'TSLA', 'NVDA', 'AAPL'];
  const regimes = [
    { id: 'breakout_bull', name: 'Bull Breakout ↗' },
    { id: 'reversal_oversold', name: 'Oversold RSI Reversal ⚡' },
    { id: 'bb_squeeze', name: 'Bollinger Band Squeeze ↔' },
    { id: 'pullback_bounce', name: 'EMA Pullback Bounce ⤵' },
    { id: 'choppy_drift', name: 'Choppy Side-market ░' }
  ];

  return (
    <div id="tradingview-visualizer" ref={containerRef} className="bg-[#0E0E10] border border-[#2A2A2E] rounded-md p-5 shadow-2xl relative overflow-hidden transition-all duration-300">
      
      {/* Decorative Left Cyber Highlight Line */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF41]/20" />

      {/* Header Info Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2A2A2E] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-2 w-2 rounded-full bg-[#00FF41] animate-pulse" />
            <span className="font-mono text-[9px] tracking-widest text-[#00FF41] bg-[#00FF41]/10 px-2 py-0.5 rounded border border-[#00FF41]/15 leading-none font-bold uppercase">
              SIMULATED MARKET STREAM
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-sans tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-[#00FF41]" />
            {activeSymbol} Interactive Chart Core
            <span className="text-xs font-mono font-normal text-zinc-400 ml-1 bg-zinc-900 border border-[#2A2A2E] px-1.5 py-0.5 rounded">
              ${currentPrice.toFixed(2)}
            </span>
          </h2>
        </div>

        {/* Configuration Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tickers */}
          <div className="flex bg-[#111114] p-0.5 rounded border border-[#2A2A2E]">
            {tickers.map((t) => (
              <button
                id={`ticker-toggle-${t}`}
                key={t}
                onClick={() => onConfigChange(t, currentRegime)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all duration-150 cursor-pointer ${
                  activeSymbol === t
                    ? 'bg-[#00FF41] text-black font-bold shadow-md'
                    : 'text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Regime Select dropdown */}
          <div className="relative">
            <select
              id="regime-select"
              value={currentRegime}
              onChange={(e) => onConfigChange(activeSymbol, e.target.value)}
              className="bg-[#111114] text-xs font-mono text-zinc-200 pl-3 pr-8 py-1.5 rounded border border-[#2A2A2E] focus:outline-none focus:border-[#00FF41] cursor-pointer appearance-none"
            >
              {regimes.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-zinc-500">
              <Sliders className="h-3 w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Simulated telemetry bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#111114] p-3 rounded border border-[#2A2A2E] mb-4 text-xs font-mono">
        <div>
          <div className="text-zinc-500 text-[10px]">LATEST CLOSE (OHLC)</div>
          <div className="text-white font-bold leading-normal mt-0.5">
            {activeBar ? `$${activeBar.close.toFixed(2)}` : '--'}
          </div>
          <div className="text-[9px] text-zinc-500">
            H: {activeBar ? activeBar.high.toFixed(2) : '--'} &middot; L: {activeBar ? activeBar.low.toFixed(2) : '--'}
          </div>
        </div>
        <div>
          <div className="text-zinc-500 text-[10px]">9 EMA / 21 EMA</div>
          <div className="text-zinc-300 leading-normal mt-0.5 font-medium">
            <span className="text-sky-400">{activeBar?.ema9?.toFixed(2) ?? '--'}</span>
            <span className="text-zinc-700 mx-1">/</span>
            <span className="text-amber-500">{activeBar?.ema21?.toFixed(2) ?? '--'}</span>
          </div>
        </div>
        <div>
          <div className="text-zinc-500 text-[10px]">VWAP IND</div>
          <div className="text-[#00FF41] font-semibold leading-normal mt-0.5">{activeBar?.vwap?.toFixed(2) ?? '--'}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[10px]">RSI (14) OSC</div>
          <div className={`font-semibold leading-normal mt-0.5 ${
            (activeBar?.rsi ?? 50) > 70 ? 'text-[#FF4444]' : (activeBar?.rsi ?? 50) < 30 ? 'text-[#00FF41]' : 'text-purple-400'
          }`}>
            {activeBar?.rsi?.toFixed(1) ?? '--'}
            <span className="text-[9px] text-zinc-500 ml-1">
              {(activeBar?.rsi ?? 50) > 70 ? 'OB' : (activeBar?.rsi ?? 50) < 30 ? 'OS' : 'MID'}
            </span>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-zinc-500 text-[10px]">CHOP / ATR RATIO</div>
          <div className="text-[#FFB800] leading-normal mt-0.5">{activeBar?.chop?.toFixed(1) ?? '--'} &middot; <span className="text-[#E0E0E0]">{activeBar?.atr?.toFixed(2) ?? '--'}</span></div>
        </div>
      </div>

      {/* SVG Canvas Charting Widget */}
      <div className="relative">
        <svg
          id="mcp-tradingview-svg"
          key={key}
          viewBox={`0 0 ${width} ${totalHeight}`}
          className="w-full h-auto select-none bg-[#070708] border border-[#2A2A2E] rounded"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clientX = e.clientX - rect.left;
            const percentageX = clientX / rect.width;
            const svgX = percentageX * width;
            
            // Find closest index
            const space = width - paddingLeft - paddingRight;
            const step = space / (bars.length - 1 || 1);
            const index = Math.round((svgX - paddingLeft) / step);
            
            if (index >= 0 && index < bars.length) {
              setHoverIndex(index);
            }
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
            const h = paddingTop + mainChartHeight * ratio;
            return (
              <line
                key={`grid-h-${idx}`}
                x1={paddingLeft}
                y1={h}
                x2={width - paddingRight}
                y2={h}
                stroke="#1B1B1E"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}

          {/* Dotted RSI bounds */}
          <line
            x1={paddingLeft}
            y1={getRsiY(70)}
            x2={width - paddingRight}
            y2={getRsiY(70)}
            stroke="#FF4444"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.5"
          />
          <line
            x1={paddingLeft}
            y1={getRsiY(30)}
            x2={width - paddingRight}
            y2={getRsiY(30)}
            stroke="#00FF41"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.5"
          />

          {/* Vertical Grid lines */}
          {bars.filter((_, i) => i % 10 === 0).map((_, i) => {
            const idx = i * 10;
            return (
              <line
                key={`grid-v-${idx}`}
                x1={getX(idx)}
                y1={paddingTop}
                x2={getX(idx)}
                y2={totalHeight - 20}
                stroke="#1B1B1E"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}

          {/* Bollinger Band Shading Area */}
          <path
            d={createShadedArea()}
            fill="rgba(0, 255, 65, 0.025)"
            stroke="none"
          />

          {/* Bollinger Bands Upper / Lower lines */}
          <path
            d={createPath(bbUppers, getY)}
            fill="none"
            stroke="rgba(0, 255, 65, 0.15)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <path
            d={createPath(bbLowers, getY)}
            fill="none"
            stroke="rgba(0, 255, 65, 0.15)"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {/* EMA 9 Line (Blue) */}
          <path
            d={createPath(ema9s, getY)}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* EMA 21 Line (Orange) */}
          <path
            d={createPath(ema21s, getY)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* VWAP Line (Green Overlay) */}
          <path
            d={createPath(vwaps, getY)}
            fill="none"
            stroke="#00FF41"
            strokeWidth="1.8"
            opacity="0.9"
          />

          {/* Candlesticks & Volume bar overlay */}
          {bars.map((bar, idx) => {
            const x = getX(idx);
            const isBullish = bar.close >= bar.open;
            const wickColor = isBullish ? '#00FF41' : '#FF4444';
            const bodyColor = isBullish ? 'rgba(0, 255, 65, 0.45)' : 'rgba(255, 68, 68, 0.45)';
            const yOpen = getY(bar.open);
            const yClose = getY(bar.close);
            const yHigh = getY(bar.high);
            const yLow = getY(bar.low);
            
            // Width adaptiveness
            const barWidth = Math.max(3, (width - paddingLeft - paddingRight) / bars.length * 0.6);

            return (
              <g key={`candle-${idx}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={wickColor}
                  strokeWidth="1"
                />
                {/* Body */}
                <rect
                  x={x - barWidth / 2}
                  y={Math.min(yOpen, yClose)}
                  width={barWidth}
                  height={Math.max(1.5, Math.abs(yOpen - yClose))}
                  fill={bodyColor}
                  stroke={wickColor}
                  strokeWidth="0.8"
                />
              </g>
            );
          })}

          {/* SECOND PANEL: RSI/CHOP */}
          {/* Shaded RSI mid range (30-70) */}
          <rect
            x={paddingLeft}
            y={getRsiY(70)}
            width={width - paddingRight - paddingLeft}
            height={getRsiY(30) - getRsiY(70)}
            fill="rgba(0, 255, 65, 0.005)"
            stroke="none"
          />

          {/* RSI Indicator Line */}
          <path
            d={createPath(bars.map(b => b.rsi ?? 50), getRsiY)}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="1.8"
          />

          {/* Chop index line */}
          <path
            d={createPath(bars.map(b => b.chop ?? 40), getRsiY)}
            fill="none"
            stroke="#FFB800"
            strokeWidth="1.2"
            strokeDasharray="3 2"
            opacity="0.8"
          />

          {/* Horizontal Watermark labels */}
          {/* Main Price scale */}
          <text x={width - paddingRight + 5} y={getY(highestPrice)} fill="#71717a" fontSize="8" fontFamily="monospace">
            ${highestPrice.toFixed(1)}
          </text>
          <text x={width - paddingRight + 5} y={getY(lowestPrice)} fill="#71717a" fontSize="8" fontFamily="monospace">
            ${lowestPrice.toFixed(1)}
          </text>
          <text x={width - paddingRight + 5} y={getY((highestPrice + lowestPrice) / 2)} fill="#52525b" fontSize="8" fontFamily="monospace">
            ${((highestPrice + lowestPrice) / 2).toFixed(1)}
          </text>

          {/* RSI / CHOP markings */}
          <text x={width - paddingRight + 5} y={getRsiY(70) + 3} fill="#FF4444" fontSize="7" fontFamily="monospace" opacity="0.9" fontWeight="bold">
            70 OB
          </text>
          <text x={width - paddingRight + 5} y={getRsiY(30) + 3} fill="#00FF41" fontSize="7" fontFamily="monospace" opacity="0.9" fontWeight="bold">
            30 OS
          </text>
          <text x={width - paddingRight + 5} y={getRsiY(50) + 3} fill="#52525b" fontSize="7" fontFamily="monospace">
            RSI Line
          </text>

          {/* Simulated price line (Y-right overlay) */}
          <line
            x1={paddingLeft}
            y1={getY(currentPrice)}
            x2={width - paddingRight}
            y2={getY(currentPrice)}
            stroke="#d8b4fe"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          <text x={width - paddingRight + 5} y={getY(currentPrice) + 3} fill="#d8b4fe" fontSize="8" fontFamily="monospace" fontWeight="600">
            ▶ ${currentPrice.toFixed(2)}
          </text>

          {/* Hover crosshair track overlay */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop - 10}
                x2={getX(hoverIndex)}
                y2={totalHeight - 15}
                stroke="#00FF41"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.7"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(bars[hoverIndex].close)}
                r="4.5"
                fill="#00FF41"
                stroke="#ffffff"
                strokeWidth="1"
              />
              {/* Background badge for hovered time */}
              <rect
                x={getX(hoverIndex) - 25}
                y={totalHeight - 14}
                width="50"
                height="12"
                rx="2"
                fill="#151518"
                stroke="#2A2A2E"
                strokeWidth="0.5"
              />
              <text
                x={getX(hoverIndex)}
                y={totalHeight - 5}
                fill="#E0E0E0"
                fontSize="7.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {bars[hoverIndex].time}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-1.5 left-3 flex flex-wrap gap-4 text-[10px] font-mono text-zinc-500 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-blue-500 inline-block" /> 9 EMA
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" /> 21 EMA
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#00FF41] inline-block" /> VWAP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-2 bg-emerald-500/5 border border-dotted border-[#00FF41]/20 inline-block" /> Bollinger BB
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#a78bfa] inline-block" /> RSI (14)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#FFB800] inline-block" /> Chop Index
          </span>
        </div>
      </div>
    </div>
  );
}
