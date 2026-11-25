import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Factory,
  FileText,
  Layers3,
  LifeBuoy,
  Link2,
  Megaphone,
  PackageCheck,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { formatMoney } from '../lib/formatters';
import Modal from '../components/common/Modal';

const tabs = [
  { id: 'suppliers', label: 'Procurement', icon: Factory, endpoint: 'suppliers', helper: 'Suppliers, requisitions, purchase orders and goods receipts.' },
  { id: 'requisitions', label: 'Requisitions', icon: FileText, endpoint: 'requisitions', helper: 'Controlled purchasing requests with approval-ready references.' },
  { id: 'purchaseOrders', label: 'Purchase Orders', icon: PackageCheck, endpoint: 'purchaseOrders', helper: 'Supplier commitments, expected dates and purchase value.' },
  { id: 'goodsReceipts', label: 'Goods Receipts', icon: CheckCircle2, endpoint: 'goodsReceipts', helper: 'Trace goods received against approved purchasing activity.' },
  { id: 'invoices', label: 'Billing', icon: WalletCards, endpoint: 'invoices', helper: 'Invoices, receivables and collection readiness.' },
  { id: 'projects', label: 'Projects', icon: ClipboardList, endpoint: 'projects', helper: 'Projects, budgets and delivery timelines.' },
  { id: 'tickets', label: 'Support', icon: LifeBuoy, endpoint: 'tickets', helper: 'Customer support, escalation and service tracking.' },
  { id: 'campaigns', label: 'Marketing', icon: Megaphone, endpoint: 'campaigns', helper: 'Consent-aware campaigns and performance tracking.' },
  { id: 'workflows', label: 'Automation', icon: Sparkles, endpoint: 'workflows', helper: 'Workflow triggers, approvals and operational controls.' },
  { id: 'integrations', label: 'Integrations', icon: Link2, endpoint: 'integrations', helper: 'Secure connection registry and sync readiness.' },
  { id: 'calendarEvents', label: 'Calendar', icon: CalendarDays, endpoint: 'calendarEvents', helper: 'Company events, meetings and delivery schedules.' },
  { id: 'documents', label: 'Documents', icon: FileText, endpoint: 'documents', helper: 'Policies, contracts and governed business records with retention tracking.' },
];

const forms = {
  suppliers: [
    ['name', 'Supplier name', 'text', true], ['contact_name', 'Contact person', 'text'], ['email', 'Email address', 'email'], ['phone', 'Phone number', 'tel'], ['address', 'Address', 'text'],
  ],
  requisitions: [
    ['title', 'Requisition title', 'text', true], ['total_amount', 'Estimated amount', 'number'], ['description', 'Business justification', 'text'],
  ],
  purchaseOrders: [
    ['supplier_name', 'Supplier name', 'text', true], ['total_amount', 'Order total', 'number'], ['expected_date', 'Expected delivery date', 'date'], ['description', 'Order description', 'text'],
  ],
  goodsReceipts: [
    ['reference_number', 'Supplier / delivery reference', 'text', true], ['purchase_order_id', 'Purchase order ID', 'number'], ['notes', 'Receipt notes', 'text'],
  ],
  invoices: [
    ['customer_name', 'Customer name', 'text', true], ['total_amount', 'Invoice total', 'number', true], ['due_date', 'Due date', 'date'], ['description', 'Description', 'text'],
  ],
  projects: [
    ['name', 'Project name', 'text', true], ['client_name', 'Client / business unit', 'text'], ['budget_amount', 'Budget amount', 'number'], ['start_date', 'Start date', 'date'], ['end_date', 'End date', 'date'], ['description', 'Description', 'text'],
  ],
  tickets: [
    ['subject', 'Ticket subject', 'text', true], ['category', 'Category', 'text'], ['priority', 'Priority', 'select'], ['description', 'Customer issue or request', 'text'],
  ],
  campaigns: [
    ['name', 'Campaign name', 'text', true], ['channel', 'Channel', 'select'], ['audience', 'Audience / segment', 'text'], ['budget_amount', 'Campaign budget', 'number'],
  ],
  workflows: [
    ['name', 'Workflow name', 'text', true], ['trigger_event', 'Trigger event', 'select'], ['description', 'Purpose and approval rule', 'text'],
  ],
  integrations: [
    ['provider', 'Provider', 'select', true], ['connection_name', 'Connection name', 'text', true],
  ],
  calendarEvents: [
    ['title', 'Event title', 'text', true], ['starts_at', 'Starts at', 'datetime-local', true], ['ends_at', 'Ends at', 'datetime-local'], ['description', 'Description', 'text'],
  ],
  documents: [
    ['title', 'Document title', 'text', true], ['category', 'Category', 'select'], ['owner_name', 'Record owner', 'text'], ['retention_until', 'Retention date', 'date'], ['description', 'Description', 'text'],
  ],
};

const defaults = {
  tickets: { category: 'General', priority: 'MEDIUM' },
  campaigns: { channel: 'EMAIL' },
  workflows: { trigger_event: 'manual' },
  integrations: { provider: 'paystack' },
  calendarEvents: { starts_at: new Date().toISOString().slice(0, 16) },
  documents: { category: 'GENERAL' },
};

const fieldOptions = {
  priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  channel: ['EMAIL', 'SMS', 'WHATSAPP', 'SOCIAL', 'REFERRAL'],
  trigger_event: ['manual', 'lead_created', 'invoice_overdue', 'stock_below_reorder', 'delivery_completed', 'leave_approved'],
  provider: ['paystack', 'flutterwave', 'whatsapp', 'smtp', 'google_calendar', 'microsoft_365', 'shopify', 'woocommerce', 's3', 'mapbox'],
  category: ['GENERAL', 'CONTRACT', 'POLICY', 'COMPLIANCE', 'FINANCE', 'HR', 'OPERATIONS'],
};

const connectedWorkspaces = [
  { label: 'Executive intelligence', tab: 'executive', icon: CircleDollarSign },
  { label: 'Customer 360 CRM', tab: 'customer-360', icon: LifeBuoy },
  { label: 'Sales & commerce', tab: 'ewf-sales', icon: WalletCards },
  { label: 'Inventory control', tab: 'inventory', icon: PackageCheck },
  { label: 'Fleet & logistics', tab: 'delivery', icon: Factory },
  { label: 'Financials', tab: 'accounting', icon: CircleDollarSign },
  { label: 'People & payroll', tab: 'ewf-hr', icon: ClipboardList },
  { label: 'Business intelligence', tab: 'reports-center', icon: Layers3 },
  { label: 'AI intelligence', tab: 'ai', icon: Sparkles },
  { label: 'Security & administration', tab: 'it-admin', icon: ShieldCheck },
];

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (['ACTIVE', 'APPROVED', 'PAID', 'RESOLVED', 'CONNECTED', 'RECEIVED'].includes(normalized)) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (['OVERDUE', 'REJECTED', 'FAILED', 'URGENT'].includes(normalized)) return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  if (['DRAFT', 'OPEN', 'PLANNING', 'DISCONNECTED'].includes(normalized)) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
  return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
};

const getRecordTitle = (tab, row) => row.name || row.subject || row.title || row.invoice_number || row.po_number || row.connection_name || row.reference_number || 'Untitled record';

const getRecordDetail = (tab, row) => {
  if (tab === 'suppliers') return row.contact_name || row.email || row.phone || 'Supplier profile';
  if (tab === 'invoices') return `${row.customer_name || 'Customer'}${row.due_date ? ` - due ${row.due_date}` : ''}`;
  if (tab === 'projects') return `${row.client_name || 'Internal delivery'}${row.budget_amount ? ` - ${formatMoney(row.budget_amount)}` : ''}`;
  if (tab === 'tickets') return `${row.category || 'General'} - ${row.priority || 'MEDIUM'} priority`;
  if (tab === 'campaigns') return `${row.channel || 'EMAIL'} - ${row.audience || 'All contacts'}`;
  if (tab === 'workflows') return `Trigger: ${row.trigger_event || 'manual'}`;
  if (tab === 'integrations') return row.provider || 'Connection';
  if (tab === 'documents') return `${row.category || 'GENERAL'}${row.owner_name ? ` - ${row.owner_name}` : ''}${row.retention_until ? ` - retain until ${row.retention_until}` : ''}`;
  return row.starts_at ? new Date(row.starts_at).toLocaleString() : row.description || 'Scheduled event';
};

export default function BusinessOperationsDashboard({ user, onNavigate = () => {} }) {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({});
  const [notice, setNotice] = useState('');

  const current = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const load = async (tabId = activeTab) => {
    setLoading(true);
    try {
      const tab = tabs.find((item) => item.id === tabId) || tabs[0];
      const [summaryResult, listResult] = await Promise.all([
        api.get('/business/summary'),
        api.get(`/business/${tab.endpoint}`),
      ]);
      setSummary(summaryResult?.data || summaryResult || null);
      setRows(listResult?.data || listResult || []);
    } catch (error) {
      setNotice(error.message || 'Unable to load this business module.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeTab]);

  const openCreate = () => {
    setForm({ ...(defaults[activeTab] || {}) });
    setNotice('');
    setFormOpen(true);
  };

  const createRecord = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      await api.post(`/business/${current.endpoint}`, form);
      setFormOpen(false);
      setNotice(`${current.label.slice(0, -1) || current.label} created successfully.`);
      await load();
    } catch (error) {
      setNotice(error.message || 'Unable to create this record.');
    } finally {
      setSaving(false);
    }
  };

  const progressRecord = async (row) => {
    const next = activeTab === 'tickets' ? 'IN_PROGRESS' : activeTab === 'workflows' ? 'ACTIVE' : activeTab === 'integrations' ? 'READY_FOR_CONFIGURATION' : 'ACTIVE';
    try {
      await api.patch(`/business/${current.endpoint}/${row.id}`, { status: next, is_active: activeTab === 'workflows' });
      setNotice('Status updated.');
      await load();
    } catch (error) {
      setNotice(error.message || 'Unable to update the record.');
    }
  };

  const metrics = [
    { label: 'Open receivables', value: formatMoney(summary?.receivables || 0), icon: CircleDollarSign, tone: 'text-orange-500' },
    { label: 'Purchase commitment', value: formatMoney(summary?.purchaseCommitment || 0), icon: PackageCheck, tone: 'text-sky-500' },
    { label: 'Open support tickets', value: String(summary?.openTickets || 0), icon: LifeBuoy, tone: 'text-rose-500' },
    { label: 'Active projects', value: String(summary?.activeProjects || 0), icon: Layers3, tone: 'text-emerald-500' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 p-5 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400">
              <ShieldCheck size={14} /> Tenant-scoped ERP and CRM
            </div>
            <h1 className="mt-2 text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white">Business Operations Suite</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">Procurement, billing, projects, support, marketing, automations, integrations, and company scheduling now operate alongside your existing field, sales, fleet, finance, and HR workspaces.</p>
          </div>
          <button type="button" onClick={openCreate} className="btn-primary whitespace-nowrap"><Plus size={16} /> Add {current.label.slice(0, -1) || current.label}</button>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return <div key={metric.label} className="surface-card rounded-2xl p-4"><Icon className={`h-5 w-5 ${metric.tone}`} /><p className="mt-3 text-xl font-black text-zinc-900 dark:text-white">{metric.value}</p><p className="text-[11px] font-semibold text-zinc-500">{metric.label}</p></div>;
        })}
      </section>

      <section className="surface-card rounded-2xl p-5">
        <div className="mb-4"><h2 className="text-sm font-black text-zinc-900 dark:text-white">Connected enterprise workspaces</h2><p className="mt-1 text-xs text-zinc-500">The ERP/CRM capabilities from the enterprise operating-system specification are connected to existing NexFieldForce modules; no duplicate records or second workflow is created.</p></div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
          {connectedWorkspaces.map((workspace) => { const Icon = workspace.icon; return <button key={workspace.tab} type="button" onClick={() => onNavigate(workspace.tab)} className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-3 text-left text-xs font-bold text-zinc-700 transition hover:border-orange-400 hover:bg-orange-500/5 dark:border-zinc-800 dark:text-zinc-200"><Icon size={15} className="shrink-0 text-orange-500" />{workspace.label}</button>; })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="surface-card rounded-2xl p-2 h-fit grid grid-cols-2 gap-1 lg:block">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}><Icon size={15} /> <span className="truncate">{tab.label}</span></button>;
          })}
        </aside>

        <section className="surface-card rounded-2xl overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-lg font-black text-zinc-900 dark:text-white">{current.label}</h2><p className="text-xs text-zinc-500">{current.helper}</p></div>
            <button type="button" onClick={() => load()} className="btn-secondary text-xs"><RefreshCw size={14} /> Refresh</button>
          </div>
          {notice && <div className="mx-5 mt-4 rounded-xl bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-700 dark:text-orange-300">{notice}</div>}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {loading ? <div className="p-10 text-center text-sm text-zinc-400"><RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading {current.label.toLowerCase()}...</div> : rows.length === 0 ? <div className="p-10 text-center"><Settings2 className="mx-auto h-7 w-7 text-zinc-300" /><p className="mt-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">No {current.label.toLowerCase()} yet</p><p className="mt-1 text-xs text-zinc-500">Create the first record to begin a traceable, tenant-safe workflow.</p></div> : rows.map((row) => <div key={row.id} className="flex gap-3 p-4 sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-bold text-zinc-900 dark:text-white">{getRecordTitle(activeTab, row)}</p><p className="mt-0.5 truncate text-xs text-zinc-500">{getRecordDetail(activeTab, row)}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${statusTone(row.status)}`}>{String(row.status || 'DRAFT').replaceAll('_', ' ')}</span><button type="button" onClick={() => progressRecord(row)} className="rounded-lg p-1.5 text-orange-600 hover:bg-orange-500/10" title="Advance status"><ChevronRight size={16} /></button></div></div>)}
          </div>
        </section>
      </section>

      <Modal title={`Create ${current.label.slice(0, -1) || current.label}`} subtitle="This record is automatically scoped to your organization." isOpen={formOpen} onClose={() => setFormOpen(false)} maxWidth="max-w-xl">
        <form className="space-y-4" onSubmit={createRecord}>
          {(forms[activeTab] || []).map(([name, label, type, required]) => <label key={name} className="block text-xs font-bold text-zinc-700 dark:text-zinc-300"><span>{label}{required ? ' *' : ''}</span>{type === 'select' ? <select required={required} value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="form-input mt-1.5">{(fieldOptions[name] || []).map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select> : <input required={required} type={type} value={form[name] || ''} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="form-input mt-1.5" />}</label>)}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create record'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
