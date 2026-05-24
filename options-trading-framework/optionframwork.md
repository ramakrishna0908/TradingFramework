# Options Trading Framework – Complete Implementation & Required Changes

## 1. Overview

A production‑ready options trading framework that:

- Connects to an MCP (Model Context Protocol) server fed by **TradingView Desktop** real‑time data.
- Runs a **multi‑stage alert engine** (signal extraction → market context → event detection → options filters).
- Displays real‑time alerts on a **React dashboard** with one‑click order placement.
- Suggests **profit booking and stop loss** levels using option Greeks, IV, and price action.
- Supports **simulated (paper) trading** with automatic target/stop execution.

The framework was built as a full‑stack application with:

- **Backend:** Node.js + Express + TypeScript (server‑sent events, REST API, WebSocket fallback)
- **Frontend:** React + Tailwind CSS (dark terminal theme, custom TradingView‑like chart)
- **Data:** In‑memory tick simulation (replaces live MCP for demo) + configurable real MCP client
- **Broker:** Simulated paper trading (order book, positions, auto TP/SL)

---

## 2. Architecture (As Implemented)

| Layer             | Technology                             | Purpose                                                                   |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Data Feed         | MCP Client (simulated tick loop)       | Generates OHLCV, volume, indicators (RSI, MACD, VWAP, Bollinger, Keltner) |
| Signal Processing | Node.js + custom quantitative engine   | Runs stages 1–5 on every bar close                                        |
| Database          | In‑memory (Redis ready – configurable) | Stores alerts, positions, user settings                                   |
| Dashboard         | React + Tailwind + Server‑Sent Events  | Real‑time alerts, order modal, trade log, interactive chart               |
| Broker            | Simulated paper trader                 | Executes orders, tracks P&L, auto‑closes at TP/SL                         |

---

## 3. Multi‑Stage Alert Engine

### Stage 1 – Signal Extraction

- **Input:** 5‑minute bars (simulated or real from MCP)
- **Indicators computed:** EMA 9/21, VWAP, RSI, ATR, Bollinger Bands, Keltner Channels, Choppiness Index, ADX (simplified)
- **Raw signals emitted:**  
  `price_above_vwap`, `rsi_oversold` (<30), `volume_spike` (>2× avg), `ema_cross`, `bollinger_squeeze`, `breakout_high`

### Stage 2 – Market Context

- **Trend:** Determined by EMA slope + ADX (trending if ADX > 25, ranging otherwise)
- **Volatility state:** Low / Normal / High based on ATR percentile over last 20 bars
- **Momentum score:** -100 to 100 (RSI slope + MACD histogram)
- **Output object:** `{ trend, volatility_state, momentum_score }`

### Stage 3 – Event Detection

| Event    | Condition                                               | Options Direction  |
| -------- | ------------------------------------------------------- | ------------------ |
| Breakout | Price > highest high(20) + volume spike + trending      | Bullish (Call)     |
| Reversal | RSI < 35 + bullish divergence (price lower, RSI higher) | Bullish            |
| Squeeze  | Bollinger width < Keltner width (TTM Squeeze)           | Neutral (Straddle) |
| Pullback | Uptrend + price touches 20 EMA + RSI 40‑50              | Bullish            |

Each event includes `type`, `direction`, `strength`, `entry_price`.

### Stage 4 – Options Filters

- **IV Rank:** 30% – 80% (simulated – replace with real feed)
- **Liquidity:** Bid‑ask spread < 10% of mid price, open interest > 100 (simulated values)
- **Choppiness Index:** < 38 (trending) or > 61 (avoid directional)
- **Timing:** Only 9:45 AM – 3:30 PM ET (simulated clock)
- **Pass** → Alert proceeds.

### Stage 5 – Alert Generation

```json
{
  "id": "uuid",
  "timestamp": "ISO",
  "symbol": "SPY",
  "event_type": "Breakout",
  "direction": "call",
  "entry_price": 450.25,
  "suggested_strike": "ATM or 1 OTM",
  "suggested_expiry": "current week (0DTE)",
  "suggested_strategy": "Buy Call",
  "premium": 2.5,
  "delta": 0.65
}
```
