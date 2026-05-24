# Profitability Review

## Bottom Line

The current project cannot be expected to produce profitable trades because it trades against simulated, regime-forced data with mocked option filters. Profitability work should focus on data quality, validation, execution realism, risk controls, and measurable strategy performance.

## Highest-Impact Changes

1. Replace simulated data with real historical and live data adapters.
   - Intraday OHLCV must include extended-hours handling, session boundaries, corporate actions, and timezone correctness.
   - Option chains must include bid, ask, last, volume, open interest, IV, Greeks, expiration, and contract multiplier.

2. Build a backtesting engine before adding more signals.
   - Replay bars exactly as they would arrive live.
   - Use realistic fills based on bid/ask, slippage, latency, and partial fill assumptions.
   - Include commissions and fees.
   - Prevent look-ahead bias in indicators and filters.

3. Add walk-forward validation.
   - Split data into train, validation, and out-of-sample windows.
   - Track performance by symbol, weekday, time of day, volatility regime, DTE, delta bucket, and strategy type.
   - Reject strategies that only work in one hand-picked period.

4. Improve options contract selection.
   - Select contracts by target delta, DTE, spread percentage, open interest, volume, and minimum premium.
   - Avoid contracts around earnings, FOMC, CPI, and low-liquidity windows unless specifically modeled.
   - Use mid-price for research but conservative bid/ask assumptions for execution.

5. Add server-side risk gates.
   - Max risk per trade.
   - Max daily loss.
   - Max open positions.
   - Max symbol concentration.
   - Cooldown after loss streak.
   - Kill switch.
   - Paper-only default.

6. Add audit logs and metrics.
   - Store every bar snapshot, signal, filter decision, alert, order, fill, position update, and exit reason.
   - Track expectancy, win rate, average win/loss, max drawdown, profit factor, Sharpe/Sortino, and time in trade.

7. Separate strategy decisions from UI and transport.
   - Extract pure strategy functions from `server.ts`.
   - Make strategy outputs reproducible and testable.
   - Version strategy parameters.

## Current Strategy Weaknesses

- The regime selector directly influences event generation, so alert performance is not independent.
- IV rank and bid/ask spread are mocked.
- Squeeze alerts map to `Put Credit Spread` but the order model only represents a single-leg buy/sell position.
- Position repricing uses a simplified option model and fixed approximate DTE/IV, not live contract quotes.
- Stops and targets are based on premium math but do not model gaps, spread widening, or liquidity.
- Alert duplicate prevention uses a short time window, not bar/event identity.
- No market-hours filter is actually enforced in the current code despite being described in docs.
- No bearish strategy path is meaningfully implemented.

## Practical Strategy Enhancements

- Add a trade quality score instead of binary alerts:
  - trend alignment
  - relative volume
  - distance from VWAP
  - ATR expansion/contraction
  - spread quality
  - delta/DTE match
  - higher-timeframe confirmation

- Add a no-trade filter:
  - chop too high for directional trades
  - spread too wide
  - IV too extreme for long premium
  - first 5 minutes and last 15 minutes of session
  - major scheduled event window
  - underlying gap already exceeded ATR threshold

- Use strategy-specific exits:
  - long options: premium stop, underlying invalidation, time stop, trailing stop after first target
  - credit spreads: defined max loss, short strike breach rules, early profit capture, expiration risk controls

## Suggested Research Metrics

Minimum metrics before trusting a strategy:

- Total trades
- Win rate
- Average win
- Average loss
- Expectancy per trade
- Profit factor
- Max drawdown
- Median hold time
- Slippage sensitivity
- Performance by symbol and market regime
- Out-of-sample performance

## Decision Rule

Do not connect live brokerage until paper trading has produced stable positive expectancy after realistic costs and slippage over enough trades to be statistically meaningful.
