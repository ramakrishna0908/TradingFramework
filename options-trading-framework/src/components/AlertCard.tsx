/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OptionsAlert } from '../types';
import { AlertCircle, ArrowUpRight, ArrowDownRight, Compass, Shield, Award, Sparkles, HelpCircle } from 'lucide-react';

interface AlertCardProps {
  key?: string;
  alert: OptionsAlert;
  onPlaceOrder: (alert: OptionsAlert) => void;
}

export default function AlertCard({ alert, onPlaceOrder }: AlertCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isBullish = alert.direction === 'call';

  // Format standard premium values
  const stopLossPercent = Math.round(((alert.suggestedPremium - alert.stopLoss) / alert.suggestedPremium) * 100);
  const targetPercent = Math.round(((alert.profitTarget - alert.suggestedPremium) / alert.suggestedPremium) * 100);

  return (
    <div
      id={`alert-card-${alert.id}`}
      className={`bg-[#111114] border-l-4 border-y border-r border-[#2A2A2E] p-4 flex flex-col gap-3.5 relative overflow-hidden group rounded-md shadow-lg ${
        isBullish ? 'border-l-[#00FF41]' : 'border-l-[#FF4444]'
      }`}
    >
      {/* Small subtle code tag label in corner */}
      <div className="absolute top-2 right-2 text-[8px] font-mono opacity-20 text-zinc-400">
        #AX-{alert.id.slice(0, 4).toUpperCase()}
      </div>

      {/* Symbol & Direction badge Header row */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold font-mono tracking-tight text-white">{alert.symbol}</span>
            <span className={`text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
              alert.eventType === 'Breakout' ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/15' :
              alert.eventType === 'Reversal' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/15' :
              'bg-fuchsia-400/10 text-fuchsia-400 border border-fuchsia-400/15'
            }`}>
              {alert.eventType}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">
            Suggested: <span className="text-white font-medium">{alert.suggestedStrategy}</span> &bull; Exp: <span className="text-white">{alert.suggestedExpiry}</span>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-mono font-bold ${isBullish ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
            ${alert.suggestedPremium.toFixed(2)}
          </div>
          <div className="text-[9px] opacity-40 uppercase tracking-wider">Current Premium</div>
        </div>
      </div>

      {/* Option details block */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-3 py-2.5 my-0.5 border-y border-[#2A2A2E] text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="opacity-40 uppercase">Underlying:</span>
          <span className="text-zinc-200 font-medium">${alert.entryPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase">IV Rank:</span>
          <span className="text-zinc-200 font-medium">{alert.ivRank}%</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase">Bid/Ask:</span>
          <span className="text-zinc-200 font-medium">${alert.bidAskSpread.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase">Chop Ind:</span>
          <span className="text-zinc-200 font-medium">{alert.chopIndex}</span>
        </div>
      </div>

      {/* Exit targets & Greece calculator */}
      <div className="bg-[#151518] p-3 rounded border border-[#2A2A2E] relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono tracking-widest text-[#00FF41] font-bold flex items-center gap-1">
            <Shield className="h-3 w-3 shrink-0" /> TRADING EXIT PLAN
          </span>
          <div 
            onMouseEnter={() => setShowTooltip(true)} 
            onMouseLeave={() => setShowTooltip(false)}
            className="relative cursor-help text-zinc-500 hover:text-[#00FF41] transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            {showTooltip && (
              <div id="greek-math-tooltip" className="absolute bottom-full right-0 mb-2 w-60 bg-[#111114] border border-[#2A2A2E] shadow-2xl rounded-md p-3 z-30 pointer-events-none">
                <div className="font-mono text-[10px] font-bold text-[#00FF41] mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#00FF41] animate-pulse" /> Delta exit conversion math
                </div>
                <p className="font-sans text-[10px] text-zinc-400 leading-relaxed mb-1">
                  Underlying stock triggers are mapped mathematically into option premiums using dynamic Greeks.
                </p>
                <div className="font-mono text-[9px] text-zinc-300 bg-zinc-900 px-1 py-0.5 rounded mt-1 text-center">
                  Option value = Prem &plusmn; (&Delta; * &Delta;Stock)
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#111114] border border-[#2A2A2E] p-2 rounded">
            <span className="text-[8px] text-zinc-500 block">TAKE PROFIT</span>
            <span className="text-[#00FF41] text-xs font-bold flex items-center mt-0.5">
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5 shrink-0" />
              ${alert.profitTarget.toFixed(2)}
            </span>
            <span className="text-[8.5px] text-[#00FF41]/60 block mt-0.5">+{targetPercent}% Gain</span>
          </div>

          <div className="bg-[#111114] border border-[#2A2A2E] p-2 rounded">
            <span className="text-[8px] text-zinc-500 block">STOP LOSS</span>
            <span className="text-[#FF4444] text-xs font-bold flex items-center mt-0.5">
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5 shrink-0" />
              ${alert.stopLoss.toFixed(2)}
            </span>
            <span className="text-[8.5px] text-[#FF4444]/60 block mt-0.5">-{stopLossPercent}% Risk</span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-zinc-400 border-t border-[#2A2A2E]/50 pt-2">
          <span>Risk/Reward Factor:</span>
          <span className="text-[#00FF41] font-bold">1:{alert.riskReward}</span>
        </div>
      </div>

      {/* PLACE ORDER TRIGGER */}
      <button
        id={`place-order-btn-${alert.id}`}
        onClick={() => onPlaceOrder(alert)}
        className={`w-full font-mono text-xs font-bold py-2 px-3 rounded uppercase tracking-tighter cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
          isBullish 
            ? 'bg-[#00FF41] hover:bg-[#00E039] text-black shadow-md' 
            : 'bg-[#FF4444] hover:bg-[#E03939] text-white shadow-md'
        }`}
      >
        <Compass className={`h-3.5 w-3.5 ${isBullish ? 'animate-bounce' : 'animate-spin'}`} style={{ animationDuration: '3s' }} />
        Place Simulated Order
      </button>
    </div>
  );
}
