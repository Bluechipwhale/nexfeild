import React, { useState, useEffect } from 'react'
import {
  DollarSign, ShoppingCart, Target, TrendingUp, Users,
  Plus, Search, Check, Trash2, Calendar, MapPin,
  Clock, Package, FileText, CheckCircle2, Award,
  ArrowRight, RefreshCw, AlertCircle, Eye, Camera,
  Upload, Filter, Phone, Mail, Building, ChevronRight,
  TrendingDown, Shield, Bell, Sparkles, CreditCard,
  Image as ImageIcon, CheckSquare, AlertTriangle, ArrowUpRight,
  ExternalLink, UserCheck
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp, useAuth } from '../App.jsx'

// ==============================================================================
// 1. SALES AGENT: 12-SECTION COMPREHENSIVE COMMERCIAL SALES DASHBOARD
// ==============================================================================
export function SalesAgentOverviewView({ onNavigate }) {
  const { user } = useAuth() || {}
  const { showToast } = useApp()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recordPaymentModal, setRecordPaymentModal] = useState(false)
  const [payCustId, setPayCustId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('Bank Transfer')

  const fetchDashboardData = async () => {
    try {
      const res = await apiRequest('/api/sales/my-report')
      setReport(res?.data || null)
    } catch (e) {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!payAmount || Number(payAmount) <= 0) {
      showToast('Please enter a valid payment amount', 'error')
      return
    }
    try {
      const cust = (report?.customers || []).find((c) => String(c.id) === String(payCustId))
      await apiRequest('/api/sales/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerId: payCustId,
          customerName: cust?.name || 'Retail Customer',
          amount: Number(payAmount),
          method: payMethod,
        }),
      })
      showToast('Payment reconciled and deducted from customer balance!')
      setRecordPaymentModal(false)
      setPayAmount('')
      fetchDashboardData()
    } catch (err) {
      showToast('Failed to record payment', 'error')
    }
  }

  const kpis = report?.kpis || {
    todaySales: 485000,
    monthlySales: 8900000,
    monthlyTarget: 10000000,
    targetAchievement: 89,
    ordersToday: 4,
    totalOrders: 14,
    outstandingDebt: 1200000,
    newCustomersCount: 8,
    visitsToday: 4,
    totalVisits: 76,
    commissionEarned: 267000,
  }

  const targetDiff = Math.max(0, kpis.monthlyTarget - kpis.monthlySales)

  const scheduleActivities = [
    { time: '09:00 AM', task: 'Visit Ebeano Warehouse Lekki (Merchandising & Order Booking)', done: true },
    { time: '11:00 AM', task: 'Follow up with Gold Line Retail Mart Broad St (Invoice Clearing)', done: true },
    { time: '01:00 PM', task: 'Submit Commercial Restock Order for MegaMart Lekki', done: false },
    { time: '03:00 PM', task: 'Debt Collection from Mainland Wholesale Depot Yaba (₦1.2M)', done: false },
    { time: '04:30 PM', task: 'Log Competitor Pricing & Upload Promotional Photos', done: false },
  ]

  const collectionsDue = [
    { customer: 'Mainland Wholesale Depot Yaba', amount: 1200000, due: 'Today', status: 'Due' },
    { customer: 'Gold Line Retail Mart Broad St', amount: 850000, due: 'Today', status: 'Due' },
    { customer: 'Prime Provisions Ikeja GRA', amount: 350000, due: 'Overdue (3 Days)', status: 'Overdue' },
  ]

  const topProducts = [
    { name: 'Golden Malt Energy Drink 330ml (Pack of 24)', revenue: 3850000, unitsSold: 405, stock: 450 },
    { name: 'Pure Cooking Vegetable Oil 1L (Carton of 12)', revenue: 2707500, unitsSold: 95, stock: 320 },
    { name: 'Evaporated Rich Milk 160g (Carton of 48)', revenue: 1470000, unitsSold: 70, stock: 260 },
  ]

  const salesAlerts = [
    { icon: Bell, text: 'Customer payment overdue: Prime Provisions Ikeja (₦350,000)', type: 'urgent' },
    { icon: Target, text: 'You are 89% toward your August quota! ₦1.1M remaining to unlock +15% bonus.', type: 'info' },
    { icon: Package, text: 'Product stock notice: Pure Cooking Oil (320 cartons available)', type: 'normal' },
    { icon: UserCheck, text: 'Lead follow-up scheduled for 02:00 PM: Prince Ebeano Ikoyi', type: 'info' },
  ]

  return (
    <div className="space-y-6">
      {/* Salutation & Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-widest">
              Commercial Sales Force CRM
            </span>
            <span className="text-xs text-slate-400">August 2026 Shift</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Good day, {user?.fullName || 'Adebanjo'} 👋
          </h1>
          <p className="text-xs text-slate-400">
            Here is your personalized commercial sales performance, customer debt roster, and daily visit activities.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <ShoppingCart className="h-4 w-4" /> Book New Order
          </button>
          <button
            onClick={() => onNavigate('competitors')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition-all"
          >
            <Camera className="h-4 w-4" /> Competitor Intel
          </button>
        </div>
      </div>

      {/* SECTION 1: TOP 8 SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Sales</span>
          <p className="text-sm font-extrabold text-emerald-400">₦{kpis.todaySales.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Sales</span>
          <p className="text-sm font-extrabold text-white">₦{kpis.monthlySales.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Sales Target</span>
          <p className="text-sm font-extrabold text-slate-300">₦{kpis.monthlyTarget.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">Achievement</span>
          <p className="text-sm font-extrabold text-emerald-300">{kpis.targetAchievement}%</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Orders Today</span>
          <p className="text-sm font-extrabold text-sky-400">{kpis.ordersToday} Orders</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-rose-400 uppercase">Outstanding</span>
          <p className="text-sm font-extrabold text-rose-300">₦{kpis.outstandingDebt.toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">New Outlets</span>
          <p className="text-sm font-extrabold text-purple-300">{kpis.newCustomersCount} New</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Visits Today</span>
          <p className="text-sm font-extrabold text-amber-300">{kpis.visitsToday} Visits</p>
        </div>
      </div>

      {/* SECTION 2 & 12: SALES PERFORMANCE PROGRESS BAR & QUICK ACTION DOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Sales Performance vs Target
              </h3>
              <p className="text-xs text-slate-400">Monthly quota attainment and 5% commission earnings.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">5% Commission Earned:</span>
              <p className="text-lg font-black text-emerald-400">₦{kpis.commissionEarned.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress Visual */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">
                Achieved: <strong className="text-emerald-400">₦{kpis.monthlySales.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">
                Target: <strong className="text-white">₦{kpis.monthlyTarget.toLocaleString()}</strong>
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-slate-800 overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis.targetAchievement)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
              <span>Remaining: <strong className="text-amber-300">₦{targetDiff.toLocaleString()}</strong></span>
              <span className="font-extrabold text-emerald-400 text-xs">{kpis.targetAchievement}% Achieved</span>
            </div>
          </div>

          {/* Growth & Conversion Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Growth vs Last Month</span>
              <p className="text-base font-extrabold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                <ArrowUpRight className="h-4 w-4" /> +14.2%
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Average Order Value</span>
              <p className="text-base font-extrabold text-white mt-1">
                ₦{Math.round(kpis.monthlySales / Math.max(1, kpis.totalOrders)).toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Conversion Rate</span>
              <p className="text-base font-extrabold text-sky-400 mt-1">78.5%</p>
            </div>
          </div>
        </div>

        {/* SECTION 12: QUICK ACTIONS DOCK */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Sales Quick Actions
            </h3>
            <p className="text-xs text-slate-400">One-tap workflows for daily sales operations.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => onNavigate('orders')}
              className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>+ New Order</span>
            </button>

            <button
              onClick={() => setRecordPaymentModal(true)}
              className="p-3 rounded-xl border border-sky-500/30 bg-sky-950/20 hover:bg-sky-900/40 text-sky-300 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={() => onNavigate('customers')}
              className="p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <Building className="h-4 w-4" />
              <span>+ New Outlet</span>
            </button>

            <button
              onClick={() => onNavigate('leads')}
              className="p-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              <span>+ New Lead</span>
            </button>

            <button
              onClick={() => onNavigate('competitors')}
              className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-300 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <Camera className="h-4 w-4" />
              <span>Competitor Intel</span>
            </button>

            <button
              onClick={() => onNavigate('my-reports')}
              className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/40 text-amber-300 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>My Sales Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3 & 8: TODAY'S SCHEDULE & COLLECTIONS DUE RECONCILIATION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              Today's Field Activity Schedule
            </h3>
            <span className="text-xs text-slate-400">5 Activities</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {scheduleActivities.map((act, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  act.done ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    act.done ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {act.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div>
                    <p className={`font-semibold ${act.done ? 'line-through text-slate-400' : 'text-white'}`}>
                      {act.task}
                    </p>
                    <span className="text-[11px] text-slate-500">{act.time}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  act.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {act.done ? 'Completed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Collections Due Today & Overdue Balances */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                Customer Debt & Collections Due
              </h3>
              <p className="text-xs text-slate-400">Total Outstanding: ₦{kpis.outstandingDebt.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setRecordPaymentModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              + Record Payment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] font-bold uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Amount Due</th>
                  <th className="py-2">Timeline</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {collectionsDue.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-white">{c.customer}</td>
                    <td className="py-3 font-bold text-rose-400 font-mono">₦{c.amount.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        c.status === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {c.due}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          setPayAmount(c.amount)
                          setRecordPaymentModal(true)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] font-bold"
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 9 & 10: PRODUCT PERFORMANCE & LIVE NOTIFICATION FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-400" />
              Top-Selling Products This Month
            </h3>
            <button onClick={() => onNavigate('products')} className="text-xs text-sky-400 font-semibold">
              View Catalog →
            </button>
          </div>

          <div className="space-y-2.5">
            {topProducts.map((p, i) => (
              <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-white">{p.name}</h4>
                  <p className="text-[11px] text-slate-400">Sold: {p.unitsSold} units • Available Stock: {p.stock}</p>
                </div>
                <span className="font-bold text-emerald-400 text-sm">₦{p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Notification Alerts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Sales Dispatch & Customer Alerts
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">Live</span>
          </div>

          <div className="space-y-2">
            {salesAlerts.map((alt, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                  alt.type === 'urgent'
                    ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-200'
                }`}
              >
                <alt.icon className={`h-4 w-4 shrink-0 ${alt.type === 'urgent' ? 'text-rose-400' : 'text-sky-400'}`} />
                <span className="leading-relaxed">{alt.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 11: SALES LEADERBOARD PREVIEW */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              August 2026 Commercial Sales Leaderboard
            </h3>
            <p className="text-xs text-slate-400">Team rankings based on total revenue and 5% commission payouts.</p>
          </div>
          <button onClick={() => onNavigate('targets')} className="text-xs text-sky-400 font-semibold">
            Full Leaderboard →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-amber-300 font-mono">🥇 Rank #1 (You)</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">Gold</span>
            </div>
            <h4 className="text-sm font-bold text-white">Adebanjo Adeleke</h4>
            <div className="text-xs text-slate-300 space-y-0.5">
              <p>Sales: <strong className="text-white">₦8,900,000</strong> (89%)</p>
              <p>Commission: <strong className="text-emerald-400">₦267,000</strong></p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-300 font-mono">🥈 Rank #2</span>
              <span className="text-[10px] bg-slate-700 text-white font-bold px-2 py-0.5 rounded">Silver</span>
            </div>
            <h4 className="text-sm font-bold text-white">Chioma Okonkwo</h4>
            <div className="text-xs text-slate-300 space-y-0.5">
              <p>Sales: <strong className="text-white">₦6,400,000</strong> (80%)</p>
              <p>Commission: <strong className="text-emerald-400">₦192,000</strong></p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-amber-700 font-mono">🥉 Rank #3</span>
              <span className="text-[10px] bg-amber-900/50 text-amber-300 font-bold px-2 py-0.5 rounded">Bronze</span>
            </div>
            <h4 className="text-sm font-bold text-white">Emeka Obi</h4>
            <div className="text-xs text-slate-300 space-y-0.5">
              <p>Sales: <strong className="text-white">₦4,200,000</strong> (70%)</p>
              <p>Commission: <strong className="text-emerald-400">₦126,000</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Record Payment Reconciliation */}
      {recordPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-400" />
              Record Customer Payment Collection
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer / Merchant</label>
                <select
                  value={payCustId}
                  onChange={(e) => setPayCustId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="">Select customer...</option>
                  {(report?.customers || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Debt: ₦{(c.balance || 0).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount Collected (₦)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                >
                  <option value="Bank Transfer">Bank Transfer (Instant Confirm)</option>
                  <option value="POS / Card">POS Terminal / Card Receipt</option>
                  <option value="Cash">Cash Collected Onsite</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRecordPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Reconcile & Confirm
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
// 2. SALES AGENT: COMPETITIVE ANALYSIS & MARKET INTELLIGENCE (WITH PICTURES)
// ==============================================================================
export function SalesAgentCompetitiveAnalysisView() {
  const { showToast } = useApp()
  const [intelList, setIntelList] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  // Form State
  const [competitorBrand, setCompetitorBrand] = useState('')
  const [productName, setProductName] = useState('')
  const [observedPrice, setObservedPrice] = useState('')
  const [ourPrice, setOurPrice] = useState('9500')
  const [promoDetails, setPromoDetails] = useState('')
  const [outletName, setOutletName] = useState('')
  const [pictureUrl, setPictureUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [shelfShare, setShelfShare] = useState(30)

  const fetchIntel = async () => {
    try {
      const res = await apiRequest('/api/sales/competitor-intel')
      setIntelList(res?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchIntel()
  }, [])

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPictureUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateIntel = async (e) => {
    e.preventDefault()
    if (!competitorBrand || !productName) {
      showToast('Brand and product name are required', 'error')
      return
    }
    try {
      await apiRequest('/api/sales/competitor-intel', {
        method: 'POST',
        body: JSON.stringify({
          competitorBrand,
          productName,
          observedPrice: Number(observedPrice),
          ourPrice: Number(ourPrice),
          promoDetails,
          outletName,
          pictureUrl,
          notes,
          shelfSharePercent: Number(shelfShare),
        }),
      })
      showToast('Competitor intelligence and photos logged successfully!')
      setModalOpen(false)
      setCompetitorBrand('')
      setProductName('')
      setObservedPrice('')
      setPromoDetails('')
      setPictureUrl('')
      setNotes('')
      fetchIntel()
    } catch (err) {
      showToast('Failed to save competitor intel', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Camera className="h-6 w-6 text-purple-400" />
            Competitive Intelligence & Market Analysis
          </h1>
          <p className="text-xs text-slate-400">
            Track rival FMCG pricing, promotional schemes, shelf share %, and attach field photos.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
        >
          <Plus className="h-4 w-4" /> Add Competitor Report
        </button>
      </div>

      {/* Grid of Competitor Intel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {intelList.map((item) => {
          const isCheaper = (item.priceDiff || 0) < 0
          return (
            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden space-y-3 hover:border-slate-700 transition-all shadow-xl">
              {/* Photo Banner */}
              <div className="h-44 w-full bg-slate-950 relative overflow-hidden">
                <img
                  src={item.pictureUrl || 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80'}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950/80 text-white uppercase backdrop-blur">
                    {item.competitorBrand}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase backdrop-blur ${
                    isCheaper ? 'bg-rose-500/80 text-white' : 'bg-emerald-500/80 text-white'
                  }`}>
                    {isCheaper ? 'Price Under-cut' : 'Premium Priced'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <h3 className="font-bold text-white text-sm">{item.productName}</h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building className="h-3 w-3 text-sky-400" /> {item.outletName || 'Commercial Supermarket'}
                  </p>
                </div>

                {/* Price Matrix */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Rival Price</span>
                    <p className="font-extrabold text-white text-sm">₦{(item.observedPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Our Price</span>
                    <p className="font-extrabold text-emerald-400 text-sm">₦{(item.ourPrice || 9500).toLocaleString()}</p>
                  </div>
                </div>

                {item.promoDetails && (
                  <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-800/40 text-[11px] text-purple-200">
                    <strong>🎁 Promo Offer:</strong> {item.promoDetails}
                  </div>
                )}

                {item.notes && (
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "{item.notes}"
                  </p>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Reported by {item.agentName}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: New Competitor Intel with Image Upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-400" />
              Log Field Competitor Intelligence & Photo
            </h3>

            <form onSubmit={handleCreateIntel} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Competitor Brand</label>
                  <input
                    type="text"
                    required
                    value={competitorBrand}
                    onChange={(e) => setCompetitorBrand(e.target.value)}
                    placeholder="e.g. PowerMax Drinks"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Competitor Product Name</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. 330ml Energy Can"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Observed Shelf Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={observedPrice}
                    onChange={(e) => setObservedPrice(e.target.value)}
                    placeholder="e.g. 8800"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Our Product Price (₦)</label>
                  <input
                    type="number"
                    value={ourPrice}
                    onChange={(e) => setOurPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Store / Outlet Location</label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  placeholder="e.g. Ebeano Lekki Phase 1"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Promotional Scheme / Discount Details</label>
                <input
                  type="text"
                  value={promoDetails}
                  onChange={(e) => setPromoDetails(e.target.value)}
                  placeholder="e.g. Buy 10 cartons get 1 free banner at entrance"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <label className="block text-slate-400 mb-1">Upload Shelf / Banner Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
                {pictureUrl && (
                  <div className="mt-2 h-32 w-full rounded-xl border border-slate-700 overflow-hidden">
                    <img src={pictureUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Field Intelligence Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe customer reception, competitor supply issues, or recommended counter-action..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold"
                >
                  Save Intel
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
// 3. SALES AGENT: STRICTLY USER-ISOLATED SALES REPORT
// ==============================================================================
export function SalesAgentMyReportsView() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await apiRequest('/api/sales/my-report')
        setReport(res?.data || null)
      } catch (e) {}
      finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  const orders = report?.orders || []
  const kpis = report?.kpis || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <FileText className="h-6 w-6 text-sky-400" />
          My Personal Commercial Sales Report
        </h1>
        <p className="text-xs text-slate-400">
          Strictly isolated records of your personal sales revenue, 5% commission payouts, and merchant order history.
        </p>
      </div>

      {/* Summary Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">My Total Revenue</span>
          <p className="text-xl font-black text-emerald-400">₦{(kpis.monthlySales || 0).toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">My 5% Commission</span>
          <p className="text-xl font-black text-white">₦{(kpis.commissionEarned || 0).toLocaleString()}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">My Total Orders</span>
          <p className="text-xl font-black text-sky-400">{orders.length} Orders</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">My Verified Visits</span>
          <p className="text-xl font-black text-purple-300">{kpis.totalVisits || 0} Visits</p>
        </div>
      </div>

      {/* My Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">My Orders Record (User-Isolated)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Order No</th>
                <th className="px-5 py-3">Customer Outlet</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">5% Commission</th>
                <th className="px-5 py-3">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-mono font-bold text-sky-400">{ord.record_no}</td>
                  <td className="px-5 py-3.5 font-bold text-white">{ord.primary_customer || ord.customerName}</td>
                  <td className="px-5 py-3.5 text-slate-400">{ord.transaction_date}</td>
                  <td className="px-5 py-3.5 font-bold text-emerald-400">₦{(ord.total || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-bold text-white">₦{Math.round((ord.total || 0) * 0.05).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      ord.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ord.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 4. SALES AGENT: LEADS & PIPELINE FUNNEL
// ==============================================================================
export function SalesAgentLeadsPipelineView({ onNavigate }) {
  const { showToast } = useApp()
  const [leads, setLeads] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('Lekki, Lagos')
  const [potentialVal, setPotentialVal] = useState('2000000')

  const fetchLeads = async () => {
    try {
      const res = await apiRequest('/api/sales/leads')
      setLeads(res?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleCreateLead = async (e) => {
    e.preventDefault()
    try {
      await apiRequest('/api/sales/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: leadName,
          company,
          phone,
          location,
          potential_value: Number(potentialVal),
        }),
      })
      showToast('Lead created in CRM pipeline!')
      setModalOpen(false)
      setLeadName('')
      fetchLeads()
    } catch (err) {
      showToast('Failed to create lead', 'error')
    }
  }

  const stages = ['New', 'Contacted', 'Interested', 'Negotiation', 'Won']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Users className="h-6 w-6 text-sky-400" />
            Commercial Leads & Prospects Pipeline
          </h1>
          <p className="text-xs text-slate-400">Prospect new modern trade retail accounts and track qualification stages.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Prospect Lead
        </button>
      </div>

      {/* Funnel Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map((stg) => {
          const list = leads.filter((l) => (l.stage || 'New').toLowerCase() === stg.toLowerCase())
          return (
            <div key={stg} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                <span>{stg}</span>
                <span className="h-5 w-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-sky-400">
                  {list.length}
                </span>
              </div>

              <div className="space-y-2">
                {list.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1.5 text-xs">
                    <h4 className="font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.location}</p>
                    <p className="text-[11px] font-bold text-emerald-400">₦{(item.potential_value || 0).toLocaleString()}</p>
                    <div className="pt-1 text-[10px] text-slate-500 flex justify-between">
                      <span>Follow-up: {item.next_followup}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: New Lead */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add New Commercial Lead</h3>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Outlet / Business Name</label>
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="e.g. Delis Mart Victoria Island"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Potential Order Value (₦)</label>
                  <input
                    type="number"
                    value={potentialVal}
                    onChange={(e) => setPotentialVal(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Location / Street Address</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Save Lead
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
// 5. SALES AGENT: PRODUCT CATALOG & STOCK
// ==============================================================================
export function SalesAgentProductsCatalogView() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiRequest('/api/sales/products')
        setProducts(res?.data || [])
      } catch (e) {}
    }
    fetchProducts()
  }, [])

  const filtered = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Package className="h-6 w-6 text-purple-400" />
            Commercial Product Catalog & Stock
          </h1>
          <p className="text-xs text-slate-400">View real-time distributor price lists, packaging units, and available warehouse inventory.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((prod) => (
          <div key={prod.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-purple-500/40 transition-all">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono">
              {prod.sku}
            </span>
            <h3 className="text-xs font-bold text-white line-clamp-2">{prod.name}</h3>
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-emerald-400 text-sm">₦{(prod.price || 0).toLocaleString()}</span>
              <span className="text-slate-400">Stock: <strong className="text-white">{prod.stock_quantity || 100}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==============================================================================
// 6. SALES AGENT: ORDER CREATOR TERMINAL (POS)
// ==============================================================================
export function SalesAgentOrderCreatorView({ onNavigate }) {
  const { showToast } = useApp()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [cart, setCart] = useState({})
  const [discountPercent, setDiscountPercent] = useState(0)
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          apiRequest('/api/sales/products'),
          apiRequest('/api/sales/customers'),
        ])
        setProducts(pRes?.data || [])
        setCustomers(cRes?.data || [])
        if (cRes?.data?.[0]) setSelectedCustomerId(cRes.data[0].id)
      } catch (e) {}
    }
    init()
  }, [])

  const handleUpdateQty = (prodId, delta) => {
    setCart((prev) => {
      const current = prev[prodId] || 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const copy = { ...prev }
        delete copy[prodId]
        return copy
      }
      return { ...prev, [prodId]: next }
    })
  }

  const cartItems = Object.keys(cart).map((id) => {
    const prod = products.find((p) => String(p.id) === String(id)) || {}
    const qty = cart[id]
    const lineTotal = (prod.price || 0) * qty
    return { ...prod, qty, lineTotal }
  })

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = Math.round(taxableAmount * 0.075)
  const totalAmount = taxableAmount + taxAmount

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showToast('Please add products to the order cart', 'error')
      return
    }
    setSubmitting(true)
    try {
      const cust = customers.find((c) => String(c.id) === String(selectedCustomerId))
      await apiRequest('/api/sales/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerName: cust?.name || 'Retail Supermarket',
          items: cartItems,
          subtotal,
          discountAmount,
          taxAmount,
          total: totalAmount,
        }),
      })
      showToast(`Order placed successfully!`)
      setCart({})
      if (onNavigate) onNavigate('overview')
    } catch (err) {
      showToast('Failed to place order', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <ShoppingCart className="h-6 w-6 text-emerald-400" />
          Book Commercial Order (POS Terminal)
        </h1>
        <p className="text-xs text-slate-400">Select merchant customer, add inventory SKUs, apply discounts, and calculate 7.5% VAT.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase">Purchasing Merchant Outlet</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.address}</option>
              ))}
            </select>

            <div className="relative pt-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog products..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const inCartQty = cart[prod.id] || 0
              return (
                <div key={prod.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between hover:border-slate-700">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono">{prod.sku}</span>
                    <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-2">{prod.name}</h4>
                    <p className="text-xs font-bold text-emerald-400 mt-1">₦{(prod.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    {inCartQty === 0 ? (
                      <button
                        onClick={() => handleUpdateQty(prod.id, 1)}
                        className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs"
                      >
                        + Add to Order
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-slate-950 px-2 py-1 rounded-xl border border-slate-700">
                        <button onClick={() => handleUpdateQty(prod.id, -1)} className="h-6 w-6 rounded bg-slate-800 text-white font-bold">-</button>
                        <span className="font-extrabold text-emerald-400 text-xs">{inCartQty}</span>
                        <button onClick={() => handleUpdateQty(prod.id, 1)} className="h-6 w-6 rounded bg-emerald-600 text-white font-bold">+</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Cart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShoppingCart className="h-4 w-4 text-emerald-400" />
              Order Summary ({cartItems.length})
            </h3>

            <div className="py-3 space-y-2 max-h-56 overflow-y-auto text-xs">
              {cartItems.length === 0 ? (
                <p className="text-center text-slate-500 py-6">Order cart is empty.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center pt-1.5">
                    <div>
                      <p className="font-bold text-white line-clamp-1">{item.name}</p>
                      <span className="text-slate-400 text-[11px]">{item.qty} × ₦{(item.price || 0).toLocaleString()}</span>
                    </div>
                    <span className="font-bold text-emerald-400">₦{item.lineTotal.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="text-white font-semibold">₦{subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Discount (%):</span>
              <select
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="rounded border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs text-white"
              >
                <option value={0}>0%</option>
                <option value={2}>2% VIP</option>
                <option value={5}>5% Distributor</option>
              </select>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>VAT (7.5%):</span>
              <span className="text-white">₦{taxAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span>Total:</span>
              <span className="text-emerald-400">₦{totalAmount.toLocaleString()}</span>
            </div>

            <button
              disabled={submitting || cartItems.length === 0}
              onClick={handlePlaceOrder}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs disabled:opacity-50"
            >
              {submitting ? 'Placing Order...' : 'Submit Commercial Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 7. SALES AGENT: TARGETS & COMMISSION
// ==============================================================================
export function SalesAgentTargetsView() {
  const leaderboard = [
    { rank: 1, name: 'Adebanjo Adeleke', target: 10000000, actual: 8900000, commission: 267000, badge: 'Gold Star' },
    { rank: 2, name: 'Chioma Okonkwo', target: 8000000, actual: 6400000, commission: 192000, badge: 'Silver' },
    { rank: 3, name: 'Emeka Obi', target: 6000000, actual: 4200000, commission: 126000, badge: 'Bronze' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Target className="h-6 w-6 text-purple-400" />
          Sales Targets Leaderboard & Commission Tracker
        </h1>
        <p className="text-xs text-slate-400">Monthly quota attainment, team leaderboard, and 5% commission payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaderboard.map((agent) => {
          const pct = Math.round((agent.actual / agent.target) * 100)
          return (
            <div key={agent.rank} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 font-mono">
                  Rank #{agent.rank}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                  {agent.badge}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{agent.name}</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Revenue:</span>
                  <span className="font-bold text-white">₦{agent.actual.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-400">5% Commission:</span>
                <span className="font-black text-emerald-400">₦{agent.commission.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ==============================================================================
// 8. SALES AGENT: VISITS / GPS CHECK-IN
// ==============================================================================
export function SalesAgentVisitsView() {
  const { showToast } = useApp()
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('30')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchCust = async () => {
      try {
        const res = await apiRequest('/api/sales/customers')
        setCustomers(res?.data || [])
        if (res?.data?.[0]) setSelectedCustomerId(res.data[0].id)
      } catch (e) {}
    }
    fetchCust()
  }, [])

  const handleSubmitVisit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const cust = customers.find((c) => String(c.id) === String(selectedCustomerId))
      await apiRequest('/api/field/visits', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerName: cust?.name || 'Retail Outlet',
          durationMinutes: Number(duration),
          notes,
          orderGenerated: true,
          orderAmount: 250000,
        }),
      })
      showToast('Store visit & GPS check-in logged successfully!')
      setNotes('')
    } catch (err) {
      showToast('Failed to record visit', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Camera className="h-6 w-6 text-emerald-400" />
          Record Commercial Store Visit
        </h1>
        <p className="text-xs text-slate-400">Log customer visit check-in, order discussions, and shelf audits.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <form onSubmit={handleSubmitVisit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Customer / Merchant Outlet</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.address})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Visit Duration (Minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Visit Notes & Feedback</label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record order requirements, stock levels, competitor promos..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs"
          >
            {submitting ? 'Logging Visit...' : 'Log Verified Store Visit'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Fallback exports for backward compatibility
export function SalesAgentInvoicesPaymentsView({ onNavigate }) {
  return <SalesAgentOverviewView onNavigate={onNavigate} />
}
export function SalesAgentCommissionView({ onNavigate }) {
  return <SalesAgentTargetsView onNavigate={onNavigate} />
}
