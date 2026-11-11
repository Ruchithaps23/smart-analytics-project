# SDADIS Frontend

The SDADIS frontend is a React application built with Vite. It provides business intelligence pages for the executive dashboard, analytics, dataset management, data quality, exploratory analysis, forecasting, predictive insights, alerts, recommendations, customer segmentation, and reports.

Some views use the existing FastAPI endpoints. Pages or features that are not exposed by the API are clearly labeled as previews or unavailable data states.

## Requirements

- Node.js and npm versions compatible with the Vite version in `package.json`.

## Install

From the frontend project directory, install the dependencies:

```bash
npm install
```

## Run locally

Start the Vite development server:

```bash
npm run dev
```

Open the local URL printed by Vite in your browser.

The frontend's existing API client connects to FastAPI at `http://127.0.0.1:8001`. Start the backend separately if you want to view API-backed data. Preview-only pages remain usable without analysis results.

## Build and lint

Create a production build:

```bash
npm run build
```

Check the frontend source with ESLint:

```bash
npm run lint
```
