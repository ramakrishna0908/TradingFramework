# Testing Strategy

## Current Test Status

No automated tests are present. `npm run lint` is the only existing quality gate.

## Minimum Tests To Add

### Unit Tests

- `cdfNormal`
- `calculateOptionGreeks`
- `calculateSuggestedPremiumLevels`
- `computeIndicators`
- signal extraction
- market context classification
- event detection
- options filters
- order creation
- position close behavior

### Integration Tests

- `GET /api/market/state`
- `POST /api/market/configure`
- `GET /api/alerts/history`
- `POST /api/order/place`
- `GET /api/positions`
- `POST /api/positions/:id/close`
- `POST /api/suggest/plsl`

### Backtest Tests

When a backtester exists:

- no look-ahead bias
- deterministic replay
- realistic fill assumptions
- transaction cost inclusion
- same input produces same trades

### UI Tests

- app loads with seeded bars
- symbol/regime controls call backend
- alert card opens order modal
- order submission creates position
- close position button closes an open position

## Recommended Tooling

- Vitest for TypeScript unit tests.
- Supertest for Express API tests after app creation is extracted from server startup.
- Playwright for core UI flow tests.

## Testability Refactor

Before adding many tests, split `server.ts` into:

- `createApp()` for Express routes.
- `marketSimulator` for simulated data.
- `strategyEngine` for alert decisions.
- `paperBroker` for order and position lifecycle.

This avoids needing a live server process for every test.
