# API Reference

Base URL in development: `http://localhost:3000`

## Alerts

### `GET /api/alerts/live`

Server-Sent Events stream. Emits each new `OptionsAlert` as JSON.

### `GET /api/alerts/history`

Returns the in-memory alert list, newest first.

## Market

### `GET /api/market/state`

Returns:

```json
{
  "activeSymbol": "SPY",
  "currentRegime": "breakout_bull",
  "currentPrice": 450.25,
  "bars": []
}
```

`bars` contains the latest 40 processed candles.

### `POST /api/market/configure`

Request:

```json
{
  "symbol": "SPY",
  "regime": "breakout_bull"
}
```

Changes the active simulated symbol and/or regime. Changing symbol reseeds history. Changing regime resets the tick counter.

## Positions

### `GET /api/positions`

Returns all in-memory positions.

### `POST /api/positions/:id/close`

Closes an open paper position at its current simulated premium and appends a sell order.

## Orders

### `POST /api/order/place`

Request:

```json
{
  "symbol": "SPY",
  "side": "buy",
  "strategy": "Buy Call",
  "strike": "450",
  "expiry": "May 29 Exp (Weekly)",
  "premium": 2.5,
  "quantity": 1,
  "stopLoss": 1.5,
  "profitTarget": 3.75
}
```

Creates a filled paper order. If `side` is `buy`, creates an open position.

## Suggestions

### `POST /api/suggest/plsl`

Request:

```json
{
  "entryPremium": 2.5,
  "spotPrice": 450,
  "strike": 450,
  "ivRank": 40,
  "isCall": true
}
```

Returns premium, delta, stop loss, profit target, and risk/reward estimate.

## Notes

- No endpoint has authentication.
- No endpoint validates request schema rigorously yet.
- No endpoint persists data.
- API contracts should be formalized with shared validators before external clients or broker integrations are added.
