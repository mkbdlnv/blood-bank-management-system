# Blood Bank Management System QA Report

## 1. Risk Assessment & Strategy Planning

### 1.1 Introduction

Quality Assurance (QA) focuses on preventing defects through planning, process control, and structured testing activities, while Quality Control (QC) is more focused on detecting defects in the delivered product. For this assignment, a risk-based testing approach is used. This approach helps determine which parts of the system should be tested first by evaluating both the probability of failure and the business impact of that failure.

The system under analysis is the **Blood Bank Management System (BBMS)**, a role-based web application designed to support blood donation operations, hospital blood requests, blood camp coordination, donor profile management, blood inventory handling, and facility approval workflows. The system is implemented as a React frontend with an Express and MongoDB backend. Its value depends on reliable user authentication, correct role-based access, accurate blood request processing, valid inventory data, and smooth coordination between donors, hospitals, blood laboratories, and administrators.

The goal of this assignment is to analyze BBMS from a QA perspective, identify the modules with the highest risk, and define testing priorities based on business impact and likelihood of failure.

### 1.2 System Overview

For the purpose of this assignment, BBMS is treated as a web-based healthcare workflow platform with the following major functional areas:

- user authentication and role-based access
- donor registration, profile management, and donation history
- facility registration and administrative approval
- hospital blood request creation and request history tracking
- blood laboratory inventory management
- blood camp creation and management
- donor discovery and coordination features
- public informational pages and contact flows

The project supports four main user roles:

- `donor`
- `hospital`
- `blood-lab`
- `admin`

These capabilities are central to how BBMS operates as a blood management and coordination platform. Hospitals must be able to request blood from approved laboratories, donors must be able to maintain their information and browse camps, blood labs must be able to manage inventory and requests, and admins must be able to approve facilities and oversee the system.

#### Main frontend page groups

**Public pages**

- `/`
- `/auth`
- `/register/donor`
- `/register/facility`
- `/login`
- `/about`
- `/contact`
- informational routes such as `/mission`, `/stories`, `/news`, `/eligibility`, `/process`, `/benefits`, `/privacy`, `/terms`, `/cookies`

**Donor pages**

- `/donor`
- `/donor/profile`
- `/donor/camps`
- `/donor/history`

**Hospital pages**

- `/hospital`
- `/hospital/blood-request-create`
- `/hospital/blood-request-history`
- `/hospital/inventory`
- `/hospital/donors`

**Blood lab pages**

- `/lab`
- `/lab/inventory`
- `/lab/camps`
- `/lab/profile`
- `/lab/requests`
- `/lab/donor`

**Admin pages**

- `/admin`
- `/admin/verification`
- `/admin/donors`
- `/admin/facilities`
- `/admin/camps`
- `/admin/donations`

#### Main backend endpoint groups

| Group | Base path | Purpose |
|---|---|---|
| Authentication | `/api/auth` | registration, login, authenticated profile access |
| Donor | `/api/donor` | donor profile, stats, history, camps |
| Facility | `/api/facility` | facility dashboard, facility profile, approved lab lookup |
| Hospital | `/api/hospital` | blood requests, hospital dashboard, stock, donor directory |
| Blood Lab | `/api/blood-lab` | camps, stock, requests, donor search, donation recording |
| Admin | `/api/admin` | facilities, approvals, dashboard, donors, camps |
| Documentation | `/api/doc` | Swagger UI |

#### Active API endpoint inventory

| # | Endpoint | Method | Module |
|---|---|---|---|
| 1 | `/api/auth/register` | POST | Authentication |
| 2 | `/api/auth/login` | POST | Authentication |
| 3 | `/api/auth/profile` | GET | Authentication |
| 4 | `/api/donor/profile` | GET | Donor |
| 5 | `/api/donor/profile` | PUT | Donor |
| 6 | `/api/donor/camps` | GET | Donor |
| 7 | `/api/donor/history` | GET | Donor |
| 8 | `/api/donor/stats` | GET | Donor |
| 9 | `/api/facility/dashboard` | GET | Facility |
| 10 | `/api/facility/profile` | GET | Facility |
| 11 | `/api/facility/profile` | PUT | Facility |
| 12 | `/api/facility/labs` | GET | Facility |
| 13 | `/api/hospital/blood/request` | POST | Hospital |
| 14 | `/api/hospital/blood/requests` | GET | Hospital |
| 15 | `/api/hospital/dashboard` | GET | Hospital |
| 16 | `/api/hospital/blood/stock` | GET | Hospital |
| 17 | `/api/hospital/history` | GET | Hospital |
| 18 | `/api/hospital/donors` | GET | Hospital |
| 19 | `/api/hospital/donors/:id/contact` | POST | Hospital |
| 20 | `/api/blood-lab/dashboard` | GET | Blood Lab |
| 21 | `/api/blood-lab/history` | GET | Blood Lab |
| 22 | `/api/blood-lab/camps` | POST | Blood Lab |
| 23 | `/api/blood-lab/camps` | GET | Blood Lab |
| 24 | `/api/blood-lab/camps/:id` | PUT | Blood Lab |
| 25 | `/api/blood-lab/camps/:id/status` | PATCH | Blood Lab |
| 26 | `/api/blood-lab/camps/:id` | DELETE | Blood Lab |
| 27 | `/api/blood-lab/blood/add` | POST | Blood Lab |
| 28 | `/api/blood-lab/blood/remove` | POST | Blood Lab |
| 29 | `/api/blood-lab/blood/stock` | GET | Blood Lab |
| 30 | `/api/blood-lab/blood/requests` | GET | Blood Lab |
| 31 | `/api/blood-lab/blood/requests/:id` | PUT | Blood Lab |
| 32 | `/api/blood-lab/labs` | GET | Blood Lab |
| 33 | `/api/blood-lab/donors/search` | GET | Blood Lab |
| 34 | `/api/blood-lab/donors/donate/:id` | POST | Blood Lab |
| 35 | `/api/blood-lab/donations/recent` | GET | Blood Lab |
| 36 | `/api/admin/facilities` | GET | Admin |
| 37 | `/api/admin/facility/approve/:id` | PUT | Admin |
| 38 | `/api/admin/facility/reject/:id` | PUT | Admin |
| 39 | `/api/admin/dashboard` | GET | Admin |
| 40 | `/api/admin/donors` | GET | Admin |
| 41 | `/api/admin/camps` | GET | Admin |
| 42 | `/api/doc` | GET | Swagger |

### 1.3 Risk Identification

For BBMS, the most critical business outcomes are clear:

- users must be able to register and log in
- role-based access must work correctly
- hospitals must be able to request blood from approved labs
- blood labs must be able to manage inventory and process requests
- admins must be able to approve facilities
- donor and stock data must remain accurate

If any of these fail, the system stops delivering its main value as a blood coordination platform.

### 1.4 Risk Matrix

| Module | Probability | Impact | Risk Level | Reason |
|---|---|---|---|---|
| Authentication & Role-Based Access | Medium | Critical | Critical | If login, token handling, or role checks fail, users cannot access the correct dashboard or data |
| Facility Registration & Admin Approval | Medium | Critical | Critical | Hospitals and labs depend on approval before they can use the system; approval bugs block key workflows |
| Hospital Blood Request Workflow | High | Critical | Critical | This is a core business flow; failures prevent hospitals from requesting blood in urgent scenarios |
| Blood Stock & Inventory Management | High | Critical | Critical | Incorrect stock data can lead to failed requests, unusable inventory, or wrong operational decisions |
| Blood Lab Request Processing | Medium | High | High | If requests cannot be accepted or rejected correctly, hospital-lab coordination breaks down |
| Blood Camp Management | Medium | High | High | Blood camps are central for donor outreach and collection planning |
| Donor Profile & Donation History | Medium | High | High | Incorrect donor history or eligibility information affects trust and operational correctness |
| Donor Search / Hospital Donor Directory | Medium | Medium | Medium | Helpful for coordination, but not the only core path of the system |
| Public Content Pages & Contact Flow | Low | Medium | Low | These affect presentation and UX but do not directly break core blood workflows |
| Placeholder / Informational Pages | Low | Low | Low | These pages are useful for completeness but are not operationally critical |

### 1.5 Risk Prioritization

| Priority Level | Modules |
|---|---|
| Critical | Authentication & Role-Based Access; Facility Registration & Admin Approval; Hospital Blood Request Workflow; Blood Stock & Inventory Management |
| High | Blood Lab Request Processing; Blood Camp Management; Donor Profile & Donation History |
| Medium | Donor Search / Hospital Donor Directory |
| Low | Public Content Pages; Placeholder / Informational Pages |

### 1.6 Explanation of High-Priority Components

#### Authentication & Role-Based Access

This module is critical because BBMS is fully role-dependent. A donor, hospital, blood lab, and admin each receive different dashboards and permissions. If authentication fails, users cannot access the system. If role enforcement fails, users may be redirected incorrectly or gain access to unauthorized data.

#### Facility Registration & Admin Approval

This module is critical because hospitals and blood labs cannot log in until they are approved. A failure in this workflow blocks onboarding completely and makes downstream features such as blood requests or lab inventory inaccessible.

#### Hospital Blood Request Workflow

This is one of the most important parts of BBMS. Hospitals use this workflow to request blood from approved laboratories. If request creation fails, if approved labs are not listed correctly, or if history tracking is broken, the platform fails in one of its main operational use cases.

#### Blood Stock & Inventory Management

Inventory is central to the platform's reliability. Blood laboratories and hospitals rely on correct stock quantities and related data. If inventory operations fail, the system may report wrong availability or prevent valid requests from being fulfilled.

#### Blood Lab Request Processing

The blood lab side of the workflow is critical for closing the hospital request loop. Even if hospitals can submit requests, the system still fails if labs cannot view, approve, or reject them correctly.

#### Blood Camp Management

Blood camps are an important mechanism for donor engagement and collection planning. Bugs in camp creation, editing, deletion, or visibility affect donor participation and collection coordination.

#### Donor Profile & Donation History

Donor data drives eligibility, history, and trust. If profile editing, donation history retrieval, or stats are inaccurate, both donors and administrators may act on invalid information.

### 1.7 Medium- and Low-Priority Components

**Donor Search / Hospital Donor Directory** is medium priority. It improves coordination and discovery, but the system can still provide value without it if the core request and inventory workflows remain functional.

**Public Content Pages** and **Placeholder Pages** are low priority for this assignment because they do not directly affect the main blood request, approval, inventory, and donation workflows. They still matter for user experience, but they should be tested after operationally critical modules are stable.

### 1.8 Assumptions and Reasoning

Several assumptions were made during this analysis.

First, BBMS is treated as a real operational healthcare support platform rather than as a UI prototype. This means the analysis focuses on business-critical workflows such as approvals, inventory, requests, and donation records.

Second, the most important user goals are assumed to be:

1. signing in successfully,
2. accessing the correct role dashboard,
3. approving healthcare facilities correctly,
4. requesting and processing blood reliably,
5. maintaining correct donor and inventory records.

Third, probability was estimated based on workflow complexity, number of involved roles, state changes, and data sensitivity. For example, request handling and inventory management were rated high because they involve multiple dependent states and role interactions. Approval and authentication were rated critical because failure there blocks system access entirely.

Fourth, this is a black-box QA planning analysis based on the observable behavior of the current project, the route structure, the controllers, and the page flows. The analysis does not assume access to historical defect statistics or private production telemetry.

### 1.9 Final Testing Priority for Assignment 1

Based on the analysis, the initial testing focus for BBMS should be:

1. Authentication & role-based access
2. Facility registration & admin approval
3. Hospital blood request workflow
4. Blood stock & inventory management
5. Blood lab request processing
6. Blood camp management

These areas should receive the earliest and deepest testing effort because failures in them would have the most severe effect on usability, business value, and user trust.

## 2. QA Environment Setup

### 2.1 Installed Tools

The QA environment for this project is implemented directly inside the main repository on the `qa` branch. The current setup includes both application runtime tools and a lightweight automated QA layer:

- Node.js / npm: package management and execution of QA scripts
- Playwright: browser-based UI smoke automation
- Custom Node smoke scripts: API validation for multi-role workflows
- Docker: environment setup and isolation
- Git: version control
- GitHub Actions: CI/CD automation through `.github/workflows/qa.yml`

### 2.2 Repository Structure

The project structure now includes a dedicated QA workspace:

```text
/blood-bank-management-system
  /.github
    /workflows
      qa.yml
  /backend
    /controllers
    /middlewares
    /models
    /openapi
    /routes
    server.js
    seedAdmin.js
  /frontend
    /src
      /components
      /pages
      /utils
    package.json
  /qa
    /api
      smoke.mjs
    /scripts
      wait-for-http.mjs
    /support
      testData.mjs
    /ui
      smoke.spec.js
    package.json
    playwright.config.js
    README.md
  docker-compose.yml
  README.md
  PROJECT_REPORT.md
```

### 2.3 CI/CD Pipeline

The project now contains an implemented GitHub Actions workflow in `.github/workflows/qa.yml`.

Current pipeline stages:

1. Build
2. Dependency installation
3. MongoDB service startup
4. Admin seed execution
5. Backend and frontend startup
6. API smoke testing
7. UI smoke testing
8. Artifact upload

Implemented CI/CD pipeline flow:

- install dependencies for `backend`, `frontend`, and `qa`
- start a MongoDB service container in GitHub Actions
- seed the admin account using `backend/seedAdmin.js`
- start backend on port `5000`
- start frontend on port `5173`
- wait for `/api/doc` and `/` to become available
- run `qa/api/smoke.mjs` to validate registration, approval, camp creation, and blood-request flow
- run `qa/ui/smoke.spec.js` to validate landing page rendering, donor login, and hospital request page visibility
- upload Playwright reports and service logs as CI artifacts

## 3. Initial Test Strategy Documentation

### 3.1 Project Scope and Objectives

This QA project covers the risk-based testing of BBMS, a role-based blood bank management platform. The scope is limited to functional areas that directly affect access control, healthcare workflow correctness, and business continuity:

- authentication and dashboard access
- donor registration and donor account management
- facility registration and admin approval
- hospital blood requests
- blood stock management
- blood-lab processing workflows
- blood camp creation and visibility

The main objectives are:

- identify and prioritize the highest-risk modules according to business impact and failure probability
- define a reproducible QA environment for local and CI execution
- establish a practical test strategy for both manual and automated testing
- produce documentation that can be reused as a basis for further academic or project reporting

### 3.2 Test Approach

The test approach is centered on functional testing of the critical modules identified in the risk assessment.

The testing cycle should combine:

- manual exploratory testing for early defect discovery
- API validation for backend contract and business-rule verification
- UI automation for repeatable role-based workflows
- regression testing for previously fixed defects
- selective performance checks for high-impact endpoints

Priority should be given to flows that involve multiple roles and strict business rules. For example, the hospital blood request workflow should be tested together with admin approval and blood-lab availability because those modules are interdependent.

### 3.3 Tools Configuration

- **Custom Node smoke scripts**: used to validate backend endpoints, request and response handling, authentication flows, approval workflows, camp creation, and blood-request integrity across multiple roles.
- **Playwright**: used for browser automation of core user journeys such as landing-page rendering, donor login, and hospital request-page validation with approved labs.
- **JMeter**: can be used for load testing of authentication, request history, donor lists, and inventory APIs.
- **Docker**: ensures reproducible local environments and consistent service startup.
- **GitHub Actions**: used to automate smoke execution after code changes on the `qa` branch and during pull requests.

## 4. Baseline Metrics for Research Paper

### 4.1 Initial Coverage Plan

1. **Authentication and role-based access**
   Verify that each valid user type can log in successfully, receive a valid token, and be redirected to the correct dashboard. Verify that unapproved facilities cannot log in.

2. **Facility registration and admin approval**
   Verify that a hospital or blood lab can register successfully, appears in the admin verification list, and can be approved or rejected correctly.

3. **Hospital blood request workflow**
   Verify that a hospital can request blood only from approved blood labs, that request validation works, and that the request appears correctly in the lab workflow.

4. **Blood stock and inventory management**
   Verify that a blood lab can add and remove stock, and that stock data is visible and consistent across the relevant pages and APIs.

5. **Blood camp management**
   Verify that a blood lab can create, update, and delete a camp, and that the donor-facing camp list reflects valid camp data.

6. **Donor profile and donation history**
   Verify that a donor can access and update profile information, retrieve donation history, and view consistent statistics.

7. **Administrative oversight**
   Verify that the admin dashboard, donor list, facilities list, and camps list load correctly for an authenticated admin account.

### 4.2 Estimated Initial Effort

| Activity | Estimated Time |
|---|---|
| Environment setup | 6 hours |
| Manual exploratory testing | 8 hours |
| API test design and execution | 6 hours |
| UI automation preparation | 8 hours |
| Smoke and regression planning | 4 hours |

## 5. Pages and Functional Mapping

### 5.1 Public Pages

| Page | Main Purpose |
|---|---|
| Landing | Introduces BBMS and directs users to register or log in |
| Auth Hub | Entry point for login and registration choices |
| About | Product mission, values, and public presentation |
| Contact | Message form and contact information |
| Public Info Pages | Informational placeholder screens for mission, stories, process, policies, and other static content |

### 5.2 Donor Pages

| Page | Main Purpose |
|---|---|
| Donor Dashboard | Dashboard metrics, eligibility, quick actions, recent activity |
| Donor Profile | Profile editing and donor data review |
| Donor Camps List | Browse camps |
| Donor Donation History | Historical donations, filtering, export |

### 5.3 Hospital Pages

| Page | Main Purpose |
|---|---|
| Hospital Dashboard | Summary of requests and stock |
| Hospital Request Blood | Submit blood requests to approved labs |
| Hospital Request History | View historical requests |
| Hospital Blood Stock | View inventory and stock alerts |
| Donor Directory | Browse donors and log contact attempts |

### 5.4 Blood Lab Pages

| Page | Main Purpose |
|---|---|
| Blood Lab Dashboard | Dashboard with stats, activity, recent camps, inventory snapshot |
| Blood Stock | Manage stock quantities |
| Blood Camps | Create and manage camps |
| Lab Profile | View and update profile |
| Lab Manage Requests | Process hospital requests |
| Blood Lab Donor | Search donors and record donations |

### 5.5 Admin Pages

| Page | Main Purpose |
|---|---|
| Admin Dashboard | System-wide metrics and quick actions |
| Admin Facilities | Pending facility approval workflow |
| Get All Donors | Donor oversight |
| Get All Facilities | Facility oversight |
| Admin Camps | Camp oversight |
| Admin Donations | Currently placeholder functionality |

## 6. Core Data Models

The current backend includes the following major MongoDB models:

- `Donor`
- `Facility`
- `Admin`
- `Blood`
- `BloodRequest`
- `BloodCamp`
- `Camp`
- `User`

The most business-relevant models for current system behavior are:

- `Donor`
- `Facility`
- `Blood`
- `BloodRequest`
- `BloodCamp`
- `Admin`

These models support the main healthcare workflow state transitions, especially:

- donor registration and donation history
- facility approval and role activation
- inventory availability
- blood request processing
- camp scheduling and donor participation planning

## 7. Key Observations About Current State

Several implementation observations are relevant for QA planning:

1. The repository contains some legacy or unused route files such as `campRoutes.js`, `hospital.js`, and `authentication.js` that are not mounted in `backend/server.js`.
2. The project has meaningful functional coverage for donors, hospitals, blood labs, and admins.
3. The admin donations page is still placeholder functionality.
4. The public informational pages are functional routes, but many are generic content pages rather than deep business modules.
5. The repository currently does not include a ready-made automated QA suite or CI pipeline definition.

These observations reinforce the need for a risk-based test strategy rather than assuming full maturity across all modules.

## 8. References

1. Blood Bank Management System repository files in `frontend/` and `backend/`
2. `README.md`
3. `frontend/src/App.jsx`
4. `backend/server.js`
5. `backend/routes/*.js`
6. `backend/controllers/*.js`
7. `backend/models/*.js`
8. `docker-compose.yml`
