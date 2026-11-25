import { processAiAgentMessage, executeAiTool } from '../services/ai.service.js'
import { memoryStore } from '../config/db.js'

export const chat = async (req, res) => {
  try {
    const { message, context = {} } = req.body || {}
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' })
    }

    const authUser = req.authUser || {
      id: 1,
      fullName: 'Super Admin',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
      companyId: 1,
    }

    const aiResult = await processAiAgentMessage({
      message: message.trim(),
      context,
      authUser,
    })

    // Record AI Audit Log Entry
    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: authUser.id,
      userName: authUser.fullName,
      role: authUser.roleCode || 'EMPLOYEE',
      action: 'AI_QUERY',
      requestPrompt: message.trim(),
      toolExecuted: aiResult.toolCalls?.[0]?.name || 'N/A',
      resultStatus: aiResult.toolResults?.[0]?.result?.denied ? 'DENIED' : 'SUCCESS',
      ip: req.ip || '127.0.0.1',
    }
    memoryStore.audit_logs.unshift(auditEntry)

    return res.json({
      success: true,
      data: {
        content: aiResult.content,
        toolCalls: aiResult.toolCalls,
        toolResults: aiResult.toolResults,
        navigation: aiResult.navigation,
        pendingConfirmation: aiResult.pendingConfirmation,
        roleContext: aiResult.roleContext,
      },
    })
  } catch (error) {
    console.error('[AI Controller Chat Error]:', error)
    return res.status(500).json({ success: false, message: 'AI copilot processing error' })
  }
}

export const executeToolAction = async (req, res) => {
  try {
    const { toolName, params = {} } = req.body || {}
    if (!toolName) {
      return res.status(400).json({ success: false, message: 'Tool name is required' })
    }

    const authUser = req.authUser || {
      id: 1,
      fullName: 'Super Admin',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
    }

    const result = await executeAiTool(toolName, params, authUser)

    // Audit Log Mutating Tool
    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: authUser.id,
      userName: authUser.fullName,
      role: authUser.roleCode || 'EMPLOYEE',
      action: `AI_EXECUTE_ACTION_${toolName.toUpperCase()}`,
      target: params.agentId || params.customerId || params.taskId || 'SYSTEM',
      resultStatus: result.success ? 'SUCCESS' : 'FAILED',
      details: JSON.stringify(params),
      ip: req.ip || '127.0.0.1',
    }
    memoryStore.audit_logs.unshift(auditEntry)

    return res.json({ success: result.success, data: result })
  } catch (error) {
    console.error('[AI Tool Execution Error]:', error)
    return res.status(500).json({ success: false, message: 'Tool execution failed' })
  }
}

export const listAutomations = async (req, res) => {
  const automations = [
    { id: 'auto-1', name: 'Late Arrival Daily Alert', trigger: 'Attendance clock-in > 08:30 AM', action: 'Flag Red Flag + Notify Supervisor', status: 'Active' },
    { id: 'auto-2', name: 'Dead Battery & GPS Inactivity', trigger: 'No location ping > 90 mins', action: 'Create Urgent Safety Check Task', status: 'Active' },
    { id: 'auto-3', name: 'Duplicate Outlet Detection', trigger: 'New Customer Creation', action: 'Run Name & Proximity Cluster Match', status: 'Active' },
  ]
  return res.json({ success: true, data: automations })
}
