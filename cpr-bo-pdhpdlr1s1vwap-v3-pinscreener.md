//@version=5
indicator("PINE-SCREENER - CPR Breakout (PDH/PDL/R1/S1 + VWAP + RSI + ATR + HTF Bias)", overlay=true, max_labels_count=500)

// ===========================
// Inputs — Base filters
// ===========================
grpBase = "Base filters"

useVolume = input.bool(true, "Require volume >= MA × mult", group=grpBase)
useRSI = input.bool(true, "Require RSI bias (>50 calls / <50 puts)", group=grpBase)
useVwap = input.bool(true, "Require VWAP alignment (calls>VWAP / puts<VWAP)", group=grpBase)
useAtrBuf = input.bool(true, "Require ATR buffer past level (no-wick filter)", group=grpBase)
respectBias = input.bool(true, "Respect Opening Bias", group=grpBase)

// ===========================
// Inputs — Bias Filters
// ===========================
useHTFBias = input.bool(true, "Use Higher‑Timeframe Bias (1H)", group="Bias Filters")

// ===========================
// Inputs — Params
// ===========================
sessionInput = input.session("0930-1600", "Regular Session")
volLen = input.int(20, "Volume MA Length", minval=1)
volMult = input.float(1.1,"Volume Multiplier", minval=0.1, step=0.1)
rsiLen = input.int(14, "RSI Length", minval=2)
atrBufMult = input.float(0.10,"ATR Buffer = mult × daily ATR(14)", minval=0.0, maxval=1.0, step=0.05)
oneSignalPerDirDay = input.bool(true,"One Signal Per Direction Per Day")

// ===========================
// Inputs — Debug
// ===========================
debugMode = input.bool(true, "Debug Mode (show gate markers)")
allowOutOfSession = input.bool(true, "DEBUG: Allow signals outside session")
ignoreVolumeGate = input.bool(false,"DEBUG: Ignore volume gate")
ignoreBiasGate = input.bool(true, "DEBUG: Ignore bias gate")
ignoreDailyLimit = input.bool(true, "DEBUG: Ignore one-signal-per-day")

showValuesLabel = input.bool(true, "Show Last-Bar Debug Label")
showLevelPlots = input.bool(true, "Plot Levels")
showJsonAlerts = input.bool(false,"Send JSON alert() payloads")

// ===========================
// Inputs — Pine Screener
// ===========================
grpScr = "Pine Screener"
emitScreenerColumns = input.bool(true, "Emit Screener Columns", group=grpScr)
recencyBars = input.int(10, "Bars to keep 'recent' signal active",
minval=1, maxval=200, group=grpScr)

// ===========================
// Preset → effective gate booleans (Custom-only mode)
// ===========================
eUseVolume = useVolume
eUseRSI = useRSI
eUseBias = respectBias
eUseVwap = useVwap
eUseAtrBuf = useAtrBuf

// ===========================
// Session state
// ===========================
inSession = not na(time(timeframe.period, sessionInput))
newSessionBar = inSession and not inSession[1]

// ===========================
// Previous-day levels + CPR + R1/S1
// ===========================
pdh = request.security(syminfo.tickerid, "D", high[1], lookahead=barmerge.lookahead_on)
pdl = request.security(syminfo.tickerid, "D", low[1], lookahead=barmerge.lookahead_on)
pdc = request.security(syminfo.tickerid, "D", close[1], lookahead=barmerge.lookahead_on)

pivot = (pdh + pdl + pdc) / 3.0
bcRaw = (pdh + pdl) / 2.0
tcRaw = 2.0 _ pivot - bcRaw
tc = math.max(tcRaw, bcRaw)
bc = math.min(tcRaw, bcRaw)
r1 = 2.0 _ pivot - pdl
s1 = 2.0 \* pivot - pdh

// Daily ATR (yesterday-completed; safe for buffer sizing)
dAtr = request.security(syminfo.tickerid, "D", ta.atr(14)[1], lookahead=barmerge.lookahead_on)

// VWAP & RSI on chart timeframe
vwapVal = ta.vwap(hlc3)
rsiVal = ta.rsi(close, rsiLen)

// ATR buffer (0 when gate off)
buf = eUseAtrBuf and not na(dAtr) ? dAtr \* atrBufMult : 0.0

// ===========================
// Break helpers (buffer-aware)
// ===========================
brokeAbove(level, b) =>
close > level + b and close[1] <= level + b

brokeBelow(level, b) =>
close < level - b and close[1] >= level - b

// ===========================
// Volume gate
// ===========================
volMA = ta.sma(volume, volLen)
volOkRaw = volume >= volMA \* volMult
volOk = ignoreVolumeGate ? true : (eUseVolume ? volOkRaw : true)

sessionOk = allowOutOfSession ? true : inSession

// ===========================
// Bias state machine
// ===========================
var string openingBias = "UNSET"
var string activeBias = "UNSET"
var bool callFiredToday = false
var bool putFiredToday = false

if newSessionBar
openingBias := open > tc ? "BULLISH" : open < bc ? "BEARISH" : "RANGE"
activeBias := openingBias
callFiredToday := false
putFiredToday := false

if sessionOk and activeBias == "RANGE"
if close > tc
activeBias := "BULLISH"
else if close < bc
activeBias := "BEARISH"

// ===============================
// Multi‑Timeframe Bias Module (with toggle)
// ===============================

// Pull higher‑timeframe bias (1H) — uses the same activeBias series evaluated on 60m
h1_bias = request.security(syminfo.tickerid, "60", activeBias, lookahead=barmerge.lookahead_off)

// Convert HTF bias into booleans (matches the "BULLISH"/"BEARISH" values produced above)
h1Bull = h1_bias == "BULLISH"
h1Bear = h1_bias == "BEARISH"

// Apply HTF filter only when toggle is ON
htfAllowsCall = not useHTFBias or h1Bull
htfAllowsPut = not useHTFBias or h1Bear

// ===========================
// Break logic
// ===========================
crossPDH = brokeAbove(pdh, buf)
crossR1 = brokeAbove(r1, buf)
crossPDL = brokeBelow(pdl, buf)
crossS1 = brokeBelow(s1, buf)

bullBreakRaw = (crossPDH or crossR1) and barstate.isconfirmed
bearBreakRaw = (crossPDL or crossS1) and barstate.isconfirmed

// ===========================
// Gates
// ===========================
biasAllowsCall = ignoreBiasGate ? true : (eUseBias ? activeBias == "BULLISH" : true)
biasAllowsPut = ignoreBiasGate ? true : (eUseBias ? activeBias == "BEARISH" : true)

vwapAllowsCall = not eUseVwap or (not na(vwapVal) and close > vwapVal)
vwapAllowsPut = not eUseVwap or (not na(vwapVal) and close < vwapVal)

rsiAllowsCall = not eUseRSI or (not na(rsiVal) and rsiVal > 50)
rsiAllowsPut = not eUseRSI or (not na(rsiVal) and rsiVal < 50)

dailyCallOk = ignoreDailyLimit ? true : (oneSignalPerDirDay ? not callFiredToday : true)
dailyPutOk = ignoreDailyLimit ? true : (oneSignalPerDirDay ? not putFiredToday : true)

// Combine HTF bias with existing LTF filters
allowCall = htfAllowsCall and rsiAllowsCall and vwapAllowsCall and biasAllowsCall
allowPut = htfAllowsPut and rsiAllowsPut and vwapAllowsPut and biasAllowsPut

// ===========================
// Final signals
// ===========================
callSignal = sessionOk and volOk and bullBreakRaw and allowCall and dailyCallOk
putSignal = sessionOk and volOk and bearBreakRaw and allowPut and dailyPutOk

if callSignal
callFiredToday := true
if putSignal
putFiredToday := true

// ===========================
// Screener encodings & recency
// ===========================

// Encode string biases as numbers for screener sorting/filtering
biasToNum(b) =>
b == "BULLISH" ? 1.0 : b == "BEARISH" ? -1.0 : b == "RANGE" ? 0.0 : na

activeBiasNum = biasToNum(activeBias)
h1BiasNum = biasToNum(h1_bias)
openBiasNum = biasToNum(openingBias)

// Net signal: +1 CALL, -1 PUT, 0 none
signalScore = callSignal ? 1 : putSignal ? -1 : 0

// Bars since last fire (per direction) — useful for sorting by recency
var int barsSinceCallFire = na
var int barsSincePutFire = na
if callSignal
barsSinceCallFire := 0
else if not na(barsSinceCallFire)
barsSinceCallFire := barsSinceCallFire + 1
if putSignal
barsSincePutFire := 0
else if not na(barsSincePutFire)
barsSincePutFire := barsSincePutFire + 1

// "Recent" flags — true if a signal fired within the last N bars
recentCall = not na(barsSinceCallFire) and barsSinceCallFire <= recencyBars
recentPut = not na(barsSincePutFire) and barsSincePutFire <= recencyBars

// Context metrics (percent-normalized so they're comparable across stocks)
vwapDeltaPct = not na(vwapVal) and vwapVal != 0 ? (close - vwapVal) / vwapVal _ 100.0 : na
distPDHPct = not na(pdh) and pdh != 0 ? (close - pdh) / pdh _ 100.0 : na
distPDLPct = not na(pdl) and pdl != 0 ? (close - pdl) / pdl _ 100.0 : na
distR1Pct = not na(r1) and r1 != 0 ? (close - r1) / r1 _ 100.0 : na
distS1Pct = not na(s1) and s1 != 0 ? (close - s1) / s1 \* 100.0 : na
volRatio = not na(volMA) and volMA != 0 ? volume / volMA : na

// ===========================
// Plots — levels & VWAP (chart pane)
// ===========================
plot(showLevelPlots ? pdh : na, title="PDH", color=color.new(color.green, 0), linewidth=1)
plot(showLevelPlots ? pdl : na, title="PDL", color=color.new(color.red, 0), linewidth=1)
plot(showLevelPlots ? tc : na, title="TC", color=color.new(color.orange, 0), linewidth=1)
plot(showLevelPlots ? bc : na, title="BC", color=color.new(color.orange, 0), linewidth=1)
plot(showLevelPlots ? r1 : na, title="R1", color=color.new(color.lime, 20), linewidth=1)
plot(showLevelPlots ? s1 : na, title="S1", color=color.new(color.maroon, 20), linewidth=1)
plot(showLevelPlots ? vwapVal : na, title="VWAP", color=color.new(color.blue, 0), linewidth=2)

// Final markers
plotshape(callSignal, title="CALL Final", style=shape.triangleup,
location=location.belowbar, color=color.new(color.green, 0), size=size.small, text="CALL")
plotshape(putSignal, title="PUT Final", style=shape.triangledown,
location=location.abovebar, color=color.new(color.red, 0), size=size.small, text="PUT")

// ===========================
// Pine Screener columns
// These plots become sortable columns in Pine Screener.
// display.data_window keeps them out of the price pane to avoid clutter.
// ===========================
plot(emitScreenerColumns ? signalScore : na, title="Signal (+1 Call / -1 Put)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns and recentCall ? 1 : 0, title="Recent CALL (1/0)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns and recentPut ? 1 : 0, title="Recent PUT (1/0)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? barsSinceCallFire : na, title="Bars Since CALL", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? barsSincePutFire : na, title="Bars Since PUT", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? h1BiasNum : na, title="HTF 1H Bias (+1/-1/0)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? activeBiasNum : na, title="Active Bias (+1/-1/0)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? openBiasNum : na, title="Opening Bias (+1/-1/0)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? rsiVal : na, title="RSI", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? vwapDeltaPct : na, title="VWAP Delta %", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? volRatio : na, title="Volume Ratio (vol/MA)", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? distPDHPct : na, title="Dist to PDH %", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? distPDLPct : na, title="Dist to PDL %", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? distR1Pct : na, title="Dist to R1 %", color=color.new(color.white, 100), display=display.data_window)
plot(emitScreenerColumns ? distS1Pct : na, title="Dist to S1 %", color=color.new(color.white, 100), display=display.data_window)

// ===========================
// Last-bar debug label (Custom-only mode)
// ===========================
if showValuesLabel and barstate.islast
txt =
"inSession=" + str.tostring(inSession) +
"\nsessionOk=" + str.tostring(sessionOk) +
"\nvolOk=" + str.tostring(volOk) +
"\nrsi=" + str.tostring(rsiVal, "#.#") +
"\nrsiAllowsCall=" + str.tostring(rsiAllowsCall) +
"\nrsiAllowsPut=" + str.tostring(rsiAllowsPut) +
"\nvwap=" + str.tostring(vwapVal, "#.##") +
"\nvwapAllowsCall=" + str.tostring(vwapAllowsCall) +
"\nvwapAllowsPut=" + str.tostring(vwapAllowsPut) +
"\ndAtr=" + str.tostring(dAtr, "#.##") +
"\nbuf=" + str.tostring(buf, "#.##") +
"\nopeningBias=" + openingBias +
"\nactiveBias=" + activeBias +
"\nh1_bias=" + h1_bias +
"\nh1Bull=" + str.tostring(h1Bull) +
"\nh1Bear=" + str.tostring(h1Bear) +
"\nhtfAllowsCall=" + str.tostring(htfAllowsCall) +
"\nhtfAllowsPut=" + str.tostring(htfAllowsPut) +
"\ncrossPDH=" + str.tostring(crossPDH) +
"\ncrossR1=" + str.tostring(crossR1) +
"\ncrossPDL=" + str.tostring(crossPDL) +
"\ncrossS1=" + str.tostring(crossS1) +
"\nbiasAllowsCall=" + str.tostring(biasAllowsCall) +
"\nbiasAllowsPut=" + str.tostring(biasAllowsPut) +
"\ncallFiredToday=" + str.tostring(callFiredToday) +
"\nputFiredToday=" + str.tostring(putFiredToday) +
"\nbarsSinceCall=" + str.tostring(barsSinceCallFire) +
"\nbarsSincePut=" + str.tostring(barsSincePutFire)

    label.new(bar_index, high, txt, style=label.style_label_left, textcolor=color.white, color=color.new(color.black, 60))

// ===========================
// Alert conditions
// ===========================
alertcondition(callSignal, "CALL_SIGNAL_DEBUG", "CALL_SIGNAL_DEBUG")
alertcondition(putSignal, "PUT_SIGNAL_DEBUG", "PUT_SIGNAL_DEBUG")

// ===========================
// Optional dynamic JSON alerts
// ===========================
if showJsonAlerts and callSignal
callJson = "{" +
"\"strategy\":\"cpr_breakout_v2\"," +
"\"signal_id\":\"" + syminfo.ticker + "-" + timeframe.period + "-" + str.tostring(time) + "-CALL\"," +
"\"symbol\":\"" + syminfo.ticker + "\"," +
"\"timeframe\":\"" + timeframe.period + "\"," +
"\"action\":\"CALL_SIGNAL\"," +
"\"bar_time\":\"" + str.tostring(time) + "\"," +
"\"close\":" + str.tostring(close) + "," +
"\"volume\":" + str.tostring(volume) + "," +
"\"rsi\":" + str.tostring(rsiVal, "#.##") + "," +
"\"vwap\":" + str.tostring(vwapVal, "#.##") + "," +
"\"trigger\":\"PDH_OR_R1_BREAK\"," +
"\"opening_bias\":\"" + openingBias + "\"," +
"\"active_bias\":\"" + activeBias + "\"," +
"\"htf_bias\":\"" + h1_bias + "\"" +
"}"
alert(callJson, alert.freq_once_per_bar_close)

if showJsonAlerts and putSignal
putJson = "{" +
"\"strategy\":\"cpr_breakout_v2\"," +
"\"signal_id\":\"" + syminfo.ticker + "-" + timeframe.period + "-" + str.tostring(time) + "-PUT\"," +
"\"symbol\":\"" + syminfo.ticker + "\"," +
"\"timeframe\":\"" + timeframe.period + "\"," +
"\"action\":\"PUT_SIGNAL\"," +
"\"bar_time\":\"" + str.tostring(time) + "\"," +
"\"close\":" + str.tostring(close) + "," +
"\"volume\":" + str.tostring(volume) + "," +
"\"rsi\":" + str.tostring(rsiVal, "#.##") + "," +
"\"vwap\":" + str.tostring(vwapVal, "#.##") + "," +
"\"trigger\":\"PDL_OR_S1_BREAK\"," +
"\"opening_bias\":\"" + openingBias + "\"," +
"\"active_bias\":\"" + activeBias + "\"," +
"\"htf_bias\":\"" + h1_bias + "\"" +
"}"
alert(putJson, alert.freq_once_per_bar_close)
