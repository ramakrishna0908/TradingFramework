Please complete the following actions in order:

1. Create a new TradingView chart layout with 2 horizontal panels (side-by-side).
   - Left chart: symbol [$META], timeframe = "1D" (daily).
   - Right chart: same symbol, timeframe = "4H" (4-hour).

2. Apply the following indicators to BOTH charts with the specified settings:

   Overlays (on the main price pane):
   - EMA 20 (close, yellow line)
   - EMA 50 (close, orange line)
   - EMA 200 (close, red line)
   - Ichimoku Cloud (default settings: 9,26,52)
   - Anchored VWAP (start date = first trading day of current quarter; source = hlc3)
     Separate panes (each in its own window below the chart, in this order):
   - RSI (14, overbought=70, oversold=30)
   - MFI (14, overbought=80, oversold=20)
   - MACD (12,26,9) – label it "Smart Option MACD"
     Additional:
   - Volume Profile (Visible Range) on the right side of each main price pane, showing high volume nodes.

3. If your TradingView data includes options markets and the MCP can fetch it, add a custom Pine Script indicator for the 3-month expiry Put/Call Ratio (PCR) as a separate bottom pane.
   - If PCR data is not available, instead add a separate pane for Volume delta (if available) or note that it’s skipped.

4. Configure both charts identically for appearance:
   - Color bars based on up/down (green/red).
   - Show gridlines, volume bars on the bottom of the main pane.
   - Extend the Ichimoku cloud lines and VWAP into the future.

5. Save this layout with the name “3M_Options_daily_4h”.

6. After building, output a summary of what was placed on each chart and confirm the anchored VWAP start date.

Indicator │ Entity │ Status │  
 ├───────────────────────┼────────┼────────────────────────────────────┤  
 │ Q2 2026 Anchored VWAP │ UCoyb2 │ ✅ Active (plots from Apr 1, 2026) │
├───────────────────────┼────────┼────────────────────────────────────┤
│ Ichimoku Cloud │ d7fRQp │ ✅ Re-added clean │  
 ├───────────────────────┼────────┼────────────────────────────────────┤  
 │ EMA 20 │ Mu3v6h │ ✅ No error │  
 ├───────────────────────┼────────┼────────────────────────────────────┤  
 │ EMA 50 │ aoQGlU │ ✅ No error │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ EMA 200 │ kkX9nj │ ✅ No error │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ Volume │ jRo2JF │ ✅ │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ Bollinger Bands │ Ayx5sS │ ✅ │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ RSI (14) │ UWl9Io │ ✅ │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ ATR (14) │ DmbuLX │ ✅ │
├───────────────────────┼────────┼────────────────────────────────────┤  
 │ Chaikin Money Flow │ 9B3Kad │ ✅ │
└───────────────────────┴────────┴────────────────────────────────────
