# Options Trading Framework

React + Express TypeScript dashboard for simulated options alerts, paper order placement, and portfolio tracking.

This project is currently a prototype/paper-trading framework. It does not connect to a live broker, does not use real option-chain data, and should not be treated as a profitable trading system until the validation items in [docs/PROFITABILITY_REVIEW.md](docs/PROFITABILITY_REVIEW.md) are completed.

## What It Does

- Simulates OHLCV market data for `SPY`, `QQQ`, `TSLA`, `NVDA`, and `AAPL`.
- Computes indicators including VWAP, EMA 9/21, RSI, ATR, Bollinger Bands, Keltner Channels, ADX approximation, and Choppiness Index.
- Runs a staged alert engine for breakout, reversal, squeeze, and pullback scenarios.
- Streams generated alerts to the frontend with Server-Sent Events.
- Lets users place simulated paper option orders from alerts.
- Tracks open/closed positions, P&L, stop loss, and profit target execution in memory.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, lucide-react
- Backend: Express, TypeScript, tsx
- Runtime data: in-memory simulated bars, alerts, orders, positions
- Build: Vite client build plus esbuild server bundle

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run lint
npm run build
npm start
```

## Important Docs

- [AGENTS.md](AGENTS.md): AI assistant instructions for this repository.
- [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md): concise project memory and current state.
- [docs/ACTIVE_CONTEXT.md](docs/ACTIVE_CONTEXT.md): current work focus and next tasks.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): system design and data flow.
- [docs/API.md](docs/API.md): backend endpoint reference.
- [docs/PROFITABILITY_REVIEW.md](docs/PROFITABILITY_REVIEW.md): changes required before expecting profitability.
- [docs/ROADMAP.md](docs/ROADMAP.md): active implementation plan.
- [docs/RUNBOOK.md](docs/RUNBOOK.md): setup, operation, and troubleshooting.
- [docs/TESTING.md](docs/TESTING.md): validation strategy and missing tests.
- [docs/RISK_CONTROLS.md](docs/RISK_CONTROLS.md): trading and software risk requirements.
- [docs/OPTIONS_TRADING_FRAMEWORK_SKILL.md](docs/OPTIONS_TRADING_FRAMEWORK_SKILL.md): project-specific AI workflow skill.
- [tasks/option-cycle.md](tasks/option-cycle.md): reusable multi-agent workflow prompts.

## Codex Slash Command

The reusable prompt command `/option-cycle` is installed at:

- `/Users/ramakrishna0908/.codex/prompts/option-cycle.md`
- `/Users/ramakrishna0908/.codex/commands/option-cycle.md` as a legacy compatibility fallback

It starts one Lead/Product/Frontend/Backend/Verifier/QA/Review improvement cycle using `tasks/option-cycle.md`.

The personal Codex plugin `options-trading-workflows` also contains a plugin command copy, but the local TUI command surface reads custom prompt commands from the Codex prompts directory.

## Safety Boundary

All orders are paper orders. The UI should describe the implemented backend honestly as simulated and in-memory. Any move toward live trading must add real data validation, broker sandboxing, audit logs, risk gates, backtesting, forward testing, and explicit user approval before live execution.
