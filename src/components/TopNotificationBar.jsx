import React, { useState, useEffect } from 'react'
import {
  Bell, MessageSquare, AlertTriangle, CheckCircle2,
  X, ChevronRight, Volume2, VolumeX, ExternalLink,
  Sparkles, RefreshCw, Smartphone
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'

export default function TopNotificationBar({
  onNavigate = () => {},
  onOpenReminderModal = () => {},
  showToast = () => {},
}) {
  const [activeAlert, setActiveAlert] = useState(null)
  const [alertsList, setAlertsList] = useState([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [pushPermission, setPushPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const [dismissedIds, setDismissedIds] = useState(new Set())

  const fetchDueReminders = async () => {
    try {
      const res = await apiRequest('/api/communication/tasks/due-reminders')
      if (res?.data && res.data.length > 0) {
        setAlertsList(res.data)
        const firstUndismissed = res.data.find((item) => !dismissedIds.has(item.task.id))
        if (firstUndismissed) {
          setActiveAlert(firstUndismissed)
        }
      }
    } catch (err) {
      // Quiet fail if offline
    }
  }

  useEffect(() => {
    fetchDueReminders()
    const interval = setInterval(fetchDueReminders, 30000) // check every 30s
    return () => clearInterval(interval)
  }, [dismissedIds])

  const requestBrowserPush = async () => {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in this browser', 'error')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission === 'granted') {
        showToast('Desktop & Mobile Notification Bar alerts enabled!')
        new Notification('🔔 NexFieldForce Task Alert Bar Active', {
          body: 'You will receive desktop and mobile notifications for task reminders and field dispatch.',
          icon: '/favicon.ico',
        })
      } else {
        showToast('Notification permission was not granted', 'error')
      }
    } catch (err) {
      showToast('Could not request notification permission', 'error')
    }
  }

  const handleDismiss = () => {
    if (activeAlert) {
      setDismissedIds((prev) => new Set([...prev, activeAlert.task.id]))
      setActiveAlert(null)
    }
  }

  if (!activeAlert) {
    if (pushPermission === 'default') {
      return (
        <div className="bg-gradient-to-r from-sky-900/90 via-indigo-900/90 to-purple-900/90 border-b border-sky-700/50 px-4 py-2 text-xs text-slate-100 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-sky-400 animate-pulse" />
            <span>
              <strong>Enable Notification Bar Alerts:</strong> Receive live reminders and field assignments directly on your desktop & mobile status bar.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestBrowserPush}
              className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-bold text-[11px] shadow transition-colors"
            >
              Turn On Alerts
            </button>
          </div>
        </div>
      )
    }
    return null
  }

  const { task, urgency, agent, whatsAppUrl } = activeAlert
  const isOverdue = urgency === 'OVERDUE'

  return (
    <div className={`border-b px-4 py-2.5 text-xs text-white flex flex-wrap items-center justify-between gap-3 shadow-xl transition-all duration-300 ${
      isOverdue
        ? 'bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 border-rose-600/60'
        : 'bg-gradient-to-r from-emerald-950 via-teal-900 to-sky-950 border-emerald-600/60'
    }`}>
      {/* Alert Title & Message */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isOverdue ? 'bg-rose-600 animate-bounce' : 'bg-emerald-600 animate-pulse'
        }`}>
          <Bell className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            isOverdue ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
          }`}>
            {isOverdue ? '🚨 OVERDUE TASK' : '📌 DUE TODAY'}
          </span>
          <span className="font-bold text-white truncate max-w-xs sm:max-w-md">
            {task.title}
          </span>
          <span className="text-slate-300 text-[11px]">
            Assigned to: <strong className="text-white">{agent.name}</strong> ({agent.phone || 'No phone'})
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* WhatsApp Deep Link Button */}
        {agent.phone && (
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-colors"
            title="Open WhatsApp Chat with Agent"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">WhatsApp Agent</span>
          </a>
        )}

        {/* Multi-Channel Reminder Modal Trigger */}
        <button
          onClick={() => onOpenReminderModal(task)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] transition-colors"
        >
          <Sparkles className="h-3 w-3 text-amber-300" />
          <span>Multi-Channel Remind</span>
        </button>

        {/* View in Tasks */}
        <button
          onClick={() => onNavigate('tasks')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-[11px] transition-colors"
        >
          <span>View Task</span>
          <ChevronRight className="h-3 w-3" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1 rounded text-slate-300 hover:text-white"
          title={soundEnabled ? 'Mute Alert Sound' : 'Unmute Alert Sound'}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-slate-500" />}
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="p-1 rounded text-slate-300 hover:text-white"
          title="Dismiss Bar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
