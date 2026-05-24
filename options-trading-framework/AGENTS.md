# AI Agent Instructions

## Repository Purpose

This repository is an options alert and paper-trading prototype. Treat it as a simulated decision-support dashboard, not a production trading system.

Core files:

- `server.ts`: Express server, simulated market feed, alert engine, paper order APIs, SSE stream.
- `src/server_utils.ts`: indicators, Black-Scholes approximation, premium stop/target helper.
- `src/App.tsx`: main React dashboard state and layout.
- `src/components/TradingViewChart.tsx`: custom SVG chart and symbol/regime controls.
- `src/components/AlertCard.tsx`: alert display and order trigger.
- `src/components/OrderModal.tsx`: paper order ticket.
- `src/components/PortfolioLog.tsx`: open/closed positions and P&L.
- `src/types.ts`: shared TypeScript interfaces.

## Current Constraints

- Market data is simulated in memory.
- Alerts are generated from regime-driven mock price action.
- Option liquidity, IV rank, option premium, and Greeks are mocked or approximated.
- Orders and positions are in memory and reset on server restart.
- No authentication, persistence, broker integration, real MCP client, or real TradingView data adapter exists yet.

## Development Rules

- Keep changes scoped and TypeScript-first.
- Do not imply live profitability or real brokerage execution unless implemented and verified.
- Add tests before trusting strategy changes.
- Prefer extracting pure strategy logic from `server.ts` before expanding alert rules.
- Keep risk controls server-side, not only in React.
- Update docs when changing architecture, APIs, strategy assumptions, or run commands.

## Profitability Priorities

Before adding more alert types, prioritize:

1. Historical backtesting against real intraday OHLCV and option-chain data.
2. Walk-forward validation and paper-trading metrics.
3. Real option selection using bid/ask, volume, open interest, DTE, delta, gamma, theta, IV, and earnings/calendar filters.
4. Position sizing, daily loss limits, max concurrent risk, and kill switch.
5. Audit logging for every signal, filter decision, order, fill, and exit.

See `docs/PROFITABILITY_REVIEW.md` for the detailed improvement backlog.

## Verification

Use:

```bash
npm run lint
npm run build
```

If dependencies are missing, run `npm install` first.
