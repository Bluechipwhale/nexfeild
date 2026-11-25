# NexFieldForce — Unified Database Documentation

## 1. Overview

NexFieldForce unites **HR & People Operations, Sales Force Management, Field Operations & Fleet, Live Telemetry Monitoring, and Workforce AI** into a normalized relational data model.

---

## 2. Table Catalog by Domain

### Multi-Tenancy & Access Control
- `companies`: Multi-tenant organization accounts
- `roles`: 12+ system roles (`SUPER_ADMIN`, `COMPANY_ADMIN`, `HR_ADMIN`, `HR_MANAGER`, `MANAGER`, `SUPERVISOR`, `SALES_AGENT`, `FIELD_AGENT`, `EMPLOYEE`, `FINANCE`, `AUDITOR`)
- `permissions` & `role_permissions`: Granular capability matrix
- `users`: Authenticated user credentials and security state
- `registration_requests`: Pending user signups requiring admin review
- `password_reset_tokens`: Time-limited cryptographic password reset hashes

### Human Resources & Lifecycle
- `departments`, `teams`, `positions`, `locations`: Corporate structure
- `employees`: Core employee profiles (linked to user credentials)
- `employee_documents` & `document_types`: Compliance records with 60-day expiry tracking
- `attendance`: Server-timestamped clock-in/out logs with late detection
- `leave_types`, `leave_balances`, `leave_requests`: Entitlement balances & review workflow
- `job_postings` & `candidates`: Recruitment / ATS pipeline (moving to `HIRED` auto-creates employee)
- `employee_onboarding`: 7-point provisioning checklists
- `goals`: Performance KPI goals
- `salary_records` & `payslips`: Compensation structures and monthly pay runs

### Sales Force & Field Operations
- `markets`: Commercial coverage markets (Balogun, Yaba, Ikorodu, Dugbe, Kaduna)
- `streets`: Street-level coverage targets
- `routes`: Field route runs with GPS waypoints and completion history
- `customers`: Retailer and distributor outlets with GPS coordinates and balances
- `products`: SKU catalog, price points, and inventory stock
- `orders`: Merchant orders with discounts, payment status, and commission
- `commissions`: 5% bonus tracking linked to completed sales orders
- `field_assignments`: Work order dispatches with priority levels
- `field_visits`: GPS-verified check-in visits with proof photos and feedback
- `vehicles`: Fleet assets with fuel levels, odometer counters, and live coordinates
- `trip_logs` & `maintenance_logs`: Pre-trip checklists and vehicle service logs
- `location_logs`: Real-time GPS telemetry records

### Intelligence & System Operations
- `announcements` & `notifications`: Internal communication broadcasts
- `tasks`: Collaborative task management
- `alerts`: Anomaly alerts (late clock-ins, overdue balances)
- `audit_logs`: Immutable security audit trails
- `ai_conversations` & `ai_messages`: AI copilot chat history and tool executions

---

## 3. Migration Files

- **Supabase SQL Editor:** [`supabase-production-migration.sql`](file:///c:/Users/HP/Documents/nexfeildforce/supabase-production-migration.sql)
- **Hostinger MySQL DDL:** [`mysql-schema.sql`](file:///c:/Users/HP/Documents/nexfeildforce/mysql-schema.sql)
