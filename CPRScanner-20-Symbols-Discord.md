//@version=6
indicator("CPR Scanner — 20 Symbols + Discord", overlay=true)

// ========================
// 40 symbols
// ========================
sym1 = "AMEX:SPY"
sym2 = "NASDAQ:QQQ"
sym3 = "AMEX:IWM"
sym4 = "NASDAQ:AAPL"
sym5 = "NASDAQ:NVDA"
sym6 = "NASDAQ:TSLA"
sym7 = "NASDAQ:AMZN"
sym8 = "NASDAQ:META"
sym9 = "NASDAQ:MSFT"
sym10 = "NASDAQ:GOOGL"
sym11 = "NASDAQ:AMD"
sym12 = "NASDAQ:COIN"
sym13 = "NASDAQ:PLTR"
sym14 = "NASDAQ:NFLX"
sym15 = "NASDAQ:AVGO"
sym16 = "NYSE:BA"
sym17 = "NASDAQ:INTC"
sym18 = "NYSE:BAC"
sym19 = "NASDAQ:MU"
sym20 = "NYSE:DIS"
disp1 = "SPY"
disp2 = "QQQ"
disp3 = "IWM"
disp4 = "AAPL"
disp5 = "NVDA"
disp6 = "TSLA"
disp7 = "AMZN"
disp8 = "META"
disp9 = "MSFT"
disp10 = "GOOGL"
disp11 = "AMD"
disp12 = "COIN"
disp13 = "PLTR"
disp14 = "NFLX"
disp15 = "AVGO"
disp16 = "BA"
disp17 = "INTC"
disp18 = "BAC"
disp19 = "MU"
disp20 = "DIS"

// ========================
// Per-symbol fetch + signal (1 request.security call per symbol)
// ========================
f_scan(string sym) =>
[dH, dL, dC, dClose, dRsi, dVol, dVolSma, wH, wL, wC] = request.security(sym, "D",
[high[1], low[1], close[1], close, ta.rsi(close, 14), volume, ta.sma(volume, 20),
ta.highest(high, 5)[1], ta.lowest(low, 5)[1], close[5]],
lookahead=barmerge.lookahead_off)

    dPP = (dH + dL + dC) / 3
    dBC = (dH + dL) / 2
    dTC = 2 * dPP - dBC
    wPP = (wH + wL + wC) / 3

    volOK   = na(dVol) or na(dVolSma) ? false : dVol > dVolSma
    bullish = dClose > dTC and dClose > wPP and dRsi > 50 and volOK
    bearish = dClose < dBC and dClose < wPP and dRsi < 50 and volOK
    signal  = bullish ? "🔵" : bearish ? "🔴" : "⚪"
    sigCol  = bullish ? color.new(color.green, 0) : bearish ? color.new(color.red, 0) : color.new(color.gray, 0)

    [dClose, signal, sigCol, dRsi, volOK, bullish, bearish]

[p1, s1, c1, r1, v1, b1, x1] = f_scan(sym1)
[p2, s2, c2, r2, v2, b2, x2] = f_scan(sym2)
[p3, s3, c3, r3, v3, b3, x3] = f_scan(sym3)
[p4, s4, c4, r4, v4, b4, x4] = f_scan(sym4)
[p5, s5, c5, r5, v5, b5, x5] = f_scan(sym5)
[p6, s6, c6, r6, v6, b6, x6] = f_scan(sym6)
[p7, s7, c7, r7, v7, b7, x7] = f_scan(sym7)
[p8, s8, c8, r8, v8, b8, x8] = f_scan(sym8)
[p9, s9, c9, r9, v9, b9, x9] = f_scan(sym9)
[p10, s10, c10, r10, v10, b10, x10] = f_scan(sym10)
[p11, s11, c11, r11, v11, b11, x11] = f_scan(sym11)
[p12, s12, c12, r12, v12, b12, x12] = f_scan(sym12)
[p13, s13, c13, r13, v13, b13, x13] = f_scan(sym13)
[p14, s14, c14, r14, v14, b14, x14] = f_scan(sym14)
[p15, s15, c15, r15, v15, b15, x15] = f_scan(sym15)
[p16, s16, c16, r16, v16, b16, x16] = f_scan(sym16)
[p17, s17, c17, r17, v17, b17, x17] = f_scan(sym17)
[p18, s18, c18, r18, v18, b18, x18] = f_scan(sym18)
[p19, s19, c19, r19, v19, b19, x19] = f_scan(sym19)
[p20, s20, c20, r20, v20, b20, x20] = f_scan(sym20)

// ========================
// Discord alerts on signal flips
// Message body is Discord webhook JSON: {"content":"..."}
// ========================
f_alert(string disp, float price, bool bullish, bool bearish, float rsi) =>
bullishFlip = bullish and not bullish[1]
bearishFlip = bearish and not bearish[1]
if barstate.isconfirmed and bullishFlip
alert('{"content":"🔵 ' + disp + ' turned BULLISH at ' + str.tostring(price, "#.##") + ' | RSI: ' + str.tostring(rsi, "#.#") + '"}', alert.freq_once_per_bar_close)
if barstate.isconfirmed and bearishFlip
alert('{"content":"🔴 ' + disp + ' turned BEARISH at ' + str.tostring(price, "#.##") + ' | RSI: ' + str.tostring(rsi, "#.#") + '"}', alert.freq_once_per_bar_close)

f_alert(disp1, p1, b1, x1, r1)
f_alert(disp2, p2, b2, x2, r2)
f_alert(disp3, p3, b3, x3, r3)
f_alert(disp4, p4, b4, x4, r4)
f_alert(disp5, p5, b5, x5, r5)
f_alert(disp6, p6, b6, x6, r6)
f_alert(disp7, p7, b7, x7, r7)
f_alert(disp8, p8, b8, x8, r8)
f_alert(disp9, p9, b9, x9, r9)
f_alert(disp10, p10, b10, x10, r10)
f_alert(disp11, p11, b11, x11, r11)
f_alert(disp12, p12, b12, x12, r12)
f_alert(disp13, p13, b13, x13, r13)
f_alert(disp14, p14, b14, x14, r14)
f_alert(disp15, p15, b15, x15, r15)
f_alert(disp16, p16, b16, x16, r16)
f_alert(disp17, p17, b17, x17, r17)
f_alert(disp18, p18, b18, x18, r18)
f_alert(disp19, p19, b19, x19, r19)
f_alert(disp20, p20, b20, x20, r20)

// ========================
// Table (5 columns, 41 rows = header + 40 symbols)
// ========================
var table t = table.new(position.top_right, 5, 41, bgcolor=color.new(color.black, 30), border_width=1, border_color=color.new(color.gray, 50))

f_row(int row, string disp, float price, string sig, color sigCol, float rsi, bool volOK) =>
table.cell(t, 0, row, disp, text_color=color.white, text_size=size.small)
table.cell(t, 1, row, str.tostring(price, "#.##"), text_color=color.white, text_size=size.small)
table.cell(t, 2, row, sig, text_color=sigCol, text_size=size.small)
table.cell(t, 3, row, str.tostring(rsi, "#.#"), text_color=rsi > 50 ? color.lime : rsi < 50 ? color.red : color.white, text_size=size.small)
table.cell(t, 4, row, volOK ? "✓" : "✗", text_color=volOK ? color.lime : color.red, text_size=size.small)

if barstate.isconfirmed
table.cell(t, 0, 0, "Symbol", text_color=color.yellow, text_size=size.small)
table.cell(t, 1, 0, "Price", text_color=color.yellow, text_size=size.small)
table.cell(t, 2, 0, "Sig", text_color=color.yellow, text_size=size.small)
table.cell(t, 3, 0, "RSI", text_color=color.yellow, text_size=size.small)
table.cell(t, 4, 0, "Vol>SMA", text_color=color.yellow, text_size=size.small)

    f_row(1,  disp1,  p1,  s1,  c1,  r1,  v1)
    f_row(2,  disp2,  p2,  s2,  c2,  r2,  v2)
    f_row(3,  disp3,  p3,  s3,  c3,  r3,  v3)
    f_row(4,  disp4,  p4,  s4,  c4,  r4,  v4)
    f_row(5,  disp5,  p5,  s5,  c5,  r5,  v5)
    f_row(6,  disp6,  p6,  s6,  c6,  r6,  v6)
    f_row(7,  disp7,  p7,  s7,  c7,  r7,  v7)
    f_row(8,  disp8,  p8,  s8,  c8,  r8,  v8)
    f_row(9,  disp9,  p9,  s9,  c9,  r9,  v9)
    f_row(10, disp10, p10, s10, c10, r10, v10)
    f_row(11, disp11, p11, s11, c11, r11, v11)
    f_row(12, disp12, p12, s12, c12, r12, v12)
    f_row(13, disp13, p13, s13, c13, r13, v13)
    f_row(14, disp14, p14, s14, c14, r14, v14)
    f_row(15, disp15, p15, s15, c15, r15, v15)
    f_row(16, disp16, p16, s16, c16, r16, v16)
    f_row(17, disp17, p17, s17, c17, r17, v17)
    f_row(18, disp18, p18, s18, c18, r18, v18)
    f_row(19, disp19, p19, s19, c19, r19, v19)
    f_row(20, disp20, p20, s20, c20, r20, v20)
