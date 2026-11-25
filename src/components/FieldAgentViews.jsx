import React, { useState, useEffect } from 'react'
import {
  Compass, MapPin, Camera, CheckSquare, Clock,
  Calendar, CheckCircle2, AlertCircle, Plus, Send,
  MessageSquare, User, Navigation, ArrowRight, ShieldCheck
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp } from '../App.jsx'
import TaskReminderModal from './TaskReminderModal.jsx'

// ==============================================================================
// 1. FIELD AGENT: COCKPIT OVERVIEW
// ==============================================================================
export function FieldAgentCockpitView({ onNavigate }) {
  const { showToast } = useApp()
  const [clockedIn, setClockedIn] = useState(true)
  const [clockInTime, setClockInTime] = useState('08:15 AM')
  const [todayVisits, setTodayVisits] = useState([
    { id: 1, name: 'Ebeano Warehouse Lekki', address: 'Plot 14 Admiralty Way', status: 'completed', time: '08:45 AM' },
    { id: 2, name: 'Gold Line Retail Mart', address: '42 Broad Street', status: 'completed', time: '10:15 AM' },
    { id: 3, name: 'MegaMart Lekki Express', address: 'Block 8 Lekki Expressway', status: 'pending', time: '02:00 PM' },
  ])

  const handleToggleClock = () => {
    if (clockedIn) {
      setClockedIn(false)
      showToast('Clocked out successfully. Work shift logged.')
    } else {
      setClockedIn(true)
      setClockInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      showToast('GPS Verified Clock-In recorded! Shift active.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-sky-400" />
            Field Operations Cockpit
          </h1>
          <p className="text-xs text-slate-400">
            Real-time GPS shift telemetry, verified merchant visits, waypoint routes, and operational work orders.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleClock}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${
              clockedIn
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{clockedIn ? 'Clock Out (End Shift)' : 'Clock In (GPS Tagged)'}</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-sky-400 uppercase">Current Shift Status</span>
            <p className="text-sm font-bold text-white">
              {clockedIn ? `Active On-Duty • Clocked In at ${clockInTime}` : 'Off-Duty'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <MapPin className="h-4 w-4 text-emerald-400" />
          <span>GPS Geofence: <strong className="text-white">Lagos Island - Broad St Hub</strong></span>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('visits')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-sky-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Camera className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Record Verified Visit</h3>
          <p className="text-xs text-slate-400 mt-1">Log GPS proof of store check-in, shelf photos, and audit notes.</p>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-emerald-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CheckSquare className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Assigned Field Tasks</h3>
          <p className="text-xs text-slate-400 mt-1">View directives, debt collection orders, and restock audits.</p>
        </button>

        <button
          onClick={() => onNavigate('map')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-left hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Navigation className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white" />
          </div>
          <h3 className="text-sm font-bold text-white">Open Live Route Map</h3>
          <p className="text-xs text-slate-400 mt-1">Leaflet OpenStreetMap waypoint navigation and client pins.</p>
        </button>
      </div>

      {/* Today's Route Schedule */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Today's Assigned Route Schedule</h3>
          <span className="text-xs text-sky-400 font-semibold">Broad Street Route (85% Done)</span>
        </div>
        <div className="p-4 space-y-3">
          {todayVisits.map((v) => (
            <div key={v.id} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  v.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {v.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{v.name}</h4>
                  <p className="text-[11px] text-slate-400">{v.address} • {v.time}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                v.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {v.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==============================================================================
// 2. FIELD AGENT: RECORD VERIFIED VISIT
// ==============================================================================
export function FieldAgentVisitsView({ onNavigate }) {
  const { showToast } = useApp()
  const [customers, setCustomers] = useState([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('35')
  const [orderBooked, setOrderBooked] = useState(false)
  const [orderAmount, setOrderAmount] = useState('250000')
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
          orderGenerated: orderBooked,
          orderAmount: orderBooked ? Number(orderAmount) : 0,
        }),
      })
      showToast('Verified GPS Visit logged & synced to supervisor!')
      setNotes('')
      if (onNavigate) onNavigate('overview')
    } catch (err) {
      showToast('Failed to log visit', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Camera className="h-6 w-6 text-sky-400" />
          Record Verified Store Visit
        </h1>
        <p className="text-xs text-slate-400">
          Geofenced location check-in, shelf merchandise audit, photo tag, and feedback logging.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <form onSubmit={handleSubmitVisit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Select Outlet / Merchant</label>
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

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-slate-300 font-bold mb-1">GPS Verification</label>
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-emerald-300 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Geofence 100% Match</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Visit Notes & Shelf Feedback</label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record stock levels, merchandising audit, competitor promos..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
              <input
                type="checkbox"
                checked={orderBooked}
                onChange={(e) => setOrderBooked(e.target.checked)}
                className="rounded border-slate-700 text-sky-500"
              />
              <span>Sales Order Booked During Visit?</span>
            </label>
            {orderBooked && (
              <div>
                <label className="block text-slate-400 mb-1">Order Amount (₦)</label>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-white font-mono"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30"
          >
            {submitting ? 'Submitting Visit...' : 'Submit Verified Visit Proof'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==============================================================================
// 3. FIELD AGENT: MY TASKS & WORK ORDERS
// ==============================================================================
export function FieldAgentTasksView() {
  const { showToast } = useApp()
  const [tasks, setTasks] = useState([])
  const [reminderModalTask, setReminderModalTask] = useState(null)

  const fetchTasks = async () => {
    try {
      const res = await apiRequest('/api/communication/tasks')
      setTasks(res?.data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleToggleComplete = async (task) => {
    const next = task.status === 'Completed' ? 'In Progress' : 'Completed'
    try {
      await apiRequest(`/api/communication/tasks/${task.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      })
      showToast(`Task marked as ${next}`)
      fetchTasks()
    } catch (e) {
      showToast('Failed to update task status', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <CheckSquare className="h-6 w-6 text-sky-400" />
          My Assigned Field Directives & Work Orders
        </h1>
        <p className="text-xs text-slate-400">
          Check off completed field work orders and self-remind via WhatsApp or Browser Notification Bar.
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => {
          const isDone = t.status === 'Completed' || t.status === 'completed'
          return (
            <div
              key={t.id}
              className={`rounded-2xl border p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                isDone ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75' : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleComplete(t)}
                  className={`mt-0.5 h-6 w-6 rounded-lg flex items-center justify-center border transition-colors ${
                    isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-sky-500 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      t.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-sky-500/20 text-sky-400'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-xs text-slate-400">Due: {t.due_date}</span>
                  </div>
                  <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                    {t.title}
                  </h3>
                  {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {t.recipient_phone && (
                  <a
                    href={t.whatsapp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                    title="Self-Remind on WhatsApp"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => setReminderModalTask(t)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-bold transition-colors"
                >
                  Remind Channel
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {reminderModalTask && (
        <TaskReminderModal
          isOpen={Boolean(reminderModalTask)}
          task={reminderModalTask}
          onClose={() => setReminderModalTask(null)}
          onReminderSent={() => fetchTasks()}
          showToast={showToast}
        />
      )}
    </div>
  )
}
