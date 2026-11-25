import { memoryStore } from '../config/db.js'
import { sendTaskReminderEmail } from './email.service.js'

/**
 * Normalizes phone numbers to standard WhatsApp format (e.g. 2348012345678)
 */
export const normalizePhoneForWhatsApp = (rawPhone = '') => {
  let cleaned = String(rawPhone).replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1)
  if (cleaned.startsWith('0')) {
    // Default prefix for Nigeria (234) if starts with 0
    cleaned = '234' + cleaned.slice(1)
  }
  return cleaned
}

/**
 * Formats a clean, professional WhatsApp task reminder message
 */
export const formatWhatsAppTaskMessage = ({
  name = 'Team Member',
  taskTitle,
  taskDescription = '',
  priority = 'Normal',
  dueDate = 'Today',
  assignedBy = 'Supervisor',
  taskUrl = 'http://localhost:3000',
  customMessage = '',
}) => {
  const priorityIcon = priority === 'Urgent' ? '🚨' : priority === 'High' ? '⚡' : '📌'
  let msg = `🔔 *NexFieldForce Task Reminder*\n\n`
  msg += `Hello *${name}*,\n`
  msg += `You have an assigned operational task:\n\n`
  msg += `📋 *Task:* ${taskTitle}\n`
  msg += `${priorityIcon} *Priority:* ${priority}\n`
  msg += `📅 *Due Date:* ${dueDate}\n`
  msg += `👤 *Assigned By:* ${assignedBy}\n`
  if (taskDescription) {
    msg += `📝 *Details:* ${taskDescription}\n`
  }
  if (customMessage) {
    msg += `\n💬 *Supervisor Note:* "${customMessage}"\n`
  }
  msg += `\n🔗 *Open Task:* ${taskUrl}\n`
  msg += `\n_NexFieldForce Unified Workforce Platform_`
  return msg
}

/**
 * Generates an instant WhatsApp click-to-chat / deep-link URL
 */
export const generateWhatsAppUrl = ({ phone, message }) => {
  const normalizedPhone = normalizePhoneForWhatsApp(phone)
  const encodedText = encodeURIComponent(message)
  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`
}

/**
 * Dispatch multi-channel task reminder across WhatsApp, Email, In-App Notification Bar, and Push
 */
export const dispatchMultiChannelReminder = async ({
  taskId,
  taskTitle,
  taskDescription = '',
  priority = 'Normal',
  dueDate = 'Today',
  assignedBy = 'Operations Lead',
  recipientName = 'Team Member',
  recipientEmail = '',
  recipientPhone = '',
  customMessage = '',
  channels = ['whatsapp', 'email', 'push', 'in_app'],
  taskUrl = 'http://localhost:3000',
}) => {
  const results = {
    taskId,
    channelsRequested: channels,
    whatsapp: { sent: false, url: null, message: null },
    email: { sent: false, error: null },
    inApp: { sent: false, notificationId: null },
    push: { sent: false, payload: null },
    timestamp: new Date().toISOString(),
  }

  // 1. Format WhatsApp Content & Deep Link
  const whatsAppMsg = formatWhatsAppTaskMessage({
    name: recipientName,
    taskTitle,
    taskDescription,
    priority,
    dueDate,
    assignedBy,
    taskUrl,
    customMessage,
  })
  const whatsAppUrl = generateWhatsAppUrl({ phone: recipientPhone, message: whatsAppMsg })
  results.whatsapp = {
    sent: true,
    url: whatsAppUrl,
    phone: recipientPhone,
    message: whatsAppMsg,
    note: 'WhatsApp deep-link generated for 1-click or API webhook dispatch.',
  }

  // 2. Email Channel Dispatch
  if (channels.includes('email') && recipientEmail) {
    try {
      const emailRes = await sendTaskReminderEmail({
        email: recipientEmail,
        name: recipientName,
        taskTitle,
        taskDescription,
        priority,
        dueDate,
        assignedBy,
        taskUrl,
        customMessage,
      })
      results.email = emailRes
    } catch (err) {
      results.email = { success: false, error: err.message }
    }
  }

  // 3. In-App Notification Bar & Feed Storage
  if (channels.includes('in_app') || channels.includes('push')) {
    const notification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      company_id: 1,
      title: `🔔 Task Reminder: ${taskTitle}`,
      message: `${priority} Priority • Due ${dueDate} • Assigned by ${assignedBy}. ${customMessage ? `Note: "${customMessage}"` : ''}`,
      type: 'task_reminder',
      priority: priority.toLowerCase(),
      taskId,
      read: false,
      created_at: new Date().toISOString(),
    }
    if (!memoryStore.notifications) memoryStore.notifications = []
    memoryStore.notifications.unshift(notification)
    results.inApp = { sent: true, notificationId: notification.id }
  }

  // 4. Native Browser Push Payload
  if (channels.includes('push')) {
    results.push = {
      sent: true,
      payload: {
        title: `🔔 Task Reminder: ${taskTitle}`,
        body: `${priority} Priority | Due: ${dueDate}\n${customMessage || taskDescription || 'Please check your NexFieldForce tasks.'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `task-${taskId}`,
        data: { taskId, url: taskUrl },
      },
    }
  }

  return results
}

/**
 * Checks all pending and overdue tasks and generates automatic reminder payloads
 */
export const checkDueTasksAndGenerateReminders = () => {
  const todayStr = new Date().toISOString().slice(0, 10)
  const activeTasks = (memoryStore.tasks || []).filter((t) => t.status !== 'Completed' && t.status !== 'completed')

  const reminders = activeTasks.map((task) => {
    const isOverdue = task.due_date && task.due_date < todayStr
    const isDueToday = task.due_date === todayStr
    const emp = memoryStore.employees.find((e) => e.id === task.assigned_to_id || e.user_id === task.assigned_to_id)
    const user = memoryStore.users.find((u) => u.id === task.assigned_to_id || (emp && u.id === emp.user_id))

    return {
      task,
      urgency: isOverdue ? 'OVERDUE' : isDueToday ? 'DUE_TODAY' : 'UPCOMING',
      agent: {
        id: task.assigned_to_id,
        name: task.assigned_to_name || (emp ? `${emp.first_name} ${emp.last_name}` : 'Team Member'),
        phone: emp?.phone || user?.phone || '',
        email: user?.email || '',
      },
      whatsAppUrl: generateWhatsAppUrl({
        phone: emp?.phone || user?.phone || '',
        message: formatWhatsAppTaskMessage({
          name: task.assigned_to_name || emp?.first_name || 'Team Member',
          taskTitle: task.title,
          taskDescription: task.description,
          priority: isOverdue ? 'Urgent' : task.priority || 'Normal',
          dueDate: task.due_date,
          assignedBy: task.assigned_by_name || 'Supervisor',
        }),
      }),
    }
  })

  return reminders
}
