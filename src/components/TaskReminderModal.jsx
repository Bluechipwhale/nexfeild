import React, { useState, useEffect } from 'react'
import {
  Bell, MessageSquare, Mail, Smartphone, Send, X,
  CheckCircle2, AlertCircle, Sparkles, ExternalLink,
  Clock, Calendar, User, Phone, CheckSquare, Shield,
  Volume2, Share2, Copy, Check
} from 'lucide-react'
import { apiRequest } from '../lib/api.js'

export default function TaskReminderModal({
  isOpen,
  onClose,
  task = {},
  onReminderSent,
  showToast = () => {},
}) {
  const [channels, setChannels] = useState({
    whatsapp: true,
    email: true,
    push: true,
    in_app: true,
  })
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [previewTab, setPreviewTab] = useState('whatsapp') // 'whatsapp' | 'email' | 'push'

  const recipientName = task.assigned_to_name || task.agent_name || 'Team Member'
  const recipientPhone = task.recipient_phone || task.phone || '+2348023456789'
  const recipientEmail = task.recipient_email || task.email || 'agent@nexfieldforce.com'
  const taskTitle = task.title || 'Assigned Operational Task'
  const taskDesc = task.description || 'Complete the scheduled field activity and report findings.'
  const priority = task.priority || 'Normal'
  const dueDate = task.due_date || new Date().toISOString().slice(0, 10)
  const assignedBy = task.assigned_by_name || 'Operations Lead'

  // Generate WhatsApp Message text for live preview
  const generateWhatsAppText = () => {
    const priorityIcon = priority === 'Urgent' ? '🚨' : priority === 'High' ? '⚡' : '📌'
    let msg = `🔔 *NexFieldForce Task Reminder*\n\n`
    msg += `Hello *${recipientName}*,\n`
    msg += `You have an assigned operational task in your workspace:\n\n`
    msg += `📋 *Task:* ${taskTitle}\n`
    msg += `${priorityIcon} *Priority:* ${priority}\n`
    msg += `📅 *Due Date:* ${dueDate}\n`
    msg += `👤 *Assigned By:* ${assignedBy}\n`
    if (taskDesc) msg += `📝 *Details:* ${taskDesc}\n`
    if (customMessage) msg += `\n💬 *Supervisor Note:* "${customMessage}"\n`
    msg += `\n🔗 *Open Portal:* ${window.location.origin || 'http://localhost:3000'}\n`
    msg += `\n_NexFieldForce Unified Workforce Platform_`
    return msg
  }

  const rawWhatsAppText = generateWhatsAppText()
  const cleanPhone = String(recipientPhone).replace(/[^\d+]/g, '').replace(/^0/, '234').replace(/^\+/, '')
  const whatsAppDirectUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawWhatsAppText)}`

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawWhatsAppText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    showToast('WhatsApp reminder copied to clipboard!')
  }

  const handleSendReminder = async () => {
    const selectedChannels = Object.keys(channels).filter((k) => channels[k])
    if (selectedChannels.length === 0) {
      showToast('Please select at least one notification channel', 'error')
      return
    }

    setSending(true)
    try {
      // 1. Dispatch through Backend Multi-Channel API
      const res = await apiRequest('/api/communication/tasks/remind', {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.id,
          taskTitle,
          taskDescription: taskDesc,
          priority,
          dueDate,
          assignedBy,
          recipientName,
          recipientEmail,
          recipientPhone,
          customMessage,
          channels: selectedChannels,
        }),
      })

      // 2. If Push Channel selected, trigger local browser native notification as well
      if (channels.push && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`🔔 Task Reminder: ${taskTitle}`, {
            body: `${priority} Priority | Due: ${dueDate}\n${customMessage || taskDesc}`,
            icon: '/favicon.ico',
          })
        } catch (e) {}
      }

      showToast(`Reminder successfully sent via ${selectedChannels.join(', ')}!`)

      // 3. If WhatsApp is selected, offer immediate 1-click browser redirect to WhatsApp Web / App
      if (channels.whatsapp) {
        window.open(whatsAppDirectUrl, '_blank', 'noopener,noreferrer')
      }

      if (onReminderSent) onReminderSent(res?.data)
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to dispatch reminder', 'error')
    } finally {
      setSending(false)
    }
  }

  const quickPrompts = [
    { label: '🚨 Urgent Follow-up', text: 'Kindly prioritize this urgent task immediately and confirm once completed.' },
    { label: '⏰ Due Today Check', text: 'Friendly reminder that this task is scheduled for completion today.' },
    { label: '📊 Status Update', text: 'Please log your current progress notes in the field force portal.' },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Multi-Channel Task Reminder
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wide">
                  Live Dispatch
                </span>
              </h2>
              <p className="text-xs text-slate-400">Remember agent via WhatsApp, Email, & Browser Notification Bar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Target Task Summary Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    {priority} Priority
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> Due: <strong className="text-slate-200">{dueDate}</strong>
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{taskTitle}</h3>
                {taskDesc && <p className="text-xs text-slate-400 leading-relaxed">{taskDesc}</p>}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <User className="h-3.5 w-3.5 text-sky-400" />
                <span>Agent: <strong className="text-white">{recipientName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Phone className="h-3.5 w-3.5 text-emerald-400" />
                <span>Phone: <strong className="text-white">{recipientPhone}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="h-3.5 w-3.5 text-indigo-400" />
                <span>Email: <strong className="text-white">{recipientEmail}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Shield className="h-3.5 w-3.5 text-amber-400" />
                <span>Assigned By: <strong className="text-white">{assignedBy}</strong></span>
              </div>
            </div>
          </div>

          {/* Channel Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              1. Select Dispatch Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={() => setChannels({ ...channels, whatsapp: !channels.whatsapp })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  channels.whatsapp
                    ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300 shadow-md shadow-emerald-900/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  channels.whatsapp ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">WhatsApp</span>
                  <span className="text-[10px] opacity-75">Direct Deep-Link</span>
                </div>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => setChannels({ ...channels, email: !channels.email })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  channels.email
                    ? 'border-sky-500/50 bg-sky-950/30 text-sky-300 shadow-md shadow-sky-900/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  channels.email ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">HTML Email</span>
                  <span className="text-[10px] opacity-75">Resend / SMTP</span>
                </div>
              </button>

              {/* Browser Push */}
              <button
                type="button"
                onClick={() => setChannels({ ...channels, push: !channels.push })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  channels.push
                    ? 'border-indigo-500/50 bg-indigo-950/30 text-indigo-300 shadow-md shadow-indigo-900/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  channels.push ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Push Bar</span>
                  <span className="text-[10px] opacity-75">OS Notification</span>
                </div>
              </button>

              {/* In-App Feed */}
              <button
                type="button"
                onClick={() => setChannels({ ...channels, in_app: !channels.in_app })}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all ${
                  channels.in_app
                    ? 'border-purple-500/50 bg-purple-950/30 text-purple-300 shadow-md shadow-purple-900/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-slate-700'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  channels.in_app ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">In-App Feed</span>
                  <span className="text-[10px] opacity-75">Top Banner Bar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Note & AI Quick Prompts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Custom Note / Directive (Optional)
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> AI Suggestions
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCustomMessage(qp.text)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Please confirm restock numbers before leaving the site..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Live Preview Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTab('whatsapp')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    previewTab === 'whatsapp' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WhatsApp Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('email')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    previewTab === 'email' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Email Preview
                </button>
              </div>

              {previewTab === 'whatsapp' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-[11px] flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={whatsAppDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-1 text-emerald-400 hover:text-emerald-300 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/50"
                  >
                    <ExternalLink className="h-3 w-3" /> Test Web Chat
                  </a>
                </div>
              )}
            </div>

            {/* Preview Box */}
            {previewTab === 'whatsapp' ? (
              <div className="rounded-xl border border-emerald-900/40 bg-[#0b141a] p-4 text-xs font-mono text-emerald-100 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed shadow-inner">
                {rawWhatsAppText}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-700 bg-white p-4 text-slate-800 text-xs max-h-44 overflow-y-auto shadow-inner space-y-2">
                <div className="border-b pb-2 flex justify-between items-center">
                  <span className="font-bold text-sky-700">NexFieldForce Task Reminder</span>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">{priority}</span>
                </div>
                <p>Hello <strong>{recipientName}</strong>,</p>
                <p>You have an assigned task: <strong>{taskTitle}</strong> (Due: {dueDate})</p>
                {customMessage && <p className="bg-amber-50 p-2 rounded text-amber-900 text-[11px]">Note: "{customMessage}"</p>}
                <div className="pt-2 text-center">
                  <span className="inline-block bg-sky-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">
                    Open Task in Workspace
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Direct WhatsApp deep-link + Multi-channel delivery</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSendReminder}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Multi-Channel Reminder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
