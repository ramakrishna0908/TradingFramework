# Weekly Options Scout — 20 Tickers + Discord

**File:** `weekly_options_scout.pine`
**Timeframe:** Daily chart only (weekly options need daily structure, not intraday noise)
**Tickers:** SPY, QQQ, IWM, AAPL, NVDA, TSLA, AMZN, META, MSFT, GOOGL, AMD, COIN, PLTR, NFLX, AVGO, BA, INTC, BAC, MU, DIS

---

## What It Does

Scans 20 high-liquidity tickers every daily bar. Each ticker gets a bull score and bear score (0–11) based on how many indicators are aligned and how much weight each carries. When a score crosses your threshold for N consecutive bars, a Discord alert fires with the option trade details — ticker, expiry, strike, targets, and stop.

---

## Scoring System (0–11 per symbol)

Indicators are weighted by signal type. Momentary signals (fires when price is at an extreme *right now*) carry more weight than persistent signals (trend backdrop that holds across many bars).

| Indicator | Weight | Type | Bull (earns pts) | Bear (earns pts) |
|---|---|---|---|---|
| **CPR** | **3** | Momentary | Price > TC (cleared pivot ceiling) | Price < BC (broke pivot floor) |
| **Volume Surge** | **2** | Momentary | Vol > 1.5x avg AND above TC | Vol > 1.5x avg AND below BC |
| **Bollinger Bands** | **2** | Momentary | Close > upper band | Close < lower band |
| **EMA Cross** | 1 | Persistent | Fast > Slow + price above fast EMA | Fast < Slow + price below fast EMA |
| **RSI** | 1 | Persistent | RSI > bull level (default 55) | RSI < bear level (default 45) |
| **Chaikin Money Flow** | 1 | Persistent | CMF > 0.05 (institutional buying) | CMF < -0.05 (selling pressure) |
| **Ichimoku** | 1 | Persistent | Price > Conversion > Base | Price < Conversion < Base |

**Max possible score: 11**

**Confidence thresholds:** `< 6 = LOW` | `6–8 = MED` | `≥ 9 = HIGH`

**Recommended Min Score setting:**
- `7` — solid setups (CPR + Vol + one or two trend indicators)
- `9+` — high-conviction only (requires CPR + Vol + BB all firing simultaneously)

---

## How CPR Levels Are Calculated

CPR (Central Pivot Range) is derived from the **previous day's** High, Low, Close — no lookahead.

```
PP  = (pH + pL + pC) / 3        ← Pivot Point (center)
BC  = (pH + pL) / 2             ← Bottom Central (floor of CPR zone)
TC  = 2 * PP - BC               ← Top Central (ceiling of CPR zone)

R1  = 2 * PP - pL               ← Resistance 1 (call target 1)
R2  = PP + (pH - pL)            ← Resistance 2 (call target 2)
S1  = 2 * PP - pH               ← Support 1 (put target 1)
S2  = PP - (pH - pL)            ← Support 2 (put target 2)
```

Bullish signal = price cleared **above TC** (above the entire CPR zone).
Bearish signal = price broke **below BC** (below the entire CPR zone).
Stop for calls = below TC. Stop for puts = above BC.

---

## Alert Logic

- Score must stay **≥ Min Score** for **N Confirmation Bars** consecutively
- On the bar where it becomes confirmed → alert fires **once**
- Won't re-fire until score drops below threshold and comes back up (new setup)
- `freq_once_per_bar` prevents duplicate fires within the same bar

---

## Sample Discord Output

```
@bot BOUGHT | MSFT MAY 23 415C $4.20
Signal: CPR TC Break  [MED conf] Score 8/11 (1-bar confirmed)
Trigger: $410.25 (TC) cleared
Targets: R1 $418.50 R2 $426.75
Stop: Below TC $410.25
```

```
@bot BOUGHT | COIN MAY 23 205P $3.80
Signal: CPR BC Break  [HIGH conf] Score 9/11 (2-bar confirmed)
Trigger: $210.50 (BC) broken
Targets: S1 $198.25 S2 $186.00
Stop: Above BC $210.50
```

---

## Option Strike & Premium Calculation

| Parameter | Formula |
|---|---|
| Call strike | `ceil(price * (1 + OTM%) / 5) * 5` — rounds UP to nearest $5 |
| Put strike | `floor(price * (1 - OTM%) / 5) * 5` — rounds DOWN to nearest $5 |
| Sub-$50 stocks | Rounds to nearest $1 instead of $5 |
| Premium estimate | `ATR14 * 0.35` — rough approximation only |

**Always verify premium against the live option chain before entering.**

---

## All Settings

### Signal Filters (toggle on/off)
| Setting | Default | Points | What it does |
|---|---|---|---|
| CPR Breakout | ON | 3 | TC/BC level cross signals |
| Volume Surge | ON | 2 | Volume spike + direction confirmation |
| Bollinger Bands | ON | 2 | Outside-band breakouts |
| EMA Cross | ON | 1 | Fast/slow EMA alignment |
| RSI Momentum | ON | 1 | RSI threshold filter |
| Chaikin Money Flow | ON | 1 | Institutional flow filter |
| Ichimoku Trend | ON | 1 | Conversion/base line filter |

### Indicator Parameters
| Setting | Default | Notes |
|---|---|---|
| EMA Fast | 20 | Standard short-term trend |
| EMA Slow | 50 | Standard medium-term trend |
| BB Length | 20 | Bollinger Band period |
| BB StdDev | 2.0 | Band width multiplier |
| RSI Length | 14 | Standard RSI period |
| RSI Bull Level | 55 | Above this = bull point |
| RSI Bear Level | 45 | Below this = bear point |
| CMF Length | 20 | Money flow lookback |
| CMF Threshold | 0.05 | Absolute CMF value needed |
| Volume Surge Mult | 1.5 | Volume must exceed avg by this |
| Min Score to Alert | 7 | Minimum score (out of 11) to fire |
| Confirmation Bars | 1 | Bars score must hold before alerting |

### Options Settings
| Setting | Default | Notes |
|---|---|---|
| OTM Strike % | 1.0% | Distance from price to strike |
| Days to Expiry | 7 | Weekly = 7, monthly = 30 |

### Debug
| Setting | Default | Notes |
|---|---|---|
| Print score breakdown | OFF | Prints per-indicator contribution to Pine console on each bar close |

To use debug: enable the toggle, open Pine Editor → Console tab. Output format:
```
MSFT BULL: CPR+3 BB+2 VOL+2 EMA+1 RSI+1 CMF 0 ICH 0 = 9/11  |  BEAR: CPR 0 BB 0 VOL 0 EMA 0 RSI 0 CMF 0 ICH 0 = 0/11
```

---

## Settings Guide — When to Adjust

**Getting too many alerts (noisy)?**
- Raise Min Score to 9 (requires CPR + Vol + BB all firing)
- Set Confirmation Bars = 2 (requires two consecutive daily closes)
- Disable BB (noisy in choppy markets)
- Disable Ichimoku (less reliable on daily for short setups)

**Missing good setups?**
- Lower Min Score to 5–6 (CPR + persistent trend alignment)
- Keep Confirmation Bars = 1
- Enable all 7 indicators

**For high-IV environments (earnings season)?**
- Raise OTM % to 2–3% (wider strikes, cheaper premium)
- Lower DTE to 5–7 days

**For low-IV / directional plays?**
- OTM % = 0 for ATM options
- DTE = 14–30 for more time

---

## Discord Webhook Setup

1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**
2. Copy the webhook URL
3. In TradingView: open the indicator on a **Daily chart**
4. Click the clock icon (Alerts) → Create Alert
5. Condition: any (script fires its own alerts internally)
6. Notifications tab → enable Webhook → paste URL
7. Alert message field: leave as default (script builds the message)
8. Set expiry: "Open-ended" so it runs indefinitely

The alert message is pre-formatted as Discord JSON `{"content":"..."}` — paste the webhook URL directly, no bot setup needed.

---

## Tickers & How to Modify

Current list (in order):
`SPY, QQQ, IWM, AAPL, NVDA, TSLA, AMZN, META, MSFT, GOOGL, AMD, COIN, PLTR, NFLX, AVGO, BA, INTC, BAC, MU, DIS`

To swap a ticker, find the corresponding `f_scan("EXCHANGE:TICKER")` line and replace the symbol. Maximum 20 symbols (Pine Script's `request.security` limit is 40 calls total; this script uses 20).

---

## Architecture Notes

```
Daily bar closes
      ↓
f_scan() called for each of 20 symbols via request.security("D")
      ↓
7 indicators scored per symbol with weights → bull_score + bear_score (0-11 each)
      ↓
f_alert() checks if score crossed confirmation threshold
      ↓
On flip → alert() fires Discord JSON webhook
      ↓
Table updates at bar close with live scores (B x/11 or S x/11) for all 20 symbols
```

Premium estimate uses `ATR14 * 0.35`. This is a heuristic — actual option price depends on IV rank, exact DTE, and strike distance. Always check the live chain.

---

## Known Limitations

- **Premium estimate is approximate** — use it as a rough range check only
- **Ichimoku on daily** uses simplified conversion/base lines (not the full cloud with forward-shifted spans)
- **Strike rounding to $5** may miss exact levels for very high-priced stocks (e.g. AVGO at $800 — a 1% OTM put would be $800 → $795)
- **Expiry date** is calendar days from bar date, not the actual Friday expiry — verify in your broker
- **No IV filter** — script doesn't know if options are cheap or expensive; check IV rank separately before trading
- **Score 11/11 is rare by design** — requires CPR breakout (3), volume surge (2), and BB breakout (2) all on the same bar, plus all four trend indicators aligned. The bottleneck is BB + Vol both firing simultaneously while price is also clearing CPR
