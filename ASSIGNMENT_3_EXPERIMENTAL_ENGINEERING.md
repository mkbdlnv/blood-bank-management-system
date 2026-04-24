# Assignment 3: Experimental Engineering for BBMS

## 1. System Under Test

The Blood Bank Management System (BBMS) is a role-based web application with a React frontend, an Express backend, and MongoDB persistence. The four supported roles are donor, hospital, blood-lab, and admin. Based on the Assignment 1 risk analysis, the highest-risk operational modules remain:

- Authentication and role-based access
- Facility registration and admin approval
- Hospital blood request workflow
- Blood stock and inventory management
- Blood lab request processing

Assignment 3 extends the previous API and UI automation with three experimental layers:

1. performance testing for the most critical API endpoints,
2. mutation testing against critical backend modules, and
3. chaos / fault-injection testing to evaluate resilience and recovery behaviour.

All new scripts are committed in `qa/experimental/` and integrated into the GitHub Actions QA pipeline through `.github/workflows/qa.yml`.

## 2. Experimental Setup

### 2.1 Environment

| Item | Value |
|---|---|
| OS | macOS 15.7.1 |
| CPU | Apple M4 |
| RAM | 16 GB |
| Node.js | v22.21.1 |
| npm | 10.9.4 |
| k6 | v1.7.1 |
| Playwright | 1.59.1 |
| Jest | 30.3.0 |
| Stryker | 9.6.1 |
| Mongo runtime for experiments | `mongodb-memory-server` 11.0.1 |

### 2.2 Added Automation Assets

- `qa/experimental/performance/run-performance.mjs`
- `qa/experimental/performance/bbms-scenario.js`
- `qa/experimental/mutation/run-curated-mutations.mjs`
- `qa/experimental/chaos/run-chaos.mjs`
- `backend/stryker.critical.config.mjs`

### 2.3 Evidence Artifacts

- Performance summary: [qa/artifacts/experimental/performance/results.md](qa/artifacts/experimental/performance/results.md)
- Mutation summary: [qa/artifacts/experimental/mutation/results.md](qa/artifacts/experimental/mutation/results.md)
- Chaos summary: [qa/artifacts/experimental/chaos/results.md](qa/artifacts/experimental/chaos/results.md)
- Generated charts:
  - [performance-p95-spike.svg](qa/artifacts/experimental/charts/performance-p95-spike.svg)
  - [performance-throughput-stress.svg](qa/artifacts/experimental/charts/performance-throughput-stress.svg)
  - [mutation-score-by-module.svg](qa/artifacts/experimental/charts/mutation-score-by-module.svg)
  - [chaos-availability.svg](qa/artifacts/experimental/charts/chaos-availability.svg)
  - [chaos-mttr.svg](qa/artifacts/experimental/charts/chaos-mttr.svg)
- Chaos screenshots:
  - [api-downtime/impact.png](qa/artifacts/experimental/chaos/api-downtime/impact.png)
  - [api-downtime/recovered.png](qa/artifacts/experimental/chaos/api-downtime/recovered.png)
  - [database-failure/impact.png](qa/artifacts/experimental/chaos/database-failure/impact.png)
  - [database-failure/recovered.png](qa/artifacts/experimental/chaos/database-failure/recovered.png)
  - [network-latency/impact.png](qa/artifacts/experimental/chaos/network-latency/impact.png)

## 3. Performance Testing

### 3.1 Scope and Test Plan

The three highest-risk API endpoints were selected from the Assignment 1 analysis:

| Endpoint | Module | Reason |
|---|---|---|
| `POST /api/auth/login` | Authentication & RBAC | Blocks all role dashboards and is executed frequently |
| `POST /api/hospital/blood/request` | Hospital blood request workflow | Core hospital-to-lab operational path |
| `POST /api/blood-lab/blood/add` | Blood stock & inventory management | Critical stock mutation endpoint |

The local execution profile used four scenario types:

| Scenario | Load Model | Parameters |
|---|---|---|
| Load | steady expected traffic | 12 VUs for 20s |
| Stress | ramp to saturation | 0 -> 20 -> 36 VUs over 40s |
| Spike | sudden burst | 0 -> 60 VUs over 25s |
| Endurance | sustained operation | 10 VUs for 45s |

Pass thresholds were defined before execution and encoded in the runner. Authentication used stricter thresholds for median and p95 latency, while request creation and stock updates were allowed slightly higher latency because they perform state-changing database writes.

### 3.2 Performance Results

Performance visualizations:

- [Spike Test P95 Latency](qa/artifacts/experimental/charts/performance-p95-spike.svg)
- [Stress Test Throughput](qa/artifacts/experimental/charts/performance-throughput-stress.svg)

| Endpoint | Scenario | Avg (ms) | Median (ms) | P95 (ms) | Throughput (req/s) | Error Rate | Avg CPU % | Max CPU % | Avg Mem (MB) | Max Mem (MB) | Verdict |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Auth Login | Load | 2223.33 | 2244.09 | 3296.16 | 4.86 | 0.00% | 95.94 | 101.70 | 98.02 | 109.48 | Fail |
| Auth Login | Stress | 4669.81 | 4987.54 | 7839.80 | 4.68 | 0.00% | 95.04 | 102.90 | 111.86 | 114.75 | Fail |
| Auth Login | Spike | 8360.17 | 4959.46 | 22515.60 | 4.49 | 0.00% | 90.72 | 102.90 | 115.64 | 117.56 | Fail |
| Auth Login | Endurance | 1880.78 | 1873.93 | 1974.30 | 4.79 | 0.00% | 97.82 | 100.70 | 107.44 | 114.34 | Fail |
| Hospital Request | Load | 13.53 | 12.69 | 22.33 | 55.51 | 0.00% | 36.66 | 51.20 | 148.95 | 178.64 | Pass |
| Hospital Request | Stress | 92.88 | 26.90 | 306.82 | 70.52 | 0.00% | 90.18 | 146.30 | 296.55 | 454.36 | Pass |
| Hospital Request | Spike | 219.36 | 202.94 | 554.42 | 87.87 | 0.00% | 93.55 | 148.30 | 382.76 | 595.88 | Pass |
| Hospital Request | Endurance | 16.59 | 15.45 | 26.96 | 45.79 | 0.00% | 44.93 | 73.60 | 235.70 | 297.77 | Pass |
| Blood Stock Add | Load | 11.95 | 10.16 | 25.38 | 55.77 | 0.00% | 34.90 | 57.90 | 203.62 | 243.22 | Pass |
| Blood Stock Add | Stress | 101.06 | 30.31 | 324.71 | 68.60 | 0.00% | 91.32 | 145.60 | 332.35 | 476.19 | Pass |
| Blood Stock Add | Spike | 226.29 | 216.89 | 547.72 | 86.67 | 0.00% | 93.91 | 152.90 | 389.37 | 569.64 | Pass |
| Blood Stock Add | Endurance | 15.24 | 13.52 | 27.81 | 46.04 | 0.00% | 44.61 | 93.70 | 240.76 | 321.78 | Pass |

### 3.3 Analysis

Two clear behaviours emerged:

- The two workflow mutation endpoints (`/api/hospital/blood/request` and `/api/blood-lab/blood/add`) remained well below their p95 thresholds in every scenario and held zero functional errors.
- `POST /api/auth/login` is the dominant bottleneck. Even though the endpoint stayed functionally correct, its latency exceeded every predefined threshold by a very large margin and throughput flattened around 4.5 to 4.9 requests per second.

The most likely root causes are visible in the login controller:

- bcrypt password comparison runs on every request,
- the endpoint updates `lastLogin`,
- facility logins also append to the facility history array, and
- the document is saved again on every successful authentication.

This combination makes the login path significantly more write-heavy than the two business workflow endpoints. Under load, CPU usage stays close to a full core while request creation and stock updates scale more predictably.

### 3.4 Performance Recommendations

1. Remove non-essential writes from the synchronous login path. `lastLogin` and history writes can be queued asynchronously.
2. Add indexes and lean reads for frequently used login fields, especially `email`.
3. Keep the hospital request and stock endpoints under observation, but prioritise authentication optimisation first because it is the only module failing the defined SLA.
4. Extend the endurance scenario to 15-30 minutes in a larger follow-up run after login optimisation.

## 4. Mutation Testing

### 4.1 Mutation Plan

Mutation testing focused on four critical backend modules:

- `backend/controllers/authContoller.js`
- `backend/controllers/adminController.js`
- `backend/controllers/hospitalController.js`
- `backend/controllers/bloodLabController.js`

Sixteen controlled mutants were created across four mutation classes:

- logical operator changes,
- constant alterations,
- return value modifications,
- function removal.

The existing backend Jest/Supertest suite was executed against each mutant. This produced a bounded, explainable mutation set that is suitable for CI while still exposing meaningful assertion gaps.

### 4.2 Mutation Results

Mutation visualization:

- [Mutation Score by Module](qa/artifacts/experimental/charts/mutation-score-by-module.svg)

| Module | Mutants | Killed | Survived | Mutation Score |
|---|---:|---:|---:|---:|
| Authentication & Role-Based Access | 4 | 3 | 1 | 75.0% |
| Facility Registration & Admin Approval | 4 | 4 | 0 | 100.0% |
| Hospital Blood Request Workflow | 4 | 2 | 2 | 50.0% |
| Blood Stock & Inventory Management | 4 | 1 | 3 | 25.0% |
| Overall | 16 | 10 | 6 | 62.5% |

### 4.3 Surviving Mutants and Missing Tests

| Mutant ID | Module | Why It Survived | Missing Test Case |
|---|---|---|---|
| `AUTH-LOGIC-001` | Authentication | Existing tests only send both credentials empty | Add separate cases for email-present/password-missing and password-present/email-missing |
| `HOSP-CONST-002` | Hospital request workflow | Tests reject negative units, but not zero units | Assert `units = 0` returns `400` and the correct validation message |
| `HOSP-FUNC-004` | Hospital request workflow | Current tests validate request creation but not audit/history recording | Verify hospital history receives a stock-update entry with the request reference ID |
| `LAB-LOGIC-001` | Blood stock validation | Current invalid-stock test makes both fields invalid together | Add partial-invalid payload tests such as blank blood type with positive quantity |
| `LAB-RETURN-002` | Blood stock update | Suite covers first-time stock creation but not additive updates to an existing record | Add a test that posts the same blood type twice and validates cumulative quantity |
| `LAB-CONST-003` | Blood stock removal | Suite checks insufficient stock but not exact depletion | Add a test that removes the exact quantity and confirms the record is deleted |

### 4.4 Mutation Analysis

The mutation results are strong for authentication and admin approval, but much weaker for the stateful inventory/request workflows. That matches the risk profile from Assignment 1: the most complex workflows still need deeper assertions around state transitions, edge values, and auditability.

The most important observation is that surviving mutants were not random. They clustered around:

- partial-input validation,
- zero-boundary values,
- secondary side effects such as history logging,
- repeated stock operations on existing data,
- exact depletion conditions.

That pattern shows the current suite is good at “happy path + obvious rejection” coverage, but thinner on boundary-state coverage.

## 5. Chaos / Fault Injection Testing

### 5.1 Chaos Plan

Three controlled failures were executed:

| Scenario | Injection Method | Target |
|---|---|---|
| API downtime | stop the Express backend process | request page / backend availability |
| Database failure | stop and restart the MongoDB test instance | blood stock page / DB-backed reads |
| Network latency | insert a 1500 ms delayed proxy between frontend and backend | hospital request page |

The chaos runner also captured Playwright screenshots for impact and recovery states. For API downtime, the user-facing screenshots were reliable, while the top-line availability and MTTR were derived from backend stop/start timestamps because the fast health probe stayed green during forced macOS teardown.

### 5.2 Chaos Results

Chaos visualizations:

- [Chaos Availability by Scenario](qa/artifacts/experimental/charts/chaos-availability.svg)
- [Chaos MTTR by Scenario](qa/artifacts/experimental/charts/chaos-mttr.svg)

| Scenario | Availability % | MTTR | Key Observation |
|---|---:|---:|---|
| API downtime | 19.64% | 14.126 s | Frontend stayed mounted, displayed an error toast, and recovered once the backend restarted |
| Database failure | 70.59% | 12.507 s | Reads timed out during outage, then recovered after MongoDB returned |
| Injected network latency | 100.00% | 0 s | Page remained functional, but first authenticated route load increased to 5677 ms |

### 5.3 Chaos Analysis

- The frontend degrades gracefully in all three scenarios. It does not white-screen or crash; instead it keeps the page shell rendered and exposes toast-based failure feedback.
- API process failure is obvious to the user and has the worst short-window availability because every dependent request fails until restart completes.
- Database failure is partially tolerated. The backend eventually resumes normal behaviour after the database returns, but the outage window still produces repeated timeouts.
- Latency is the most user-friendly failure mode. Availability remains 100%, but user-perceived responsiveness degrades significantly.

### 5.4 Resilience Recommendations

1. Add an application-level retry / reconnect status banner for database-dependent pages.
2. Add explicit empty/error states on hospital and blood-lab dashboards rather than relying only on toast notifications.
3. Add health-check and readiness endpoints to separate “process alive” from “database ready”.
4. Consider circuit-breaker or graceful fallback logic for read-heavy pages during transient backend/database failures.

## 6. Expected vs Observed Behaviour

| Area | Expected | Observed | Assessment |
|---|---|---|---|
| Authentication performance | Moderate latency under load | Severe login latency under all scenarios | Risk was underestimated; performance is worse than expected |
| Hospital request workflow | High-risk but should remain functional | Passed all performance thresholds and killed most relevant mutants | Functionality is stronger than expected, but boundary coverage still has gaps |
| Inventory management | High-risk, mutation-prone state changes | Performance stable, but weakest mutation score at 25% | Functional path is fast, but test depth is insufficient |
| Fault tolerance | Graceful degradation with recoverable failures | UI degrades gracefully, but recovery is operational rather than transparent | Behaviour is acceptable, resilience messaging can be improved |

## 7. Conclusion

Assignment 3 shows that BBMS is functionally solid in its core hospital and blood-lab workflows, but two quality risks remain significant:

1. the authentication endpoint is a serious performance bottleneck, and
2. the deepest automated-test gaps are in inventory and edge-condition workflow coverage.

The new experimental scripts now make those risks reproducible in CI. The immediate next actions for the development and QA teams should be:

1. optimise the login path by removing synchronous audit writes,
2. add the six missing mutation-killing tests identified above,
3. strengthen user-facing degraded-state handling on dashboard pages,
4. rerun the experimental suite after those fixes and compare the new metrics against this report baseline.
