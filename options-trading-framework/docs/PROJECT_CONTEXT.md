# Project Context

Last reviewed: 2026-05-23

## Summary

Options Trading Framework is a full-stack TypeScript prototype for generating simulated options alerts and managing paper trades. It has a React dashboard, an Express backend, a simulated market-data loop, basic technical indicators, generated options alerts, and in-memory position tracking.

## Current State

- App entry: `server.ts` starts Express and Vite middleware in development.
- Frontend entry: `src/main.tsx`, main app in `src/App.tsx`.
- Shared models: `src/types.ts`.
- Quant helpers: `src/server_utils.ts`.
- Data model: all runtime state is in module-level arrays in `server.ts`.
- Default server port: `3000`.
- Run command: `npm run dev`.

## Implemented Capabilities

- Simulated symbols: `SPY`, `QQQ`, `TSLA`, `NVDA`, `AAPL`.
- Simulated regimes: `breakout_bull`, `reversal_oversold`, `bb_squeeze`, `choppy_drift`, `pullback_bounce`.
- Indicators: VWAP, EMA 9/21, RSI, ATR, ADX approximation, Bollinger Bands, Keltner Channels, Choppiness Index.
- Alert types: Breakout, Reversal, Squeeze, Pullback.
- Transport: Server-Sent Events for live alerts, polling fallback for state.
- Trading: paper-only market orders, in-memory positions, automatic premium-based stop/target exits.

## Not Implemented

- Real TradingView Desktop MCP adapter.
- Real broker connection.
- Real option-chain data.
- Persistent storage.
- User authentication.
- Backtesting.
- Strategy metrics.
- Production-grade risk limits.
- Automated tests.

## Important Safety Note

The UI should use simulated and paper-only language for market feeds, option premiums, and orders. Future agents should avoid treating route names such as `/api/alerts/live` or component names such as `TradingViewChart` as proof of live integration.
