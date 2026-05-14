//@version=5
indicator("Casey Cheat Sheet - 6 Condition Checklist", overlay=true, max_labels_count=500)

// ============ INPUTS ============
grp_ema = "EMAs"
ema_fast = input.int(13, "Fast EMA", group=grp_ema)
ema_mid = input.int(48, "Mid EMA", group=grp_ema)
ema_slow = input.int(200,"Slow EMA", group=grp_ema)

grp_flag = "Flag Detection"
flag_lookback = input.int(20, "Flag Lookback Bars", minval=5, group=grp_flag)
impulse_lookback= input.int(30, "Impulse Lookback Bars", minval=10, group=grp_flag)
impulse_pct = input.float(0.5, "Min Impulse Move %", minval=0.1, step=0.1, group=grp_flag)
pullback_max_pct= input.float(0.5, "Max Pullback Depth (of impulse)", minval=0.2, maxval=0.8, step=0.05, group=grp_flag)

grp_tbl = "Display"
show_tbl = input.bool(true, "Show Checklist Table", group=grp_tbl)
tbl_pos = input.string("top_right", "Table Position", options=["top_right","top_left","bottom_right","bottom_left","middle_right"], group=grp_tbl)
show_levels = input.bool(true, "Show PDH/PDL/PMH/PML Lines", group=grp_tbl)

// ============ EMAs ============
e13 = ta.ema(close, ema_fast)
e48 = ta.ema(close, ema_mid)
e200 = ta.ema(close, ema_slow)

plot(e13, "13 EMA", color=color.yellow, linewidth=2)
plot(e48, "48 EMA", color=color.purple,linewidth=2)
plot(e200, "200 EMA", color=color.red, linewidth=2)

// ============ PDH / PDL (Previous Day High/Low) ============
pdh = request.security(syminfo.tickerid, "D", high[1], lookahead=barmerge.lookahead_on)
pdl = request.security(syminfo.tickerid, "D", low[1], lookahead=barmerge.lookahead_on)

// ============ PMH / PML (Pre-Market High/Low, 04:00–09:30 ET) ============
is_premkt = not na(time(timeframe.period, "0400-0930", "America/New_York"))
var float pmh = na
var float pml = na
new_session = ta.change(time("D")) != 0
if new_session
pmh := na
pml := na
if is_premkt
pmh := na(pmh) ? high : math.max(pmh, high)
pml := na(pml) ? low : math.min(pml, low)

plot(show_levels ? pdh : na, "PDH", color=color.new(color.lime, 0), style=plot.style_linebr, linewidth=1)
plot(show_levels ? pdl : na, "PDL", color=color.new(color.red, 0), style=plot.style_linebr, linewidth=1)
plot(show_levels ? pmh : na, "PMH", color=color.new(color.aqua, 0), style=plot.style_linebr, linewidth=1)
plot(show_levels ? pml : na, "PML", color=color.new(color.orange, 0), style=plot.style_linebr, linewidth=1)

// ============ CONDITION 1: Above PDH + PMH / Below PDL + PML ============
above_pdh_pmh = not na(pdh) and not na(pmh) and close > pdh and close > pmh
below_pdl_pml = not na(pdl) and not na(pml) and close < pdl and close < pml

// ============ CONDITION 2: EMA Trend ============
bullish_ema = e13 > e48 and e48 > e200 and close > e13
bearish_ema = e13 < e48 and e48 < e200 and close < e13

// ============ CONDITION 3: Flag Detection ============
// Bull flag = strong impulse up, then shallow consolidation/pullback above the 13 EMA
// Bear flag = strong impulse down, then shallow bounce below the 13 EMA

impulse_low = ta.lowest(low, impulse_lookback)
impulse_high = ta.highest(high, impulse_lookback)
impulse_up_pct = (impulse_high - impulse_low) / impulse_low _ 100
impulse_down_pct = (impulse_high - impulse_low) / impulse_high _ 100

// recent range = the consolidation
recent_high = ta.highest(high, flag_lookback)
recent_low = ta.lowest(low, flag_lookback)
recent_range_pct = (recent_high - recent_low) / recent_low \* 100

// Bull flag: impulse up exists, price holding above 13 EMA, pullback shallow vs impulse
bull_flag = impulse_up_pct >= impulse_pct and
close > e13 and
recent_low > impulse_low and
(recent_high - recent_low) < (impulse_high - impulse_low) \* pullback_max_pct and
ta.lowest(low, flag_lookback) > e48

// Bear flag: impulse down exists, price holding below 13 EMA, bounce shallow vs impulse
bear_flag = impulse_down_pct >= impulse_pct and
close < e13 and
recent_high < impulse_high and
(recent_high - recent_low) < (impulse_high - impulse_low) \* pullback_max_pct and
ta.highest(high, flag_lookback) < e48

// ============ FINAL SIGNAL ============
bull_all = above_pdh_pmh and bullish_ema and bull_flag
bear_all = below_pdl_pml and bearish_ema and bear_flag

bgcolor(bull_all ? color.new(color.green, 85) : na, title="Bull Setup BG")
bgcolor(bear_all ? color.new(color.red, 85) : na, title="Bear Setup BG")

plotshape(bull_all and not bull_all[1], title="BULL SETUP", style=shape.triangleup, location=location.belowbar, color=color.lime, size=size.small, text="BULL")
plotshape(bear_all and not bear_all[1], title="BEAR SETUP", style=shape.triangledown, location=location.abovebar, color=color.red, size=size.small, text="BEAR")

// ============ CHECKLIST TABLE ============
f_pos(s) =>
s == "top_right" ? position.top_right :
s == "top_left" ? position.top_left :
s == "bottom_right" ? position.bottom_right :
s == "bottom_left" ? position.bottom_left :
position.middle_right

f_mark(b) => b ? "✅" : "❌"
f_col(b) => b ? color.new(color.green, 70) : color.new(color.red, 70)

var table t = table.new(f_pos(tbl_pos), 2, 9, border_width=1)

if show_tbl and barstate.islast
table.clear(t, 0, 0, 1, 8)
table.cell(t, 0, 0, "UPSIDE", bgcolor=color.new(color.green,50), text_color=color.white)
table.cell(t, 1, 0, f_mark(bull_all), bgcolor=f_col(bull_all), text_color=color.white)

    table.cell(t, 0, 1, "Above PDH+PMH",  text_color=color.white)
    table.cell(t, 1, 1, f_mark(above_pdh_pmh), bgcolor=f_col(above_pdh_pmh))

    table.cell(t, 0, 2, "Bullish EMA",    text_color=color.white)
    table.cell(t, 1, 2, f_mark(bullish_ema),   bgcolor=f_col(bullish_ema))

    table.cell(t, 0, 3, "Bull Flag",      text_color=color.white)
    table.cell(t, 1, 3, f_mark(bull_flag),     bgcolor=f_col(bull_flag))

    table.cell(t, 0, 4, "DOWNSIDE", bgcolor=color.new(color.red,50),   text_color=color.white)
    table.cell(t, 1, 4, f_mark(bear_all), bgcolor=f_col(bear_all),     text_color=color.white)

    table.cell(t, 0, 5, "Below PDL+PML",  text_color=color.white)
    table.cell(t, 1, 5, f_mark(below_pdl_pml), bgcolor=f_col(below_pdl_pml))

    table.cell(t, 0, 6, "Bearish EMA",    text_color=color.white)
    table.cell(t, 1, 6, f_mark(bearish_ema),   bgcolor=f_col(bearish_ema))

    table.cell(t, 0, 7, "Bear Flag",      text_color=color.white)
    table.cell(t, 1, 7, f_mark(bear_flag),     bgcolor=f_col(bear_flag))

    bias_txt = bull_all ? "🟢 LONG OK" : bear_all ? "🔴 SHORT OK" : "⏸ WAIT"
    table.cell(t, 0, 8, "BIAS", bgcolor=color.new(color.gray,40), text_color=color.white)
    table.cell(t, 1, 8, bias_txt, bgcolor=color.new(color.gray,40), text_color=color.white)

// ============ ALERTS ============
alertcondition(bull_all and not bull_all[1], "All 3 Bull Conditions Met", "Casey Bull Setup: PDH+PMH break, Bullish EMA, Bull Flag")
alertcondition(bear_all and not bear_all[1], "All 3 Bear Conditions Met", "Casey Bear Setup: PDL+PML break, Bearish EMA, Bear Flag")
