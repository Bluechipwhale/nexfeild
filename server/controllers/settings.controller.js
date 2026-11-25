import { memoryStore } from '../config/db.js'

export const getCompanySettings = async (req, res) => {
  return res.json({ success: true, data: memoryStore.companies[0] })
}

export const listRoles = async (req, res) => {
  return res.json({
    success: true,
    data: {
      roles: memoryStore.roles,
      permissions: [],
    },
  })
}

export const listAuditLogs = async (req, res) => {
  return res.json({ success: true, data: memoryStore.audit_logs })
}
