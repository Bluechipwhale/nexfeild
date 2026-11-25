import { DEFAULT_ROLE_PERMISSIONS } from '../config/constants.js'

/**
 * Standard outside-the-AI authorization engine.
 * Validates whether a specific user & role possesses the required permission for an action.
 */
export const authorize = (userId, role, permission, resource = '', action = 'read') => {
  if (!role) return false
  const normalizedRole = role.toUpperCase()

  // Super Admin possesses wildcard permissions
  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'COMPANY_ADMIN') {
    return true
  }

  const rolePerms = DEFAULT_ROLE_PERMISSIONS[normalizedRole] || []
  if (rolePerms.includes('*') || rolePerms.includes(permission)) {
    return true
  }

  // Permission module wildcard check e.g. "customers.*"
  if (permission && permission.includes('.')) {
    const modulePrefix = permission.split('.')[0] + '.*'
    if (rolePerms.includes(modulePrefix)) return true
  }

  return false
}

/**
 * Scopes data according to the user's role and identity.
 * Prevents horizontal or vertical privilege escalation outside permitted boundaries.
 */
export const filterResourceByScope = (role, userId, resourceType, items = []) => {
  if (!items || !Array.isArray(items)) return []
  const normalizedRole = (role || 'EMPLOYEE').toUpperCase()

  if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'AGENT_ADMIN' || normalizedRole === 'AGENTADMIN') {
    return items // Full organization view
  }

  const strUserId = String(userId)

  switch (resourceType) {
    case 'agents':
      if (normalizedRole === 'SUPERVISOR') return items // Supervisor sees field workforce
      if (normalizedRole === 'HR_MANAGER') return items
      // Field or Sales Agent only sees themselves
      return items.filter((a) => String(a.userId) === strUserId || String(a.id) === strUserId)

    case 'customers':
      if (normalizedRole === 'SUPERVISOR') return items
      if (normalizedRole === 'SALES_AGENT' || normalizedRole === 'FIELD_AGENT') {
        return items.filter((c) => String(c.registered_by_id) === strUserId || String(c.assigned_agent_id) === strUserId || !c.registered_by_id)
      }
      if (normalizedRole === 'HR_MANAGER') return [] // HR has no financial/customer access
      return items

    case 'visits':
      if (normalizedRole === 'SUPERVISOR') return items
      if (normalizedRole === 'SALES_AGENT' || normalizedRole === 'FIELD_AGENT') {
        return items.filter((v) => String(v.agentId) === strUserId)
      }
      if (normalizedRole === 'HR_MANAGER') return []
      return items

    case 'orders':
    case 'payments':
      if (normalizedRole === 'SUPERVISOR') return items
      if (normalizedRole === 'SALES_AGENT' || normalizedRole === 'FIELD_AGENT') {
        return items.filter((o) => String(o.agentId) === strUserId || String(o.created_by_id) === strUserId || String(o.collected_by_id) === strUserId)
      }
      if (normalizedRole === 'HR_MANAGER') return [] // Restrict financial transactions from HR
      return items

    case 'tasks':
      if (normalizedRole === 'SUPERVISOR') return items
      return items.filter((t) => String(t.assigned_to_id) === strUserId || String(t.assigned_to_employee_id) === strUserId)

    case 'schedules':
      if (normalizedRole === 'SUPERVISOR') return items
      return items.filter((s) => String(s.agentId) === strUserId)

    case 'expenses':
      if (normalizedRole === 'SUPERVISOR') return items
      return items.filter((e) => String(e.agentId) === strUserId)

    case 'attendance':
      if (normalizedRole === 'HR_MANAGER' || normalizedRole === 'SUPERVISOR') return items
      return items.filter((a) => String(a.employee_id) === strUserId || String(a.user_id) === strUserId)

    default:
      return items
  }
}

export const requirePermission = (permissionCode) => {
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    if (req.authUser.isSuperAdmin || req.authUser.permissions?.has('*')) {
      return next()
    }

    if (Array.isArray(permissionCode)) {
      const hasAny = permissionCode.some((code) => req.authUser.permissions?.has(code))
      if (!hasAny) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required one of: ${permissionCode.join(', ')}`,
        })
      }
      return next()
    }

    if (!req.authUser.permissions?.has(permissionCode)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permissionCode}`,
      })
    }

    next()
  }
}

export const requireRole = (roles) => {
  const roleList = Array.isArray(roles) ? roles : [roles]
  return (req, res, next) => {
    if (!req.authUser) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    if (req.authUser.isSuperAdmin) {
      return next()
    }

    if (!roleList.includes(req.authUser.roleCode)) {
      return res.status(403).json({
        success: false,
        message: `Role access denied. Required role in [${roleList.join(', ')}]`,
      })
    }

    next()
  }
}
