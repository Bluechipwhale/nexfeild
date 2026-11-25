import { getPool } from '../config/db.js'

export const writeAuditLog = async (req, action, entityType, entityId = null, metadata = {}) => {
  try {
    const pool = getPool()
    if (!pool) return

    const userId = req?.authUser?.id || null
    const companyId = req?.authUser?.companyId || req?.tenantId || null
    const method = req?.method || 'SYSTEM'
    const path = req?.originalUrl || req?.url || ''
    const ip = req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1'
    const userAgent = req?.headers?.['user-agent'] || 'internal'

    await pool.query(
      `INSERT INTO audit_logs (uuid, company_id, user_id, action, entity_type, entity_id, request_method, request_path, ip_address, user_agent, metadata)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, userId, action, entityType, String(entityId || ''), method, path, ip, userAgent, JSON.stringify(metadata)]
    )
  } catch (err) {
    console.warn('[Audit Log Write Warning]:', err.message)
  }
}
