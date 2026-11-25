import React, { useState, useEffect } from 'react'
import {
  User, Clock, Calendar, CheckSquare, Target,
  FileText, Plus, Check, ShieldCheck, MapPin,
  CheckCircle2, AlertCircle, MessageSquare, ExternalLink,
  ChevronRight, Sparkles, Send
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp, useAuth } from '../App.jsx'
import TaskReminderModal from './TaskReminderModal.jsx'
import PhotoAttendance from './PhotoAttendance.jsx'

// ==============================================================================
// 1. STAFF: SELF-SERVICE OVERVIEW
// ==============================================================================
export function StaffOverviewView({ onNavigate }) {
  const { user } = useAuth() || {}
  const [announcements, setAnnouncements] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest('/api/communication/announcements')
        setAnnouncements(res?.data || [])
      } catch (e) {}
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">
            Employee Workspace
          </span>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {user?.fullName || 'Team Member'}!
          </h1>
          <p className="text-xs text-slate-400">
            Access your attendance roster, submit leave applications, track assigned tasks, and review performance goals.
          </p>
        </div>

        <button
          onClick={() => onNavigate('attendance')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all"
        >
          <Clock className="h-4 w-4" /> Clock In / Out
        </button>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('attendance')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left hover:border-emerald-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors mb-3">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">My Attendance</h3>
          <p className="text-xs text-slate-400 mt-1">Clock in with GPS geolocation and view timesheets.</p>
        </button>

        <button
          onClick={() => onNavigate('leave')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left hover:border-sky-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-colors mb-3">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Request Leave</h3>
          <p className="text-xs text-slate-400 mt-1">Check remaining allowances and apply for time off.</p>
        </button>

        <button
          onClick={() => onNavigate('tasks')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left hover:border-purple-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors mb-3">
            <CheckSquare className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">My Tasks</h3>
          <p className="text-xs text-slate-400 mt-1">Check off assigned tasks and set WhatsApp reminders.</p>
        </button>

        <button
          onClick={() => onNavigate('goals')}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left hover:border-amber-500/40 hover:bg-slate-900 transition-all group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-3">
            <Target className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-white">My Goals</h3>
          <p className="text-xs text-slate-400 mt-1">Review quarterly KPI goals and performance ratings.</p>
        </button>
      </div>

      {/* Announcements */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
        <h3 className="text-sm font-bold text-white">Company Announcements</h3>
        {announcements.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-1">
            <div className="flex justify-between items-start">
              <h4 className="text-xs font-bold text-white">{a.title}</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                {a.priority || 'General'}
              </span>
            </div>
            <p className="text-xs text-slate-400">{a.message}</p>
            <p className="text-[10px] text-slate-500 pt-1">Posted by {a.author_name || 'HR Admin'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==============================================================================
// 2. STAFF: ATTENDANCE CLOCK IN / OUT
// ==============================================================================
export function StaffAttendanceView() { return <PhotoAttendance /> }

function LegacyStaffAttendanceView() {
  const { showToast } = useApp()
  const [clockedIn, setClockedIn] = useState(true)
  const [coords, setCoords] = useState('6.4544° N, 3.3947° E')
  const [history, setHistory] = useState([
    { date: '2026-08-14', clockIn: '08:15 AM', clockOut: '05:30 PM', status: 'Present', duration: '9h 15m' },
    { date: '2026-08-13', clockIn: '08:20 AM', clockOut: '05:00 PM', status: 'Present', duration: '8h 40m' },
    { date: '2026-08-12', clockIn: '08:10 AM', clockOut: '05:15 PM', status: 'Present', duration: '9h 05m' },
  ])

  const handleToggle = () => {
    if (clockedIn) {
      setClockedIn(false)
      showToast('Shift ended. Clock out recorded.')
    } else {
      setClockedIn(true)
      showToast('GPS Clock-in verified! Shift active.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Clock className="h-6 w-6 text-emerald-400" />
          My Daily Attendance & Geofence Verification
        </h1>
        <p className="text-xs text-slate-400">Record daily shift clock-in with live GPS telemetry.</p>
      </div>

      {/* Clock Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center text-center space-y-4 max-w-lg mx-auto shadow-xl">
        <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${
          clockedIn ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'
        }`}>
          <Clock className="h-8 w-8" />
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase text-slate-400">Shift Status</span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            {clockedIn ? 'CLOCKED IN • ACTIVE SHIFT' : 'CLOCKED OUT'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" /> GPS: {coords}
          </p>
        </div>

        <button
          onClick={handleToggle}
          className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition-all ${
            clockedIn
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
          }`}
        >
          {clockedIn ? 'Clock Out (End Work Day)' : 'Clock In with GPS Geolocation'}
        </button>
      </div>

      {/* Timesheet History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Recent Attendance Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Clock In</th>
                <th className="px-5 py-3">Clock Out</th>
                <th className="px-5 py-3">Total Duration</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map((h, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="px-5 py-3 font-semibold text-white">{h.date}</td>
                  <td className="px-5 py-3 text-slate-300 font-mono">{h.clockIn}</td>
                  <td className="px-5 py-3 text-slate-300 font-mono">{h.clockOut}</td>
                  <td className="px-5 py-3 font-bold text-emerald-400">{h.duration}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">
                      {h.status}
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
// 3. STAFF: LEAVE REQUEST
// ==============================================================================
export function StaffLeaveRequestView() {
  const { showToast } = useApp()
  const [leaveType, setLeaveType] = useState('Annual Leave (Vacation)')
  const [startDate, setStartDate] = useState('2026-09-01')
  const [endDate, setEndDate] = useState('2026-09-05')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await apiRequest('/api/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      })
      showToast('Leave request submitted to HR manager for approval!')
      setReason('')
    } catch (e) {
      showToast('Failed to submit leave request', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <Calendar className="h-6 w-6 text-sky-400" />
          Request Leave & View Balances
        </h1>
        <p className="text-xs text-slate-400">Apply for annual leave, medical leave, or casual time-off.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-sky-400 uppercase">Annual Leave</span>
          <p className="text-lg font-black text-white mt-1">15 Days Left</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-rose-400 uppercase">Sick Leave</span>
          <p className="text-lg font-black text-white mt-1">12 Days Left</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-center">
          <span className="text-[10px] font-bold text-amber-400 uppercase">Casual</span>
          <p className="text-lg font-black text-white mt-1">5 Days Left</p>
        </div>
      </div>

      {/* Request Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            >
              <option>Annual Leave (Vacation)</option>
              <option>Sick Leave (Medical)</option>
              <option>Casual Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Reason for Leave</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for HR approval..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30"
          >
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ==============================================================================
// 4. STAFF: MY TASKS
// ==============================================================================
export function StaffTasksView() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
          <CheckSquare className="h-6 w-6 text-purple-400" />
          My Assigned Work Tasks & Directives
        </h1>
        <p className="text-xs text-slate-400">Manage daily deliverables and trigger WhatsApp or push notification reminders.</p>
      </div>

      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase">
                  {t.priority || 'Normal'}
                </span>
                <span className="text-xs text-slate-400">Due: {t.due_date}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{t.title}</h3>
              {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {t.recipient_phone && (
                <a
                  href={t.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                  title="WhatsApp Reminder"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => setReminderModalTask(t)}
                className="px-3 py-1.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-bold transition-colors"
              >
                Set Reminder
              </button>
            </div>
          </div>
        ))}
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

// ==============================================================================
// 5. STAFF: GOALS & KPI PERFORMANCE
// ==============================================================================
export function StaffGoalsView({ onNavigate }) {
  const { showToast } = useApp()
  const { user } = useAuth() || {}
  const [goals, setGoals] = useState([
    { id: 1, title: 'Achieve 95% Monthly Attendance Compliance', progress: 92, target: 95, unit: '%', weightage: 30, deadline: '2026-09-30', status: 'in_progress', notes: 'Active daily clock-ins' },
    { id: 2, title: 'Complete Q3 Field Compliance Certification', progress: 100, target: 100, unit: '%', weightage: 30, deadline: '2026-09-30', status: 'completed', notes: 'Completed course module' },
    { id: 3, title: 'Onboard 15 New Merchant Accounts', progress: 12, target: 15, unit: 'Outlets', weightage: 40, deadline: '2026-09-30', status: 'in_progress', notes: '12 active merchants' },
  ])
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [editProgress, setEditProgress] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchGoals = async () => {
    try {
      const res = await apiRequest('/api/performance/goals')
      if (Array.isArray(res?.data) && res.data.length > 0) {
        setGoals(res.data)
      }
    } catch (err) {}
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  const handleOpenGoal = (g) => {
    setSelectedGoal(g)
    setEditProgress(g.progress)
    setEditNotes(g.notes || '')
  }

  const handleSaveProgress = async (e) => {
    e.preventDefault()
    if (!selectedGoal) return
    setSaving(true)
    try {
      await apiRequest(`/api/performance/goals/${selectedGoal.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({
          progress: Number(editProgress),
          notes: editNotes,
        }),
      })
      showToast('Goal progress and milestone log saved successfully!', 'success')
      setSelectedGoal(null)
      fetchGoals()
    } catch (err) {
      showToast(err.message || 'Failed to update goal', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {onNavigate && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => onNavigate('overview')} className="text-sky-400 hover:underline font-semibold flex items-center gap-1">
            &larr; Back to Dashboard
          </button>
          <span>/</span>
          <span className="text-white font-bold">My KPI Goals</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Target className="h-6 w-6 text-amber-400" />
            My KPI Goals & Performance Objectives
          </h1>
          <p className="text-xs text-slate-400">Quarterly corporate milestones, deliverables, and performance appraisal metrics. Click any metric to log progress.</p>
        </div>
        <span className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-500/30">
          Q3 2026 Appraisal Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((Number(g.progress) / Number(g.target || 1)) * 100))
          const isDone = Number(g.progress) >= Number(g.target)

          return (
            <div
              key={g.id}
              onClick={() => handleOpenGoal(g)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 hover:border-amber-500/50 hover:bg-slate-900 transition-all shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {isDone ? '✓ Completed' : 'In Progress'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Weight: {g.weightage || 30}%
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {g.title}
                </h3>

                {g.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {g.notes}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-400">Progress:</span>
                  <span className="text-white">
                    {Number(g.progress).toLocaleString()} / {Number(g.target).toLocaleString()} {g.unit} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-sky-400 group-hover:underline flex items-center gap-1 font-semibold pt-1">
                  Click to log milestone progress &rarr;
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Goal Details & Progress Logging Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                  KPI Milestone Breakdown
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedGoal.title}</h3>
                <p className="text-xs text-slate-400">Target Deadline: {selectedGoal.deadline || '2026-09-30'}</p>
              </div>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Target Value:</span>
                  <span className="text-white font-bold">{selectedGoal.target} {selectedGoal.unit}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Weight in Appraisal:</span>
                  <span className="text-amber-400 font-bold">{selectedGoal.weightage || 30}%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Current Progress Achieved ({selectedGoal.unit})
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    required
                    value={editProgress}
                    onChange={(e) => setEditProgress(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white font-bold text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setEditProgress((prev) => Number(prev || 0) + 1)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold whitespace-nowrap"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProgress((prev) => Number(prev || 0) + 5)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold whitespace-nowrap"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Milestone Update / Self-Assessment Remarks
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Describe your progress and deliverables achieved..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Milestone Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
