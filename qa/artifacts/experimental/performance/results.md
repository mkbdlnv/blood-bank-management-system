# Assignment 3 Performance Results

Generated: 2026-04-24T13:40:36.902Z

## Threshold Plan

| Endpoint | Scenario | Avg <= (ms) | Median <= (ms) | P95 <= (ms) | Error Rate <= |
|---|---|---:|---:|---:|---:|
| Auth Login | load | 300 | 250 | 500 | 1.0% |
| Auth Login | stress | 450 | 400 | 800 | 2.0% |
| Auth Login | spike | 650 | 600 | 1100 | 3.0% |
| Auth Login | endurance | 350 | 300 | 650 | 1.0% |
| Hospital Blood Request Creation | load | 350 | 300 | 650 | 1.0% |
| Hospital Blood Request Creation | stress | 550 | 500 | 950 | 2.0% |
| Hospital Blood Request Creation | spike | 800 | 750 | 1300 | 3.0% |
| Hospital Blood Request Creation | endurance | 450 | 400 | 850 | 2.0% |
| Blood Stock Update | load | 320 | 280 | 600 | 1.0% |
| Blood Stock Update | stress | 500 | 450 | 900 | 2.0% |
| Blood Stock Update | spike | 750 | 700 | 1200 | 3.0% |
| Blood Stock Update | endurance | 420 | 360 | 750 | 2.0% |

## Execution Metrics

| Endpoint | Scenario | Avg (ms) | Median (ms) | P95 (ms) | Throughput (req/s) | Error Rate | Avg CPU % | Max CPU % | Avg Mem (MB) | Max Mem (MB) | Status |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Auth Login | load | 2295.24 | 2285.69 | 2932.91 | 4.75 | 0.00% | 92.26 | 102.40 | 103.65 | 112.25 | FAIL |
| Auth Login | stress | 4738.46 | 4952.66 | 7282.50 | 4.67 | 0.00% | 95.08 | 101.10 | 119.26 | 123.13 | FAIL |
| Auth Login | spike | 8421.22 | 5005.95 | 22509.17 | 4.46 | 0.00% | 90.53 | 101.50 | 124.76 | 129.00 | FAIL |
| Auth Login | endurance | 1884.38 | 1977.66 | 2137.89 | 4.76 | 0.00% | 95.66 | 101.90 | 117.39 | 123.61 | FAIL |
| Hospital Blood Request Creation | load | 16.69 | 14.50 | 29.11 | 54.58 | 0.00% | 36.88 | 59.80 | 165.22 | 191.97 | PASS |
| Hospital Blood Request Creation | stress | 90.94 | 29.94 | 304.39 | 70.96 | 0.00% | 84.73 | 148.00 | 324.12 | 492.28 | PASS |
| Hospital Blood Request Creation | spike | 211.56 | 188.03 | 548.88 | 89.72 | 0.00% | 93.42 | 145.00 | 376.46 | 565.25 | PASS |
| Hospital Blood Request Creation | endurance | 17.96 | 16.80 | 30.67 | 45.50 | 0.00% | 45.35 | 84.10 | 247.04 | 317.98 | PASS |
| Blood Stock Update | load | 17.38 | 16.06 | 29.40 | 54.24 | 0.00% | 38.91 | 55.30 | 207.71 | 223.42 | PASS |
| Blood Stock Update | stress | 85.87 | 27.43 | 287.11 | 72.59 | 0.00% | 92.47 | 148.10 | 341.00 | 482.52 | PASS |
| Blood Stock Update | spike | 204.90 | 179.16 | 534.33 | 91.14 | 0.00% | 95.07 | 152.70 | 411.41 | 643.81 | PASS |
| Blood Stock Update | endurance | 20.09 | 19.03 | 31.10 | 45.06 | 0.00% | 44.09 | 81.00 | 278.39 | 340.88 | PASS |

## Notes

- CPU and memory samples were captured from the Express backend process once per second during each k6 run.
- Endurance duration is shortened for reproducible local/CI execution and should be extended to 15-30 minutes for a larger-scale study.

