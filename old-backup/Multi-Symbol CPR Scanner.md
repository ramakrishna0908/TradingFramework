//@version=6
indicator("CPR Scanner — 40 Symbols", overlay=true)

// ========================
// 40 symbols
// ========================
// ========================
// 40 symbols
// ========================
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
sym14 = "AMEX:DIA"
sym15 = "NASDAQ:IBIT"
sym16 = "NASDAQ:SOFI"
sym17 = "NASDAQ:MSTR"
sym18 = "NASDAQ:BMNR"
sym19 = "NASDAQ:SMH"
sym20 = "AMEX:ARKK"
sym21 = "NASDAQ:MU"
sym22 = "NASDAQ:INTC"
sym23 = "NASDAQ:AMAT"
sym24 = "NASDAQ:ASML"
sym25 = "NASDAQ:CRWD"
sym26 = "NASDAQ:CRWV"
sym27 = "NYSE:BAC"
sym28 = "NYSE:GS"
sym29 = "NYSE:MS"
sym30 = "NYSE:WFC"
sym31 = "NASDAQ:COIN"
sym32 = "NASDAQ:PLTR"
sym33 = "NASDAQ:SHOP"
sym34 = "NYSE:UBER"
sym35 = "NASDAQ:COST"
sym36 = "NYSE:DIS"
sym37 = "NYSE:BA"
sym38 = "NYSE:LLY"
sym39 = "NYSE:UNH"
sym40 = "NASDAQ:ADBE"

disp1 = "QQQ"
disp2 = "SPY"
disp3 = "NVDA"
disp4 = "GOOGL"
disp5 = "AMZN"
disp6 = "META"
disp7 = "TSLA"
disp8 = "AVGO"
disp9 = "AMD"
disp10 = "NFLX"
disp11 = "MSFT"
disp12 = "AAPL"
disp13 = "IWM"
disp14 = "DIA"
disp15 = "IBIT"
disp16 = "XLF"
disp17 = "XLE"
disp18 = "XLK"
disp19 = "SMH"
disp20 = "ARKK"
disp21 = "MU"
disp22 = "INTC"
disp23 = "AMAT"
disp24 = "ASML"
disp25 = "CRWD"
disp26 = "JPM"
disp27 = "BAC"
disp28 = "GS"
disp29 = "MS"
disp30 = "WFC"
disp31 = "COIN"
disp32 = "PLTR"
disp33 = "SHOP"
disp34 = "UBER"
disp35 = "COST"
disp36 = "DIS"
disp37 = "BA"
disp38 = "LLY"
disp39 = "UNH"
disp40 = "ADBE"

// ========================
// Per-symbol fetch + signal — ONE request.security call per symbol
// Weekly pivot is approximated from the last 5 daily bars.
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

    bullish = dClose > dTC and dClose > wPP and dRsi > 50
    bearish = dClose < dBC and dClose < wPP and dRsi < 50
    signal  = bullish ? "🔵" : bearish ? "🔴" : "⚪"
    sigCol  = bullish ? color.new(color.green, 0) : bearish ? color.new(color.red, 0) : color.new(color.gray, 0)
    volOK   = na(dVol) or na(dVolSma) ? false : dVol > dVolSma

    [dClose, signal, sigCol, dRsi, volOK]

[p1, s1, c1, r1, v1] = f_scan(sym1)
[p2, s2, c2, r2, v2] = f_scan(sym2)
[p3, s3, c3, r3, v3] = f_scan(sym3)
[p4, s4, c4, r4, v4] = f_scan(sym4)
[p5, s5, c5, r5, v5] = f_scan(sym5)
[p6, s6, c6, r6, v6] = f_scan(sym6)
[p7, s7, c7, r7, v7] = f_scan(sym7)
[p8, s8, c8, r8, v8] = f_scan(sym8)
[p9, s9, c9, r9, v9] = f_scan(sym9)
[p10, s10, c10, r10, v10] = f_scan(sym10)
[p11, s11, c11, r11, v11] = f_scan(sym11)
[p12, s12, c12, r12, v12] = f_scan(sym12)
[p13, s13, c13, r13, v13] = f_scan(sym13)
[p14, s14, c14, r14, v14] = f_scan(sym14)
[p15, s15, c15, r15, v15] = f_scan(sym15)
[p16, s16, c16, r16, v16] = f_scan(sym16)
[p17, s17, c17, r17, v17] = f_scan(sym17)
[p18, s18, c18, r18, v18] = f_scan(sym18)
[p19, s19, c19, r19, v19] = f_scan(sym19)
[p20, s20, c20, r20, v20] = f_scan(sym20)
[p21, s21, c21, r21, v21] = f_scan(sym21)
[p22, s22, c22, r22, v22] = f_scan(sym22)
[p23, s23, c23, r23, v23] = f_scan(sym23)
[p24, s24, c24, r24, v24] = f_scan(sym24)
[p25, s25, c25, r25, v25] = f_scan(sym25)
[p26, s26, c26, r26, v26] = f_scan(sym26)
[p27, s27, c27, r27, v27] = f_scan(sym27)
[p28, s28, c28, r28, v28] = f_scan(sym28)
[p29, s29, c29, r29, v29] = f_scan(sym29)
[p30, s30, c30, r30, v30] = f_scan(sym30)
[p31, s31, c31, r31, v31] = f_scan(sym31)
[p32, s32, c32, r32, v32] = f_scan(sym32)
[p33, s33, c33, r33, v33] = f_scan(sym33)
[p34, s34, c34, r34, v34] = f_scan(sym34)
[p35, s35, c35, r35, v35] = f_scan(sym35)
[p36, s36, c36, r36, v36] = f_scan(sym36)
[p37, s37, c37, r37, v37] = f_scan(sym37)
[p38, s38, c38, r38, v38] = f_scan(sym38)
[p39, s39, c39, r39, v39] = f_scan(sym39)
[p40, s40, c40, r40, v40] = f_scan(sym40)

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
    f_row(21, disp21, p21, s21, c21, r21, v21)
    f_row(22, disp22, p22, s22, c22, r22, v22)
    f_row(23, disp23, p23, s23, c23, r23, v23)
    f_row(24, disp24, p24, s24, c24, r24, v24)
    f_row(25, disp25, p25, s25, c25, r25, v25)
    f_row(26, disp26, p26, s26, c26, r26, v26)
    f_row(27, disp27, p27, s27, c27, r27, v27)
    f_row(28, disp28, p28, s28, c28, r28, v28)
    f_row(29, disp29, p29, s29, c29, r29, v29)
    f_row(30, disp30, p30, s30, c30, r30, v30)
    f_row(31, disp31, p31, s31, c31, r31, v31)
    f_row(32, disp32, p32, s32, c32, r32, v32)
    f_row(33, disp33, p33, s33, c33, r33, v33)
    f_row(34, disp34, p34, s34, c34, r34, v34)
    f_row(35, disp35, p35, s35, c35, r35, v35)
    f_row(36, disp36, p36, s36, c36, r36, v36)
    f_row(37, disp37, p37, s37, c37, r37, v37)
    f_row(38, disp38, p38, s38, c38, r38, v38)
    f_row(39, disp39, p39, s39, c39, r39, v39)
    f_row(40, disp40, p40, s40, c40, r40, v40)
