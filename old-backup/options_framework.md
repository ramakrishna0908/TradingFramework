# 3-Month Options Trading Indicator Framework for AI Analysis

## Purpose

This document is a structured knowledge base for an AI assistant to analyze market data and generate trading signals for **call and put options with a 3-month expiry**. The AI should use this framework to interpret provided data, assess confluence of indicators, and output a clear trading decision.

## Indicator Portfolio

### 1. Trend-Following Indicators

Used to determine the overall directional bias.

- **EMA 20, 50, 200**
  - _Bullish alignment (Calls):_ Price > EMA 20 > EMA 50 > EMA 200.
  - _Bearish alignment (Puts):_ Price < EMA 20 < EMA 50 < EMA 200.
  - _Dynamic support/resistance:_ EMAs act as levels where price may bounce or break.

- **Ichimoku Cloud**
  - _Bullish (Calls):_ Price is above the cloud, the cloud is green, and Tenkan-sen is above Kijun-sen.
  - _Bearish (Puts):_ Price is below the cloud, the cloud is red, and Tenkan-sen is below Kijun-sen.
  - _Risk management:_ The cloud’s boundaries and the baseline (Kijun-sen) serve as dynamic support/resistance for stop-loss placement.

- **MACD (applied directly to option prices — "Smart Option MACD")**
  - _Call signal:_ MACD line crosses above signal line while in a bullish state.
  - _Put signal:_ MACD line crosses below signal line while in a bearish state.
  - _Momentum shift:_ Histogram changing direction indicates weakening trend.

- **VWAP (Quarterly Anchor)**
  - Anchor point: start of the current quarter.
  - _Bullish (Calls):_ Price holding above quarterly VWAP.
  - _Bearish (Puts):_ Price failing to reclaim quarterly VWAP or rejecting from it.
  - Acts as a high-value institutional reference level for multi-week conviction.

### 2. Momentum & Strength Indicators

Used to time entries and spot exhaustion.

- **RSI (Relative Strength Index, period 14)**
  - Overbought: >70 (potential put or call exit).
  - Oversold: <30 (potential call or put exit).
  - _Divergence:_
    - Bullish divergence (price lower low, RSI higher low) → potential call entry.
    - Bearish divergence (price higher high, RSI lower high) → potential put entry.

- **MFI (Money Flow Index, period 14)**
  - Overbought: >80
  - Oversold: <20
  - Confirms RSI signals when divergence is present. Adds volume conviction.

### 3. Volatility & Options-Specific Sentiment

Essential for strike selection and gauging market expectations.

- **Volatility Skew**
  - _Put skew elevated (OTM put IV > OTM call IV):_ market pricing in crash risk. Extreme skew can be contrarian bullish → call opportunity.
  - _Call skew elevated:_ extreme greed, potential contrarian bearish → put opportunity.
  - _Smile or neutral:_ no significant edge.

- **Expected Move (for the 3-month expiration)**
  - Shows the market’s one-standard-deviation price range until expiry.
  - _Strike selection:_ Selling or buying options with strikes outside the expected move yields higher probability; inside yields higher risk/reward.
  - _AI note:_ Compare current price to expected move boundaries; if near a boundary on a high-confluence signal, it strengthens the trade.

- **Put/Call Ratio (PCR)**
  - _Extreme high (>1.2)_: fear, potential bottom → contrarian call signal.
  - _Extreme low (<0.6)_: greed, potential top → contrarian put signal.
  - Best used with price action confirmation.

### 4. Volume & Flow

Confirms strength and pinpoints target/support zones.

- **Volume Profile (Visible Range)**
  - _High Volume Nodes (HVN)_: magnets for price, act as profit targets or support/resistance.
  - _Low Volume Nodes (LVN)_: areas where price moves quickly—can be breached easily.
  - _For calls:_ next HVN above current price is a natural profit target.
  - _For puts:_ next HVN below is target.
  - _Stop loss:_ Just beyond an HVN that should act as support/resistance.

- **Options Flow Sentiment**
  - Balance of call vs put volume in the 3-month expiry.
  - _Shift from neutral to directional dominance (e.g., large call buying):_ strongly predictive of upcoming move; enter call.
  - _All-time high put flow with no price collapse:_ potential absorption and reversal → call.

### 5. Sentiment (Contrarian)

- **PCR extremes** already covered, serves as a core contrarian gauge. Combine with retail sentiment surveys or media narrative if data available.

## The Confluence-Based Decision Framework

The AI must evaluate the data in this exact sequence, weighting points as indicated.

### Step 1: Trend Confirmation (30% weight)

Check:

- Ichimoku Cloud: price relative to cloud and cloud color.
- EMA alignment: 20, 50, 200 relationship.
- Quarterly VWAP: price above or below.

**Result:** Determine bullish, bearish, or neutral bias for calls/puts.

### Step 2: Momentum & Entry Timing (25% weight)

- MACD on option prices: state and signal cross.
- RSI: overbought/oversold and divergence.
- MFI: confirmation of RSI divergence.

**Result:** Entry signal (buy call / buy put) or wait.

### Step 3: Options-Specific Filter (25% weight)

- Volatility skew: fear/greed extreme.
- PCR: contrarian signal.
- Expected Move: is the strike selection reasonable? Is price at an extreme of the expected range?

**Result:** Adjust confidence (boost if skew/PCR align with fundamental direction, reduce if they contradict).

### Step 4: Volume & Flow Final Check (20% weight)

- Volume Profile: clear target (HVN) and invalidation level (HVN or LVN).
- Options flow sentiment: identify absorption or breakout.

**Result:** Set profit target and stop-loss. If no clear volume structure, reduce position size or skip.

### Step 5: Final Synthesis & Output

The AI must output:

- **Trade Direction:** Buy Call or Buy Put.
- **Underlying asset.**
- **Strike price** (based on expected move and risk tolerance).
- **Expiration:** ~3 months out.
- **Entry trigger** (e.g., “on a daily close above X”).
- **Profit target** (next HVN or measured move).
- **Stop-loss** (below Ichimoku cloud / quarterly VWAP / major HVN).
- **Confidence level:** High (all steps align), Medium (3 of 4 align), Low (only 1-2 align) → Do Not Trade.

## Input Format for Analysis

To use this framework, provide the AI with the following data points in a structured manner:
