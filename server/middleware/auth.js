import jwt from 'jsonwebtoken'
import { query, getPool, memoryStore } from '../config/db.js'

const JWT_SECRET = process.env.JWT_SECRET

const requireJwtSecret = () => {
  if (!JWT_SECRET) throw new Error('JWT authentication is not configured.')
  return JWT_SECRET
}

export const signToken = (payload, expiresIn = '12h') => {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, requireJwtSecret())
  } catch (err) {
    return null
  }
}

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.token || '')

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please sign in.' })
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' })
    }

    // Lookup full user profile with role and permissions
    const pool = getPool()
    if (pool) {
      const [users] = await pool.query(
        `SELECT u.id, u.uuid, u.company_id, u.email, u.full_name, u.phone, u.avatar_url, u.status, u.is_super_admin,
                r.id as role_id, r.code as role_code, r.name as role_name,
                e.id as employee_id, e.employee_code, e.department_id, e.position_id
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN employees e ON e.user_id = u.id
         WHERE u.id = ? AND u.status = 'active'
         LIMIT 1`,
        [decoded.id]
      )

      if (!users || users.length === 0) {
        return res.status(401).json({ success: false, message: 'Account not found or inactive.' })
      }

      const user = users[0]

      // Fetch user's permissions
      const [perms] = await pool.query(
        `SELECT p.code
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ?`,
        [user.role_id]
      )

      const permissions = new Set(perms.map((p) => p.code))
      if (user.is_super_admin) {
        permissions.add('*')
      }

      req.authUser = {
        id: user.id,
        uuid: user.uuid,
        companyId: user.company_id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        roleId: user.role_id,
        roleCode: user.role_code || 'EMPLOYEE',
        roleName: user.role_name || 'Employee',
        isSuperAdmin: Boolean(user.is_super_admin),
        employeeId: user.employee_id,
        employeeCode: user.employee_code,
        departmentId: user.department_id,
        positionId: user.position_id,
        managerId: null,
        permissions,
        // Legacy routes use snake_case while newer routes use camelCase.
        role_code: user.role_code || 'EMPLOYEE',
        role_name: user.role_name || 'Employee',
        company_id: user.company_id,
      }
      req.tenantId = user.company_id
    } else {
      // Local fallback must still load the user record. Trusting a role claim
      // from a token alone would let a standard account act as an administrator.
      const user = memoryStore.users.find((entry) => String(entry.id) === String(decoded.id))
      if (!user || user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'Account not found or inactive.' })
      }

      const role = memoryStore.roles.find((entry) => entry.id === user.role_id)
      const employee = memoryStore.employees.find((entry) => String(entry.user_id) === String(user.id))
      const roleCode = role?.code || decoded.role || 'EMPLOYEE'
      const isSuperAdmin = roleCode === 'SUPER_ADMIN'

      req.authUser = {
        id: user.id,
        uuid: user.uuid,
        companyId: user.company_id || decoded.companyId || 1,
        company_id: user.company_id || decoded.companyId || 1,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        roleId: role?.id || user.role_id,
        roleCode,
        role_code: roleCode,
        roleName: role?.name || 'Staff Member',
        role_name: role?.name || 'Staff Member',
        isSuperAdmin,
        employeeId: employee?.id,
        employeeCode: employee?.employee_code,
        permissions: new Set(isSuperAdmin ? ['*'] : []),
      }
      req.tenantId = user.company_id || decoded.companyId || 1
    }

    req.user = req.authUser
    next()
  } catch (error) {
    console.error('[Auth Middleware Error]:', error)
    return res.status(500).json({ success: false, message: 'Authentication verification error' })
  }
}

export const authenticateToken = requireAuth
