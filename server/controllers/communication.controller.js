import { memoryStore } from '../config/db.js'
import {
  dispatchMultiChannelReminder,
  checkDueTasksAndGenerateReminders,
  formatWhatsAppTaskMessage,
  generateWhatsAppUrl,
} from '../services/notification.service.js'

export const listAnnouncements = async (req, res) => {
  return res.json({ success: true, data: memoryStore.announcements })
}

export const createAnnouncement = async (req, res) => {
  const { title, message, priority = 'info' } = req.body || {}
  const a = {
    id: memoryStore.announcements.length + 1,
    title: title.trim(),
    message: message.trim(),
    priority,
    author_name: req.authUser?.fullName || 'HR Admin',
    starts_at: new Date().toISOString(),
  }
  memoryStore.announcements.unshift(a)
  return res.status(201).json({ success: true, message: 'Announcement posted', id: a.id })
}

export const listNotifications = async (req, res) => {
  return res.json({ success: true, data: memoryStore.notifications || [] })
}

export const markNotificationRead = async (req, res) => {
  const { id } = req.params
  const notif = (memoryStore.notifications || []).find((n) => String(n.id) === String(id))
  if (notif) notif.read = true
  return res.json({ success: true, message: 'Marked read' })
}

// ==========================================
// MULTI-CHANNEL TASK & REMINDER ENGINE
// ==========================================

export const listTasks = async (req, res) => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const tasks = (memoryStore.tasks || []).map((t) => {
    const emp = memoryStore.employees.find((e) => e.id === t.assigned_to_id || e.user_id === t.assigned_to_id)
    const user = memoryStore.users.find((u) => u.id === t.assigned_to_id || (emp && u.id === emp.user_id))
    const isOverdue = t.due_date && t.due_date < todayStr && t.status !== 'Completed' && t.status !== 'completed'

    const phone = emp?.phone || user?.phone || ''
    const email = user?.email || ''
    const whatsAppMessage = formatWhatsAppTaskMessage({
      name: t.assigned_to_name || emp?.first_name || 'Team Member',
      taskTitle: t.title,
      taskDescription: t.description,
      priority: t.priority,
      dueDate: t.due_date,
      assignedBy: t.assigned_by_name || 'Supervisor',
    })

    return {
      ...t,
      is_overdue: Boolean(isOverdue),
      recipient_phone: phone,
      recipient_email: email,
      whatsapp_url: generateWhatsAppUrl({ phone, message: whatsAppMessage }),
    }
  })

  return res.json({ success: true, data: tasks })
}

export const createTask = async (req, res) => {
  const {
    title,
    description = '',
    assigned_to_id,
    priority = 'Normal',
    due_date,
    send_instant_reminder = true,
    channels = ['whatsapp', 'email', 'push', 'in_app'],
    custom_message = '',
  } = req.body || {}

  if (!title) return res.status(400).json({ success: false, message: 'Task title is required' })

  const emp = memoryStore.employees.find((e) => String(e.id) === String(assigned_to_id) || String(e.user_id) === String(assigned_to_id))
  const user = memoryStore.users.find((u) => String(u.id) === String(assigned_to_id) || (emp && u.id === emp.user_id))
  const assignedToName = emp ? `${emp.first_name} ${emp.last_name}` : (user?.full_name || 'Team Member')

  const newTask = {
    id: `tsk-${Date.now().toString().slice(-4)}`,
    title: title.trim(),
    description: description.trim(),
    assigned_to_id: Number(assigned_to_id || emp?.id || 1),
    assigned_to_name: assignedToName,
    assigned_by_name: req.authUser?.fullName || 'Supervisor',
    priority,
    due_date: due_date || new Date().toISOString().slice(0, 10),
    status: 'Pending',
    created_at: new Date().toISOString(),
  }

  if (!memoryStore.tasks) memoryStore.tasks = []
  memoryStore.tasks.unshift(newTask)

  let reminderResult = null
  if (send_instant_reminder) {
    reminderResult = await dispatchMultiChannelReminder({
      taskId: newTask.id,
      taskTitle: newTask.title,
      taskDescription: newTask.description,
      priority: newTask.priority,
      dueDate: newTask.due_date,
      assignedBy: newTask.assigned_by_name,
      recipientName: assignedToName,
      recipientEmail: user?.email || '',
      recipientPhone: emp?.phone || user?.phone || '',
      customMessage: custom_message,
      channels,
    })
  }

  return res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: newTask,
    reminder: reminderResult,
  })
}

export const updateTaskStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const task = (memoryStore.tasks || []).find((t) => String(t.id) === String(id))
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' })

  task.status = status
  if (status === 'Completed' || status === 'completed') {
    task.completed_at = new Date().toISOString()
  }

  return res.json({ success: true, message: 'Task status updated', data: task })
}

export const sendTaskReminder = async (req, res) => {
  const {
    taskId,
    taskTitle,
    taskDescription,
    priority,
    dueDate,
    assignedBy,
    recipientName,
    recipientEmail,
    recipientPhone,
    customMessage,
    channels = ['whatsapp', 'email', 'push', 'in_app'],
  } = req.body || {}

  let targetTask = null
  if (taskId) {
    targetTask = (memoryStore.tasks || []).find((t) => String(t.id) === String(taskId))
  }

  const emp = targetTask
    ? memoryStore.employees.find((e) => e.id === targetTask.assigned_to_id || e.user_id === targetTask.assigned_to_id)
    : null
  const user = targetTask
    ? memoryStore.users.find((u) => u.id === targetTask.assigned_to_id || (emp && u.id === emp.user_id))
    : null

  const resolvedName = recipientName || targetTask?.assigned_to_name || (emp ? `${emp.first_name} ${emp.last_name}` : 'Team Member')
  const resolvedEmail = recipientEmail || user?.email || ''
  const resolvedPhone = recipientPhone || emp?.phone || user?.phone || ''
  const resolvedTitle = taskTitle || targetTask?.title || 'Operational Assignment'
  const resolvedDesc = taskDescription || targetTask?.description || ''
  const resolvedPriority = priority || targetTask?.priority || 'Normal'
  const resolvedDueDate = dueDate || targetTask?.due_date || 'Today'
  const resolvedAssignedBy = assignedBy || targetTask?.assigned_by_name || req.authUser?.fullName || 'Supervisor'

  const dispatchRes = await dispatchMultiChannelReminder({
    taskId: taskId || targetTask?.id || 'manual-remind',
    taskTitle: resolvedTitle,
    taskDescription: resolvedDesc,
    priority: resolvedPriority,
    dueDate: resolvedDueDate,
    assignedBy: resolvedAssignedBy,
    recipientName: resolvedName,
    recipientEmail: resolvedEmail,
    recipientPhone: resolvedPhone,
    customMessage: customMessage || '',
    channels,
  })

  return res.json({
    success: true,
    message: `Reminder dispatched across channels: ${channels.join(', ')}`,
    data: dispatchRes,
  })
}

export const getDueReminders = async (req, res) => {
  const dueList = checkDueTasksAndGenerateReminders()
  return res.json({ success: true, data: dueList, count: dueList.length })
}
