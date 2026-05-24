# Architecture

## Runtime Flow

1. `server.ts` seeds 40 simulated bars for the active symbol.
2. A `setInterval` loop runs every 4 seconds.
3. The loop mutates price and volume based on the selected regime.
4. Bars are updated and indicators are recomputed with `computeIndicators`.
5. Open positions are repriced with `calculateOptionGreeks`.
6. Stop loss and profit target exits are checked.
7. The alert engine evaluates staged signal rules.
8. New alerts are stored in memory and pushed to SSE clients.
9. React polls `/api/market/state` and `/api/positions`, while listening to `/api/alerts/live`.

## Backend Components

`server.ts` owns:

- Express app setup.
- Vite middleware in development.
- Simulated market state.
- Alert generation.
- Paper order placement.
- Position tracking.
- SSE clients.

`src/server_utils.ts` owns:

- Standard normal CDF approximation.
- Black-Scholes style option price and Greeks approximation.
- Indicator calculations.
- Premium stop loss and profit target conversion.

## Frontend Components

- `App.tsx`: top-level data synchronization and page layout.
- `TradingViewChart.tsx`: symbol/regime controls and SVG chart.
- `AlertCard.tsx`: alert details, filters, and exit plan.
- `OrderModal.tsx`: order input and risk projection.
- `PortfolioLog.tsx`: paper portfolio metrics and position management.

## Data Storage

All data is in memory:

- `bars`
- `alerts`
- `orders`
- `positions`
- `activeSymbol`
- `currentRegime`
- `currentPrice`

This means every server restart resets the system.

## Recommended Target Architecture

For a serious trading research system, split the backend into modules:

- `market-data`: live adapter plus historical loader.
- `indicators`: pure deterministic indicator functions.
- `strategy-engine`: signal extraction, context, event detection, filters, scoring.
- `options-chain`: contract selection and liquidity filters.
- `risk-engine`: account limits, sizing, stops, kill switch.
- `broker`: paper broker first, live broker later behind the same interface.
- `persistence`: trades, bars, alerts, fills, metrics, audit logs.
- `backtester`: replay historical market and option-chain data.

Avoid adding live execution until the strategy engine, risk engine, and broker adapter are isolated and tested.
