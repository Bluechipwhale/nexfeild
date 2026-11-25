import React, { useState, useEffect } from 'react'
import {
  CheckSquare, Plus, Search, Filter, Bell, MessageSquare,
  Mail, Calendar, Clock, User, AlertCircle, CheckCircle2,
  ExternalLink, Sparkles, Send, Shield, RefreshCw
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'
import { useApp } from '../App.jsx'
import TaskReminderModal from './TaskReminderModal.jsx'

export function SupervisorTeamDispatchView({ onNavigate }) {
  const { showToast } = useApp()
  const [tasks, setTasks] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [reminderModalTask, setReminderModalTask] = useState(null)

  // New Task Form State
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [taskPriority, setTaskPriority] = useState('High')
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [sendInstantReminder, setSendInstantReminder] = useState(true)
  const [customSupervisorNote, setCustomSupervisorNote] = useState('')

  const fetchTasksAndAgents = async () => {
    try {
      const [tRes, empRes] = await Promise.all([
        apiRequest('/api/communication/tasks'),
        apiRequest('/api/employees'),
      ])
      setTasks(tRes?.data || [])
      setEmployees(empRes?.data || [])
      if (empRes?.data?.[0]) setAssignedToId(empRes.data[0].id)
    } catch (err) {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasksAndAgents()
  }, [])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskTitle.trim()) {
      showToast('Task title is required', 'error')
      return
    }
    try {
      const res = await apiRequest('/api/communication/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          assigned_to_id: assignedToId,
          priority: taskPriority,
          due_date: taskDueDate,
          send_instant_reminder: sendInstantReminder,
          custom_message: customSupervisorNote,
        }),
      })

      showToast('Task dispatched successfully!')
      if (sendInstantReminder && res?.reminder?.whatsapp?.url) {
        // Open WhatsApp web if requested
        window.open(res.reminder.whatsapp.url, '_blank', 'noopener,noreferrer')
      }

      setCreateModalOpen(false)
      setTaskTitle('')
      setTaskDesc('')
      setCustomSupervisorNote('')
      fetchTasksAndAgents()
    } catch (err) {
      showToast(err.message || 'Failed to dispatch task', 'error')
    }
  }

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await apiRequest(`/api/communication/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      showToast(`Task status updated to ${newStatus}`)
      fetchTasksAndAgents()
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.assigned_to_name || '').toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || (t.priority || '').toLowerCase() === priorityFilter.toLowerCase()
    const matchesStatus = statusFilter === 'all' || (t.status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-sky-400" />
            Field & Sales Operations Task Dispatch
          </h1>
          <p className="text-xs text-slate-400">
            Create work orders, assign field directives, and dispatch multi-channel reminders via WhatsApp, Email, & Browser Notification Bar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
          >
            <Plus className="h-4 w-4" /> Dispatch New Task
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Tasks</span>
          <p className="text-2xl font-extrabold text-white mt-1">{tasks.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
          <span className="text-[11px] font-bold text-amber-400 uppercase">Pending / In Progress</span>
          <p className="text-2xl font-extrabold text-amber-300 mt-1">
            {tasks.filter((t) => t.status !== 'Completed' && t.status !== 'completed').length}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-4">
          <span className="text-[11px] font-bold text-rose-400 uppercase">Overdue Tasks</span>
          <p className="text-2xl font-extrabold text-rose-300 mt-1">
            {tasks.filter((t) => t.is_overdue).length}
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <span className="text-[11px] font-bold text-emerald-400 uppercase">Completed Tasks</span>
          <p className="text-2xl font-extrabold text-emerald-300 mt-1">
            {tasks.filter((t) => t.status === 'Completed' || t.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, agents..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Priority / Task</th>
                <th className="px-5 py-3.5">Assigned Agent</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Multi-Channel Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.map((t) => {
                const isUrgent = t.priority === 'Urgent' || t.priority === 'High'
                const isOverdue = t.is_overdue

                return (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="px-5 py-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          t.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          t.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        }`}>
                          {t.priority || 'Normal'}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white uppercase animate-pulse">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm">{t.title}</p>
                      {t.description && <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-1">{t.description}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{t.assigned_to_name || 'Agent'}</p>
                      <p className="text-[11px] text-slate-500">{t.recipient_phone || '+234...'}</p>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      {t.due_date || 'Today'}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={t.status || 'Pending'}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border bg-slate-900 ${
                          t.status === 'Completed' ? 'border-emerald-500/40 text-emerald-300' :
                          t.status === 'In Progress' ? 'border-amber-500/40 text-amber-300' :
                          'border-slate-700 text-slate-300'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Direct WhatsApp Quick Button */}
                        {t.recipient_phone && (
                          <a
                            href={t.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 transition-all"
                            title="Open WhatsApp Web Chat with Agent"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </a>
                        )}

                        {/* Full Multi-Channel Reminder Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setReminderModalTask(t)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all"
                        >
                          <Bell className="h-3.5 w-3.5" />
                          <span>Remind Agent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Task */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-sky-400" />
              Dispatch Operational Work Order
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Task Title / Directive</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Audit shelf placement & restock inventory at Lekki Hub"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description & Field Instructions</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Provide precise location, items to inspect, or customer requirements..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assign To Agent</label>
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.phone || 'No phone'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  >
                    <option value="Urgent">🚨 Urgent</option>
                    <option value="High">⚡ High</option>
                    <option value="Normal">📌 Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              {/* Instant Multi-Channel Reminder Option */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendInstantReminder}
                    onChange={(e) => setSendInstantReminder(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="font-bold text-emerald-300 text-xs">
                    Send Instant WhatsApp & Email Reminder upon Dispatch
                  </span>
                </label>
                {sendInstantReminder && (
                  <input
                    type="text"
                    value={customSupervisorNote}
                    onChange={(e) => setCustomSupervisorNote(e.target.value)}
                    placeholder="Add optional supervisor note (e.g. Call client 15m prior)..."
                    className="w-full rounded-lg border border-emerald-800/60 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30"
                >
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Channel Task Reminder Modal */}
      {reminderModalTask && (
        <TaskReminderModal
          isOpen={Boolean(reminderModalTask)}
          task={reminderModalTask}
          onClose={() => setReminderModalTask(null)}
          onReminderSent={() => fetchTasksAndAgents()}
          showToast={showToast}
        />
      )}
    </div>
  )
}
