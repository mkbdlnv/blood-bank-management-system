# QA Setup

This folder contains a minimal QA layer for the Blood Bank Management System:

- `api/smoke.mjs`: API smoke test for registration, approval, camps, and blood requests
- `ui/smoke.spec.js`: Playwright smoke checks for landing, donor login, and hospital request flow
- `scripts/wait-for-http.mjs`: small utility to wait for backend/frontend readiness
- `experimental/performance/run-performance.mjs`: k6-backed load, stress, spike, and endurance runner for login, request creation, and stock update
- `experimental/mutation/run-curated-mutations.mjs`: curated mutation matrix that replays the backend Jest suite against critical controller mutants
- `experimental/chaos/run-chaos.mjs`: API-down, DB-failure, and latency fault-injection runner with Playwright screenshots and recovery metrics

## Local run

1. Start MongoDB.
2. Start the backend with:

```bash
cd backend
MONGO_URI=mongodb://127.0.0.1:27017/bbms_qa JWT_SECRET=secret PORT=5055 node server.js
```

3. Seed the admin user in another terminal:

```bash
cd backend
MONGO_URI=mongodb://127.0.0.1:27017/bbms_qa node seedAdmin.js
```

4. Start the frontend:

```bash
cd frontend
VITE_API_PROXY_TARGET=http://127.0.0.1:5055 npm run dev
```

5. Install QA dependencies and run the suite:

```bash
cd qa
npm install
npx playwright install chromium
QA_RUN_ID=$(date +%s) API_BASE_URL=http://127.0.0.1:5055 FRONTEND_BASE_URL=http://127.0.0.1:5173 npm test
```

Use the same `QA_RUN_ID` for `test:api` and `test:ui` so the UI tests log in with the accounts created by the API smoke test.

If port `5000` is already occupied on macOS, keep using `5055` locally and pass `VITE_API_PROXY_TARGET` / `API_BASE_URL` explicitly as shown above.

## Assignment 3 experimental runs

Install the extra tooling once:

```bash
brew install k6
cd backend && npm install
cd ../qa && npm install && npx playwright install chromium
```

Then run the experimental suites from the repository root:

```bash
npm run qa:experimental:performance
npm run qa:experimental:mutation
npm run qa:experimental:chaos
```

Artifacts are written to `qa/artifacts/experimental/`:

- `performance/`: per-scenario k6 summaries, backend CPU/memory samples, and a Markdown summary table
- `mutation/`: per-mutant Jest execution logs plus module/overall mutation scores
- `chaos/`: screenshots, probe logs, and availability / MTTR summaries for each injected fault
- `charts/`: generated SVG visualizations for performance, mutation, and chaos metrics
