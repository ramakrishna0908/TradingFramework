## QQQCPR-Alerts

1.multi layout 5m/1hr/4hr
2.set up alert on 5m chart only
3.apply QQQCPR-Alerts indicator

What changed and why

1. CPR width filter (useCprWidth, default ON)

Computes today's CPR width (tc − bc) inside the daily security fetch and compares it to a 7-day SMA of past widths.
narrow = todayWidth < avgWidth × 0.6 → only narrow days pass.
New CPRw column in the table: N (narrow, green) = breakouts allowed; W (wide, orange) = breakouts blocked. Hover for tooltip. 2. VWAP alignment (useVwap, default ON)

Calls now require close > chart-TF VWAP; puts require close < VWAP.
Single biggest cut to counter-trend losers. 3. ATR buffer (useAtrBuf, default ON, 0.10 × dailyATR)

Replaces ta.crossover with a buffered version: prior bar must be at/below level + buf, current close must clear level + buf.
Auto-scales per symbol — small for SPY/QQQ, larger for TSLA — because it uses each symbol's own daily ATR.
All three filters are toggle-able via inputs, so you can A/B test them. Defaults are tuned for "ship as-is."

Tuning hints
The logic is: narrow = todayWidth < avgWidth × cprNarrowMult

Lower mult (e.g., 0.45) → stricter "narrow" definition → fewer days qualify → fewer alerts
Higher mult (e.g., 1.0, 1.2) → looser "narrow" definition → more days qualify → more alerts

If you still get wick fakeouts → bump atrBufMult to 0.15 or 0.20.
If VWAP filter is killing winning trades early in the session (before VWAP stabilizes) → disable VWAP for the first 15 minutes by adding a time check, or just leave it off.

For frequent alerts, do the opposite of what I said:
Knob For more alerts Effect
cprNarrowMult raise to 1.0–1.2 (or turn off useCprWidth) Lets wide-CPR days through too
useVwap false ✅ (your instinct is correct) Removes the call>VWAP / put<VWAP gate
useAtrBuf false or lower atrBufMult to 0.05 Looser cross definition, wicks count
useRSI false Removes the RSI>50/<50 gate
useVolume leave true This one actually filters dead-bar noise; turning off causes garbage signals

## CPRScanner-20-Symbols-Discord-Alerts

1.multi layout 5m/1hr/4hr
2.set up alert on 5m chart only
3.apply CPRScanner-20-Symbols-Discord indicator
