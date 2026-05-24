# Risk Controls

## Required Before Serious Paper Trading

- Default paper mode with no live broker route.
- Max dollar risk per trade.
- Max percent account risk per trade.
- Max daily realized loss.
- Max daily unrealized loss.
- Max concurrent open positions.
- Max contracts per order.
- Max symbol concentration.
- Max strategy concentration.
- Cooldown after consecutive losses.
- Time-of-day restrictions.
- Kill switch that blocks new orders.
- Audit log for rejected and accepted orders.

## Required Before Live Trading

- Live trading disabled by default.
- Explicit environment variable and UI confirmation for live mode.
- Broker sandbox tested before live credentials.
- Server-side enforcement of all risk controls.
- Emergency flatten or cancel-all control.
- Persistent order/fill reconciliation.
- Monitoring for stale data, disconnected broker, rejected orders, and abnormal slippage.

## Risk Checks For Every Order

Every order should be rejected if:

- quantity is not a positive integer
- premium is missing or stale
- stop loss is not below entry for long premium
- target is not above entry for long premium
- max trade risk exceeds account rules
- daily loss limit is breached
- position count limit is breached
- spread/liquidity filters fail
- market data is stale
- strategy is disabled

## Strategy Risk Notes

- Long options can lose most or all premium quickly.
- 0DTE and weekly options have high gamma and theta risk.
- Credit spreads require multi-leg modeling; a single-leg position model is not sufficient.
- Stops based on theoretical premium can fail when spreads widen or liquidity disappears.
- Backtests must include costs and slippage or they will overstate performance.
