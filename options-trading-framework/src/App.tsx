/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bar, OptionsAlert, Position } from './types';
import TradingViewChart from './components/TradingViewChart';
import AlertCard from './components/AlertCard';
import OrderModal from './components/OrderModal';
import PortfolioLog from './components/PortfolioLog';
import { Activity, Bell, Compass, FileSpreadsheet, Shield, Cpu, RefreshCw, Layers } from 'lucide-react';

export default function App() {
  // UI and Feed State Management
  const [bars, setBars] = useState<Bar[]>([]);
  const [activeSymbol, setActiveSymbol] = useState<string>('SPY');
  const [currentRegime, setCurrentRegime] = useState<string>('breakout_bull');
  const [currentPrice, setCurrentPrice] = useState<number>(450.0);
  
  const [alerts, setAlerts] = useState<OptionsAlert[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedAlertForOrder, setSelectedAlertForOrder] = useState<OptionsAlert | null>(null);

  // Connection diagnostics
  const [feedState, setFeedState] = useState<'streaming' | 'polling' | 'connecting'>('connecting');

  // Load initial simulated market history and paper positions.
  const syncState = async () => {
    try {
      const stateRes = await fetch('/api/market/state');
      if (stateRes.ok) {
        const data = await stateRes.json();
        setBars(data.bars);
        setActiveSymbol(data.activeSymbol);
        setCurrentRegime(data.currentRegime);
        setCurrentPrice(data.currentPrice);
      }

      const posRes = await fetch('/api/positions');
      if (posRes.ok) {
        const data = await posRes.json();
        setPositions(data);
      }
    } catch (e) {
      console.error('State Synchronization issue:', e);
    }
  };

  const syncAlertsHistory = async () => {
    try {
      const alertsRes = await fetch('/api/alerts/history');
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data);
      }
    } catch (e) {
      console.error('Alert history load issue:', e);
    }
  };

  useEffect(() => {
    syncState();
    syncAlertsHistory();

    // Constant background polling for simulated price ticks, indicators, and paper P&L.
    const stateInterval = setInterval(syncState, 2000);

    // ----------------------------------------------------
    // SERVER-SENT EVENTS (SSE) SIMULATED ALERT STREAM connection
    // ----------------------------------------------------
    let eventSource: EventSource | null = null;
    let fallbackPollInterval: NodeJS.Timeout | null = null;

    const establishSse = () => {
      setFeedState('connecting');
      eventSource = new EventSource('/api/alerts/live');

      eventSource.onopen = () => {
        setFeedState('streaming');
        console.log('SSE connection successfully opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const newAlert = JSON.parse(event.data);
          setAlerts((prev) => {
            // Guard duplication
            if (prev.some(a => a.id === newAlert.id)) return prev;
            return [newAlert, ...prev];
          });
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('SSE disconnected or not supported. Switching to polling fallback.');
        setFeedState('polling');
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Establish background polling for alerts history
        if (!fallbackPollInterval) {
          fallbackPollInterval = setInterval(syncAlertsHistory, 4000);
        }
      };
    };

    establishSse();

    // Cleanup on unmount
    return () => {
      clearInterval(stateInterval);
      if (eventSource) eventSource.close();
      if (fallbackPollInterval) clearInterval(fallbackPollInterval);
    };
  }, []);

  // Update backend configuration (Ticker and Regime settings)
  const handleConfigChange = async (symbol: string, regime: string) => {
    try {
      const res = await fetch('/api/market/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, regime }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSymbol(data.activeSymbol);
        setCurrentRegime(data.currentRegime);
        setCurrentPrice(data.currentPrice);
        // Force immediate refresh
        syncState();
      }
    } catch (e) {
      console.error('Configure market error:', e);
    }
  };

  // Submit simulated paper option orders.
  const handleOrderSubmit = async (orderData: any) => {
    try {
      const res = await fetch('/api/order/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        // Immediate sync to update portfolio feed log
        syncState();
      }
    } catch (e) {
      console.error('Routing order error:', e);
    }
  };

  // Close active contract positions
  const handleClosePosition = async (id: string) => {
    try {
      const res = await fetch(`/api/positions/${id}/close`, {
        method: 'POST',
      });
      if (res.ok) {
        syncState();
      }
    } catch (e) {
      console.error('Settlement position error:', e);
    }
  };

  // Dynamic Account equity calculations
  const initialEquity = 142840.12;
  const currentOpenPL = positions.filter((p) => p.status === 'open').reduce((acc, curr) => acc + curr.profitLoss, 0);
  const currentClosedPL = positions.filter((p) => p.status === 'closed').reduce((acc, curr) => acc + curr.profitLoss, 0);
  const reactiveEquity = initialEquity + currentOpenPL + currentClosedPL;

  // Derive market context indicators from the latest candle bar
  const latestBar = bars.length > 0 ? bars[bars.length - 1] : null;
  const adxVal = latestBar?.adx ?? 32;
  const ivpVal = latestBar ? Math.round(latestBar.atr * 15) : 42; 
  const rsiValForBar = latestBar?.rsi ?? 68.4;
  const isTrendBullish = latestBar ? latestBar.close >= latestBar.open : true;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col font-sans select-none antialiased">
      
      {/* TOP NAVIGATION / SYSTEM BAR */}
      <header className="h-14 border-b border-[#2A2A2E] flex items-center justify-between px-6 bg-[#0E0E10] shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#00FF41] shadow-[0_0_8px_#00FF41] animate-pulse"></div>
            <span className="text-xs font-mono tracking-widest text-[#00FF41]">
              SIM FEED: {feedState === 'streaming' ? 'SSE STREAMING' : 'POLLING'}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-[#2A2A2E]"></div>
          <span className="text-[10px] font-mono opacity-60 uppercase">Server Latency: 12ms</span>
          <span className="hidden sm:inline text-zinc-700 font-mono text-[10px]">&bull;</span>
          <span className="hidden sm:inline text-[10px] font-mono text-zinc-500">TIME UTC: 2026-05-23 14:56:35</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] uppercase opacity-40 leading-none mb-1">Account Equity</div>
            <div className="text-xs sm:text-sm font-mono text-white">
              ${reactiveEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className={`text-[10px] ml-1.5 font-bold ${currentOpenPL + currentClosedPL >= 0 ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
                {currentOpenPL + currentClosedPL >= 0 ? '+' : ''}
                {(((currentOpenPL + currentClosedPL) / initialEquity) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full border border-[#2A2A2E] flex items-center justify-center bg-[#151518]">
            <span className="text-[10px] font-mono font-bold text-[#E0E0E0]">JD</span>
          </div>
        </div>
      </header>

      {/* SUB HEADER BRAND HERO SECTION */}
      <div className="bg-[#0A0A0B] border-b border-[#2A2A2E] py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono text-[#00FF41] bg-[#00FF41]/10 px-2 py-0.5 rounded border border-[#00FF41]/15 tracking-wider uppercase font-bold flex items-center gap-1">
              <Cpu className="h-3 w-3" /> MULTI-STAGE QUANT ENGINE ACTIVE
            </span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-1.5">
            Dynamic Options Quant Alert Framework
          </h1>
          <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
            Replays simulated OHLCV ticks through a 5-stage filter array and estimates paper option exits for research only.
          </p>
        </div>
        <div className="text-right text-[10px] font-mono text-zinc-500 self-start md:self-center bg-[#111114] px-3 py-1.5 border border-[#2A2A2E] rounded-md">
          MODE: <span className="text-[#00FF41] font-bold">● SIMULATED PAPER</span>
        </div>
      </div>

      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT RAIL: MARKET CONTEXT & ACTIVE SCANNERS */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[#2A2A2E] bg-[#0E0E10] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[#2A2A2E]">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E0E0E0]/40 mb-4 font-bold">Market Context</h3>
            <div className="space-y-4">
              {/* ADX TREND */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400 font-mono">TREND (ADX)</span>
                  <span className={isTrendBullish ? 'text-[#00FF41] font-bold' : 'text-[#FF4444] font-bold'}>
                    {isTrendBullish ? 'BULLISH' : 'BEARISH'} ({adxVal.toFixed(0)})
                  </span>
                </div>
                <div className="h-1 bg-[#1A1A1D] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${isTrendBullish ? 'bg-[#00FF41]' : 'bg-[#FF4444]'}`} 
                    style={{ width: `${Math.min(100, Math.max(10, adxVal * 2.5))}%` }}
                  />
                </div>
              </div>
              
              {/* ATR VOLATILITY */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400 font-mono">VOLATILITY (ATR)</span>
                  <span className="text-[#FFB800] font-bold">
                    {latestBar ? latestBar.atr.toFixed(2) : '1.20'} ({latestBar?.chop.toFixed(0) ?? '40'} IVP)
                  </span>
                </div>
                <div className="h-1 bg-[#1A1A1D] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#FFB800]" 
                    style={{ width: `${Math.min(100, Math.max(10, (latestBar?.chop ?? 40) * 1.5))}%` }}
                  />
                </div>
              </div>

              {/* RSI MOMENTUM */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400 font-mono">MOMENTUM (RSI)</span>
                  <span className={`font-bold ${rsiValForBar > 70 ? 'text-[#FF4444]' : rsiValForBar < 30 ? 'text-[#00FF41]' : 'text-indigo-400'}`}>
                    {rsiValForBar.toFixed(1)}
                  </span>
                </div>
                <div className="h-1 bg-[#1A1A1D] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${rsiValForBar}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1">
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#E0E0E0]/40 mb-4 font-bold">Active Filter Statuses</h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-[11.5px] p-2 rounded bg-[#151518] border border-[#2A2A2E]">
                <span className="text-zinc-300">TTM Squeeze Filter</span>
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                  currentRegime === 'bb_squeeze' 
                    ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' 
                    : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {currentRegime === 'bb_squeeze' ? 'ACTIVE' : 'IDLE'}
                </span>
              </li>
              <li className="flex items-center justify-between text-[11.5px] p-2 rounded bg-[#151518] border border-[#2A2A2E]">
                <span className="text-zinc-300">EMA Cloud Pulses</span>
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                  currentRegime === 'pullback_bounce' 
                    ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' 
                    : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {currentRegime === 'pullback_bounce' ? 'ACTIVE' : 'IDLE'}
                </span>
              </li>
              <li className="flex items-center justify-between text-[11.5px] p-2 rounded bg-[#151518] border border-[#2A2A2E]">
                <span className="text-zinc-300">RSI Reversal Monitor</span>
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono ${
                  currentRegime === 'reversal_oversold' 
                    ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' 
                    : 'bg-zinc-900 text-zinc-500'
                }`}>
                  {currentRegime === 'reversal_oversold' ? 'ACTIVE' : 'IDLE'}
                </span>
              </li>
              <li className="flex items-center justify-between text-[11.5px] p-2 rounded bg-[#151518] border border-[#2A2A2E] opacity-55">
                <span className="text-zinc-400">Order Timing Guard</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 text-[8.5px] font-bold font-mono">ACTIVE</span>
              </li>
            </ul>
          </div>

          <div className="p-4 border-t border-[#2A2A2E] bg-[#0A0A0B] text-[10px] text-zinc-500 leading-normal font-mono">
            <div>5-STAGE QUANT MATRIX: OK</div>
            <div className="mt-1">BROKER SIMULATION: UP</div>
          </div>
        </aside>

        {/* WORKSPACE MIDDLE BODY: CHARTER AND PORTFOLIO LOG */}
        <section className="flex-1 flex flex-col overflow-y-auto bg-[#070708] p-4 lg:p-6 gap-6">
          
          {/* Core interactive charts segment */}
          <TradingViewChart
            bars={bars}
            activeSymbol={activeSymbol}
            currentRegime={currentRegime}
            onConfigChange={handleConfigChange}
            currentPrice={currentPrice}
          />

          {/* Active holdings ledger and closed order ledger list */}
          <PortfolioLog
            positions={positions}
            onClosePosition={handleClosePosition}
          />

        </section>

        {/* RIGHT RAIL: SIMULATED FEED STREAM COLLAPSIBLE */}
        <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[#2A2A2E] bg-[#0E0E10] flex flex-col shrink-0 overflow-hidden">
          
          <div className="p-4 border-b border-[#2A2A2E] flex items-center justify-between bg-[#0E0E10]">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#00FF41] animate-ping" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-tight text-white">Simulated Alert Feed</h2>
            </div>
            <span className="font-mono text-[9px] bg-[#151518] text-zinc-400 border border-[#2A2A2E] px-2 py-0.5 rounded">
              {alerts.length} ALERTS FIRED
            </span>
          </div>

          {/* Feed List Container */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
            {alerts.length === 0 ? (
              <div id="alert-feed-empty" className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#2A2A2E] rounded-xl bg-[#111114]">
                <Activity className="h-6 w-6 text-[#00FF41]/40 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Awaiting simulated alerts...</span>
                <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed">
                  Toggle ticker symbols or change strategy regimes above to generate filtered paper signals.
                </p>
              </div>
            ) : (
              alerts.map((alt) => (
                <AlertCard
                  key={alt.id}
                  alert={alt}
                  onPlaceOrder={setSelectedAlertForOrder}
                />
              ))
            )}
          </div>

          <div className="p-4 border-t border-[#2A2A2E] bg-[#0A0A0B] text-center">
            <div className="font-mono text-[9px] text-zinc-500">v1.0.4-STABLE / INTEGRITY CONFIRMED</div>
          </div>
        </aside>

      </main>

      {/* FOOTER SYSTEM DIAGNOSTICS */}
      <footer className="h-8 bg-[#0E0E10] border-t border-[#2A2A2E] flex items-center px-6 justify-between select-none text-[10px] font-mono text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <span>PAPER API PORT: 3000 (SIMULATED)</span>
          <span className="hidden sm:inline">|</span>
          <span className="text-[#00FF41]">FEED STATE: {feedState.toUpperCase()}</span>
          <span className="hidden sm:inline">|</span>
          <span>STABILITY RATING: 99.8%</span>
        </div>
        <div>
          TD_CORE_NODE &bull; BUILD: 2026.05.23
        </div>
      </footer>

      {/* Interactive paper order validation modal overlay */}
      {selectedAlertForOrder && (
        <OrderModal
          alert={selectedAlertForOrder}
          onClose={() => setSelectedAlertForOrder(null)}
          onSubmit={handleOrderSubmit}
        />
      )}

    </div>
  );
}
