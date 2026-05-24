/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OptionsAlert } from '../types';
import { X, Send, CreditCard, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

interface OrderModalProps {
  alert: OptionsAlert | null;
  onClose: () => void;
  onSubmit: (orderData: {
    symbol: string;
    side: 'buy' | 'sell';
    strategy: string;
    strike: string;
    expiry: string;
    premium: number;
    quantity: number;
    stopLoss: number;
    profitTarget: number;
  }) => void;
}

export default function OrderModal({ alert, onClose, onSubmit }: OrderModalProps) {
  const [qty, setQty] = useState<number>(1);
  const [customStop, setCustomStop] = useState<number>(alert ? alert.stopLoss : 1.0);
  const [customTarget, setCustomTarget] = useState<number>(alert ? alert.profitTarget : 3.0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Sync state if warning alert transitions occur
  React.useEffect(() => {
    if (alert) {
      setCustomStop(alert.stopLoss);
      setCustomTarget(alert.profitTarget);
    }
  }, [alert]);

  if (!alert) return null;

  const totalCost = parseFloat((alert.suggestedPremium * qty * 100).toFixed(2));
  const maxRisk = parseFloat(((alert.suggestedPremium - customStop) * qty * 100).toFixed(2));
  const maxReward = parseFloat(((customTarget - alert.suggestedPremium) * qty * 100).toFixed(2));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      onSubmit({
        symbol: alert.symbol,
        side: 'buy',
        strategy: alert.suggestedStrategy,
        strike: alert.suggestedStrike,
        expiry: alert.suggestedExpiry,
        premium: alert.suggestedPremium,
        quantity: qty,
        stopLoss: customStop,
        profitTarget: customTarget,
      });
      setSubmitting(false);
      onClose();
    }, 800);
  };

  return (
    <div id="order-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div id="order-ticket-container" className="relative w-full max-w-lg bg-[#0E0E10] border border-[#2A2A2E] rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Banner highlight */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2E] bg-[#111114]">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-[#00FF41]" />
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white">Paper Options Order Ticket</h3>
          </div>
          <button
            id="close-order-modal"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5">
          <div className="space-y-4">
            
            {/* Underlying Ticker Card */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-[#111114] rounded border border-[#2A2A2E] font-mono text-center">
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">TICKER</div>
                <div className="text-sm font-bold text-white mt-0.5">{alert.symbol}</div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">STRIKE CONTRACT</div>
                <div className="text-sm font-bold text-[#00FF41] mt-0.5">${alert.suggestedStrike}</div>
              </div>
              <div>
                <div className="text-[9px] text-zinc-500 uppercase">SUGGESTED OPTION</div>
                <div className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-0.5 leading-none ${alert.direction === 'call' ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' : 'bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20'}`}>
                  {alert.suggestedStrategy}
                </div>
              </div>
            </div>

            {/* Paper mode indicator */}
            <div className="flex items-center justify-between p-2.5 bg-[#111114] border border-[#2A2A2E] rounded">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00FF41]" />
                <span className="font-mono text-xs text-zinc-350">Paper-only simulated order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#00FF41] font-bold">PAPER</span>
                <button
                  type="button"
                  disabled
                  aria-label="Paper trading mode is always enabled"
                  className="w-10 h-5.5 rounded-full p-0.5 bg-[#00FF41] opacity-90 cursor-not-allowed"
                >
                  <div className="w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-250 translate-x-4.5 bg-white" />
                </button>
              </div>
            </div>

            {/* Inputs Matrix */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Contract Lots (Qty)</label>
                <input
                  id="order-qty-input"
                  type="number"
                  min="1"
                  max="100"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-[#111114] border border-[#2A2A2E] rounded p-2 font-mono text-white focus:outline-none focus:border-[#00FF41] text-xs"
                  required
                />
                <span className="text-[8.5px] font-mono text-zinc-550 mt-1 block">1 contracts slot = 100 shares leverage</span>
              </div>

              {/* Option Entry Premium */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">Entry Limit Premium</label>
                <div className="w-full bg-[#111114]/50 border border-[#2A2A2E] rounded p-2 font-mono text-zinc-450 text-xs cursor-not-allowed">
                  ${alert.suggestedPremium.toFixed(2)}
                </div>
                <span className="text-[8.5px] font-mono text-zinc-550 mt-1 block">Estimated from simulated option model</span>
              </div>
            </div>

            {/* Stop Loss & Profit Target Overrides */}
            <div className="grid grid-cols-2 gap-4 pt-3.5 border-t border-[#2A2A2E]">
              {/* Stop Loss custom input */}
              <div>
                <label className="block text-[9px] font-mono text-[#FF4444] uppercase mb-1 flex items-center justify-between font-bold">
                  <span>STOP LOSS LIMIT</span>
                  <span className="text-zinc-500 font-normal">Original: ${alert.stopLoss.toFixed(2)}</span>
                </label>
                <input
                  id="order-stop-input"
                  type="number"
                  step="0.05"
                  min="0.05"
                  max={alert.suggestedPremium - 0.05}
                  value={customStop}
                  onChange={(e) => setCustomStop(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-[#111114] border border-[#2A2A2E] rounded p-2 font-mono text-white focus:outline-none focus:border-[#FF4444] text-xs"
                  required
                />
              </div>

              {/* Profit Target custom input */}
              <div>
                <label className="block text-[9px] font-mono text-[#00FF41] uppercase mb-1 flex items-center justify-between font-bold">
                  <span>PROFIT TARGET LIMIT</span>
                  <span className="text-zinc-500 font-normal">Original: ${alert.profitTarget.toFixed(2)}</span>
                </label>
                <input
                  id="order-profit-input"
                  type="number"
                  step="0.05"
                  min={alert.suggestedPremium + 0.05}
                  value={customTarget}
                  onChange={(e) => setCustomTarget(parseFloat(e.target.value) || 0.1)}
                  className="w-full bg-[#111114] border border-[#2A2A2E] rounded p-2 font-mono text-white focus:outline-none focus:border-[#00FF41] text-xs"
                  required
                />
              </div>
            </div>

            {/* Financial Calculations Details Card */}
            <div className="bg-[#111114] p-4 rounded border border-[#2A2A2E] text-xs font-mono">
              <span className="text-[9px] text-zinc-500 font-bold uppercase block mb-2.5">risk management projections</span>
              
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-zinc-350">
                  <span>Premium Collateral (lots * qty * 100):</span>
                  <span className="font-semibold text-white">${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[#FF4444]">
                  <span>Max Outflow Risk (loss triggered at S/L):</span>
                  <span className="font-bold">-${maxRisk.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[#00FF41]">
                  <span>Potential Profit Return (gain at target):</span>
                  <span className="font-bold">+${maxReward.toLocaleString()}</span>
                </div>
                
                <div className="mt-3.5 flex items-start gap-2 bg-amber-950/20 border border-[#FFB800]/25 p-2.5 rounded text-[10px] font-sans text-amber-200">
                  <AlertTriangle className="h-4 w-4 text-[#FFB800] shrink-0" />
                  <span>Paper simulation only. No broker connection, live route, or real fund exposure is implemented.</span>
                </div>
              </div>
            </div>

          </div>

          {/* Action buttons footer */}
          <div className="mt-6 flex justify-end gap-3 border-t border-[#2A2A2E] pt-4">
            <button
              id="cancel-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-white rounded border border-[#2A2A2E] hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-modal-btn"
              type="submit"
              disabled={submitting}
              className="bg-[#00FF41] hover:bg-[#00E039] disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed text-black text-xs font-mono font-extrabold py-2 px-5 rounded flex items-center gap-1.5 cursor-pointer transition-all duration-150"
            >
              {submitting ? (
                <>
                  <div className="h-3 w-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1" />
                  RECORDING PAPER ORDER...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  PLACE PAPER ORDER
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
