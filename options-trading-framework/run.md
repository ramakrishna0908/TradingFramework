# Run The Application

This app is a simulated options alert and paper-trading dashboard. It does not connect to live market data or a real broker.

## Prerequisites

- Node.js 20 or newer
- npm

## Install Dependencies

```bash
npm install
```

## Start In Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

The Express server starts on port `3000`, serves the React app, and runs the in-memory simulated market feed.

## Production Build And Run

Build the frontend and bundled backend:

```bash
npm run build
```

Start the built server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Verification

Run TypeScript checks:

```bash
npm run lint
```

Run the full production build check:

```bash
npm run build
```

## Troubleshooting

- If port `3000` is busy, stop the other process using that port before running `npm run dev` or `npm start`.
- If the dashboard is empty, confirm the server is still running and refresh `http://localhost:3000`.
- If alerts do not appear, change the ticker or strategy regime in the chart controls. Alerts depend on simulated regime conditions.
- If positions disappear, restart behavior is expected. Orders and positions are stored only in memory.

