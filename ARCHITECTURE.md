# NexFieldForce — Enterprise Architecture Documentation

## 1. System Overview

**NexFieldForce** is an enterprise-grade AI-Powered Human Resources & Workforce Management Platform built for multi-tenant SaaS deployment on Hostinger Business Web Hosting.

The application unifies:
1. **Human Resources & People Management**: Employee directory, organizational structure, departments, positions, teams, and interactive organization charts.
2. **Time, Attendance & Shifts**: Server-verified clock-in/out, GPS/geofencing tracking, break logging, and timesheet approvals.
3. **Leave Management**: Entitlement tracking, duration calculations, employee requests, and supervisor approvals.
4. **Recruitment & Applicant Tracking (ATS)**: Job requisitions, public openings, candidate pipelines, interview scorecards, and auto-onboarding triggers.
5. **Employee Onboarding**: 7-step provisioning, document verification, equipment assignment, and progress tracking.
6. **Performance & Appraisals**: Goal/KPI trackers, continuous feedback, and review cycles.
7. **Field Workforce Operations**: Task dispatch, work orders, field visit check-ins with photo proof, and fleet management.
8. **Payroll-Ready Records**: Salary structures, allowances, statutory deductions, monthly pay runs, and itemized payslips.
9. **Document Compliance**: Employee contract repository, certifications, and automated 60-day expiry notifications.
10. **Internal Communication**: Announcements broadcasts and real-time notification alerts.
11. **AI Workforce Command Center**: Dedicated AI agents (HR Copilot, Candidate Screener, Attendance Detector, Employee Support) querying real database tables.
12. **Role-Based Access Control (RBAC)**: Granular permissions matrix supporting 12+ standard roles with custom permission bindings.

---

## 2. Architecture Diagram

```mermaid
graph TD
  UserClient[Web Browser / Mobile PWA] -->|HTTPS / REST API / JWT| ExpressServer[Node.js + Express 5 Backend]
  
  subgraph Frontend [React 19 + Vite SPA]
    Layout[Enterprise Shell & Sidebar]
    Palette[Ctrl+K Command Palette]
    FeatureViews[HR, Attendance, Leave, ATS, Performance, Field Ops, AI, Payroll]
  end

  subgraph Backend [Modular Server Architecture]
    Router[/api/* Central Router]
    AuthMW[JWT Authentication & RBAC Middleware]
    AuditMW[Security Audit Logger]
    Controllers[Domain Controllers]
    AiEngine[AI Tool Execution Engine]
  end

  subgraph DataLayer [Storage & Services]
    MySQL[(MySQL 8.0 / MariaDB)]
    Resend[Resend Transactional Email API]
    Uploads[Secure Local/Cloud File Storage]
  end

  ExpressServer --> Router
  Router --> AuthMW --> Controllers
  Controllers --> MySQL
  Controllers --> AuditMW --> MySQL
  AiEngine --> MySQL
  Controllers --> Resend
```

---

## 3. Technology Stack

- **Frontend**: React 19, Vite, TailwindCSS, Lucide Icons, HeadlessUI.
- **Backend**: Node.js 20+, Express 5, `mysql2/promise`, `bcryptjs`, `jsonwebtoken`, `helmet`, `compression`, `cors`.
- **Database**: MySQL 8.0+ / MariaDB (with fallback support).
- **Email Delivery**: Resend API (`api.resend.com/emails`).
- **Deployment Platform**: Hostinger Business Web Hosting (Node.js Application Mode).
