# NexFieldForce Enterprise Platform: Master AI Build Specification Prompt

Copy and paste the entire prompt below into any AI coding model to build or reproduce the complete NexFieldForce platform from scratch without omitting any module, role, database table, or feature.

---

```markdown
# SYSTEM DIRECTIVE: BUILD COMPLETE "NEXFIELDFORCE" UNIFIED ENTERPRISE WORKFORCE & FIELD AUTOMATION PLATFORM

You are tasked with building a full-stack, production-grade enterprise workforce SaaS platform called **NexFieldForce** (combining Multi-Company SaaS Governance + Human Resources Management + Commercial Sales Force Automation + Field Operations & Telemetry + AI Copilot + Multi-Channel Task Dispatch Engine).

Every single module, database schema, API endpoint, role permission matrix, and interactive UI view specified below MUST be fully implemented with zero placeholders or omissions.

---

## 1. TECHNOLOGY STACK & ARCHITECTURE

1. **Frontend Architecture**:
   - Framework: React 19 + Vite + TailwindCSS.
   - Icons: `lucide-react`.
   - Maps: Real-time Leaflet + OpenStreetMap API (zero external API keys required, animated live agent radar dots, customer markers, route waypoints).
   - Offline Resilience: LocalForage / IndexedDB sync queue with online/offline auto-detection.
   - Desktop & Mobile Web Notifications: HTML5 Web Push Notification API + Top Notification Bar banner.
   - Theming: Full Dark / Light mode toggle with CSS variable adaptation.

2. **Backend Architecture**:
   - Runtime: Node.js (ES Modules).
   - Framework: Express.js (v5+).
   - Security: Helmet, CORS, Rate-Limiting, Bcrypt password hashing, JWT Authentication.
   - Multi-Tenant Isolation Architecture:
     * Strict tenant separation with `company_id` attached to all data records.
     * High-resilience in-memory seed store with zero cold-start failures.
     * PostgreSQL (Supabase) and MySQL relational schemas with complete foreign key enforcement.
   - Communication Services:
     * WhatsApp Deep-Link & Webhook generator (`https://wa.me/<phone>?text=...`).
     * HTML Email Dispatcher using Resend API / SMTP.
     * Web Push Notification payload generator.

---

## 2. MULTI-TENANT SAAS ARCHITECTURE & ROLE SPECIFICATION

### Multi-Tenant Model Hierarchy:
`Platform (Super Admin) -> Client Companies -> Subscriptions / Modules -> Departments -> Roles -> Users & Employees`

```text
                    👑 NEXFIELDFORCE SUPER ADMIN (Platform Owner)
                                   │
               ┌───────────────────┼───────────────────┐
               │                   │                   │
      NXF-ABC-001 (ABC FMCG)   NXF-XYZ-002 (XYZ HR)   NXF-ZGB-006 (Zenith Global)
               │                   │                   │
         🏢 Company Admin     🏢 Company Admin    🏢 Company Admin
               │                   │                   │
          ┌────┼────┐             ┌┼────┐             ┌┼──────┐
          │    │    │             ││    │             ││      │
         HR  Sales Field          HR Staff          Sales   Field
               │
          👔 Supervisor
               │
          ┌────┴────┐
          💼        📍
        Sales      Field
        Agent      Agent

          📋 Staff Member
```

### Complete 8-Role Permission Matrix:

#### 1. `SUPER_ADMIN` (NexFieldForce SaaS Platform Administrator)
- **Identity**: `admin@nexfieldforce.com` (Platform Owner).
- **Core Role**: Manages the SaaS platform itself; onboards, configures, and provisions client organizations.
- **SaaS Platform Dashboard**: Total companies, active/trial/suspended tenant counters, platform user base, module adoption metrics, and growth analytics.
- **Client Companies Management**:
  * Complete directory of registered client organizations (`NXF-HQ-001`, `NXF-ABC-001`, `NXF-XYZ-002`, `NXF-PRM-003`, `NXF-APX-004`, `NXF-ZGB-006`).
  * **Configure Button & Modal**: Opens Company Information (name, ID, industry, contact, phone, email, address) and Enabled Modules checklist with individual ON/OFF toggles (`sales`, `crm`, `orders`, `products`, `collections`, `field_force`, `agent_tracking`, `gps_visits`, `surveys`, `evidence`, `hr`, `attendance`, `leave`, `performance`, `reports`, `ai`) and saves directly to database.
  * **Manage Button & Company Detail View**: Opens dedicated workspace displaying:
    1. *Company Overview*: Name, ID code, industry, status, onboard date, subscription plan, address, contact details.
    2. *Users Breakdown*: Total Users, Company Admins, HR Managers, Supervisors, Sales Agents, Field Agents, and Staff.
    3. *Enabled Functions Checklist*: Visual badge cards for all 16 modules with status.
    4. *Operational Rules*: GPS required, photo proof required, 5% commission engine, quota limits.
    5. *Company Actions*: Configure Company, Manage Modules, Provision Staff (pre-attached to this tenant), Reset Admin, Suspend/Activate.
    6. *Company Staff Roster*: Real live table of all staff members belonging to this specific company.
- **Staff Provisioning View**: Includes Client Company Selector dropdown, attaching `company_id` to user, employee, default leave balances, and salary records. Displays exact backend error messages.
- **6-Step Onboarding Wizard**:
  * Step 1: Company Profile (Trading name, legal name, industry, contact person, email, phone, HQ address).
  * Step 2: Select Subscribed Modules.
  * Step 3: Configure Starter Organization (Departments, divisions).
  * Step 4: Provision Company Administrator (Admin full name, work email, temporary master password).
  * Step 5: Enforce Operational Rules (Mandatory GPS check-in, photo evidence, sales commissions, user quotas).
  * Step 6: Instant Activation & Credential Dispatch (Generates Company Code `NXF-XXX-00X`, workspace activation link).

#### 2. `COMPANY_ADMIN` (Client Organization Administrator)
- **Role**: Master administrator for a specific client tenant (e.g. `admin@zenithbeverages.com`).
- **Scope**: Manages their own company's workforce, departments, and operations strictly within their subscribed modules.
- **Tenant Isolation**: Only sees data where `company_id` matches their own company.

#### 3. `AGENT_ADMIN` (Field Operations Command)
- **Field Command Center**: Active field agents, visit verification rate, order booking, red flags.
- **Field Agents Directory**: Agent profiles, assigned vehicles, live status, daily visit counters.
- **Attendance & Visits**: Geofenced clock-in audits, photo proof, duration anomaly detection.
- **Red Flags Anomaly Center**: Real-time anomaly detection (short visits, late check-ins, low battery / stale pings).
- **Requests & Stock Queue**: Emergency inventory restock and territory pin relocation approvals.

#### 4. `SUPERVISOR` / `MANAGER` (Field Team Dispatch)
- **Team Dispatch Console**: Full task management table with filters (Urgent, High, Normal), "Create Task" modal.
- **Multi-Channel Reminder Engine**: 1-click WhatsApp web chat, HTML email dispatch, and top notification bar alert.
- **My Team & Route Oversight**: Active shift map, team sales leaderboard, expense review (Approve/Reject).

#### 5. `SALES_AGENT` (Commercial Sales Force CRM)
- **12-Section Sales Cockpit**:
  1. *Top 8 Summary Cards*: Today's Sales (₦), Monthly Sales (₦), Sales Target (₦), Achievement %, Orders Today, Outstanding Debt (₦), New Outlets, Visits Today.
  2. *My Performance & Commissions*: Daily/Monthly targets, 5% automated commission engine, quota progress bar.
  3. *New Order Creator POS*: Product picker (SKUs, units, prices), 7.5% VAT calculation, customer credit limit validation.
  4. *Customer Directory & GPS Register*: Merchant outlet list, outstanding balance, GPS coordinate capture.
  5. *Collections & Invoicing*: Payment recording (Cash, Transfer, POS, Cheque), invoice balance settlement.
  6. *My Sales Reports*: Personal sales history, order list with status filters, receipt printing.
  7. *Competitor Intelligence*: Form to log competitor brand pricing, promotions, stock levels, and store shelf display photos.
  8. *Daily Clock-In & Shifts*: Geofenced GPS attendance clock-in with timestamps.
  9. *Product Catalog & Stock*: Master price list, available inventory units, SKU specs.
  10. *Reconciliation & Settlements*: Daily cash-in-hand vs bank deposit slips with photo attachment.
  11. *Task Center*: Assigned sales visits with WhatsApp/Email/In-App reminder actions.
  12. *Sales AI Copilot*: Commercial assistant trained on price lists and deal negotiation scripts.

#### 6. `FIELD_AGENT` (Field Telemetry & Route Execution)
- **Live Mobile Cockpit**: Shift status banner (Active/Paused), start/end shift GPS geofenced toggle.
- **Daily Route Manifest**: Ordered customer stops with distance, priority tags, and Google Maps / Waze deep links.
- **Geofenced Check-In & Verification**: GPS verification within 150m of outlet, stopwatch duration timer, mandatory photo proof.
- **Field Audits & Shelf Share**: Multi-question questionnaires, competitor price tracking, shelf share percentage slider.
- **Incident & SOS Beacon**: Emergency roadside support trigger with immediate dispatch to Agent Admin.

#### 7. `HR_MANAGER` (Workforce & ATS Life Cycle)
- **Recruitment & ATS Pipeline**: Job openings, applicant stages (Applied, Screening, Interview, Offered, Hired).
- **Employee Directory**: Staff profiles, departments, job titles, base salary, employment type, document lockers.
- **Leave Approvals Management**: Vacation, sick leave, compassionate leave balances with 1-click approval/rejection.
- **Attendance & Overtime Timesheets**: Geofenced clock-in logs, biometric timesheets, monthly overtime summaries.
- **Performance & OKR Appraisals**: Quarterly KPI evaluation, self-appraisal submission, supervisor scoring.

#### 8. `EMPLOYEE` (Corporate Staff Self-Service)
- **Staff Portal**: View personal leave balances, submit leave requests with date pickers.
- **Attendance History**: View personal monthly clock-in timesheets and working hours.
- **Payslips & Compensation**: View monthly salary breakdown (Basic, Housing, Transport, Tax/PAYE, Pension).
- **Personal OKRs**: View assigned annual goals and update completion milestones.

---

## 3. MULTI-CHANNEL NOTIFICATION ENGINE

Every scheduled task, assignment, and alert supports 3-way instant dispatch:
1. **WhatsApp Web Dispatch**: Deep-links to `https://wa.me/<phone>?text=<encoded_message>` containing task details, deadline, and customer location.
2. **HTML Email Dispatcher**: Sends professional email notifications to agent's work email with structured HTML table and action button.
3. **In-App Top Notification Bar**: Displays top-fixed banner alert on the agent's screen with sound effect and dismiss trigger.

---

## 4. RELATIONAL DATABASE SCHEMAS

### Complete Supabase (PostgreSQL) Schema:

```sql
-- 0. Client Companies
CREATE TABLE IF NOT EXISTS companies (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    legal_name text,
    industry text NOT NULL DEFAULT 'FMCG Wholesale & Retail Distribution',
    contact_person text,
    phone text,
    email text,
    address text,
    logo_url text,
    subscription_plan text NOT NULL DEFAULT 'Enterprise Suite',
    subscription_status text NOT NULL DEFAULT 'active',
    enabled_modules jsonb NOT NULL DEFAULT '["sales", "field_force", "crm", "orders", "products", "collections", "agent_training", "attendance", "reports", "ai"]'::jsonb,
    rules jsonb NOT NULL DEFAULT '{"gps_required": true, "photo_required": true, "target_system": true, "commission_enabled": true}'::jsonb,
    employee_limit integer NOT NULL DEFAULT 100,
    sales_agent_limit integer NOT NULL DEFAULT 30,
    field_agent_limit integer NOT NULL DEFAULT 30,
    start_date date DEFAULT CURRENT_DATE,
    renewal_date date DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1. Users (Multi-Tenant)
CREATE TABLE IF NOT EXISTS users (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES companies(id) ON DELETE CASCADE DEFAULT 1,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text,
    phone text,
    role_id bigint REFERENCES roles(id) ON DELETE RESTRICT,
    role_code text NOT NULL DEFAULT 'EMPLOYEE',
    department_id bigint REFERENCES departments(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active',
    is_super_admin boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Employees (Multi-Tenant)
CREATE TABLE IF NOT EXISTS employees (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES companies(id) ON DELETE CASCADE DEFAULT 1,
    uuid uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    employee_code text UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    department_id bigint REFERENCES departments(id) ON DELETE SET NULL,
    position_id bigint REFERENCES positions(id) ON DELETE SET NULL,
    territory text,
    employment_status text DEFAULT 'active',
    is_field_agent boolean DEFAULT false,
    is_sales_agent boolean DEFAULT false,
    hire_date date DEFAULT current_date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Orders (Multi-Tenant)
CREATE TABLE IF NOT EXISTS orders (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES companies(id) ON DELETE CASCADE DEFAULT 1,
    order_number text NOT NULL UNIQUE,
    customer_id bigint REFERENCES customers(id) ON DELETE RESTRICT,
    sales_agent_id bigint REFERENCES employees(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'pending',
    subtotal numeric(15,2) NOT NULL DEFAULT 0.00,
    vat_rate numeric(5,2) NOT NULL DEFAULT 7.50,
    vat_amount numeric(15,2) NOT NULL DEFAULT 0.00,
    total_amount numeric(15,2) NOT NULL DEFAULT 0.00,
    payment_status text NOT NULL DEFAULT 'unpaid',
    order_date date NOT NULL DEFAULT current_date,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Visits (Multi-Tenant)
CREATE TABLE IF NOT EXISTS visits (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    company_id bigint REFERENCES companies(id) ON DELETE CASCADE DEFAULT 1,
    agent_id bigint REFERENCES employees(id) ON DELETE RESTRICT,
    customer_id bigint REFERENCES customers(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'scheduled',
    planned_time timestamptz,
    check_in_time timestamptz,
    check_out_time timestamptz,
    duration_minutes integer,
    check_in_lat numeric(10,7),
    check_in_lng numeric(10,7),
    is_geofence_verified boolean DEFAULT false,
    photo_evidence_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 5. DEFAULT SEED ACCOUNTS & LOGINS

All accounts use the password: `ChangeMe123!`

| Persona | Email | Role Code | Tenant Scope |
|---|---|---|---|
| **👑 SaaS Super Admin** | `admin@nexfieldforce.com` | `SUPER_ADMIN` | Global Platform Governance |
| **🏢 Zenith Beverages Admin** | `admin@zenithbeverages.com` | `COMPANY_ADMIN` | NXF-ZGB-006 (Beverages) |
| **🏢 ABC FMCG Admin** | `admin@abcfmcg.com` | `COMPANY_ADMIN` | NXF-ABC-001 (FMCG) |
| **📍 Field Operations Admin** | `agentadmin@nexfieldforce.com` | `AGENT_ADMIN` | Fleet & Field Logistics |
| **👔 Field Supervisor** | `supervisor@nexfieldforce.com` | `SUPERVISOR` | Field Team Dispatch |
| **💼 Commercial Sales Agent** | `sales@nexfieldforce.com` | `SALES_AGENT` | Commercial CRM & Orders |
| **🏃 Field Operations Agent** | `field@nexfieldforce.com` | `FIELD_AGENT` | GPS Telemetry & Store Visits |
| **👥 HR Director** | `hr@nexfieldforce.com` | `HR_MANAGER` | Workforce Lifecycle & ATS |
| **📋 Corporate Staff Member** | `staff@nexfieldforce.com` | `EMPLOYEE` | Employee Self-Service |

---

## 6. VERIFICATION DIRECTIVES

1. Ensure `npm run build` compiles with 0 errors.
2. The Super Admin dashboard must display actual registered companies from the database.
3. Clicking **Configure** opens the company configuration modal with ON/OFF switches for all 16 modules and saves to `/api/companies/:id/modules`.
4. Clicking **Manage** opens the complete Company Detail view with Overview, Users Breakdown, Enabled Modules checklist, and Staff Roster.
5. Provisioning staff attaches the employee strictly to the chosen `company_id` without creating global duplicates.
6. Company Admins and staff log into isolated workspaces reflecting strictly their company's enabled modules.
```
