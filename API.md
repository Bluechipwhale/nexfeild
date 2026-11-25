# NexFieldForce — Unified REST API Documentation

All requests except public auth require `Authorization: Bearer <token>`.

---

## 1. Authentication & Registration Approvals

* `POST /api/auth/login`: Authenticate and receive JWT + user profile with permissions and role.
* `POST /api/auth/register`: Register new account with role selection (privileged roles placed in pending approval).
* `GET /api/auth/registrations`: List pending registration requests (Admin).
* `POST /api/auth/registrations/:id/approve`: Approve registration and activate user profile (Admin).
* `POST /api/auth/registrations/:id/reject`: Reject registration request (Admin).
* `POST /api/auth/request-password-reset`: Generate password reset link via Resend API.
* `POST /api/auth/reset-password`: Complete password reset using cryptographic token.
* `POST /api/auth/self-reset-password`: Instant phone verification reset.
* `GET /api/auth/me`: Get current authenticated user profile.

---

## 2. Sales Force & Commercial Management

* `GET /api/sales/products`: List SKU products and pricing.
* `POST /api/sales/products`: Add new product to catalog.
* `GET /api/sales/customers`: List customer outlets with market and search filters.
* `POST /api/sales/customers`: Register new customer / outlet with GPS coordinates.
* `GET /api/sales/orders`: List sales orders with itemized breakdown and commission.
* `POST /api/sales/orders`: Record new sales order and auto-credit 5% sales commission.
* `GET /api/sales/targets`: View sales targets and leaderboard rankings.
* `GET /api/sales/commissions`: View agent commission history.
* `GET /api/sales/summary`: Overall sales revenue, order volume, and active agent metrics.

---

## 3. Field Force Operations & Live Monitoring

* `GET /api/monitoring/live`: Live GPS telemetry, agent coordinates, customer pins, and alerts.
* `GET /api/field/dashboard`: Field dashboard KPIs (today's tasks, visits, vehicles).
* `GET /api/field/assignments`: List field work order assignments.
* `POST /api/field/assignments`: Dispatch new work order.
* `PATCH /api/field/assignments/:id/status`: Update work order status (`ASSIGNED`, `IN_PROGRESS`, `COMPLETED`).
* `GET /api/field/visits`: List completed field visits with proof photos and feedback.
* `POST /api/field/visits`: Record visit check-in with GPS verification and notes.
* `GET /api/field/routes`: List active coverage routes and waypoints.
* `GET /api/field/vehicles`: List fleet vehicles, fuel levels, and odometers.
* `GET /api/field/trips`: List vehicle delivery trip logs.

---

## 4. Human Resources & Core Operations

* `GET /api/employees`: List employees with search, department, and status filters.
* `POST /api/employees`: Create employee and provision initial leave balances.
* `GET /api/attendance/summary`: Get today's attendance metrics.
* `POST /api/attendance/clock-in`: Clock in with server timestamp and late detection.
* `POST /api/attendance/clock-out`: Clock out and compute work duration.
* `GET /api/leave/balances`: Get remaining leave days per category.
* `GET /api/leave/requests`: List leave applications.
* `POST /api/leave/requests`: Submit leave request.
* `POST /api/leave/requests/:id/review`: Approve or reject leave request.
* `GET /api/recruitment/jobs`: List open job postings.
* `GET /api/recruitment/candidates`: Candidate pipeline stages.
* `PATCH /api/recruitment/applications/:id/stage`: Advance candidate stage (`HIRED` auto-creates employee).
* `GET /api/payroll/salaries`: Compensation records.
* `GET /api/documents`: Document compliance repository.
* `GET /api/communication/announcements`: Internal broadcast notices.

---

## 5. Workforce AI Command Center

* `POST /api/ai/chat`: Execute natural language queries across HR, Sales, Field Operations, and Targets with safe database tools.
