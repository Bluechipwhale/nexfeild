# NexFieldForce Enterprise Capability Matrix

This matrix brings the EdgeWForce enterprise ERP/CRM specification into NexFieldForce as additive capability. Existing modules remain the system of record; the ERP & CRM Operations workspace adds procurement, billing, projects, support, marketing, automations, integrations, calendar, and document governance without duplicating customer, order, field, or HR data.

| Enterprise specification area | NexFieldForce workspace |
| --- | --- |
| Executive dashboard | Executive Suite |
| CRM, leads, customer 360 and opportunity tracking | Customer 360 CRM and Commercial Sales POS |
| Sales management, orders, commissions and targets | Commercial Sales POS |
| Invoicing, collections and receivables | Financials & Payroll and ERP & CRM Billing |
| Accounting, expenses and payroll | Financials & Payroll |
| Store and e-commerce operations | Commercial Sales POS, inventory and integration registry |
| Inventory and warehouse control | Inventory Hub |
| Procurement and goods receiving | ERP & CRM Operations: Procurement, Requisitions, Purchase Orders and Goods Receipts |
| Human resources and workforce management | HR & Org Chart |
| Payroll | Financials & Payroll |
| Tasks and projects | Supervisor Live Hub, My Tasks and ERP & CRM Projects |
| Scheduler and calendar | ERP & CRM Calendar |
| Fleet and logistics | Delivery & Fleet |
| Customer support | ERP & CRM Support |
| Marketing automation | ERP & CRM Marketing and Automation |
| Document management | ERP & CRM Documents and employee document lockers |
| Business intelligence | BI & Reports Center and Executive Suite |
| AI intelligence | NEXField AI and role-specific AI workspaces |
| Administration and security | IT Administration and SaaS Platform Governance |
| Integration centre | ERP & CRM Integrations |

## Data and access rules

- Every ERP/CRM record is scoped by `company_id` on the server.
- Staff cannot approve privileged registration requests.
- Company and Agent Admins can access the operational ERP workspace exposed in their sidebar; field and staff users remain restricted to their dedicated workspaces.
- Apply `supabase/migrations/008_business_operations_suite.sql` and then `supabase/migrations/009_document_governance.sql` before enabling the business workspace against Supabase.
