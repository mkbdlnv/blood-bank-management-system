# Assignment 3 Performance Results

Generated: 2026-04-24T12:04:38.663Z

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
| Auth Login | load | 2602.05 | 2557.09 | 3193.37 | 4.23 | 0.00% | 88.58 | 100.60 | 97.80 | 100.83 | FAIL |
| Auth Login | stress | 5204.57 | 5790.40 | 8047.00 | 4.19 | 0.00% | 92.90 | 99.40 | 108.65 | 115.25 | FAIL |
| Auth Login | spike | 9223.34 | 5521.56 | 23728.92 | 4.03 | 0.00% | 89.97 | 99.10 | 116.32 | 118.11 | FAIL |
| Auth Login | endurance | 2107.29 | 2090.96 | 2434.75 | 4.32 | 0.00% | 94.06 | 99.80 | 114.97 | 118.83 | FAIL |
| Hospital Blood Request Creation | load | 10.09 | 8.03 | 25.14 | 56.10 | 0.00% | 30.02 | 46.10 | 142.26 | 167.13 | PASS |
| Hospital Blood Request Creation | stress | 119.64 | 34.46 | 421.83 | 65.01 | 0.00% | 85.53 | 151.80 | 299.66 | 481.89 | PASS |
| Hospital Blood Request Creation | spike | 245.05 | 235.69 | 577.79 | 83.08 | 0.00% | 90.73 | 150.50 | 376.70 | 586.03 | PASS |
| Hospital Blood Request Creation | endurance | 12.94 | 10.88 | 30.81 | 46.49 | 0.00% | 43.56 | 94.30 | 207.72 | 292.11 | PASS |
| Blood Stock Update | load | 9.47 | 8.00 | 21.19 | 56.31 | 0.00% | 30.06 | 50.50 | 179.61 | 192.72 | PASS |
| Blood Stock Update | stress | 112.56 | 45.84 | 363.15 | 66.33 | 0.00% | 91.26 | 150.70 | 326.39 | 500.61 | PASS |
| Blood Stock Update | spike | 255.80 | 259.06 | 572.67 | 81.10 | 0.00% | 93.20 | 153.90 | 382.22 | 528.08 | PASS |
| Blood Stock Update | endurance | 12.59 | 10.61 | 29.09 | 46.56 | 0.00% | 44.77 | 87.00 | 217.49 | 310.98 | PASS |

## Notes

- CPU and memory samples were captured from the Express backend process once per second during each k6 run.
- Endurance duration is shortened for reproducible local/CI execution and should be extended to 15-30 minutes for a larger-scale study.

