/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core market data types
export interface Bar {
  time: string; // ISO string or time string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
  ema9?: number;
  ema21?: number;
  rsi?: number;
  adx?: number;
  atr?: number;
  bbUpper?: number;
  bbLower?: number;
  kcUpper?: number;
  kcLower?: number;
  chop?: number;
}

// Stage 1 - Normalised Signals
export interface Signal {
  vwapCross: 'above' | 'below' | 'none';
  rsiState: 'oversold' | 'overbought' | 'neutral';
  volumeSpike: boolean;
  emaCross: 'bullish' | 'bearish' | 'none';
}

// Stage 2 - Market Context
export interface MarketContext {
  trend: 'uptrend' | 'downtrend' | 'ranging';
  volatilityState: 'low' | 'normal' | 'high';
  momentumScore: number; // -100 to 100
}

// Stage 3 - Event Detection
export interface AlertEvent {
  type: 'Breakout' | 'Reversal' | 'Squeeze' | 'Pullback' | 'None';
  direction: 'call' | 'put' | 'neutral';
  strength: number; // 0 to 1
  entryPrice: number;
}

// Stage 4 & 5 - Options Alert Engine
export interface OptionsAlert {
  id: string;
  timestamp: string;
  symbol: string;
  eventType: string;
  direction: 'call' | 'put';
  entryPrice: number;
  suggestedStrike: string;
  suggestedExpiry: string;
  suggestedStrategy: 'Buy Call' | 'Buy Put' | 'Put Credit Spread' | 'Call Credit Spread';
  suggestedPremium: number; // Current options premium
  ivRank: number; // 0 to 100
  bidAskSpread: number;
  chopIndex: number;
  stopLoss: number; // Suggested Option Premium Stop Loss
  profitTarget: number; // Suggested Option Premium Take Profit
  riskReward: number; // R:R ratio
}

// Orders and Portfolio
export interface Order {
  id: string;
  alertId?: string;
  timestamp: string;
  symbol: string;
  side: 'buy' | 'sell';
  strategy: string;
  strike: string;
  expiry: string;
  premium: number;
  quantity: number;
  limitPrice?: number;
  orderType: 'market' | 'limit';
  isPaper: boolean;
  status: 'filled' | 'cancelled' | 'pending';
}

export interface Position {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  strategy: string;
  strike: string;
  expiry: string;
  entryPremium: number;
  currentPremium: number;
  quantity: number;
  stopLoss: number;
  profitTarget: number;
  status: 'open' | 'closed';
  profitLoss: number;
  timestamp: string;
}
