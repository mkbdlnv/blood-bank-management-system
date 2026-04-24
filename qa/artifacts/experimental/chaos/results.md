# Assignment 3 Chaos Results

Generated: 2026-04-24T11:37:17.892Z

| Scenario | Availability % | MTTR (ms) | Avg Probe Latency (ms) | Frontend Behaviour |
|---|---:|---:|---:|---|
| API downtime | 19.64 | 14126 | 1.83 | Hospital request page stayed mounted, surfaced the 'Failed to load blood labs' toast, and recovered after the API returned. Availability and MTTR are derived from backend stop/start timestamps plus the captured UI evidence. |
| Database failure | 70.59 | 12507 | 659.47 | The blood stock page showed a toast during the outage and resumed normal reads after MongoDB returned. |
| Injected network latency | 100.00 | 0 | 5.17 | The hospital request page remained functional under the delayed proxy, but the first data-bearing render slowed noticeably. |

## Lessons

- API outages are visible quickly in the UI through toasts, but users cannot complete request workflows until the service returns.
- Database failure handling is weaker than API process failure because recovery may require reconnect stabilization or a backend recycle.
- Latency does not break the app, but it pushes critical flows close to the edge of acceptable responsiveness.
