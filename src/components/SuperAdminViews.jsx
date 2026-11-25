import React, { useState, useEffect } from 'react'
import {
  Map, MapPin, Users, Building, Shield, UserPlus,
  Plus, Check, X, Search, Filter, Trash2, Edit3,
  Calendar, CheckCircle2, AlertCircle, RefreshCw,
  Phone, Mail, Globe, ArrowRight, UserCheck, UserX,
  Target, Navigation, Clock, Sparkles, Layers, CreditCard,
  Award, TrendingUp, Key, Lock, ExternalLink, Settings,
  Play, ChevronRight, CheckSquare, Eye, Briefcase, FileText,
  ShoppingCart, Camera, Server, ToggleLeft, ToggleRight, Laptop,
  Package, ArrowLeft, Sliders, Smartphone, CheckCircle
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp } from '../App.jsx'

// Available Core Business Modules Catalog
export const MODULE_CATALOG = [
  { key: 'sales', label: 'Commercial Sales & Targets', icon: TrendingUp, desc: 'Sales pipeline, quotas, and 5% commission calculator' },
  { key: 'crm', label: 'Customer / Merchant Outlets CRM', icon: Building, desc: 'Merchant directory, GPS coordinates, and balances' },
  { key: 'orders', label: 'POS Commercial Orders', icon: ShoppingCart, desc: 'Commercial order booking with 7.5% VAT and line-item discounts' },
  { key: 'products', label: 'Product Catalog & Pricing', icon: Package, desc: 'Master price lists, SKU variants, and warehouse stock' },
  { key: 'collections', label: 'Collections & Invoices', icon: CreditCard, desc: 'Payment recording, credit limits, and invoice settlements' },
  { key: 'field_force', label: 'Field Force Management', icon: MapPin, desc: 'Field roster, territory assignments, and check-in rosters' },
  { key: 'agent_tracking', label: 'Live GPS Telemetry & Maps', icon: Navigation, desc: 'Real-time Leaflet OpenStreetMap live radar pins and speed' },
  { key: 'gps_visits', label: 'GPS Verified Store Check-in', icon: Camera, desc: 'Geofenced visit verification, stopwatch timer, and notes' },
  { key: 'surveys', label: 'Field Audits & Surveys', icon: CheckSquare, desc: 'Shelf share questionnaires and competitor intelligence' },
  { key: 'evidence', label: 'Photo Proof of Execution', icon: Camera, desc: 'Store display attachments and billboard audit photos' },
  { key: 'hr', label: 'Human Resources & ATS', icon: Users, desc: 'Candidate recruitment, employee lifecycle, and job roles' },
  { key: 'attendance', label: 'Geofenced Attendance Timesheets', icon: Clock, desc: 'GPS clock-in/out logs, working hours, and monthly timesheets' },
  { key: 'leave', label: 'Leave Approvals Management', icon: Calendar, desc: 'Leave balance calculation and supervisor review workflow' },
  { key: 'performance', label: 'Appraisals & OKR Goals', icon: Award, desc: 'Quarterly performance metrics and staff KPI scoring' },
  { key: 'reports', label: 'Analytics & Export Reports', icon: FileText, desc: 'Audit downloads, executive BI, and sales CSV exports' },
  { key: 'ai', label: 'AI Copilots Suite', icon: Sparkles, desc: 'Role-scoped AI assistant for sales, HR, and ops queries' },
]

// ==============================================================================
// 1. SUPER ADMIN: MARKETS, TERRITORIES & ROUTE ASSIGNER
// ==============================================================================
export function SuperAdminTerritoriesView({ onNavigate }) {
  const { showToast } = useApp()
  const [markets, setMarkets] = useState([])
  const [routes, setRoutes] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('markets') // 'markets' | 'routes'
  const [newMarketModal, setNewMarketModal] = useState(false)
  const [newRouteModal, setNewRouteModal] = useState(false)

  // New Market Form State
  const [mktName, setMktName] = useState('')
  const [mktZone, setMktZone] = useState('Lagos Island')
  const [mktRegion, setMktRegion] = useState('South West')
  const [mktTarget, setMktTarget] = useState(1000)

  // New Route Form State
  const [routeName, setRouteName] = useState('')
  const [routeMarketId, setRouteMarketId] = useState('')
  const [routeAgentId, setRouteAgentId] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')

  const fetchData = async () => {
    try {
      const [mktRes, rtRes, agtRes] = await Promise.all([
        apiRequest('/api/sales/markets'),
        apiRequest('/api/field/routes'),
        apiRequest('/api/agent-admin/field-agents'),
      ])
      setMarkets(mktRes?.data || [])
      setRoutes(rtRes?.data || [])
      setAgents(agtRes?.data || [])
      if (mktRes?.data?.[0]) setRouteMarketId(mktRes.data[0].id)
      if (agtRes?.data?.[0]) setRouteAgentId(agtRes.data[0].id)
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateMarket = async (e) => {
    e.preventDefault()
    if (!mktName.trim()) return
    try {
      await apiRequest('/api/sales/markets', {
        method: 'POST',
        body: JSON.stringify({
          name: mktName,
          zone: mktZone,
          region: mktRegion,
          targetOutlets: Number(mktTarget),
        }),
      })
      showToast(`Market territory "${mktName}" registered!`)
      setNewMarketModal(false)
      setMktName('')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to create market territory', 'error')
    }
  }

  const handleDeleteMarket = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete market "${name}"?`)) return
    try {
      await apiRequest(`/api/sales/markets/${id}`, { method: 'DELETE' })
      showToast(`Market territory "${name}" deleted!`)
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to delete market territory', 'error')
    }
  }

  const handleCreateRoute = async (e) => {
    e.preventDefault()
    if (!routeName.trim()) return
    try {
      await apiRequest('/api/field/routes', {
        method: 'POST',
        body: JSON.stringify({
          name: routeName,
          marketId: Number(routeMarketId),
          assignedAgentId: Number(routeAgentId),
          startTime,
          endTime,
        }),
      })
      showToast(`Field route "${routeName}" assigned!`)
      setNewRouteModal(false)
      setRouteName('')
      fetchData()
    } catch (err) {
      showToast(err.message || 'Failed to assign field route', 'error')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Map className="h-6 w-6 text-sky-400" />
            Markets, Territories & Route Logistics
          </h1>
          <p className="text-xs text-slate-400">
            Define sales territories, configure target merchant outlets, and dispatch optimized field agent routes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewMarketModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
          >
            <Plus className="h-4 w-4" /> Add Market
          </button>
          <button
            onClick={() => setNewRouteModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Navigation className="h-4 w-4" /> Create Route
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('markets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'markets'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Market Territories ({markets.length})
        </button>
        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'routes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Active Routes & Schedules ({routes.length})
        </button>
      </div>

      {/* Content: Markets */}
      {activeTab === 'markets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((m) => (
            <div key={m.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition-all shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                    {m.zone}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{m.name}</h3>
                  <p className="text-xs text-slate-400">{m.region} Region</p>
                </div>
                <button
                  onClick={() => handleDeleteMarket(m.id, m.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Delete Market"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-300">
                <span>Target Merchant Outlets:</span>
                <span className="font-bold text-emerald-400">{m.target_outlets || 1000} Outlets</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content: Routes */}
      {activeTab === 'routes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 hover:border-slate-700 transition-all shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase">
                    {r.route_code || 'RT-001'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{r.name}</h3>
                  <p className="text-xs text-slate-400">{r.market_name || 'Commercial Zone'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                  Active
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Agent:</span>
                  <span className="font-semibold text-white">{r.agent_name || 'Babatunde Odesina'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Operating Hours:</span>
                  <span className="font-mono text-slate-300">{r.start_time || '08:00'} - {r.end_time || '17:00'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Market */}
      {newMarketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Market Territory</h3>
            <form onSubmit={handleCreateMarket} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Territory / Market Name *</label>
                <input
                  type="text"
                  required
                  value={mktName}
                  onChange={(e) => setMktName(e.target.value)}
                  placeholder="e.g. Alaba International Market"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Zone</label>
                  <input
                    type="text"
                    value={mktZone}
                    onChange={(e) => setMktZone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Region</label>
                  <input
                    type="text"
                    value={mktRegion}
                    onChange={(e) => setMktRegion(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Merchant Outlets</label>
                <input
                  type="number"
                  value={mktTarget}
                  onChange={(e) => setMktTarget(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewMarketModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Route */}
      {newRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Field Route Assignment</h3>
            <form onSubmit={handleCreateRoute} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g. Ikeja Commercial Route Alpha"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Market Zone</label>
                  <select
                    value={routeMarketId}
                    onChange={(e) => setRouteMarketId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Agent</label>
                  <select
                    value={routeAgentId}
                    onChange={(e) => setRouteAgentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name || a.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewRouteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Dispatch Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 2. SUPER ADMIN: STAFF PROVISIONING & USER MANAGEMENT (WITH COMPANY SELECTOR)
// ==============================================================================
export function SuperAdminStaffProvisioningView({ isHr = false, params = {}, onNavigate }) {
  const { showToast } = useApp()
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [companyFilter, setCompanyFilter] = useState(params?.companyId ? String(params.companyId) : 'all')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Provision Form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleCode, setRoleCode] = useState('FIELD_AGENT')
  const [targetCompanyId, setTargetCompanyId] = useState(params?.companyId ? String(params.companyId) : '1')
  const [departmentId, setDepartmentId] = useState('1')
  const [territory, setTerritory] = useState('National HQ')

  const fetchStaffData = async () => {
    try {
      const [empRes, compRes] = await Promise.all([
        apiRequest('/api/employees'),
        apiRequest('/api/companies'),
      ])
      setEmployees(empRes?.data || [])
      setCompanies(compRes?.data || [])
      if (params?.companyId) {
        setTargetCompanyId(String(params.companyId))
      } else if (compRes?.data?.[0]) {
        setTargetCompanyId(String(compRes.data[0].id))
      }
    } catch (err) {}
  }

  useEffect(() => {
    fetchStaffData()
  }, [params?.companyId])

  const handleProvision = async (e) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast('First name, last name, and official email are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          roleCode,
          companyId: Number(targetCompanyId),
          departmentId: Number(departmentId),
          territory: territory.trim(),
        }),
      })
      showToast(res?.message || `Staff member "${firstName} ${lastName}" provisioned successfully!`)
      setModalOpen(false)
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      fetchStaffData()
    } catch (err) {
      showToast(err.message || 'Failed to provision staff member', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = employees.filter((emp) => {
    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase()
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee_code || '').toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || emp.role_code === roleFilter
    const matchesComp = companyFilter === 'all' || String(emp.company_id) === String(companyFilter)
    return matchesSearch && matchesRole && matchesComp
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-sky-400" />
            {isHr ? 'HR Staff Directory & Provisioning' : 'Enterprise Staff Provisioning & User Roster'}
          </h1>
          <p className="text-xs text-slate-400">
            Provision, manage, and assign roles across client companies and operational divisions.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-colors"
        >
          <UserPlus className="h-4 w-4" /> Provision New Staff
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company, code..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500"
          />
        </div>

        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white"
        >
          <option value="all">All Companies ({companies.length})</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-white"
        >
          <option value="all">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="COMPANY_ADMIN">Company Admin</option>
          <option value="AGENT_ADMIN">Agent Admin</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="SALES_AGENT">Sales Agent</option>
          <option value="FIELD_AGENT">Field Agent</option>
          <option value="HR_MANAGER">HR Manager</option>
          <option value="EMPLOYEE">Staff Member</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Employee Name & Email</th>
                <th className="px-5 py-3.5">Attached Organization</th>
                <th className="px-5 py-3.5">Role / Position</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Territory</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-mono font-bold text-sky-400">{emp.employee_code || `EMP-${emp.id}`}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{emp.first_name} {emp.last_name}</p>
                    <p className="text-[11px] text-slate-400">{emp.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-200 block">{emp.company_name || 'Platform HQ'}</span>
                    <span className="font-mono text-[10px] text-slate-500">{emp.company_code}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 uppercase">
                      {emp.role_code ? emp.role_code.replace(/_/g, ' ') : 'STAFF'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{emp.phone || '+2348000000000'}</td>
                  <td className="px-5 py-4 text-slate-400">{emp.territory || 'HQ / National'}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                      {emp.user_status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-400" />
              Provision New Enterprise Staff Member
            </h3>
            <form onSubmit={handleProvision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Assign to Client Organization / Tenant *</label>
                <select
                  value={targetCompanyId}
                  onChange={(e) => setTargetCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-sky-500/40 bg-slate-950 px-3 py-2 text-white font-semibold"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. David"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Adeleke"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Official Work Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. david.adeleke@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number (WhatsApp Dispatch enabled)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+2348012345678"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Role Permission *</label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-semibold"
                  >
                    <option value="FIELD_AGENT">Field Agent (GPS & Visits)</option>
                    <option value="SALES_AGENT">Sales Agent (Orders & Pipeline)</option>
                    <option value="SUPERVISOR">Field Supervisor</option>
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="EMPLOYEE">Corporate Staff Member</option>
                    <option value="AGENT_ADMIN">Agent Operations Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Operational Territory</label>
                  <input
                    type="text"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    placeholder="e.g. Lagos Island"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-lg shadow-sky-600/30"
                >
                  {submitting ? 'Provisioning Staff...' : '✓ Provision Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 3. SUPER ADMIN: ACCOUNT REGISTRATION APPROVALS
// ==============================================================================
export function SuperAdminRegistrationsView() {
  const { showToast } = useApp()
  const [requests, setRequests] = useState([
    { id: 1, full_name: 'David Adeleke', email: 'david.a@example.com', phone: '+2348039911223', role_requested: 'SALES_AGENT', requested_at: '2026-08-14 09:30', status: 'pending' },
    { id: 2, full_name: 'Grace Oladipo', email: 'grace.o@example.com', phone: '+2348038822334', role_requested: 'FIELD_AGENT', requested_at: '2026-08-14 11:15', status: 'pending' },
  ])

  const handleApprove = (id) => {
    setRequests(requests.filter((r) => r.id !== id))
    showToast('Registration approved & user account activated!')
  }

  const handleReject = (id) => {
    setRequests(requests.filter((r) => r.id !== id))
    showToast('Registration request declined.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <UserCheck className="h-6 w-6 text-sky-400" />
          Public Registration & Account Approvals
        </h1>
        <p className="text-xs text-slate-400">Review pending workforce signups and provision access permissions.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-300">All Registration Requests Reviewed</p>
            <p className="text-xs">No pending accounts waiting for administrative approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Candidate Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Requested Role</th>
                  <th className="px-5 py-3.5">Request Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-bold text-white">{req.full_name}</td>
                    <td className="px-5 py-4">
                      <p>{req.email}</p>
                      <p className="text-slate-500">{req.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                        {req.role_requested}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{req.requested_at}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-xs border border-rose-500/30"
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ==============================================================================
// 4. SUPER ADMIN: MULTI-COMPANY SAAS PLATFORM DASHBOARD
// ==============================================================================
export function SuperAdminSaaSDashboardView({ onNavigate }) {
  const [data, setData] = useState(null)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [configModalCompany, setConfigModalCompany] = useState(null)

  const fetchDashboard = async () => {
    try {
      const [dashRes, compRes] = await Promise.all([
        apiRequest('/api/saas/dashboard'),
        apiRequest('/api/companies'),
      ])
      setData(dashRes?.data || null)
      setCompanies(compRes?.data || [])
    } catch (e) {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  const kpis = data?.kpis || {
    totalCompanies: companies.length || 5,
    activeCompanies: companies.filter((c) => c.subscription_status === 'active').length || 4,
    trialCompanies: companies.filter((c) => c.subscription_status === 'trial').length || 1,
    suspendedCompanies: companies.filter((c) => c.subscription_status === 'suspended').length || 0,
    totalPlatformUsers: 292,
    activeUsersToday: 239,
    companiesOnboarding: 2,
  }

  const moduleAdoption = data?.moduleAdoption || {
    hr: 2,
    sales: 3,
    field_force: 3,
    attendance: 4,
    crm: 3,
    agent_training: 2,
    orders: 3,
    collections: 3,
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-widest">
              👑 NexFieldForce SaaS Platform Admin
            </span>
            <span className="text-xs text-slate-400">Multi-Tenant Cloud</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            SaaS Platform Governance & Client Workspaces
          </h1>
          <p className="text-xs text-slate-400">
            Register, onboard, configure business modules, and monitor tenant workspaces across the entire platform.
          </p>
        </div>

        <button
          onClick={() => onNavigate('companies')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
        >
          <Building className="h-4 w-4" /> Manage Client Companies ({kpis.totalCompanies})
        </button>
      </div>

      {/* Top SaaS Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Companies</span>
          <p className="text-lg font-black text-white">{kpis.totalCompanies} Clients</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Active Workspaces</span>
          <p className="text-lg font-black text-emerald-300">{kpis.activeCompanies} Active</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase">Trial Workspaces</span>
          <p className="text-lg font-black text-amber-300">{kpis.trialCompanies} Trial</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Suspended</span>
          <p className="text-lg font-black text-slate-400">{kpis.suspendedCompanies}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Users</span>
          <p className="text-lg font-black text-sky-400">{kpis.totalPlatformUsers} Users</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Active Today</span>
          <p className="text-lg font-black text-purple-300">{kpis.activeUsersToday} Active</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Onboarding</span>
          <p className="text-lg font-black text-teal-300">{kpis.companiesOnboarding} Pending</p>
        </div>
      </div>

      {/* Module Adoption Breakdown & Industry Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Adoption */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                SaaS Module Adoption Across Client Companies
              </h3>
              <p className="text-xs text-slate-400">Total client organizations utilizing each core business module.</p>
            </div>
            <span className="text-xs font-bold text-slate-400">16 Modules Platform-Ready</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">Commercial Sales CRM</span>
              <p className="text-base font-extrabold text-emerald-400">{moduleAdoption.sales} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">Field Force & Telemetry</span>
              <p className="text-base font-extrabold text-sky-400">{moduleAdoption.field_force} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">HR & Workforce ATS</span>
              <p className="text-base font-extrabold text-purple-400">{moduleAdoption.hr} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">GPS Attendance Roster</span>
              <p className="text-base font-extrabold text-teal-400">{moduleAdoption.attendance} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '80%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">POS Orders Creator</span>
              <p className="text-base font-extrabold text-amber-400">{moduleAdoption.orders} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">Collections Reconciliation</span>
              <p className="text-base font-extrabold text-indigo-400">{moduleAdoption.collections} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">Agent Training & Surveys</span>
              <p className="text-base font-extrabold text-rose-400">{moduleAdoption.agent_training} Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1">
              <span className="text-slate-400 font-semibold">AI Copilots Suite</span>
              <p className="text-base font-extrabold text-white">5 Companies</p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Industry Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building className="h-4 w-4 text-purple-400" />
              Client Industry Distribution
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>FMCG & Wholesale Distribution</span>
                  <span className="font-bold text-white">40%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>HR Consulting & Professional Services</span>
                  <span className="font-bold text-white">25%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Fleet & Field Operations Logistics</span>
                  <span className="font-bold text-white">20%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Modern Supermarket & Retail Chains</span>
                  <span className="font-bold text-white">15%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('companies')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Open Client Companies Directory →
          </button>
        </div>
      </div>

      {/* Recent Client Organization Onboardings (Connected to real database) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Recent Client Company Onboardings & Active Environments
            </h3>
            <p className="text-xs text-slate-400">Actual registered client companies on NexFieldForce.</p>
          </div>
          <button onClick={() => onNavigate('companies')} className="text-xs font-bold text-sky-400 hover:underline">
            View All ({companies.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Company ID & Name</th>
                <th className="px-5 py-3.5">Industry</th>
                <th className="px-5 py-3.5">Subscribed Modules</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Onboarded</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {companies.slice(0, 6).map((comp) => {
                const mods = comp.enabled_modules || []
                return (
                  <tr key={comp.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] font-bold text-sky-400 block">{comp.code}</span>
                      <strong className="text-white text-sm">{comp.name}</strong>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{comp.industry}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {mods.slice(0, 3).map((m) => (
                          <span key={m} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {m.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {mods.length > 3 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-sky-400">
                            +{mods.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        comp.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {comp.subscription_status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{comp.start_date || '16 Aug 2026'}</td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => setConfigModalCompany(comp)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white font-bold text-xs transition-colors"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => onNavigate('companies', { companyId: comp.id })}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configure Company & Modules */}
      {configModalCompany && (
        <SuperAdminCompanyConfigModal
          company={configModalCompany}
          onClose={() => setConfigModalCompany(null)}
          onSuccess={() => {
            setConfigModalCompany(null)
            fetchDashboard()
          }}
        />
      )}
    </div>
  )
}

// ==============================================================================
// 5. SUPER ADMIN: CLIENT COMPANIES DIRECTORY & COMPANY DETAIL VIEW
// ==============================================================================
export function SuperAdminCompaniesManagementView({ params = {}, onNavigate }) {
  const { showToast } = useApp()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'trial' | 'suspended'
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [configModalCompany, setConfigModalCompany] = useState(null)
  const [resetModalData, setResetModalData] = useState(null)

  const fetchCompanies = async () => {
    try {
      const res = await apiRequest('/api/companies')
      const comps = res?.data || []
      setCompanies(comps)

      // If params.companyId is passed, open detail view directly
      if (params?.companyId) {
        const match = comps.find((c) => String(c.id) === String(params.companyId) || String(c.code).toLowerCase() === String(params.companyId).toLowerCase())
        if (match) setSelectedCompany(match)
      }
    } catch (e) {}
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [params?.companyId])

  const handleToggleStatus = async (comp) => {
    const nextStatus = comp.subscription_status === 'active' ? 'suspended' : 'active'
    if (!window.confirm(`Change status of "${comp.name}" to ${nextStatus.toUpperCase()}?`)) return
    try {
      await apiRequest(`/api/companies/${comp.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      showToast(`Company "${comp.name}" is now ${nextStatus.toUpperCase()}`)
      fetchCompanies()
      if (selectedCompany && selectedCompany.id === comp.id) {
        setSelectedCompany({ ...selectedCompany, subscription_status: nextStatus })
      }
    } catch (err) {
      showToast(err.message || 'Failed to update company status', 'error')
    }
  }

  const handleResetAdmin = async (comp) => {
    try {
      const res = await apiRequest(`/api/companies/${comp.id}/reset-admin`, { method: 'POST' })
      setResetModalData(res?.data)
      showToast('New credentials generated!')
    } catch (err) {
      showToast(err.message || 'Failed to reset credentials', 'error')
    }
  }

  // If a company is selected, render the dedicated Company Detail & Workspace View
  if (selectedCompany) {
    return (
      <SuperAdminCompanyDetailView
        companyId={selectedCompany.id}
        onBack={() => setSelectedCompany(null)}
        onConfigure={(comp) => setConfigModalCompany(comp)}
        onResetAdmin={(comp) => handleResetAdmin(comp)}
        onToggleStatus={(comp) => handleToggleStatus(comp)}
        onNavigate={onNavigate}
        showToast={showToast}
      />
    )
  }

  const filtered = companies.filter((c) => {
    const matchesSearch =
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_person || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || (c.subscription_status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Building className="h-6 w-6 text-sky-400" />
            Client Companies & Multi-Tenant Management
          </h1>
          <p className="text-xs text-slate-400">
            Register and onboard client organizations, configure subscribed modules, and provision tenant workspaces.
          </p>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
        >
          <Plus className="h-4 w-4" /> Onboard New Organization (6-Step Wizard)
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, code, contact..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-white"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto">
          {['all', 'active', 'trial', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase transition-colors ${
                statusFilter === st ? 'bg-sky-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Client Organizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((comp) => {
          const mods = comp.enabled_modules || []
          return (
            <div key={comp.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase font-mono">
                      {comp.code}
                    </span>
                    <h3
                      onClick={() => setSelectedCompany(comp)}
                      className="text-base font-bold text-white mt-1 hover:text-sky-400 cursor-pointer transition-colors"
                    >
                      {comp.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{comp.industry}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase ${
                    comp.subscription_status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : comp.subscription_status === 'trial'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {comp.subscription_status}
                  </span>
                </div>

                {/* Contact & Quota Details */}
                <div className="space-y-1.5 text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact Person:</span>
                    <span className="font-semibold text-slate-200">{comp.contact_person}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Official Email:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{comp.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">User Quota:</span>
                    <span className="font-bold text-sky-400">{comp.user_count || 1} / {comp.employee_limit || 100} Accounts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan & Renewal:</span>
                    <span className="font-semibold text-emerald-400">{comp.renewal_date}</span>
                  </div>
                </div>

                {/* Subscribed Modules Badges */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Subscribed Modules ({mods.length})</span>
                  <div className="flex flex-wrap gap-1">
                    {mods.map((m) => (
                      <span key={m} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 uppercase">
                        {m.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs font-bold">
                <button
                  onClick={() => setSelectedCompany(comp)}
                  className="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-center transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => setConfigModalCompany(comp)}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-center"
                >
                  Configure
                </button>
                <button
                  onClick={() => handleResetAdmin(comp)}
                  className="py-1.5 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white"
                  title="Reset Administrator Credentials & Activation Link"
                >
                  <Key className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(comp)}
                  className={`py-1.5 px-2.5 rounded-xl ${
                    comp.subscription_status === 'active'
                      ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white'
                      : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                  }`}
                  title={comp.subscription_status === 'active' ? 'Suspend Organization' : 'Activate Organization'}
                >
                  {comp.subscription_status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: 6-Step Onboarding Wizard */}
      {wizardOpen && (
        <SuperAdminCompanyOnboardingWizardModal
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onSuccess={() => {
            setWizardOpen(false)
            fetchCompanies()
          }}
          showToast={showToast}
        />
      )}

      {/* Modal: Configure Company Profile & Modules */}
      {configModalCompany && (
        <SuperAdminCompanyConfigModal
          company={configModalCompany}
          onClose={() => setConfigModalCompany(null)}
          onSuccess={() => {
            setConfigModalCompany(null)
            fetchCompanies()
          }}
        />
      )}

      {/* Modal: Admin Credentials & Activation Link Result */}
      {resetModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/40 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-400" />
              Company Administrator Credentials
            </h3>
            <div className="rounded-xl bg-slate-950 p-4 space-y-2 text-xs font-mono">
              <p><span className="text-slate-500">Admin Email:</span> <strong className="text-white">{resetModalData.adminEmail}</strong></p>
              <p><span className="text-slate-500">Temporary Password:</span> <strong className="text-emerald-400">{resetModalData.temporaryPassword}</strong></p>
              <p className="pt-2 text-[11px] text-slate-400 break-all"><span className="text-slate-500">Activation Link:</span><br/>{resetModalData.activationLink}</p>
            </div>
            <button
              onClick={() => setResetModalData(null)}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==============================================================================
// 5B. SUPER ADMIN: CLIENT COMPANY DETAIL & WORKSPACE VIEW (NEVER EMPTY)
// ==============================================================================
export function SuperAdminCompanyDetailView({ companyId, onBack, onConfigure, onResetAdmin, onToggleStatus, onNavigate, showToast }) {
  const [companyData, setCompanyData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchStaff, setSearchStaff] = useState('')
  const [staffModalOpen, setStaffModalOpen] = useState(false)

  const fetchCompanyDetails = async () => {
    try {
      const res = await apiRequest(`/api/companies/${companyId}`)
      setCompanyData(res?.data || null)
    } catch (e) {
      if (showToast) showToast('Failed to load company details', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanyDetails()
  }, [companyId])

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-400" />
        <p className="text-xs">Loading client company workspace details...</p>
      </div>
    )
  }

  if (!companyData) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <AlertCircle className="h-8 w-8 mx-auto text-rose-500" />
        <p className="text-sm font-bold text-white">Client Company Not Found</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">
          ← Back to Directory
        </button>
      </div>
    )
  }

  const comp = companyData
  const stats = comp.stats || {
    totalUsers: comp.users?.length || 1,
    companyAdmins: 1,
    hrManagers: 0,
    supervisors: 1,
    salesAgents: 1,
    fieldAgents: 1,
    staff: 0,
  }
  const enabledMods = comp.enabled_modules || []
  const usersList = comp.users || []

  const filteredUsers = usersList.filter((u) => {
    const q = searchStaff.toLowerCase()
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role_code || '').toLowerCase().includes(q) ||
      (u.employee_code || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back to All Companies
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onConfigure(comp)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all"
          >
            <Sliders className="h-4 w-4" /> Configure Company & Modules
          </button>
          <button
            onClick={() => onResetAdmin(comp)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white text-xs font-bold transition-all"
          >
            <Key className="h-4 w-4" /> Reset Admin
          </button>
          <button
            onClick={() => onToggleStatus(comp)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              comp.subscription_status === 'active'
                ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white'
                : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
            }`}
          >
            {comp.subscription_status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {comp.subscription_status === 'active' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>

      {/* 1. Company Overview Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                {comp.code}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                comp.subscription_status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {comp.subscription_status}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">{comp.name}</h1>
            <p className="text-xs text-slate-400">{comp.legal_name || `${comp.name} Ltd`} • {comp.industry}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Subscription Tier</span>
            <span className="text-sm font-bold text-emerald-400 block">{comp.subscription_plan || 'Enterprise'}</span>
            <span className="text-[11px] text-slate-400">Renewal: {comp.renewal_date || '2027-03-01'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
          <div>
            <span className="text-slate-500 block">Contact Executive:</span>
            <span className="font-semibold text-white">{comp.contact_person}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Official Email & Phone:</span>
            <span className="font-semibold text-white">{comp.email} • {comp.phone}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Headquarters Address:</span>
            <span className="font-semibold text-white">{comp.address || 'Lagos, Nigeria'}</span>
          </div>
        </div>
      </div>

      {/* 2. Users Breakdown & Enabled Functions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              Company Users Breakdown
            </h3>
            <span className="text-xs font-black text-sky-400">{stats.totalUsers} Total Accounts</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">Company Admins:</span>
              <strong className="text-purple-400 font-mono">{stats.companyAdmins}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">HR Managers:</span>
              <strong className="text-pink-400 font-mono">{stats.hrManagers}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">Field Supervisors:</span>
              <strong className="text-indigo-400 font-mono">{stats.supervisors}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">Commercial Sales Agents:</span>
              <strong className="text-emerald-400 font-mono">{stats.salesAgents}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">Field Operations Agents:</span>
              <strong className="text-teal-400 font-mono">{stats.fieldAgents}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-300">Corporate Staff:</span>
              <strong className="text-slate-300 font-mono">{stats.staff}</strong>
            </div>
          </div>
        </div>

        {/* Enabled Functions Checklist */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Subscribed Functions & Business Modules
              </h3>
              <p className="text-xs text-slate-400">Only enabled functions are visible in this company's workspace.</p>
            </div>
            <button
              onClick={() => onConfigure(comp)}
              className="text-xs font-bold text-sky-400 hover:underline"
            >
              Edit Modules →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {MODULE_CATALOG.map((m) => {
              const active = enabledMods.includes(m.key)
              return (
                <div
                  key={m.key}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    active
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-white'
                      : 'border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-60'
                  }`}
                >
                  <m.icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <div className="overflow-hidden">
                    <span className="font-bold block truncate">{m.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {active ? '✓ Enabled' : '— Disabled'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. Company Staff Roster Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              Company Staff & User Roster
            </h3>
            <p className="text-xs text-slate-400">Active accounts belonging to {comp.name}.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                placeholder="Search staff..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-white"
              />
            </div>
            <button
              onClick={() => onNavigate('employees', { companyId: comp.id })}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <UserPlus className="h-4 w-4" /> Provision Staff
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Full Name & Email</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                    No staff members found matching query. Click "Provision Staff" to add users.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-mono font-bold text-sky-400">{u.employee_code || `EMP-${u.id}`}</td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700 uppercase">
                        {(u.role_code || 'EMPLOYEE').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{u.department_name || 'General Operations'}</td>
                    <td className="px-5 py-4 text-slate-400">{u.phone || '+2348000000000'}</td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                        {u.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 5C. SUPER ADMIN: CONFIGURE COMPANY PROFILE & MODULES MODAL
// ==============================================================================
export function SuperAdminCompanyConfigModal({ company, onClose, onSuccess }) {
  const { showToast } = useApp()
  const [activeTab, setActiveTab] = useState('modules') // 'modules' | 'profile' | 'rules'
  const [submitting, setSubmitting] = useState(false)

  // Profile State
  const [name, setName] = useState(company.name || '')
  const [legalName, setLegalName] = useState(company.legal_name || '')
  const [industry, setIndustry] = useState(company.industry || '')
  const [contactPerson, setContactPerson] = useState(company.contact_person || '')
  const [phone, setPhone] = useState(company.phone || '')
  const [email, setEmail] = useState(company.email || '')
  const [address, setAddress] = useState(company.address || '')
  const [employeeLimit, setEmployeeLimit] = useState(company.employee_limit || 100)

  // Modules State
  const [targetModules, setTargetModules] = useState(company.enabled_modules || [])

  // Rules State
  const [gpsRequired, setGpsRequired] = useState(company.rules?.gps_required ?? true)
  const [photoRequired, setPhotoRequired] = useState(company.rules?.photo_required ?? true)
  const [targetSystem, setTargetSystem] = useState(company.rules?.target_system ?? true)
  const [commissionEnabled, setCommissionEnabled] = useState(company.rules?.commission_enabled ?? true)

  const toggleModule = (key) => {
    if (targetModules.includes(key)) {
      setTargetModules(targetModules.filter((m) => m !== key))
    } else {
      setTargetModules([...targetModules, key])
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // 1. Update Profile & Rules
      await apiRequest(`/api/companies/${company.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          legalName: legalName.trim(),
          industry: industry.trim(),
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          employeeLimit: Number(employeeLimit),
        }),
      })

      // 2. Update Modules & Rules
      await apiRequest(`/api/companies/${company.id}/modules`, {
        method: 'PATCH',
        body: JSON.stringify({
          enabledModules: targetModules,
          rules: {
            gps_required: gpsRequired,
            photo_required: photoRequired,
            target_system: targetSystem,
            commission_enabled: commissionEnabled,
          },
        }),
      })

      showToast(`Configuration for "${name}" updated successfully!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      showToast(err.message || 'Failed to update company configuration', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-sky-400" />
              Configure Company: {company.name} ({company.code})
            </h2>
            <p className="text-xs text-slate-400">Edit organization details, subscribed modules, and operational rules.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('modules')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'modules' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Subscribed Modules ({targetModules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'profile' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Company Profile & Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'rules' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Operational Rules & Limits
          </button>
        </div>

        {/* Tab 1: Modules */}
        {activeTab === 'modules' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-300">
              Toggle which business modules are active for this company. Disabled modules are completely hidden from staff.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {MODULE_CATALOG.map((m) => {
                const isSelected = targetModules.includes(m.key)
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    className={`p-3 rounded-xl border flex items-start justify-between text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-950/30 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <m.icon className={`h-4 w-4 mt-0.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div>
                        <span className="font-bold block text-xs">{m.label}</span>
                        <span className="text-[10px] text-slate-400">{m.desc}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Company Trading Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Legal Registered Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Contact Person</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Headquarters Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Rules & Limits */}
        {activeTab === 'rules' && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Max Staff Quota Limit</label>
              <input
                type="number"
                value={employeeLimit}
                onChange={(e) => setEmployeeLimit(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="block text-slate-300 font-bold">Enforced Operational Rules:</span>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>GPS Location Verification Mandatory for Visits</span>
                <input
                  type="checkbox"
                  checked={gpsRequired}
                  onChange={(e) => setGpsRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>Store Visit Photo Evidence Mandatory</span>
                <input
                  type="checkbox"
                  checked={photoRequired}
                  onChange={(e) => setPhotoRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>Enable 5% Sales Commission Engine</span>
                <input
                  type="checkbox"
                  checked={commissionEnabled}
                  onChange={(e) => setCommissionEnabled(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
          >
            {submitting ? 'Saving Configuration...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 6. 6-STEP INTERACTIVE COMPANY ONBOARDING WIZARD MODAL
// ==============================================================================
export function SuperAdminCompanyOnboardingWizardModal({ isOpen, onClose, onSuccess, showToast }) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Company Info
  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [industry, setIndustry] = useState('FMCG Wholesale & Retail Distribution')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('+2348000000000')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('Lagos, Nigeria')

  // Step 2: Modules Selection
  const [enabledModules, setEnabledModules] = useState([
    'sales', 'crm', 'orders', 'products', 'collections',
    'field_force', 'agent_tracking', 'gps_visits', 'reports', 'ai'
  ])

  // Step 3: Organization
  const [departments, setDepartments] = useState(['Executive Leadership', 'Commercial Sales', 'Field Operations', 'Finance & Accounts'])
  const [newDept, setNewDept] = useState('')

  // Step 4: Administrator User
  const [adminFullName, setAdminFullName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('ChangeMe123!')

  // Step 5: Rules & Limits
  const [gpsRequired, setGpsRequired] = useState(true)
  const [photoRequired, setPhotoRequired] = useState(true)
  const [targetSystem, setTargetSystem] = useState(true)
  const [commissionEnabled, setCommissionEnabled] = useState(true)
  const [employeeLimit, setEmployeeLimit] = useState('100')
  const [salesLimit, setSalesLimit] = useState('30')
  const [fieldLimit, setFieldLimit] = useState('30')

  const toggleModule = (key) => {
    if (enabledModules.includes(key)) {
      setEnabledModules(enabledModules.filter((m) => m !== key))
    } else {
      setEnabledModules([...enabledModules, key])
    }
  }

  const handleAddDepartment = () => {
    if (newDept.trim() && !departments.includes(newDept.trim())) {
      setDepartments([...departments, newDept.trim()])
      setNewDept('')
    }
  }

  const handleRemoveDepartment = (dept) => {
    setDepartments(departments.filter((d) => d !== dept))
  }

  const handleFinalSubmit = async () => {
    if (!name.trim() || !adminEmail.trim()) {
      showToast('Company name and administrator email are required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiRequest('/api/companies/onboard', {
        method: 'POST',
        body: JSON.stringify({
          name,
          legalName,
          industry,
          contactPerson,
          phone,
          email,
          address,
          adminFullName,
          adminEmail,
          adminPassword,
          enabledModules,
          departments,
          employeeLimit: Number(employeeLimit),
          salesAgentLimit: Number(salesLimit),
          fieldAgentLimit: Number(fieldLimit),
          rules: {
            gps_required: gpsRequired,
            photo_required: photoRequired,
            target_system: targetSystem,
            commission_enabled: commissionEnabled,
          },
        }),
      })
      showToast(`Organization "${name}" onboarded and workspace provisioned!`)
      if (onSuccess) onSuccess(res?.data)
    } catch (err) {
      showToast(err.message || 'Failed to onboard company', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Wizard Progress Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
              Step {step} of 6
            </span>
            <h2 className="text-base font-bold text-white mt-1">
              {step === 1 && '1. Company Profile & Business Details'}
              {step === 2 && '2. Select Subscribed Business Modules'}
              {step === 3 && '3. Configure Starter Organization'}
              {step === 4 && '4. Provision Company Administrator'}
              {step === 5 && '5. Operational Rules & Quotas'}
              {step === 6 && '6. Review & Activate Organization'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: COMPANY PROFILE */}
        {step === 1 && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Company Trading Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ABC Distribution Ltd"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Legal Registered Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="e.g. ABC Distribution Nigeria Ltd"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Industry Category</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="FMCG Wholesale & Retail Distribution">FMCG Wholesale & Retail Distribution</option>
                  <option value="HR Consulting & Professional Services">HR Consulting & Professional Services</option>
                  <option value="Field Operations & Fleet Logistics">Field Operations & Fleet Logistics</option>
                  <option value="Retail & Modern Trade Supermarkets">Retail & Modern Trade Supermarkets</option>
                  <option value="Beverage Bottling & Distribution">Beverage Bottling & Distribution</option>
                  <option value="Pharmaceuticals & Healthcare Distribution">Pharmaceuticals & Healthcare Distribution</option>
                  <option value="Manufacturing & Industrial Goods">Manufacturing & Industrial Goods</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Contact Person (MD / Executive)</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. John Adeleke"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Company Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@abcdistribution.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Headquarters Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Commercial Avenue, Ikeja, Lagos"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SELECT MODULES */}
        {step === 2 && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">
              Choose the business modules to activate for this tenant. The company's staff will only see functions enabled here.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {MODULE_CATALOG.map((m) => {
                const active = enabledModules.includes(m.key)
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => toggleModule(m.key)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 transition-all ${
                      active ? 'border-sky-500 bg-sky-950/30 text-white' : 'border-slate-800 bg-slate-950/60 text-slate-400'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <m.icon className={`h-4 w-4 mt-0.5 ${active ? 'text-sky-400' : 'text-slate-500'}`} />
                      <div>
                        <span className="font-bold block text-xs">{m.label}</span>
                        <span className="text-[10px] text-slate-400">{m.desc}</span>
                      </div>
                    </div>
                    {active && <Check className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: CONFIGURE ORGANIZATION */}
        {step === 3 && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">Add initial departments and operational divisions for this organization:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="e.g. Regional Logistics & Fleet"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
              >
                + Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {departments.map((dept) => (
                <span
                  key={dept}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-2 font-semibold"
                >
                  {dept}
                  <button onClick={() => handleRemoveDepartment(dept)} className="text-rose-400 hover:text-rose-300">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: PROVISION COMPANY ADMINISTRATOR */}
        {step === 4 && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-400">
              Create the initial master administrator account for this client company. They will use this to manage their organization.
            </p>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Administrator Full Name *</label>
              <input
                type="text"
                required
                value={adminFullName}
                onChange={(e) => setAdminFullName(e.target.value)}
                placeholder="e.g. John Adeleke"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Administrator Login Email *</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@abcdistribution.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Temporary Master Password</label>
              <input
                type="text"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                The administrator will be prompted to change their password upon first login.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: OPERATIONAL RULES & USER LIMITS */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Max Staff Quota</label>
                <input
                  type="number"
                  value={employeeLimit}
                  onChange={(e) => setEmployeeLimit(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Sales Agents Quota</label>
                <input
                  type="number"
                  value={salesLimit}
                  onChange={(e) => setSalesLimit(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-bold mb-1">Field Agents Quota</label>
                <input
                  type="number"
                  value={fieldLimit}
                  onChange={(e) => setFieldLimit(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="block text-slate-300 font-bold">Enforced Operational Rules:</span>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>GPS Location Verification Mandatory</span>
                <input
                  type="checkbox"
                  checked={gpsRequired}
                  onChange={(e) => setGpsRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>Store Visit Photo Evidence Mandatory</span>
                <input
                  type="checkbox"
                  checked={photoRequired}
                  onChange={(e) => setPhotoRequired(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer">
                <span>Enable 5% Sales Commission Engine</span>
                <input
                  type="checkbox"
                  checked={commissionEnabled}
                  onChange={(e) => setCommissionEnabled(e.target.checked)}
                  className="h-4 w-4 rounded text-sky-600 bg-slate-900 border-slate-700"
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 6: SUMMARY & INSTANT ACTIVATION */}
        {step === 6 && (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Ready to Activate Workspace for "{name}"
              </h3>
              <div className="space-y-1 text-slate-300">
                <p><strong>Industry:</strong> {industry}</p>
                <p><strong>Administrator:</strong> {adminFullName} ({adminEmail})</p>
                <p><strong>Temporary Password:</strong> <span className="font-mono text-emerald-400">{adminPassword}</span></p>
                <p><strong>Active Modules ({enabledModules.length}):</strong> {enabledModules.join(', ')}</p>
                <p><strong>Departments ({departments.length}):</strong> {departments.join(', ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              ← Back
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !name.trim()) {
                  showToast('Company name is required', 'error')
                  return
                }
                if (step === 4 && !adminEmail.trim()) {
                  showToast('Administrator email is required', 'error')
                  return
                }
                setStep(step + 1)
              }}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition-all"
            >
              {submitting ? 'Generating Workspace...' : '✓ Activate Organization Workspace'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 7. COMPANY ADMINISTRATOR WORKSPACE (TENANT ADMIN)
// ==============================================================================
export function CompanyAdminWorkspaceView({ onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
          🏢 Client Organization Workspace
        </span>
        <h1 className="text-xl font-bold text-white">Company Administration & Staff Roster</h1>
        <p className="text-xs text-slate-400">
          Manage your organization's employees, departments, commercial targets, and field teams.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('employees')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left space-y-2 transition-all"
        >
          <Users className="h-6 w-6 text-sky-400" />
          <h3 className="text-sm font-bold text-white">Employee & Staff Directory</h3>
          <p className="text-xs text-slate-400">Manage workforce roster, role assignments, and onboarding.</p>
        </button>

        <button
          onClick={() => onNavigate('departments')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left space-y-2 transition-all"
        >
          <Building className="h-6 w-6 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Departments & Teams</h3>
          <p className="text-xs text-slate-400">Organize company hierarchy and team structures.</p>
        </button>

        <button
          onClick={() => onNavigate('reports')}
          className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 text-left space-y-2 transition-all"
        >
          <FileText className="h-6 w-6 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Company Reports</h3>
          <p className="text-xs text-slate-400">View executive performance, attendance, and sales audit logs.</p>
        </button>
      </div>
    </div>
  )
}
