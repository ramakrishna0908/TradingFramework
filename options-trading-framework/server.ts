/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Bar, OptionsAlert, Order, Position, MarketContext, Signal, AlertEvent } from './src/types';
import { computeIndicators, calculateOptionGreeks, calculateSuggestedPremiumLevels } from './src/server_utils';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database / State Manager
let activeSymbol = 'SPY';
let currentRegime: 'breakout_bull' | 'reversal_oversold' | 'bb_squeeze' | 'choppy_drift' | 'pullback_bounce' = 'breakout_bull';
let currentPrice = 450.0;
let bars: Bar[] = [];
let alerts: OptionsAlert[] = [];
let orders: Order[] = [];
let positions: Position[] = [];

// Track SSE Client connection streams
let sseClients: any[] = [];

// Helper: Seed initial history to establish indicators
function seedHistory() {
  bars = [];
  let basePrice = 445.0;
  if (activeSymbol === 'TSLA') basePrice = 180.0;
  if (activeSymbol === 'AAPL') basePrice = 175.0;
  if (activeSymbol === 'NVDA') basePrice = 480.0;
  if (activeSymbol === 'QQQ') basePrice = 380.0;

  currentPrice = basePrice;
  const now = new Date();

  // Create 40 initial static bars
  for (let i = 40; i > 0; i--) {
    const timeVal = new Date(now.getTime() - i * 60000);
    // Simple random walk
    const change = (Math.random() - 0.48) * 0.4;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 0.2;
    const low = Math.min(open, close) - Math.random() * 0.2;
    const volume = Math.floor(Math.random() * 3000) + 1000;

    bars.push({
      time: timeVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      open,
      high,
      low,
      close,
      volume,
    });
    basePrice = close;
  }
  currentPrice = basePrice;
  bars = computeIndicators(bars);
}

// Initialise seed data
seedHistory();

// Helper: Stream notification helper
function sendSseAlert(alert: OptionsAlert) {
  sseClients.forEach((client) => {
    client.write(`data: ${JSON.stringify(alert)}\n\n`);
  });
}

// ----------------------------------------------------
// THE ALERT ENGINE TICK LOOP (Simulates TradingView Stream via MPC Wrapper)
// ----------------------------------------------------
let tickCounter = 0;

setInterval(() => {
  tickCounter++;
  const lastBarIndex = bars.length - 1;
  const lastBar = bars[lastBarIndex];
  
  // 1. Generate new tick updates based on the current regime
  let deltaPrice = (Math.random() - 0.5) * 0.15; // Random noise
  let forcedVolume = Math.floor(Math.random() * 2000) + 1200;

  switch (currentRegime) {
    case 'breakout_bull':
      // Consistently upward momentum, building higher highs
      deltaPrice = (Math.random() - 0.2) * 0.6; // bias upwards
      if (tickCounter % 3 === 0) {
        deltaPrice += 0.8; // large breakout jump
        forcedVolume = Math.floor(Math.random() * 5000) + 4000; // volume spike
      }
      break;

    case 'reversal_oversold':
      // First drop the price, then initiate sharp reversal bounce
      if (tickCounter < 6) {
        deltaPrice = -0.7 - Math.random() * 0.4; // heavy dump
        forcedVolume = Math.floor(Math.random() * 3000) + 2000;
      } else if (tickCounter >= 6 && tickCounter <= 8) {
        deltaPrice = (Math.random() - 0.3) * 0.1; // stabilization
      } else {
        deltaPrice = 0.6 + Math.random() * 0.5; // explosive hammer bounce upward
        forcedVolume = Math.floor(Math.random() * 6000) + 3000;
      }
      break;

    case 'bb_squeeze':
      // Low volatility squeezing inside limits
      deltaPrice = (Math.random() - 0.5) * 0.05;
      forcedVolume = Math.floor(Math.random() * 500) + 400;
      break;

    case 'choppy_drift':
      // Overlapping noise, directional consolidation
      deltaPrice = (Math.random() - 0.5) * 0.18;
      forcedVolume = Math.floor(Math.random() * 1200) + 600;
      break;

    case 'pullback_bounce':
      // Uptrend, followed by pullback to 21 EMA (index), then bounce
      if (tickCounter < 5) {
        deltaPrice = -0.4 - Math.random() * 0.25; // Pullback
        forcedVolume = Math.floor(Math.random() * 1500) + 1000;
      } else {
        deltaPrice = 0.5 + Math.random() * 0.4; // Bounce
        forcedVolume = Math.floor(Math.random() * 4000) + 2000;
      }
      break;
  }

  currentPrice = parseFloat((currentPrice + deltaPrice).toFixed(2));

  // Determine if we start a new bar or update the current one (every 4 ticks is a bar close)
  const isNewBar = tickCounter % 4 === 0;

  if (isNewBar || bars.length === 0) {
    const nextTime = new Date();
    const newBar: Bar = {
      time: nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      open: lastBar ? lastBar.close : currentPrice,
      high: currentPrice,
      low: currentPrice,
      close: currentPrice,
      volume: forcedVolume,
    };
    bars.push(newBar);
    if (bars.length > 80) bars.shift(); // Keep standard sliding size
  } else {
    // Update existing bar
    const currentBar = bars[bars.length - 1];
    currentBar.high = parseFloat(Math.max(currentBar.high, currentPrice).toFixed(2));
    currentBar.low = parseFloat(Math.min(currentBar.low, currentPrice).toFixed(2));
    currentBar.close = currentPrice;
    currentBar.volume += forcedVolume;
  }

  // Recalculate indicators
  bars = computeIndicators(bars);
  const activeBar = bars[bars.length - 1];

  // ----------------------------------------------------
  // OPTIONS PORTFOLIO LIVE PnL TICK CALCULATIONS
  // ----------------------------------------------------
  positions.forEach((pos) => {
    if (pos.status === 'open') {
      const isCall = pos.side === 'buy' && pos.strategy.includes('Call');
      const strikeVal = parseFloat(pos.strike);
      
      // Calculate realistic option Greeks and price given current price & volatility
      const greeks = calculateOptionGreeks(
        currentPrice,
        strikeVal,
        3.5, // 3.5 days left approx
        45, // IV rank
        isCall
      );
      
      pos.currentPremium = greeks.price;
      pos.profitLoss = parseFloat(((pos.currentPremium - pos.entryPremium) * pos.quantity * 100).toFixed(2));

      // Automatic TakeProfit or StopLoss assessment
      if (pos.currentPremium <= pos.stopLoss) {
        // Trigger StopLoss
        pos.status = 'closed';
        pos.profitLoss = parseFloat(((pos.stopLoss - pos.entryPremium) * pos.quantity * 100).toFixed(2));
        orders.push({
          id: 'ord_' + Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          symbol: pos.symbol,
          side: 'sell',
          strategy: pos.strategy,
          strike: pos.strike,
          expiry: pos.expiry,
          premium: pos.stopLoss,
          quantity: pos.quantity,
          orderType: 'market',
          isPaper: true,
          status: 'filled',
        });
      } else if (pos.currentPremium >= pos.profitTarget) {
        // Trigger ProfitTarget
        pos.status = 'closed';
        pos.profitLoss = parseFloat(((pos.profitTarget - pos.entryPremium) * pos.quantity * 100).toFixed(2));
        orders.push({
          id: 'ord_' + Math.random().toString(36).substring(2, 11),
          timestamp: new Date().toISOString(),
          symbol: pos.symbol,
          side: 'sell',
          strategy: pos.strategy,
          strike: pos.strike,
          expiry: pos.expiry,
          premium: pos.profitTarget,
          quantity: pos.quantity,
          orderType: 'market',
          isPaper: true,
          status: 'filled',
        });
      }
    }
  });

  // ----------------------------------------------------
  // FULL QUANT ACTIONABLE ALERT PROCESSOR (STAGES 1-5)
  // ----------------------------------------------------
  if (bars.length >= 20) {
    const prevBar = bars[bars.length - 2];
    
    // STAGE 1 - NORMALISE SIGNALS
    const vwapCross: 'above' | 'below' | 'none' = 
      (prevBar.close <= (prevBar.vwap ?? 0) && activeBar.close > (activeBar.vwap ?? 0)) ? 'above' :
      (prevBar.close >= (prevBar.vwap ?? 0) && activeBar.close < (activeBar.vwap ?? 0)) ? 'below' : 'none';
      
    const rsiState = (activeBar.rsi ?? 50) < 30 ? 'oversold' as const : (activeBar.rsi ?? 50) > 70 ? 'overbought' as const : 'neutral' as const;
    const emaCross: 'none' | 'bullish' | 'bearish' = 
      ((prevBar.ema9 ?? 0) <= (prevBar.ema21 ?? 0) && (activeBar.ema9 ?? 0) > (activeBar.ema21 ?? 0)) ? 'bullish' :
      ((prevBar.ema9 ?? 0) >= (prevBar.ema21 ?? 0) && (activeBar.ema9 ?? 0) < (activeBar.ema21 ?? 0)) ? 'bearish' : 'none';
    
    // Simple average volume
    let totalVol = 0;
    for (let v = bars.length - 10; v < bars.length; v++) {
      totalVol += bars[v]?.volume ?? 1000;
    }
    const avgVol = totalVol / 10;
    const volumeSpike = activeBar.volume > (avgVol * 1.8);

    // STAGE 2 - MARKET CONTEXT
    const trend = (activeBar.ema9 ?? 0) > (activeBar.ema21 ?? 0) ? 'uptrend' as const : 'downtrend' as const;
    const volatilityState = (activeBar.atr ?? 1.5) > 2.5 ? 'high' as const : (activeBar.atr ?? 1.5) < 0.8 ? 'low' as const : 'normal' as const;
    const momentumScore = Math.max(-100, Math.min(100, Math.floor(((activeBar.rsi ?? 50) - 50) * 3.5)));

    // STAGE 3 - EVENT DETECTION RULES
    let detectedEvent: AlertEvent = { type: 'None', direction: 'neutral', strength: 0, entryPrice: currentPrice };

    // Breakout: Price higher than last 20 bar high + volume spike + uptrend
    let highestOf20 = -Infinity;
    for (let k = bars.length - 21; k < bars.length - 1; k++) {
      if (bars[k] && bars[k].high > highestOf20) highestOf20 = bars[k].high;
    }
    
    // Reversal: Bullish/Bearish Divergences OR Deep RSI extremes combined with key signals
    if (currentRegime === 'breakout_bull' && activeBar.close > highestOf20 && volumeSpike && trend === 'uptrend') {
      detectedEvent = {
        type: 'Breakout',
        direction: 'call',
        strength: 0.9,
        entryPrice: activeBar.close
      };
    } else if (currentRegime === 'reversal_oversold' && activeBar.rsi && activeBar.rsi < 35 && volumeSpike) {
      detectedEvent = {
        type: 'Reversal',
        direction: 'call',
        strength: 0.85,
        entryPrice: activeBar.close
      };
    } else if (currentRegime === 'bb_squeeze' && activeBar.bbUpper && activeBar.bbLower && activeBar.kcUpper && activeBar.kcLower) {
      // Bollinger squeeze: Bollinger Bands fully inside Keltner Channel
      const isSqueeze = (activeBar.bbUpper < activeBar.kcUpper) && (activeBar.bbLower > activeBar.kcLower);
      if (isSqueeze) {
        detectedEvent = {
          type: 'Squeeze',
          direction: 'neutral', // non-directional strangle/straddle
          strength: 0.8,
          entryPrice: activeBar.close
        };
      }
    } else if (currentRegime === 'pullback_bounce' && trend === 'uptrend' && activeBar.close > (activeBar.ema21 ?? 0) && prevBar.close <= (prevBar.ema21 ?? 0) * 1.002) {
      detectedEvent = {
        type: 'Pullback',
        direction: 'call',
        strength: 0.75,
        entryPrice: activeBar.close
      };
    }

    // STAGE 4 - OPTIONS VALIDATION FILTERS
    if (detectedEvent.type !== 'None') {
      // Simulate options filter thresholds
      const mockIVRank = Math.floor(Math.random() * 25) + 35; // 35% to 60%
      const mockBidAskSpread = 0.08; // 8 cents mid spread
      const chopIndex = activeBar.chop ?? 45;

      const isIVValid = mockIVRank > 30 && mockIVRank < 80;
      const isLiquidityValid = mockBidAskSpread < 0.20; // Tight spread check
      const isChopValid = detectedEvent.type === 'Squeeze' ? chopIndex > 61 : chopIndex < 55; // Squeeze likes consolidation

      // If filters pass -> Alert Engine fires
      if (isIVValid && isLiquidityValid && isChopValid) {
        // Prevent duplicate alerts on immediate consecutive ticks in the same minute
        const lastAlert = alerts[0];
        const isDuplicate = lastAlert && 
          lastAlert.symbol === activeSymbol && 
          lastAlert.eventType === detectedEvent.type && 
          (new Date().getTime() - new Date(lastAlert.timestamp).getTime()) < 4000;

        if (!isDuplicate) {
          const suggestedStrikePrice = Math.round(currentPrice);
          const strikeStr = suggestedStrikePrice.toString();
          
          let strategySelected: 'Buy Call' | 'Buy Put' | 'Put Credit Spread' | 'Call Credit Spread' = 'Buy Call';
          if (detectedEvent.direction === 'put') {
            strategySelected = 'Buy Put';
          } else if (detectedEvent.type === 'Squeeze') {
            strategySelected = 'Put Credit Spread'; // Non-directional premium seller
          }

          const greeks = calculateOptionGreeks(
            currentPrice,
            suggestedStrikePrice,
            4, // 4 DTE
            mockIVRank,
            detectedEvent.direction !== 'put'
          );

          // Profit booking & Stop triggers using math
          const suggestions = calculateSuggestedPremiumLevels(
            currentPrice,
            greeks.price,
            greeks.delta,
            detectedEvent.direction !== 'put',
            activeBar.atr ?? 1.2
          );

          const alertExpiryDate = new Date();
          alertExpiryDate.setDate(alertExpiryDate.getDate() + (5 - alertExpiryDate.getDay() + 7) % 7); // nearest Friday
          const expiryStr = alertExpiryDate.toLocaleDateString([], { month: 'short', day: '2-digit' }) + ' Exp (Weekly)';

          const liveAlert: OptionsAlert = {
            id: 'alt_' + Math.random().toString(36).substring(2, 11),
            timestamp: new Date().toISOString(),
            symbol: activeSymbol,
            eventType: detectedEvent.type,
            direction: detectedEvent.direction === 'neutral' ? 'call' : detectedEvent.direction,
            entryPrice: currentPrice,
            suggestedStrike: strikeStr,
            suggestedExpiry: expiryStr,
            suggestedStrategy: strategySelected,
            suggestedPremium: greeks.price,
            ivRank: mockIVRank,
            bidAskSpread: mockBidAskSpread,
            chopIndex: parseFloat(chopIndex.toFixed(1)),
            stopLoss: suggestions.stopLoss,
            profitTarget: suggestions.profitTarget,
            riskReward: suggestions.riskReward
          };

          alerts.unshift(liveAlert);
          if (alerts.length > 50) alerts.pop();

          // Push alert to SSE Clients!
          sendSseAlert(liveAlert);
        }
      }
    }
  }
}, 4000); // Poll/fire loop calculations every 4 seconds for ultra fast dashboard rendering


// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// Server-Sent Events real-time alert stream
app.get('/api/alerts/live', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');
  
  sseClients.push(res);
  
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// Past alerts history API
app.get('/api/alerts/history', (req, res) => {
  res.json(alerts);
});

// simulated active market parameters handler
app.get('/api/market/state', (req, res) => {
  res.json({
    activeSymbol,
    currentRegime,
    currentPrice,
    bars: bars.slice(-40) // Serve last 40 processed candles
  });
});

app.post('/api/market/configure', (req, res) => {
  const { symbol, regime } = req.body;
  if (symbol && symbol !== activeSymbol) {
    activeSymbol = symbol;
    seedHistory();
  }
  if (regime) {
    currentRegime = regime;
    tickCounter = 0; // reset ticks for regime behavior triggers
  }
  res.json({ status: 'ok', activeSymbol, currentRegime, currentPrice });
});

// Broker position tracking API
app.get('/api/positions', (req, res) => {
  res.json(positions);
});

app.post('/api/positions/:id/close', (req, res) => {
  const posId = req.params.id;
  const pos = positions.find(p => p.id === posId);
  if (pos && pos.status === 'open') {
    pos.status = 'closed';
    orders.push({
      id: 'ord_' + Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      symbol: pos.symbol,
      side: 'sell',
      strategy: pos.strategy,
      strike: pos.strike,
      expiry: pos.expiry,
      premium: pos.currentPremium,
      quantity: pos.quantity,
      orderType: 'market',
      isPaper: true,
      status: 'filled',
    });
    res.json({ success: true, position: pos });
  } else {
    res.status(404).json({ error: 'Open position not found' });
  }
});

// Place orders API (Broker simulation)
app.post('/api/order/place', (req, res) => {
  const { symbol, side, strike, expiry, premium, quantity, strategy, stopLoss, profitTarget } = req.body;
  
  const newOrder: Order = {
    id: 'ord_' + Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
    symbol,
    side,
    strategy: strategy || 'Buy Call',
    strike,
    expiry,
    premium,
    quantity,
    orderType: 'market',
    isPaper: true,
    status: 'filled'
  };

  orders.unshift(newOrder);

  if (side === 'buy') {
    const newPos: Position = {
      id: 'pos_' + Math.random().toString(36).substring(2, 11),
      symbol,
      side: 'buy',
      strategy: strategy || 'Buy Call',
      strike,
      expiry,
      entryPremium: premium,
      currentPremium: premium,
      quantity,
      stopLoss: stopLoss || (premium * 0.7),
      profitTarget: profitTarget || (premium * 1.5),
      status: 'open',
      profitLoss: 0,
      timestamp: new Date().toISOString(),
    };
    positions.unshift(newPos);
  }

  res.json({ success: true, order: newOrder });
});

// Custom Suggest Profit Target and Stop Loss Levels API
app.post('/api/suggest/plsl', (req, res) => {
  const { entryPremium, spotPrice, strike, ivRank, isCall } = req.body;
  
  const atr = 1.35; // standard sample ATR
  const greeks = calculateOptionGreeks(
    spotPrice || 450,
    strike || 450,
    4,
    ivRank || 40,
    isCall !== false
  );
  
  const suggestions = calculateSuggestedPremiumLevels(
    spotPrice || 450,
    entryPremium || greeks.price,
    greeks.delta,
    isCall !== false,
    atr
  );

  res.json({
    premium: entryPremium || greeks.price,
    delta: greeks.delta,
    stopLoss: suggestions.stopLoss,
    profitTarget: suggestions.profitTarget,
    riskReward: suggestions.riskReward
  });
});


// ----------------------------------------------------
// VITE CLIENT INTEGRATION MIDDLEWARES
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:${PORT}`);
  });
}

startServer();
