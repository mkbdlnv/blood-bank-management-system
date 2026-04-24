# Assignment 3 Chaos Results

Generated: 2026-04-24T13:53:40.946Z

| Scenario | Availability % | MTTR (ms) | Avg Probe Latency (ms) | Frontend Behaviour |
|---|---:|---:|---:|---|
| API downtime | 100.00 | N/A | 2.94 | Hospital request page stayed mounted, surfaced the 'Failed to load blood labs' toast, and recovered after the API returned. |
| Database failure | 70.59 | 12509 | 657.71 | The blood stock page showed a toast during the outage and resumed normal reads after MongoDB returned. |
| Injected network latency | 100.00 | 0 | 4.11 | The hospital request page remained functional under the delayed proxy, but the first data-bearing render slowed noticeably. |

## Lessons

- API outages are visible quickly in the UI through toasts, but users cannot complete request workflows until the service returns.
- Database failure handling is weaker than API process failure because recovery may require reconnect stabilization or a backend recycle.
- Latency does not break the app, but it pushes critical flows close to the edge of acceptable responsiveness.

