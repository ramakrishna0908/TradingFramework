# Runbook

## Prerequisites

- Node.js 20 or newer recommended.
- npm.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

The server listens on `http://localhost:3000`.

## Production Build

```bash
npm run build
npm start
```

`npm run build` creates:

- Vite client assets in `dist/`
- bundled backend at `dist/server.cjs`

## Quality Checks

```bash
npm run lint
```

This runs TypeScript type checking with `tsc --noEmit`.

## Reset Runtime State

Restart the server. Runtime state is in memory and is not persisted.

## Common Troubleshooting

- Port `3000` busy: change `PORT` in `server.ts` or stop the existing process.
- Empty dashboard: confirm `npm run dev` is running and open `http://localhost:3000`.
- No alerts: switch the regime in the chart controls; alerts depend on simulated regime conditions and filters.
- Positions disappeared: expected after server restart because storage is in memory.

## Operational Notes

- Do not use this app for live orders.
- Do not enter real broker credentials until a proper broker adapter, config model, and risk gates exist.
- Keep `.env.local` and any future broker credentials out of git.
