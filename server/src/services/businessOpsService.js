import { db } from '../config/database.js';

const MODULES = {
  suppliers: { table: 'suppliers', label: 'Supplier', required: ['name'], defaultStatus: 'ACTIVE' },
  requisitions: { table: 'purchase_requisitions', label: 'Purchase requisition', required: ['title'], defaultStatus: 'DRAFT' },
  purchaseOrders: { table: 'purchase_orders', label: 'Purchase order', required: ['supplier_name'], defaultStatus: 'DRAFT' },
  goodsReceipts: { table: 'goods_receipts', label: 'Goods receipt', required: ['reference_number'], defaultStatus: 'RECEIVED' },
  invoices: { table: 'invoices', label: 'Invoice', required: ['customer_name'], defaultStatus: 'DRAFT' },
  tickets: { table: 'support_tickets', label: 'Support ticket', required: ['subject'], defaultStatus: 'OPEN' },
  projects: { table: 'projects', label: 'Project', required: ['name'], defaultStatus: 'PLANNING' },
  campaigns: { table: 'marketing_campaigns', label: 'Campaign', required: ['name'], defaultStatus: 'DRAFT' },
  workflows: { table: 'automation_workflows', label: 'Workflow', required: ['name'], defaultStatus: 'DRAFT' },
  integrations: { table: 'integration_connections', label: 'Integration', required: ['provider'], defaultStatus: 'DISCONNECTED' },
  calendarEvents: { table: 'calendar_events', label: 'Calendar event', required: ['title'], defaultStatus: 'SCHEDULED' },
  documents: { table: 'document_records', label: 'Business document', required: ['title'], defaultStatus: 'ACTIVE' },
};

const getCompanyId = (user) => Number(user?.company_id || user?.companyId || 1);

const makeReference = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const validatePayload = (module, payload) => {
  const config = MODULES[module];
  if (!config) throw new Error('Unsupported business module.');

  const missing = config.required.filter((field) => !String(payload?.[field] || '').trim());
  if (missing.length) throw new Error(`${config.label}: ${missing.join(', ')} is required.`);
};

const normalizedRecord = (module, payload, user) => {
  const { company_id, companyId, id, created_at, updated_at, credential_secret, api_key, ...safePayload } = payload || {};
  const companyIdValue = getCompanyId(user);
  const status = String(safePayload.status || MODULES[module].defaultStatus).toUpperCase();
  const record = {
    ...safePayload,
    company_id: companyIdValue,
    status,
    created_by_id: user?.id || null,
    created_by_name: user?.full_name || user?.fullName || user?.email || 'System',
  };

  if (module === 'purchaseOrders') {
    record.po_number = safePayload.po_number || makeReference('PO');
    record.total_amount = Number(safePayload.total_amount || 0);
  }
  if (module === 'requisitions') record.requisition_number = safePayload.requisition_number || makeReference('PR');
  if (module === 'goodsReceipts') record.receipt_number = safePayload.receipt_number || makeReference('GRN');
  if (module === 'invoices') {
    const total = Number(safePayload.total_amount || safePayload.amount || 0);
    record.invoice_number = safePayload.invoice_number || makeReference('INV');
    record.total_amount = total;
    record.amount_paid = Number(safePayload.amount_paid || 0);
    record.balance_due = Math.max(total - record.amount_paid, 0);
    record.due_date = safePayload.due_date || null;
  }
  if (module === 'tickets') {
    record.priority = safePayload.priority || 'MEDIUM';
    record.category = safePayload.category || 'General';
  }
  if (module === 'projects') {
    record.budget_amount = Number(safePayload.budget_amount || 0);
    record.start_date = safePayload.start_date || null;
    record.end_date = safePayload.end_date || null;
  }
  if (module === 'campaigns') record.budget_amount = Number(safePayload.budget_amount || 0);
  if (module === 'workflows') {
    record.trigger_event = safePayload.trigger_event || 'manual';
    record.is_active = Boolean(safePayload.is_active);
  }
  if (module === 'integrations') {
    record.provider = String(safePayload.provider || '').toLowerCase();
    record.connection_name = safePayload.connection_name || safePayload.provider;
  }
  if (module === 'calendarEvents') {
    record.starts_at = safePayload.starts_at || new Date().toISOString();
    record.ends_at = safePayload.ends_at || null;
  }
  if (module === 'documents') {
    record.category = safePayload.category || 'GENERAL';
    record.owner_name = safePayload.owner_name || record.created_by_name;
    record.retention_until = safePayload.retention_until || null;
  }

  return record;
};

export const businessOpsService = {
  modules: MODULES,

  async list(module, user) {
    const config = MODULES[module];
    if (!config) throw new Error('Unsupported business module.');
    return db.find(config.table, { company_id: getCompanyId(user) }, { order: { column: 'created_at', ascending: false }, limit: 250 });
  },

  async create(module, payload, user) {
    validatePayload(module, payload);
    return db.insert(MODULES[module].table, normalizedRecord(module, payload, user));
  },

  async update(module, id, payload, user) {
    const config = MODULES[module];
    if (!config) throw new Error('Unsupported business module.');
    const existing = await db.findById(config.table, id);
    if (!existing || Number(existing.company_id) !== getCompanyId(user)) throw new Error('Record not found.');

    const record = normalizedRecord(module, { ...existing, ...payload }, user);
    delete record.created_by_id;
    delete record.created_by_name;
    return db.update(config.table, id, record);
  },

  async summary(user) {
    const entries = await Promise.all(Object.keys(MODULES).map(async (module) => [module, await this.list(module, user)]));
    const data = Object.fromEntries(entries);
    const invoices = data.invoices || [];
    const purchaseOrders = data.purchaseOrders || [];
    const tickets = data.tickets || [];
    const projects = data.projects || [];

    return {
      counts: Object.fromEntries(Object.entries(data).map(([module, rows]) => [module, rows.length])),
      receivables: invoices.reduce((sum, invoice) => sum + Number(invoice.balance_due || 0), 0),
      invoicedValue: invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
      purchaseCommitment: purchaseOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      openTickets: tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(String(ticket.status || '').toUpperCase())).length,
      activeProjects: projects.filter((project) => ['ACTIVE', 'IN_PROGRESS'].includes(String(project.status || '').toUpperCase())).length,
      governedDocuments: (data.documents || []).length,
    };
  },
};
