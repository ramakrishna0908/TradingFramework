/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Position } from '../types';
import { History, LayoutGrid, XCircle, TrendingUp, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PortfolioLogProps {
  positions: Position[];
  onClosePosition: (id: string) => void;
}

export default function PortfolioLog({ positions, onClosePosition }: PortfolioLogProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');

  const openPositions = positions.filter((p) => p.status === 'open');
  const closedPositions = positions.filter((p) => p.status === 'closed');

  // Compute portfolio metrics
  const totalOpenPl = openPositions.reduce((acc, curr) => acc + curr.profitLoss, 0);
  const totalClosedPl = closedPositions.reduce((acc, curr) => acc + curr.profitLoss, 0);
  const totalWinCount = closedPositions.filter((p) => p.profitLoss > 0).length;
  const totalTrades = closedPositions.length;
  const winRate = totalTrades > 0 ? Math.round((totalWinCount / totalTrades) * 100) : 0;

  return (
    <div id="portfolio-dashboard" className="bg-[#0E0E10] border border-[#2A2A2E] rounded-md p-5 shadow-2xl transition-all duration-300">
      
      {/* Portfolio Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded bg-[#111114] border border-[#2A2A2E] mb-6">
        <div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Unrealized Paper P&L
          </div>
          <div className={`text-base font-bold font-mono mt-1 ${totalOpenPl >= 0 ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
            {totalOpenPl >= 0 ? '+' : ''}${totalOpenPl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Realized Paper Returns
          </div>
          <div className={`text-base font-bold font-mono mt-1 ${totalClosedPl >= 0 ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
            {totalClosedPl >= 0 ? '+' : ''}${totalClosedPl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Strategy Win Rate
          </div>
          <div className="text-base font-bold text-[#00FF41] mt-1 font-mono flex items-baseline gap-1">
            {winRate}% <span className="text-zinc-500 text-[10px] font-normal">({totalWinCount}W/{totalTrades}T)</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Paper Engine State</div>
          <div className="text-xs text-zinc-300 mt-1.5 font-mono flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00FF41] shadow-[0_0_6px_#00FF41] animate-pulse" />
            SIMULATED PAPER
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#2A2A2E] mb-4 gap-1">
        <button
          id="portfolio-open-tab"
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 text-xs font-mono font-medium rounded-t border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'open'
              ? 'border-[#00FF41] text-white bg-[#00FF41]/5'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <LayoutGrid className="h-4 w-4 text-[#00FF41]" />
          Active Holdings ({openPositions.length})
        </button>
        <button
          id="portfolio-history-tab"
          onClick={() => setActiveTab('closed')}
          className={`px-4 py-2 text-xs font-mono font-medium rounded-t border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'closed'
              ? 'border-[#00FF41] text-white bg-[#00FF41]/5'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <History className="h-4 w-4 text-[#FFB800]" />
          Account Settled History ({closedPositions.length})
        </button>
      </div>

      {/* OPEN POSITIONS STREAM */}
      {activeTab === 'open' && (
        <div className="overflow-x-auto">
          {openPositions.length === 0 ? (
            <div id="no-open-positions-msg" className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-[#2A2A2E] rounded bg-[#111114]">
              NO ACTIVE PAPER OPTIONS CONTRACTS HELD. PLACE AN ORDER FROM THE SIMULATED SIGNAL FEED TO BEGIN.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2E] text-zinc-500 text-[10px] uppercase">
                  <th className="pb-3 pt-1">Option Details</th>
                  <th className="pb-3 pt-1">Strategy</th>
                  <th className="pb-3 pt-1">Contracts</th>
                  <th className="pb-3 pt-1">Entry / Current Premium</th>
                  <th className="pb-3 pt-1">Limits Profit/Stop</th>
                  <th className="pb-3 pt-1 text-right">Current P&L</th>
                  <th className="pb-3 pt-1 text-right">Settle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E] text-zinc-350">
                {openPositions.map((pos) => {
                  const isProfit = pos.profitLoss >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-[#111114]/50 transition-all">
                      <td className="py-3.5 font-bold text-white">
                        {pos.symbol} <span className="text-zinc-600 font-normal">|</span> {pos.strike} Strike <span className="text-[10px] font-normal font-sans ml-1 text-[#FFB800]">{pos.expiry}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pos.strategy.includes('Call') ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' : 'bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20'}`}>
                          {pos.strategy}
                        </span>
                      </td>
                      <td className="py-3.5">{pos.quantity} Lots</td>
                      <td className="py-3.5 font-sans text-zinc-300">
                        ${pos.entryPremium.toFixed(2)} <span className="text-zinc-600 mx-1">&rarr;</span> <span className="font-mono text-white">${pos.currentPremium.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 font-mono">
                        <span className="text-[#00FF41] font-bold">${pos.profitTarget.toFixed(2)}</span>
                        <span className="text-zinc-650 mx-1">/</span>
                        <span className="text-[#FF4444] font-bold">${pos.stopLoss.toFixed(2)}</span>
                      </td>
                      <td className={`py-3.5 text-right font-bold text-sm select-none ${isProfit ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
                        {isProfit ? '+' : ''}${pos.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] block font-normal opacity-90">
                          {isProfit ? '▲' : '▼'} {Math.round(((pos.currentPremium - pos.entryPremium) / pos.entryPremium) * 100)}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          id={`close-position-btn-${pos.id}`}
                          onClick={() => onClosePosition(pos.id)}
                          className="px-3 py-1 text-[10px] font-mono font-bold rounded border border-[#FF4444]/30 bg-[#FF4444]/10 hover:bg-[#FF4444] text-white hover:text-black cursor-pointer transition-all duration-200"
                        >
                          MARKET SETTLE
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CLOSED SETTLED LEDGER */}
      {activeTab === 'closed' && (
        <div className="overflow-x-auto">
          {closedPositions.length === 0 ? (
            <div id="no-history-msg" className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-[#2A2A2E] rounded bg-[#111114]">
              LEDGER EMPTY. CLOSED OR EXPIRED OPTION HISTORIES WILL LOG AUTOMATICALLY.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-[#2A2A2E] text-zinc-500 text-[10px] uppercase">
                  <th className="pb-3 pt-1">Option Details</th>
                  <th className="pb-3 pt-1">Strategy</th>
                  <th className="pb-3 pt-1">Lots Bought</th>
                  <th className="pb-3 pt-1">Entry Premium</th>
                  <th className="pb-3 pt-1">Exit Settlement</th>
                  <th className="pb-3 pt-1 text-right">Realized Paper Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2E] text-zinc-400">
                {closedPositions.map((pos) => {
                  const isProfit = pos.profitLoss >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-[#111114]/30 transition-all font-sans">
                      <td className="py-3 text-zinc-200 font-mono font-bold">
                        {pos.symbol} &bull; {pos.strike} Strike <span className="text-[10px] font-normal text-zinc-500 ml-1 block sm:inline">{pos.expiry}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-1 py-0.5 rounded text-[9px] font-bold font-mono ${pos.strategy.includes('Call') ? 'bg-[#00FF41]/10 text-[#00FF41] border border-[#00FF41]/20' : 'bg-[#FF4444]/10 text-[#FF4444] border border-[#FF4444]/20'}`}>
                          {pos.strategy}
                        </span>
                      </td>
                      <td className="py-3 font-mono">{pos.quantity} Lots</td>
                      <td className="py-3 font-mono">${pos.entryPremium.toFixed(2)}</td>
                      <td className="py-3 font-mono font-semibold text-white">
                        ${pos.currentPremium.toFixed(2)}
                      </td>
                      <td className={`py-3 text-right font-bold font-mono text-sm ${isProfit ? 'text-[#00FF41]' : 'text-[#FF4444]'}`}>
                        {isProfit ? '+' : ''}${pos.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] block font-sans font-normal text-zinc-500">
                          {isProfit ? 'WIN' : 'LOSS'} ({Math.round(((pos.currentPremium - pos.entryPremium) / pos.entryPremium) * 100)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
