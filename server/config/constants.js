export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  AGENT_ADMIN: 'AGENT_ADMIN',
  AGENTADMIN: 'AGENTADMIN',
  SUPERVISOR: 'SUPERVISOR',
  SALES_AGENT: 'SALES_AGENT',
  FIELD_AGENT: 'FIELD_AGENT',
  HR_MANAGER: 'HR_MANAGER',
  HR_ADMIN: 'HR_ADMIN',
  HR_OFFICER: 'HR_OFFICER',
  EMPLOYEE: 'EMPLOYEE',
  STAFF_MEMBER: 'STAFF_MEMBER',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  MANAGER: 'MANAGER',
  TEAM_LEAD: 'TEAM_LEAD',
  RECRUITER: 'RECRUITER',
  FINANCE: 'FINANCE',
  AUDITOR: 'AUDITOR',
}

export const PERMISSIONS = [
  // Dashboard & Operations Overview
  { module: 'dashboard', code: 'dashboard.view', name: 'View Dashboard & KPIs' },
  { module: 'dashboard', code: 'dashboard.analytics', name: 'View Executive Analytics' },

  // Field Agents & Workforce
  { module: 'agents', code: 'agents.view', name: 'View Field Agents Directory' },
  { module: 'agents', code: 'agents.profile', name: 'View Agent Detailed Profile' },
  { module: 'agents', code: 'agents.assign_territory', name: 'Assign Territory to Agent' },
  { module: 'agents', code: 'agents.assign_task', name: 'Assign Task to Agent' },
  { module: 'agents', code: 'agents.location', name: 'View Live Agent Location' },
  { module: 'workforce', code: 'workforce.view', name: 'View Field Operations & Tracking' },
  { module: 'workforce', code: 'workforce.dispatch', name: 'Assign Tasks & Work Orders' },

  // Live Tracking & GPS
  { module: 'tracking', code: 'tracking.view', name: 'View Live Tracking Map & Fleet' },
  { module: 'tracking', code: 'tracking.routes', name: 'View Route History & Playback' },

  // Time & Attendance
  { module: 'attendance', code: 'attendance.view', name: 'View Attendance Records' },
  { module: 'attendance', code: 'attendance.clock', name: 'Clock In & Out' },
  { module: 'attendance', code: 'attendance.manage', name: 'Manage Shifts & GPS Corrections' },
  { module: 'attendance', code: 'attendance.anomalies', name: 'View Late & Absentee Radar' },

  // Customers & Outlets
  { module: 'customers', code: 'customers.view', name: 'View Customer Outlets' },
  { module: 'customers', code: 'customers.create', name: 'Register New Customer' },
  { module: 'customers', code: 'customers.edit', name: 'Edit Customer Information' },
  { module: 'customers', code: 'customers.detect_duplicates', name: 'Run Duplicate Detection' },
  { module: 'customers', code: 'customers.merge', name: 'Merge Duplicate Customers' },

  // Visits & Proof of Delivery
  { module: 'visits', code: 'visits.view', name: 'View Field Visits & Merchandising' },
  { module: 'visits', code: 'visits.create', name: 'Log Field Visit & Proof' },

  // Orders & Transactions
  { module: 'orders', code: 'orders.view', name: 'View Orders & Transactions' },
  { module: 'orders', code: 'orders.create', name: 'Create Sales Order' },
  { module: 'orders', code: 'orders.approve', name: 'Approve or Reject Orders' },

  // Payment Management & Collections
  { module: 'payments', code: 'payments.view', name: 'View Invoices & Customer Balances' },
  { module: 'payments', code: 'payments.collect', name: 'Record Payment Collection' },

  // Expenses
  { module: 'expenses', code: 'expenses.view', name: 'View Field Expense Claims' },
  { module: 'expenses', code: 'expenses.create', name: 'Submit Field Expense Claim' },
  { module: 'expenses', code: 'expenses.approve', name: 'Approve or Reject Expenses' },

  // Tasks & Schedules
  { module: 'tasks', code: 'tasks.view', name: 'View Assigned & Team Tasks' },
  { module: 'tasks', code: 'tasks.create', name: 'Create New Task' },
  { module: 'tasks', code: 'tasks.assign', name: 'Assign Task' },
  { module: 'schedules', code: 'schedules.view', name: 'View Visit Schedules' },
  { module: 'schedules', code: 'schedules.create', name: 'Create Visit Schedule' },

  // Targets & Performance
  { module: 'targets', code: 'targets.view', name: 'View Targets & Leaderboard' },
  { module: 'targets', code: 'targets.manage', name: 'Set Performance Targets' },
  { module: 'performance', code: 'performance.view', name: 'View Goals & Reviews' },
  { module: 'performance', code: 'performance.manage', name: 'Manage Appraisals' },

  // Red Flags & Anomaly Engine
  { module: 'red_flags', code: 'red_flags.view', name: 'View Red Flags & Anomalies' },
  { module: 'red_flags', code: 'red_flags.resolve', name: 'Resolve Red Flag Alerts' },

  // Operational Requests
  { module: 'requests', code: 'requests.view', name: 'View Field Requests (Stock, Location)' },
  { module: 'requests', code: 'requests.manage', name: 'Approve/Reject Field Requests' },

  // Reports & Data Export
  { module: 'reports', code: 'reports.view', name: 'View Analytics & Performance Reports' },
  { module: 'reports', code: 'reports.export', name: 'Export Data (CSV, Excel, PDF)' },
  { module: 'reports', code: 'reports.activity', name: 'View Activity Reports' },
  { module: 'reports', code: 'reports.daily_summary', name: 'View Daily Activity Summary' },

  // Employees & HR Org
  { module: 'employees', code: 'employees.view', name: 'View Employees' },
  { module: 'employees', code: 'employees.create', name: 'Create Employees' },
  { module: 'employees', code: 'employees.edit', name: 'Edit Employees' },
  { module: 'employees', code: 'employees.delete', name: 'Archive / Delete Employees' },
  { module: 'organization', code: 'org.manage', name: 'Manage Departments & Positions' },

  // Leave Management
  { module: 'leave', code: 'leave.request', name: 'Request Leave' },
  { module: 'leave', code: 'leave.view', name: 'View Leave Records' },
  { module: 'leave', code: 'leave.approve', name: 'Approve or Reject Leave' },
  { module: 'leave', code: 'leave.manage', name: 'Manage Leave Types & Balances' },

  // Recruitment & Onboarding
  { module: 'recruitment', code: 'recruitment.view', name: 'View Jobs & Candidates' },
  { module: 'recruitment', code: 'recruitment.manage', name: 'Manage Jobs & Pipeline' },
  { module: 'recruitment', code: 'recruitment.interview', name: 'Conduct Interviews & Score' },
  { module: 'onboarding', code: 'onboarding.view', name: 'View Onboarding Progress' },
  { module: 'onboarding', code: 'onboarding.manage', name: 'Manage Onboarding Workflows' },

  // Payroll & Documents
  { module: 'payroll', code: 'payroll.view', name: 'View Salary & Payslips' },
  { module: 'payroll', code: 'payroll.manage', name: 'Manage Compensation & Pay Runs' },
  { module: 'documents', code: 'documents.view', name: 'View Documents' },
  { module: 'documents', code: 'documents.manage', name: 'Upload & Verify Documents' },

  // Communication & System
  { module: 'communication', code: 'announcements.view', name: 'View Announcements' },
  { module: 'communication', code: 'announcements.create', name: 'Publish Announcements' },
  { module: 'ai', code: 'ai.use', name: 'Use NEXField AI Operations Copilot' },
  { module: 'ai', code: 'ai.command', name: 'Execute AI Command Center Actions' },
  { module: 'settings', code: 'settings.manage', name: 'Manage Company & System Settings' },
  { module: 'audit', code: 'audit.view', name: 'View Security Audit Logs' },
]

export const DEFAULT_ROLE_PERMISSIONS = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.code),
  COMPANY_ADMIN: PERMISSIONS.map((p) => p.code),

  AGENT_ADMIN: [
    'dashboard.view', 'dashboard.analytics',
    'agents.view', 'agents.profile', 'agents.assign_territory', 'agents.assign_task', 'agents.location',
    'tracking.view', 'tracking.routes',
    'attendance.view', 'attendance.manage', 'attendance.anomalies',
    'customers.view', 'customers.create', 'customers.edit', 'customers.detect_duplicates',
    'visits.view', 'visits.create',
    'orders.view', 'orders.create', 'orders.approve',
    'payments.view', 'payments.collect',
    'expenses.view', 'expenses.approve',
    'tasks.view', 'tasks.create', 'tasks.assign',
    'schedules.view', 'schedules.create',
    'targets.view', 'targets.manage',
    'red_flags.view', 'red_flags.resolve',
    'requests.view', 'requests.manage',
    'reports.view', 'reports.export', 'reports.activity', 'reports.daily_summary',
    'workforce.view', 'workforce.dispatch',
    'announcements.view', 'announcements.create',
    'ai.use', 'ai.command',
  ],

  AGENTADMIN: [
    'dashboard.view', 'dashboard.analytics',
    'agents.view', 'agents.profile', 'agents.assign_territory', 'agents.assign_task', 'agents.location',
    'tracking.view', 'tracking.routes',
    'attendance.view', 'attendance.manage', 'attendance.anomalies',
    'customers.view', 'customers.create', 'customers.edit', 'customers.detect_duplicates',
    'visits.view', 'visits.create',
    'orders.view', 'orders.create', 'orders.approve',
    'payments.view', 'payments.collect',
    'expenses.view', 'expenses.approve',
    'tasks.view', 'tasks.create', 'tasks.assign',
    'schedules.view', 'schedules.create',
    'targets.view', 'targets.manage',
    'red_flags.view', 'red_flags.resolve',
    'requests.view', 'requests.manage',
    'reports.view', 'reports.export', 'reports.activity', 'reports.daily_summary',
    'workforce.view', 'workforce.dispatch',
    'announcements.view', 'announcements.create',
    'ai.use', 'ai.command',
  ],

  SUPERVISOR: [
    'dashboard.view',
    'agents.view', 'agents.profile', 'agents.assign_task', 'agents.location',
    'tracking.view', 'tracking.routes',
    'attendance.view', 'attendance.anomalies',
    'customers.view', 'customers.create',
    'visits.view',
    'orders.view', 'orders.approve',
    'payments.view',
    'expenses.view', 'expenses.approve',
    'tasks.view', 'tasks.create', 'tasks.assign',
    'schedules.view', 'schedules.create',
    'targets.view',
    'red_flags.view',
    'requests.view', 'requests.manage',
    'reports.view', 'reports.export', 'reports.activity', 'reports.daily_summary',
    'announcements.view',
    'ai.use',
  ],

  SALES_AGENT: [
    'dashboard.view',
    'customers.view', 'customers.create', 'customers.edit',
    'visits.view', 'visits.create',
    'orders.view', 'orders.create',
    'payments.view', 'payments.collect',
    'targets.view',
    'tasks.view',
    'schedules.view',
    'attendance.view', 'attendance.clock',
    'expenses.view', 'expenses.create',
    'announcements.view',
    'ai.use',
  ],

  FIELD_AGENT: [
    'dashboard.view',
    'customers.view', 'customers.create',
    'visits.view', 'visits.create',
    'orders.view', 'orders.create',
    'payments.view', 'payments.collect',
    'tasks.view',
    'schedules.view',
    'attendance.view', 'attendance.clock',
    'expenses.view', 'expenses.create',
    'tracking.view',
    'announcements.view',
    'ai.use',
  ],

  HR_MANAGER: [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit', 'org.manage',
    'attendance.view', 'attendance.clock', 'attendance.manage', 'attendance.anomalies',
    'leave.request', 'leave.view', 'leave.approve', 'leave.manage',
    'recruitment.view', 'recruitment.manage', 'recruitment.interview',
    'onboarding.view', 'onboarding.manage',
    'performance.view', 'performance.manage',
    'payroll.view',
    'documents.view', 'documents.manage',
    'announcements.view', 'announcements.create',
    'reports.view', 'reports.export',
    'ai.use', 'ai.command',
    'settings.manage', 'audit.view',
  ],

  HR_ADMIN: [
    'dashboard.view',
    'employees.view', 'employees.create', 'employees.edit', 'org.manage',
    'attendance.view', 'attendance.clock', 'attendance.manage', 'attendance.anomalies',
    'leave.request', 'leave.view', 'leave.approve', 'leave.manage',
    'recruitment.view', 'recruitment.manage', 'recruitment.interview',
    'onboarding.view', 'onboarding.manage',
    'performance.view', 'performance.manage',
    'payroll.view', 'payroll.manage',
    'documents.view', 'documents.manage',
    'announcements.view', 'announcements.create',
    'reports.view', 'reports.export',
    'ai.use', 'ai.command',
    'settings.manage', 'audit.view',
  ],

  HR_OFFICER: [
    'employees.view', 'employees.create', 'employees.edit',
    'attendance.view', 'attendance.clock',
    'leave.request', 'leave.view', 'leave.approve',
    'recruitment.view', 'recruitment.manage', 'recruitment.interview',
    'onboarding.view', 'onboarding.manage',
    'performance.view',
    'documents.view', 'documents.manage',
    'announcements.view',
    'reports.view', 'reports.export',
    'ai.use',
  ],

  EMPLOYEE: [
    'dashboard.view',
    'attendance.clock', 'attendance.view',
    'leave.request', 'leave.view',
    'tasks.view',
    'schedules.view',
    'performance.view',
    'documents.view',
    'payroll.view',
    'expenses.view', 'expenses.create',
    'announcements.view',
    'ai.use',
  ],

  STAFF_MEMBER: [
    'dashboard.view',
    'attendance.clock', 'attendance.view',
    'leave.request', 'leave.view',
    'tasks.view',
    'schedules.view',
    'performance.view',
    'documents.view',
    'payroll.view',
    'expenses.view', 'expenses.create',
    'announcements.view',
    'ai.use',
  ],

  FINANCE: [
    'dashboard.view',
    'employees.view',
    'attendance.view',
    'orders.view',
    'payments.view',
    'expenses.view', 'expenses.approve',
    'payroll.view', 'payroll.manage',
    'reports.view', 'reports.export',
    'announcements.view',
    'ai.use',
  ],

  AUDITOR: [
    'dashboard.view',
    'employees.view',
    'attendance.view',
    'leave.view',
    'payroll.view',
    'documents.view',
    'reports.view', 'reports.export',
    'audit.view',
    'announcements.view',
    'ai.use',
  ],
}
