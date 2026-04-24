# Assignment 3 Mutation Results

Generated: 2026-04-24T11:15:13.914Z

## Module Scores

| Module | Mutants | Killed | Survived | Mutation Score |
|---|---:|---:|---:|---:|
| Authentication & Role-Based Access | 4 | 3 | 1 | 75.0% |
| Facility Registration & Admin Approval | 4 | 4 | 0 | 100.0% |
| Hospital Blood Request Workflow | 4 | 2 | 2 | 50.0% |
| Blood Stock & Inventory Management | 4 | 1 | 3 | 25.0% |
| Overall | 16 | 10 | 6 | 62.5% |

## Mutant Outcomes

| ID | Module | Type | Status | Missing / Confirmed Coverage Insight |
|---|---|---|---|---|
| AUTH-LOGIC-001 | Authentication & Role-Based Access | Logical operator change | Survived | Missing test: reject requests where only one credential is absent (email present/password missing, and vice versa). |
| AUTH-RETURN-002 | Authentication & Role-Based Access | Return value modification | Killed | Detected by existing tests |
| AUTH-CONST-003 | Authentication & Role-Based Access | Constant alteration | Killed | Detected by existing tests |
| AUTH-CONST-004 | Authentication & Role-Based Access | Constant alteration | Killed | Detected by existing tests |
| ADMIN-CONST-001 | Facility Registration & Admin Approval | Constant alteration | Killed | Detected by existing tests |
| ADMIN-LOGIC-002 | Facility Registration & Admin Approval | Logical operator change | Killed | Detected by existing tests |
| ADMIN-FILTER-003 | Facility Registration & Admin Approval | Function removal | Killed | Detected by existing tests |
| ADMIN-CONST-004 | Facility Registration & Admin Approval | Constant alteration | Killed | Detected by existing tests |
| HOSP-LOGIC-001 | Hospital Blood Request Workflow | Logical operator change | Killed | Detected by existing tests |
| HOSP-CONST-002 | Hospital Blood Request Workflow | Constant alteration | Survived | Missing test: reject `units = 0` in hospital request creation. |
| HOSP-CONST-003 | Hospital Blood Request Workflow | Constant alteration | Killed | Detected by existing tests |
| HOSP-FUNC-004 | Hospital Blood Request Workflow | Function removal | Survived | Missing test: verify hospital history entry and reference id after request creation. |
| LAB-LOGIC-001 | Blood Stock & Inventory Management | Logical operator change | Survived | Missing test: reject partially invalid stock payloads where only one field is bad (for example blank blood type with positive quantity). |
| LAB-RETURN-002 | Blood Stock & Inventory Management | Return value modification | Survived | Missing test: add to an existing blood type and verify cumulative quantity. |
| LAB-CONST-003 | Blood Stock & Inventory Management | Constant alteration | Survived | Missing test: allow exact-quantity removal and delete the stock record when it reaches zero. |
| LAB-LOGIC-004 | Blood Stock & Inventory Management | Logical operator change | Killed | Detected by existing tests |

## Recommendations

- AUTH-LOGIC-001: Missing test: reject requests where only one credential is absent (email present/password missing, and vice versa).
- HOSP-CONST-002: Missing test: reject `units = 0` in hospital request creation.
- HOSP-FUNC-004: Missing test: verify hospital history entry and reference id after request creation.
- LAB-LOGIC-001: Missing test: reject partially invalid stock payloads where only one field is bad (for example blank blood type with positive quantity).
- LAB-RETURN-002: Missing test: add to an existing blood type and verify cumulative quantity.
- LAB-CONST-003: Missing test: allow exact-quantity removal and delete the stock record when it reaches zero.
