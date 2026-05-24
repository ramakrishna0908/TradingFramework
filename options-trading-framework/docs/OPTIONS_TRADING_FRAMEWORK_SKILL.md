# Options Trading Framework Skill

Use this skill when working in this repository or when the user asks about this options trading framework.

## Trigger Context

This project is a React + Express TypeScript prototype for simulated options alerts and paper trading. It is not live trading software yet.

## First Steps

1. Read `AGENTS.md`.
2. Read `docs/PROJECT_CONTEXT.md`.
3. For architecture work, read `docs/ARCHITECTURE.md`.
4. For trading strategy or profitability questions, read `docs/PROFITABILITY_REVIEW.md` and `docs/RISK_CONTROLS.md`.
5. For endpoint work, read `docs/API.md`.

## Working Rules

- Treat all trading behavior as simulated unless code proves otherwise.
- Do not promise profitability.
- Prefer measurable research improvements over adding more signals.
- Keep live trading disabled until real data, broker sandboxing, persistence, risk gates, and validation exist.
- Update docs when changing strategy assumptions, run commands, API contracts, or risk controls.

## Implementation Preferences

- Extract pure functions from `server.ts` before adding complexity.
- Add TypeScript types and validators for API inputs.
- Keep order/risk checks on the backend.
- Introduce persistence before building serious performance analytics.
- Add tests around indicators, strategy decisions, and order lifecycle before tuning rules.

## Verification

Run:

```bash
npm run lint
npm run build
```

If dependencies are missing, run `npm install`.
