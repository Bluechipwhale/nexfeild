import dotenv from 'dotenv'

dotenv.config()

// Provider credentials belong only in the deployment environment, never in source.
const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'NexFieldForce <onboarding@resend.dev>'

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!RESEND_API_KEY) {
    console.warn('[Email Service]: RESEND_API_KEY is not configured. Email skipped.')
    return { success: false, message: 'Email not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || '',
      }),
    })

    if (!response.ok) {
      console.error('[Resend Error]: provider rejected the request', response.status)
      return { success: false, error: 'Email provider rejected the request' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('[Email Dispatch Error]:', error.message)
    return { success: false, error: 'Email delivery failed' }
  }
}

export const sendPasswordResetEmail = async ({ email, resetUrl, name = 'Team Member' }) => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #0284c7; font-weight: 700; margin: 0 0 6px 0;">NexFieldForce Security</p>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 0;">Password Reset Request</h2>
      </div>
      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
        Hello <strong>${name}</strong>, we received a request to reset your password for your NexFieldForce enterprise account. Click the secure button below to set a new password:
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
          Reset My Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin: 24px 0 0 0;">
        This secure link expires in <strong>30 minutes</strong>. If you did not make this request, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">NexFieldForce Workforce & HR Management Platform</p>
    </div>
  `
  return sendEmail({ to: email, subject: 'Reset your NexFieldForce password', html })
}

export const sendTaskReminderEmail = async ({
  email,
  name = 'Team Member',
  taskTitle,
  taskDescription = '',
  priority = 'Normal',
  dueDate = 'Today',
  assignedBy = 'Operations Lead',
  taskUrl = 'http://localhost:3000',
  customMessage = '',
}) => {
  const priorityColor = priority === 'Urgent' ? '#dc2626' : priority === 'High' ? '#ea580c' : '#0284c7'
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="margin-bottom: 24px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #0284c7; font-weight: 700; margin: 0;">NexFieldForce Dispatch</p>
          <span style="background-color: ${priorityColor}15; color: ${priorityColor}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
            ${priority} Priority
          </span>
        </div>
        <h2 style="color: #0f172a; font-size: 22px; font-weight: 700; margin: 10px 0 0 0;">🔔 Task Reminder Alert</h2>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
        Hello <strong>${name}</strong>, this is an automated reminder regarding an assigned operational task in your workspace:
      </p>

      <div style="background-color: #f8fafc; border-left: 4px solid ${priorityColor}; border-radius: 8px; padding: 18px 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 17px; font-weight: 700;">${taskTitle}</h3>
        ${taskDescription ? `<p style="margin: 0 0 12px 0; color: #475569; font-size: 14px; line-height: 1.5;">${taskDescription}</p>` : ''}
        <div style="font-size: 13px; color: #64748b; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <p style="margin: 3px 0;"><strong>📅 Due Date:</strong> <span style="color: #0f172a;">${dueDate}</span></p>
          <p style="margin: 3px 0;"><strong>👤 Assigned By:</strong> <span style="color: #0f172a;">${assignedBy}</span></p>
        </div>
      </div>

      ${customMessage ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #166534;"><strong>💬 Note from Supervisor:</strong> ${customMessage}</p>
        </div>
      ` : ''}

      <div style="margin: 28px 0 20px 0; text-align: center;">
        <a href="${taskUrl}" style="background-color: #0284c7; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);">
          Open Task in Workspace
        </a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
        NexFieldForce Automated Task & Field Dispatch Engine • Real-Time Workforce Platform
      </p>
    </div>
  `
  return sendEmail({
    to: email,
    subject: `🔔 Task Reminder [${priority}]: ${taskTitle}`,
    html,
    text: `Task Reminder: ${taskTitle}\nDue Date: ${dueDate}\nPriority: ${priority}\nAssigned By: ${assignedBy}\nDetails: ${taskDescription}\nLink: ${taskUrl}`,
  })
}

