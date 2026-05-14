//@version=6
indicator("0DTE Scanner — CPR + VWAP + ATR Filters", overlay=true)

// === Inputs ===
useVolume = input.bool(true, "Require volume > SMA(20)", group="Base filters")
useRSI = input.bool(true, "Require RSI bias (>50 bull, <50 bear)", group="Base filters")

useCprWidth = input.bool(true, "Only trade narrow-CPR days", group="CPR Width")
cprNarrowMult = input.float(0.6, "Narrow if today width < mult × N-day avg",
minval=0.1, maxval=2.0, step=0.05, group="CPR Width")
cprAvgLen = input.int(7, "CPR width average length (days)",
minval=2, group="CPR Width")

useVwap = input.bool(true, "Require VWAP alignment (calls>VWAP / puts<VWAP)",group="VWAP")

useAtrBuf = input.bool(true, "Require ATR buffer past level (no-wick filter)", group="ATR Buffer")
atrBufMult = input.float(0.10, "Buffer = mult × daily ATR(14)",
minval=0.0, maxval=1.0, step=0.05, group="ATR Buffer")

// === Daily fetch: pivots, RSI, volume, ATR, CPR width & its rolling average ===
f_calc() =>
yH = high[1]
yL = low[1]
yC = close[1]
c = close
pp = (yH + yL + yC) / 3
bc = (yH + yL) / 2
tc = 2 _ pp - bc
r1 = 2 _ pp - yL
s1 = 2 \* pp - yH
rsi = ta.rsi(close, 14)
vol = volume
volSma = ta.sma(volume, 20)
dAtr = ta.atr(14)
cprW = tc - bc
cprWavg = ta.sma(cprW, cprAvgLen)
[c, pp, bc, tc, r1, s1, rsi, vol, volSma, dAtr, cprW, cprWavg]

f_fetch(string sym) =>
request.security(sym, "D", f_calc(), lookahead=barmerge.lookahead_off)

// VWAP runs on the chart timeframe (intraday); resets daily by default.
chartVwap = ta.vwap

// === Signal generation with all three new gates ===
f_signals(float c, float bc, float tc, float r1, float s1,
float rsi, float vol, float volSma,
float dAtr, float cprW, float cprWavg) =>
volOK = na(vol) or na(volSma) ? true : vol > volSma
rsiBull = not useRSI or rsi > 50
rsiBear = not useRSI or rsi < 50
volPass = not useVolume or volOK

    // VWAP alignment
    vwapBull = not useVwap or (not na(chartVwap) and c > chartVwap)
    vwapBear = not useVwap or (not na(chartVwap) and c < chartVwap)

    // Narrow-CPR gate (skip breakouts on wide/range days)
    narrow = not useCprWidth or (not na(cprWavg) and cprW < cprWavg * cprNarrowMult)

    // ATR buffer: prior bar at/below the level, current bar's close cleared it by `buf`.
    // Daily ATR keeps the buffer scaled to the symbol — small for SPY, larger for TSLA.
    buf = useAtrBuf and not na(dAtr) ? dAtr * atrBufMult : 0.0

    tcUp = (c > tc + buf) and (c[1] <= tc + buf) and rsiBull and volPass and vwapBull and narrow
    bcDn = (c < bc - buf) and (c[1] >= bc - buf) and rsiBear and volPass and vwapBear and narrow
    r1Up = (c > r1 + buf) and (c[1] <= r1 + buf) and rsiBull and volPass and vwapBull and narrow
    s1Dn = (c < s1 - buf) and (c[1] >= s1 - buf) and rsiBear and volPass and vwapBear and narrow

    [tcUp, bcDn, r1Up, s1Dn, volOK, narrow]

// === Per-symbol ===
[qC, qPP, qBC, qTC, qR1, qS1, qRsi, qVolRaw, qVolSma, qAtr, qCprW, qCprWavg] = f_fetch("NASDAQ:QQQ")
[sC, sPP, sBC, sTC, sR1, sS1, sRsi, sVolRaw, sVolSma, sAtr, sCprW, sCprWavg] = f_fetch("AMEX:SPY")
[xC, xPP, xBC, xTC, xR1, xS1, xRsi, xVolRaw, xVolSma, xAtr, xCprW, xCprWavg] = f_fetch("SP:SPX")
[tC, tPP, tBC, tTC, tR1, tS1, tRsi, tVolRaw, tVolSma, tAtr, tCprW, tCprWavg] = f_fetch("NASDAQ:TSLA")
[mC, mPP, mBC, mTC, mR1, mS1, mRsi, mVolRaw, mVolSma, mAtr, mCprW, mCprWavg] = f_fetch("NASDAQ:META")

[qTcUp, qBcDn, qR1Up, qS1Dn, qVol, qNarrow] = f_signals(qC, qBC, qTC, qR1, qS1, qRsi, qVolRaw, qVolSma, qAtr, qCprW, qCprWavg)
[sTcUp, sBcDn, sR1Up, sS1Dn, sVol, sNarrow] = f_signals(sC, sBC, sTC, sR1, sS1, sRsi, sVolRaw, sVolSma, sAtr, sCprW, sCprWavg)
[xTcUp, xBcDn, xR1Up, xS1Dn, xVol, xNarrow] = f_signals(xC, xBC, xTC, xR1, xS1, xRsi, xVolRaw, xVolSma, xAtr, xCprW, xCprWavg)
[tTcUp, tBcDn, tR1Up, tS1Dn, tVol, tNarrow] = f_signals(tC, tBC, tTC, tR1, tS1, tRsi, tVolRaw, tVolSma, tAtr, tCprW, tCprWavg)
[mTcUp, mBcDn, mR1Up, mS1Dn, mVol, mNarrow] = f_signals(mC, mBC, mTC, mR1, mS1, mRsi, mVolRaw, mVolSma, mAtr, mCprW, mCprWavg)

// === Discord embed alert ===
f_fire(string disp, bool isCall, float price) =>
mo = str.tostring(month(timenow, "America/New_York"))
dy = str.tostring(dayofmonth(timenow, "America/New_York"))
strikeStep = disp == "SPX" ? 5 : 1
strike = math.round(price / strikeStep) \* strikeStep
dirCode = isCall ? "C" : "P"
embedColor = isCall ? 3066993 : 15158332
desc = "**ALERT**\\n\\n**BOUGHT** | " + disp + " " + mo + "/" + dy + " " +
str.tostring(strike) + dirCode + " at " + str.tostring(price, "#.##")
payload = '{"content":"@rbot","embeds":[{"description":"' + desc +
'","color":' + str.tostring(embedColor) + '}]}'
alert(payload, alert.freq_once_per_bar_close)

if barstate.isconfirmed
if qTcUp
f_fire("QQQ", true, qC)
if qR1Up
f_fire("QQQ", true, qC)
if qBcDn
f_fire("QQQ", false, qC)
if qS1Dn
f_fire("QQQ", false, qC)

    if sTcUp
        f_fire("SPY", true,  sC)
    if sR1Up
        f_fire("SPY", true,  sC)
    if sBcDn
        f_fire("SPY", false, sC)
    if sS1Dn
        f_fire("SPY", false, sC)

    if xTcUp
        f_fire("SPX", true,  xC)
    if xR1Up
        f_fire("SPX", true,  xC)
    if xBcDn
        f_fire("SPX", false, xC)
    if xS1Dn
        f_fire("SPX", false, xC)

    if tTcUp
        f_fire("TSLA", true,  tC)
    if tR1Up
        f_fire("TSLA", true,  tC)
    if tBcDn
        f_fire("TSLA", false, tC)
    if tS1Dn
        f_fire("TSLA", false, tC)

    if mTcUp
        f_fire("META", true,  mC)
    if mR1Up
        f_fire("META", true,  mC)
    if mBcDn
        f_fire("META", false, mC)
    if mS1Dn
        f_fire("META", false, mC)

// === Live status table (now includes CPR-width status) ===
var table t = table.new(position.top_right, 8, 6,
bgcolor=color.new(color.black, 30),
border_width=1, border_color=color.new(color.gray, 50))

f_row(int row, string disp, float price, float bc, float tc, float r1, float s1,
float rsi, bool volOK, bool narrow) =>
bias = price > tc ? "🔵" : price < bc ? "🔴" : "⚪"
biasCol = price > tc ? color.lime : price < bc ? color.red : color.gray
table.cell(t, 0, row, disp, text_color=color.white)
table.cell(t, 1, row, str.tostring(price, "#.##"), text_color=color.white)
table.cell(t, 2, row, "BC " + str.tostring(bc, "#.##") + " / TC " + str.tostring(tc, "#.##"), text_color=color.gray)
table.cell(t, 3, row, "S1 " + str.tostring(s1, "#.##") + " / R1 " + str.tostring(r1, "#.##"), text_color=color.gray)
table.cell(t, 4, row, str.tostring(rsi, "#.#"), text_color=rsi > 50 ? color.lime : color.red)
table.cell(t, 5, row, volOK ? "✓" : "✗", text_color=volOK ? color.lime : color.red)
table.cell(t, 6, row, narrow ? "N" : "W", text_color=narrow ? color.lime : color.orange,
tooltip="N = narrow CPR (trending-day setup) → breakouts allowed\nW = wide CPR (range/chop day) → breakouts blocked")
table.cell(t, 7, row, bias, text_color=biasCol)

if barstate.isconfirmed
table.cell(t, 0, 0, "Sym", text_color=color.yellow)
table.cell(t, 1, 0, "Price", text_color=color.yellow)
table.cell(t, 2, 0, "CPR", text_color=color.yellow)
table.cell(t, 3, 0, "S1/R1", text_color=color.yellow)
table.cell(t, 4, 0, "RSI", text_color=color.yellow)
table.cell(t, 5, 0, "Vol", text_color=color.yellow)
table.cell(t, 6, 0, "CPRw", text_color=color.yellow)
table.cell(t, 7, 0, "Bias", text_color=color.yellow)
f_row(1, "QQQ", qC, qBC, qTC, qR1, qS1, qRsi, qVol, qNarrow)
f_row(2, "SPY", sC, sBC, sTC, sR1, sS1, sRsi, sVol, sNarrow)
f_row(3, "SPX", xC, xBC, xTC, xR1, xS1, xRsi, xVol, xNarrow)
f_row(4, "TSLA", tC, tBC, tTC, tR1, tS1, tRsi, tVol, tNarrow)
f_row(5, "META", mC, mBC, mTC, mR1, mS1, mRsi, mVol, mNarrow)
