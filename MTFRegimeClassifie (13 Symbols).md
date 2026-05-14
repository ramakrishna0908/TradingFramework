//@version=5
// =============================================================================
// MTF Regime Classifier (13 Symbols) — Bull / Range / Bear in one column
// -----------------------------------------------------------------------------
// For each symbol, evaluates Bull and Bear conditions on Daily, Weekly, Monthly
// (same Layer-1 trend/momentum + Layer-2 volume rules used in the bull/bear
// screeners). Each TF contributes +1 (Bull), -1 (Bear), or 0 (Neither) to a
// composite score [-3, +3], which maps to a single regime label.
//
// 13 symbols \* 3 TFs = 39 request.security() calls (Pine v5 cap = 40).
// =============================================================================
indicator("MTF Regime Classifier (13 Symbols)",
shorttitle = "Regime 13",
overlay = true)

// -----------------------------------------------------------------------------
// INPUTS
// -----------------------------------------------------------------------------
grpTrend = "Trend / Momentum"
emaFast = input.int(9, "Fast EMA", minval = 1, group = grpTrend)
emaMed = input.int(21, "Medium EMA", minval = 1, group = grpTrend)
emaSlow = input.int(50, "Slow EMA", minval = 1, group = grpTrend)
emaTrend = input.int(200, "Trend EMA", minval = 1, group = grpTrend)

macdFast = input.int(12, "MACD Fast", minval = 1, group = grpTrend)
macdSlow = input.int(26, "MACD Slow", minval = 1, group = grpTrend)
macdSignal = input.int(9, "MACD Signal", minval = 1, group = grpTrend)

grpVol = "Volume Confirmation"
obvEmaLen = input.int(20, "OBV EMA Length", minval = 1, group = grpVol)
volSmaLen = input.int(20, "Volume SMA Length", minval = 1, group = grpVol)

grpScore = "Scoring"
trendCut = input.int(2, "|Score| >= this = Trend (else Range)",
minval = 1, maxval = 3, group = grpScore)
strongCut = input.int(3, "|Score| >= this = Strong Trend",
minval = 2, maxval = 3, group = grpScore)

grpTbl = "Table"
tblPos = input.string("top_right", "Position", options = ["top_left","top_right","top_center","middle_left","middle_right","middle_center", "bottom_left","bottom_right","bottom_center"],group = grpTbl)

// -----------------------------------------------------------------------------
// SYMBOL LIST (13)
// -----------------------------------------------------------------------------
sym1 = "NASDAQ:QQQ"
sym2 = "AMEX:SPY"
sym3 = "NASDAQ:NVDA"
sym4 = "NASDAQ:GOOGL"
sym5 = "NASDAQ:AMZN"
sym6 = "NASDAQ:META"
sym7 = "NASDAQ:TSLA"
sym8 = "NASDAQ:AVGO"
sym9 = "NASDAQ:AMD"
sym10 = "NASDAQ:NFLX"
sym11 = "NASDAQ:MSFT"
sym12 = "NASDAQ:AAPL"
sym13 = "AMEX:IWM"

// -----------------------------------------------------------------------------
// CORE — returns [isBull, isBear] for the current security context
// -----------------------------------------------------------------------------
calcRegime() =>
eFast = ta.ema(close, emaFast)
eMed = ta.ema(close, emaMed)
eSlow = ta.ema(close, emaSlow)
eTrend = ta.ema(close, emaTrend)

    [macdLine, signalLine, histLine] = ta.macd(close, macdFast, macdSlow, macdSignal)

    obvVal = ta.obv
    obvEma = ta.ema(obvVal, obvEmaLen)
    volSma = ta.sma(volume, volSmaLen)

    obvReady = bar_index >= obvEmaLen
    volReady = bar_index >= volSmaLen

    // Layer 2 - volume confirmation (vol > SMA is required for both regimes;
    // OBV side differs: accumulation for bull, distribution for bear)
    volConfirm = volReady and (volume > volSma)
    obvBull    = obvReady and (obvVal > obvEma)
    obvBear    = obvReady and (obvVal < obvEma)

    // Bull layer 1
    bullCascade = (eFast > eMed) and (eMed > eSlow)
    bullSlope   = (eFast > eFast[1]) and (eMed > eMed[1]) and (eSlow > eSlow[1])
    bullMacd    = (macdLine > signalLine) and (histLine > 0)
    bullTrend   = close > eTrend
    isBull      = bullTrend and bullCascade and bullSlope and bullMacd and obvBull and volConfirm

    // Bear layer 1
    bearCascade = (eFast < eMed) and (eMed < eSlow)
    bearSlope   = (eFast < eFast[1]) and (eMed < eMed[1]) and (eSlow < eSlow[1])
    bearMacd    = (macdLine < signalLine) and (histLine < 0)
    bearTrend   = close < eTrend
    isBear      = bearTrend and bearCascade and bearSlope and bearMacd and obvBear and volConfirm

    [isBull, isBear]

f_d(\_s) => request.security(\_s, "D", calcRegime(), lookahead = barmerge.lookahead_off)
f_w(\_s) => request.security(\_s, "W", calcRegime(), lookahead = barmerge.lookahead_off)
f_m(\_s) => request.security(\_s, "M", calcRegime(), lookahead = barmerge.lookahead_off)

// -----------------------------------------------------------------------------
// PER-SYMBOL: fetch D/W/M and compute composite score
// -----------------------------------------------------------------------------
// score = (+1 if bull / -1 if bear / 0) summed across D,W,M → range [-3, +3]
f_score(\_sym) =>
[dB, dBr] = f_d(\_sym)
[wB, wBr] = f_w(\_sym)
[mB, mBr] = f_m(\_sym)
s = (dB ? 1 : dBr ? -1 : 0) + (wB ? 1 : wBr ? -1 : 0) + (mB ? 1 : mBr ? -1 : 0)
// Also return per-TF labels for tooltip
dLbl = dB ? "Bull" : dBr ? "Bear" : "Neutral"
wLbl = wB ? "Bull" : wBr ? "Bear" : "Neutral"
mLbl = mB ? "Bull" : mBr ? "Bear" : "Neutral"
[s, dLbl, wLbl, mLbl]

[score1, d1L, w1L, m1L] = f_score(sym1)
[score2, d2L, w2L, m2L] = f_score(sym2)
[score3, d3L, w3L, m3L] = f_score(sym3)
[score4, d4L, w4L, m4L] = f_score(sym4)
[score5, d5L, w5L, m5L] = f_score(sym5)
[score6, d6L, w6L, m6L] = f_score(sym6)
[score7, d7L, w7L, m7L] = f_score(sym7)
[score8, d8L, w8L, m8L] = f_score(sym8)
[score9, d9L, w9L, m9L] = f_score(sym9)
[score10, d10L, w10L, m10L] = f_score(sym10)
[score11, d11L, w11L, m11L] = f_score(sym11)
[score12, d12L, w12L, m12L] = f_score(sym12)
[score13, d13L, w13L, m13L] = f_score(sym13)

// -----------------------------------------------------------------------------
// REGIME MAPPING
// -----------------------------------------------------------------------------
f_regimeLabel(\_s) =>
abs_s = math.abs(\_s)
abs_s >= strongCut and \_s > 0 ? "🟢🟢 Strong Bull" :
abs_s >= trendCut and \_s > 0 ? "🟢 Bull" :
abs_s >= strongCut and \_s < 0 ? "🔴🔴 Strong Bear" :
abs_s >= trendCut and \_s < 0 ? "🔴 Bear" :
"⚪ Range"

f_regimeColor(\_s) =>
abs_s = math.abs(\_s)
abs_s >= strongCut and \_s > 0 ? color.new(color.lime, 30) :
abs_s >= trendCut and \_s > 0 ? color.new(color.green, 50) :
abs_s >= strongCut and \_s < 0 ? color.new(color.red, 30) :
abs_s >= trendCut and \_s < 0 ? color.new(color.maroon, 50) :
color.new(color.gray, 70)

f_tooltip(\_dL, \_wL, \_mL, \_s) =>
"Daily: " + \_dL + "\n" +"Weekly: " + \_wL + "\n" + "Monthly: " + \_mL + "\n" +"Score: " + str.tostring(\_s)

// -----------------------------------------------------------------------------
// TABLE (Symbol | Regime - one column for regime as requested)
// -----------------------------------------------------------------------------
f_pos(\_p) =>
\_p == "top_left" ? position.top_left :
\_p == "top_center" ? position.top_center :
\_p == "top_right" ? position.top_right :
\_p == "middle_left" ? position.middle_left :
\_p == "middle_right" ? position.middle_right :
\_p == "middle_center" ? position.middle_center :
\_p == "bottom_left" ? position.bottom_left :
\_p == "bottom_center" ? position.bottom_center :
position.bottom_right

// 2 columns (Symbol, Regime), 14 rows (header + 13 tickers)
var table tbl = table.new(f_pos(tblPos), 2, 14,
border_width = 1,
frame_color = color.gray,
frame_width = 1)

f_row(\_r, \_sym, \_score, \_dL, \_wL, \_mL) =>
bg = f_regimeColor(\_score)
lbl = f_regimeLabel(\_score) + " (" + str.tostring(\_score) + ")"
tt = f_tooltip(\_dL, \_wL, \_mL, \_score)
table.cell(tbl, 0, \_r, \_sym,
bgcolor = bg,
text_color = color.white,
text_size = size.small,
tooltip = tt)
table.cell(tbl, 1, \_r, lbl,
bgcolor = bg,
text_color = color.white,
text_size = size.small,
tooltip = tt)

if barstate.islast
hdrBg = color.new(color.black, 60)
table.cell(tbl, 0, 0, "Symbol", bgcolor = hdrBg, text_color = color.white, text_size = size.small)
table.cell(tbl, 1, 0, "Regime", bgcolor = hdrBg, text_color = color.white, text_size = size.small)

    f_row(1,  sym1,  score1,  d1L,  w1L,  m1L)
    f_row(2,  sym2,  score2,  d2L,  w2L,  m2L)
    f_row(3,  sym3,  score3,  d3L,  w3L,  m3L)
    f_row(4,  sym4,  score4,  d4L,  w4L,  m4L)
    f_row(5,  sym5,  score5,  d5L,  w5L,  m5L)
    f_row(6,  sym6,  score6,  d6L,  w6L,  m6L)
    f_row(7,  sym7,  score7,  d7L,  w7L,  m7L)
    f_row(8,  sym8,  score8,  d8L,  w8L,  m8L)
    f_row(9,  sym9,  score9,  d9L,  w9L,  m9L)
    f_row(10, sym10, score10, d10L, w10L, m10L)
    f_row(11, sym11, score11, d11L, w11L, m11L)
    f_row(12, sym12, score12, d12L, w12L, m12L)
    f_row(13, sym13, score13, d13L, w13L, m13L)

// -----------------------------------------------------------------------------
// ALERTS - regime transitions
// -----------------------------------------------------------------------------
// "Turned Bull" = score crossed above (trendCut - 1), i.e. entered +trendCut zone
// "Turned Bear" = score crossed below -(trendCut - 1)
// "Entered Range" = score moved from outside [-trendCut+1, +trendCut-1] into it
f_enteredBull(\_s) => \_s >= trendCut and \_s[1] < trendCut
f_enteredBear(\_s) => \_s <= -trendCut and \_s[1] > -trendCut
f_enteredRange(\_s) => math.abs(\_s) < trendCut and math.abs(\_s[1]) >= trendCut

anyNewBull = f_enteredBull(score1) or f_enteredBull(score2) or f_enteredBull(score3) or
f_enteredBull(score4) or f_enteredBull(score5) or f_enteredBull(score6) or
f_enteredBull(score7) or f_enteredBull(score8) or f_enteredBull(score9) or
f_enteredBull(score10) or f_enteredBull(score11) or f_enteredBull(score12) or
f_enteredBull(score13)

anyNewBear = f_enteredBear(score1) or f_enteredBear(score2) or f_enteredBear(score3) or
f_enteredBear(score4) or f_enteredBear(score5) or f_enteredBear(score6) or
f_enteredBear(score7) or f_enteredBear(score8) or f_enteredBear(score9) or
f_enteredBear(score10) or f_enteredBear(score11) or f_enteredBear(score12) or
f_enteredBear(score13)

anyEnteredRange = f_enteredRange(score1) or f_enteredRange(score2) or f_enteredRange(score3) or
f_enteredRange(score4) or f_enteredRange(score5) or f_enteredRange(score6) or
f_enteredRange(score7) or f_enteredRange(score8) or f_enteredRange(score9) or
f_enteredRange(score10) or f_enteredRange(score11) or f_enteredRange(score12) or
f_enteredRange(score13)

alertcondition(anyNewBull,
title = "Regime: New Bull",
message = "A watchlist symbol just turned BULL regime")

alertcondition(anyNewBear,
title = "Regime: New Bear",
message = "A watchlist symbol just turned BEAR regime")

alertcondition(anyEnteredRange,
title = "Regime: Entered Range",
message = "A watchlist symbol just exited a trend into RANGE")
