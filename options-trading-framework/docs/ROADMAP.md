# Roadmap

## Active Objective

Turn the prototype into a research-grade paper-trading system before any live execution work.

## Phase 1: Make Current Prototype Reliable

- Add request validation for all API inputs.
- Fix misleading UI copy that implies live broker/MCP integration.
- Add server-side position sizing and risk limits.
- Add persistent storage for alerts, orders, positions, fills, and metrics.
- Extract strategy logic from `server.ts` into testable modules.
- Add unit tests for indicators, Greeks, alert rules, and order lifecycle.

## Phase 2: Add Research Infrastructure

- Add historical market-data loader.
- Add historical option-chain loader.
- Build replay/backtest runner.
- Store strategy parameters with version IDs.
- Generate performance reports.
- Add walk-forward validation.

## Phase 3: Improve Strategy Quality

- Add real options liquidity filters.
- Add higher-timeframe trend confirmation.
- Add event/calendar filters.
- Add quality scoring.
- Add no-trade conditions.
- Add bearish and neutral strategies with correct multi-leg modeling.

## Phase 4: Production Paper Trading

- Add live market-data adapter.
- Add paper broker adapter behind a broker interface.
- Add durable audit logs.
- Add risk kill switch.
- Add monitoring and alerts.
- Add deployment configuration.

## Phase 5: Live Trading Readiness

Only start this phase after paper trading shows stable positive expectancy with realistic costs.

- Add live broker adapter in disabled-by-default mode.
- Require explicit config and confirmation for live trading.
- Add per-account risk limits.
- Add emergency flatten/disable controls.
- Add legal/compliance review as needed.
