import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { getPool, memoryStore } from '../config/db.js'
import { signToken } from '../middleware/auth.js'
import { writeAuditLog } from '../middleware/audit.js'
import { sendPasswordResetEmail } from '../services/email.service.js'

const createMySqlEmployee = async (connection, { userId, companyId = 1, fullName, phone = '', roleCode = 'EMPLOYEE' }) => {
  const parts = String(fullName || 'Staff Member').trim().split(/\s+/)
  const [created] = await connection.execute(
    `INSERT INTO employees (uuid, company_id, user_id, employee_code, first_name, last_name, phone, hire_date, is_field_agent, is_sales_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)`,
    [
      crypto.randomUUID(), companyId, userId, `PENDING-${userId}`, parts[0] || 'Staff', parts.slice(1).join(' ') || 'Member', phone,
      roleCode === 'FIELD_AGENT' ? 1 : 0,
      roleCode === 'SALES_AGENT' ? 1 : 0,
    ]
  )
  const employeeCode = `EMP-${String(created.insertId).padStart(5, '0')}`
  await connection.execute('UPDATE employees SET employee_code = ? WHERE id = ?', [employeeCode, created.insertId])
  const [leaveTypes] = await connection.query('SELECT id, days_allowed_per_year FROM leave_types WHERE company_id = ?', [companyId])
  for (const leaveType of leaveTypes) {
    await connection.execute(
      `INSERT IGNORE INTO leave_balances (company_id, employee_id, leave_type_id, fiscal_year, entitled_days, remaining_days)
       VALUES (?, ?, ?, YEAR(CURDATE()), ?, ?)`,
      [companyId, created.insertId, leaveType.id, leaveType.days_allowed_per_year, leaveType.days_allowed_per_year]
    )
  }
  return { id: created.insertId, employeeCode }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()

    let user = null
    if (pool) {
      const [users] = await pool.query(
        `SELECT u.*, r.code as role_code, r.name as role_name,
                c.name as company_name, c.code as company_code,
                e.id as employee_id, e.employee_code, e.first_name, e.last_name,
                e.is_field_agent, e.is_sales_agent
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN companies c ON u.company_id = c.id
         LEFT JOIN employees e ON e.user_id = u.id
         WHERE u.email = ?
         LIMIT 1`,
        [normalizedEmail]
      )
      user = users?.[0] || null
    }

    // MemoryStore is development-only. Production MySQL never falls back to it.
    if (!user && !pool) {
      const memUser = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
      if (memUser) {
        const memRole = memoryStore.roles.find((r) => r.id === memUser.role_id)
        const memEmp = memoryStore.employees.find((e) => e.user_id === memUser.id)
        const memComp = memoryStore.companies.find((c) => c.id === memUser.company_id)
        user = {
          ...memUser,
          role_code: memRole?.code || 'EMPLOYEE',
          role_name: memRole?.name || 'Staff / Employee',
          company_name: memComp?.name || 'NexFieldForce Enterprise',
          company_code: memComp?.code || 'NEX-HQ',
          employee_id: memEmp?.id || memUser.id,
          employee_code: memEmp?.employee_code || `EMP-${String(memUser.id).padStart(4, '0')}`,
          is_field_agent: memEmp?.is_field_agent || (memRole?.code === 'FIELD_AGENT' ? 1 : 0),
          is_sales_agent: memEmp?.is_sales_agent || (memRole?.code === 'SALES_AGENT' ? 1 : 0),
        }
      }
    }

    if (!user) {
      // Check if user is pending registration approval
      let pending = null
      if (pool) {
        const [pendingRows] = await pool.query('SELECT id FROM registration_requests WHERE email = ? AND status = \'pending\' LIMIT 1', [normalizedEmail])
        pending = pendingRows[0] || null
      } else {
        pending = memoryStore.registration_requests.find(
          (r) => r.email.toLowerCase() === normalizedEmail && r.status === 'pending'
        )
      }
      if (pending) {
        return res.status(403).json({
          success: false,
          message: 'Your registration request is currently pending administrator approval. You will receive access once approved.',
        })
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    if (user.status === 'pending_approval') {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending administrator approval. Please contact HR or your system administrator.',
      })
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated or suspended. Contact HR.' })
    }

    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(password, user.password_hash)
    } catch (e) {
      passwordMatch = false
    }

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const token = signToken({
      id: user.id,
      companyId: user.company_id || 1,
      email: user.email,
      role: user.role_code || 'SUPER_ADMIN',
    })

    const comp = (memoryStore.companies || []).find((c) => c.id === (user.company_id || 1))

    const permissions = user.is_super_admin
      ? ['*']
      : [
          'attendance.clock',
          'attendance.view',
          'leave.request',
          'leave.view',
          'tasks.view',
          'ai.use',
          ...(user.role_code === 'COMPANY_ADMIN' ? ['company.manage', 'employees.view', 'employees.create', 'sales.view', 'sales.create', 'field.monitor', 'leave.approve', 'reports.view'] : []),
          ...(user.role_code === 'SALES_AGENT' ? ['sales.view', 'sales.create', 'orders.create', 'customers.view'] : []),
          ...(user.role_code === 'FIELD_AGENT' ? ['field.visits', 'field.assignments', 'orders.create', 'customers.view'] : []),
          ...(user.role_code === 'HR_MANAGER' || user.role_code === 'HR_ADMIN' ? ['employees.view', 'employees.create', 'leave.approve', 'recruitment.manage'] : []),
          ...(user.role_code === 'MANAGER' || user.role_code === 'SUPERVISOR' ? ['field.monitor', 'leave.approve', 'sales.view', 'tasks.assign'] : []),
        ]

    const safeUser = {
      id: user.id,
      uuid: user.uuid || 'user-uuid',
      companyId: user.company_id || 1,
      companyName: comp?.name || user.company_name || 'NexFieldForce Platform HQ',
      companyCode: comp?.code || user.company_code || 'NXF-HQ-001',
      companyPlan: comp?.subscription_plan || 'Enterprise Master',
      companyStatus: comp?.subscription_status || 'active',
      enabledModules: comp?.enabled_modules || ['hr', 'attendance', 'leave', 'sales', 'crm', 'orders', 'products', 'collections', 'field_force', 'agent_tracking', 'reports', 'ai'],
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url || null,
      role: user.role_code || 'SUPER_ADMIN',
      roleName: user.role_name || (user.role_code === 'COMPANY_ADMIN' ? 'Company Administrator' : 'Super Admin'),
      isSuperAdmin: Boolean(user.is_super_admin || user.role_code === 'SUPER_ADMIN'),
      isCompanyAdmin: Boolean(user.role_code === 'COMPANY_ADMIN'),
      employeeId: user.employee_id || 1,
      employeeCode: user.employee_code || 'EMP-0001',
      isFieldAgent: Boolean(user.is_field_agent),
      isSalesAgent: Boolean(user.is_sales_agent),
      permissions,
    }

    return res.json({
      success: true,
      message: 'Sign in successful',
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error('[Login Error]:', error)
    return res.status(500).json({ success: false, message: 'Internal server error during login' })
  }
}

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, roleCode = 'EMPLOYEE', departmentId = 4, jobTitle = 'Staff Member' } = req.body || {}
    if (typeof fullName !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !fullName.trim() || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Full name, work email, and password are required' })
    }

    if (fullName.trim().length > 255 || email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || (phone != null && (typeof phone !== 'string' || phone.length > 50)) || typeof jobTitle !== 'string' || jobTitle.length > 255 || typeof roleCode !== 'string') {
      return res.status(400).json({ success: false, message: 'Please enter a valid name, email address, phone number, and account type.' })
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and no more than 72 bytes.' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedRole = roleCode === 'AGENTADMIN' ? 'AGENT_ADMIN' : String(roleCode).toUpperCase()
    const allowedRoles = new Set(['EMPLOYEE', 'AGENT_ADMIN', 'FIELD_AGENT', 'SALES_AGENT', 'SUPERVISOR', 'HR_MANAGER'])
    if (!allowedRoles.has(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Choose a valid account type.' })
    }
    const passwordHash = await bcrypt.hash(password, 12)

    // Security Rule: Privileged roles require approval
    const privilegedRoles = ['AGENT_ADMIN', 'HR_MANAGER', 'SUPERVISOR', 'FIELD_AGENT', 'SALES_AGENT']
    const requiresApproval = privilegedRoles.includes(normalizedRole)

    const pool = getPool()
    if (pool) {
      const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
      const [[pending]] = await pool.query('SELECT id FROM registration_requests WHERE email = ? AND status = \'pending\' LIMIT 1', [normalizedEmail])
      if (existing || pending) {
        return res.status(400).json({ success: false, message: 'An account or registration request already exists for this email address' })
      }

      if (requiresApproval) {
        await pool.execute(
          `INSERT INTO registration_requests (uuid, company_id, full_name, email, phone, requested_role, job_title, status, password_hash)
           VALUES (?, 1, ?, ?, ?, ?, ?, 'pending', ?)`,
          [crypto.randomUUID(), fullName.trim(), normalizedEmail, phone || '', normalizedRole, jobTitle, passwordHash]
        )
        return res.status(202).json({
          success: true,
          requiresApproval: true,
          message: `Your registration request as ${normalizedRole.replace(/_/g, ' ')} has been submitted! An administrator will review and activate your account.`,
        })
      }

      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        const [[employeeRole]] = await connection.query("SELECT id, name FROM roles WHERE code = 'EMPLOYEE' LIMIT 1")
        if (!employeeRole) throw new Error('The employee role is not configured.')
        const [createdUser] = await connection.execute(
          `INSERT INTO users (uuid, company_id, email, password_hash, full_name, phone, role_id, status)
           VALUES (?, 1, ?, ?, ?, ?, ?, 'active')`,
          [crypto.randomUUID(), normalizedEmail, passwordHash, fullName.trim(), phone || '', employeeRole.id]
        )
        const employee = await createMySqlEmployee(connection, { userId: createdUser.insertId, fullName, phone, roleCode: 'EMPLOYEE' })
        await connection.commit()
        const token = signToken({ id: createdUser.insertId, companyId: 1, email: normalizedEmail, role: 'EMPLOYEE' })
        return res.status(201).json({
          success: true,
          message: 'Account registered and activated successfully!',
          token,
          user: { id: createdUser.insertId, companyId: 1, email: normalizedEmail, fullName: fullName.trim(), role: 'EMPLOYEE', roleName: employeeRole.name, employeeId: employee.id, employeeCode: employee.employeeCode, permissions: ['attendance.clock', 'attendance.view', 'leave.request', 'leave.view', 'tasks.view', 'ai.use'] },
        })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    }

    // Development store fallback
    const existing = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists' })
    }

    if (requiresApproval) {
      const regId = memoryStore.registration_requests.length + 1
      const newReq = {
        id: regId,
        uuid: `reg-${regId}`,
        full_name: fullName.trim(),
        email: normalizedEmail,
        phone: phone || '',
        requested_role: normalizedRole,
        department_id: Number(departmentId),
        job_title: jobTitle,
        status: 'pending',
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      }
      memoryStore.registration_requests.push(newReq)

      return res.status(202).json({
        success: true,
        requiresApproval: true,
        message: `Your registration request as ${normalizedRole.replace(/_/g, ' ')} has been submitted! An administrator will review and activate your account.`,
      })
    }

    // Auto-approve standard staff member
    const employeeRole = memoryStore.roles.find((role) => role.code === 'EMPLOYEE')
    if (!employeeRole) {
      throw new Error('The employee role is not configured.')
    }

    const newUserId = memoryStore.users.length + 1
    const newUser = {
      id: newUserId,
      uuid: `user-${newUserId}`,
      company_id: 1,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: fullName.trim(),
      phone: phone || '',
      role_id: employeeRole.id,
      is_super_admin: 0,
      status: 'active',
    }
    memoryStore.users.push(newUser)

    const empId = memoryStore.employees.length + 1
    const newEmp = {
      id: empId,
      uuid: `emp-${empId}`,
      company_id: 1,
      user_id: newUserId,
      employee_code: `EMP-${String(empId).padStart(4, '0')}`,
      first_name: fullName.trim().split(' ')[0],
      last_name: fullName.trim().split(' ').slice(1).join(' ') || 'Staff',
      phone: phone || '',
      department_id: Number(departmentId),
      position_id: 4,
      employment_type: 'full_time',
      employment_status: 'active',
      hire_date: new Date().toISOString().slice(0, 10),
      is_field_agent: 0,
      is_sales_agent: 0,
    }
    memoryStore.employees.push(newEmp)

    // Seed default leave balances
    memoryStore.leave_types.forEach((lt) => {
      memoryStore.leave_balances.push({
        id: memoryStore.leave_balances.length + 1,
        company_id: 1,
        employee_id: empId,
        leave_type_id: lt.id,
        fiscal_year: 2026,
        entitled_days: lt.days_allowed_per_year,
        used_days: 0,
        pending_days: 0,
        remaining_days: lt.days_allowed_per_year,
      })
    })

    const token = signToken({ id: newUserId, companyId: 1, email: normalizedEmail, role: 'EMPLOYEE' })
    const safeUser = {
      id: newUserId,
      companyId: 1,
      email: normalizedEmail,
      fullName: fullName.trim(),
      role: 'EMPLOYEE',
      roleName: 'Staff / Employee',
      employeeId: empId,
      employeeCode: newEmp.employee_code,
      permissions: ['attendance.clock', 'attendance.view', 'leave.request', 'leave.view', 'tasks.view', 'ai.use'],
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered and activated successfully!',
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error('[Register Error]:', error)
    return res.status(500).json({ success: false, message: 'Registration failed' })
  }
}

export const listRegistrationRequests = async (req, res) => {
  const pool = getPool()
  if (pool) {
    const [rows] = await pool.query(
      `SELECT id, uuid, full_name, email, phone, requested_role, department_id, job_title, status, reviewed_by, reviewed_at, created_at
       FROM registration_requests WHERE company_id = ? ORDER BY created_at DESC`,
      [req.authUser?.companyId || 1]
    )
    return res.json({ success: true, data: rows })
  }
  return res.json({ success: true, data: memoryStore.registration_requests })
}

export const approveRegistrationRequest = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (pool) {
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        const [[request]] = await connection.query('SELECT * FROM registration_requests WHERE id = ? AND company_id = ? AND status = \'pending\' FOR UPDATE', [id, req.authUser?.companyId || 1])
        if (!request) {
          await connection.rollback()
          return res.status(404).json({ success: false, message: 'Registration request not found' })
        }
        const [[role]] = await connection.query('SELECT id, name, code FROM roles WHERE code = ? LIMIT 1', [request.requested_role])
        if (!role) throw new Error('The requested account role is not configured.')
        const [createdUser] = await connection.execute(
          `INSERT INTO users (uuid, company_id, email, password_hash, full_name, phone, role_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [crypto.randomUUID(), request.company_id, request.email, request.password_hash, request.full_name, request.phone || '', role.id]
        )
        await createMySqlEmployee(connection, { userId: createdUser.insertId, companyId: request.company_id, fullName: request.full_name, phone: request.phone, roleCode: role.code })
        await connection.execute('UPDATE registration_requests SET status = \'approved\', reviewed_by = ?, reviewed_at = NOW() WHERE id = ?', [req.authUser?.id || null, id])
        await connection.commit()
        return res.json({ success: true, message: `Account for ${request.full_name} has been approved as ${role.name}!` })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    }
    const request = memoryStore.registration_requests.find((r) => String(r.id) === String(id))
    if (!request) return res.status(404).json({ success: false, message: 'Registration request not found' })

    const roleObj = memoryStore.roles.find((r) => r.code === request.requested_role)
      || memoryStore.roles.find((r) => r.code === 'EMPLOYEE')
    if (!roleObj) return res.status(500).json({ success: false, message: 'The requested account role is not configured.' })

    const newUserId = memoryStore.users.length + 1
    const newUser = {
      id: newUserId,
      uuid: `user-${newUserId}`,
      company_id: 1,
      email: request.email,
      password_hash: request.password_hash,
      full_name: request.full_name,
      phone: request.phone,
      role_id: roleObj.id,
      is_super_admin: request.requested_role === 'SUPER_ADMIN' ? 1 : 0,
      status: 'active',
    }
    memoryStore.users.push(newUser)

    const empId = memoryStore.employees.length + 1
    const newEmp = {
      id: empId,
      uuid: `emp-${empId}`,
      company_id: 1,
      user_id: newUserId,
      employee_code: `EMP-${String(empId).padStart(4, '0')}`,
      first_name: request.full_name.split(' ')[0],
      last_name: request.full_name.split(' ').slice(1).join(' ') || 'Staff',
      phone: request.phone,
      department_id: request.department_id || 4,
      position_id: 4,
      employment_type: 'full_time',
      employment_status: 'active',
      hire_date: new Date().toISOString().slice(0, 10),
      is_field_agent: request.requested_role === 'FIELD_AGENT' ? 1 : 0,
      is_sales_agent: request.requested_role === 'SALES_AGENT' ? 1 : 0,
    }
    memoryStore.employees.push(newEmp)

    request.status = 'approved'
    request.reviewed_by = req.authUser?.id || 1
    request.reviewed_at = new Date().toISOString()

    return res.json({ success: true, message: `Account for ${request.full_name} has been approved as ${roleObj.name}!` })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Approval failed' })
  }
}

export const rejectRegistrationRequest = async (req, res) => {
  try {
    const { id } = req.params
    const pool = getPool()
    if (pool) {
      const [result] = await pool.execute(
        "UPDATE registration_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW() WHERE id = ? AND company_id = ? AND status = 'pending'",
        [req.authUser?.id || null, id, req.authUser?.companyId || 1]
      )
      if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Registration request not found' })
      return res.json({ success: true, message: 'Registration request rejected.' })
    }
    const request = memoryStore.registration_requests.find((r) => String(r.id) === String(id))
    if (!request) return res.status(404).json({ success: false, message: 'Registration request not found' })

    request.status = 'rejected'
    request.reviewed_by = req.authUser?.id || 1
    request.reviewed_at = new Date().toISOString()

    return res.json({ success: true, message: `Registration request rejected.` })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Rejection failed' })
  }
}

export const getMe = async (req, res) => {
  return res.json({ success: true, user: req.authUser })
}

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {}
    if (!email) return res.status(400).json({ success: false, message: 'Email address is required' })

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()
    let user = null
    if (pool) {
      const [rows] = await pool.query('SELECT id, email, full_name, status FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
      user = rows[0] || null
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
    }

    if (!user || user.status !== 'active') {
      return res.json({ success: true, message: 'If an active account exists, a reset link has been dispatched to your email.' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    if (pool) {
      await pool.execute('INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [user.id, tokenHash, expiresAt])
    } else {
      memoryStore.password_resets[tokenHash] = { userId: user.id, email: user.email, expiresAt: expiresAt.toISOString() }
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000'
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'
    const origin = req.headers.origin || `${protocol}://${host}`
    const resetUrl = `${origin}/login?resetToken=${encodeURIComponent(resetToken)}`

    console.log(`[AUTH] 📧 Password Reset Requested for ${user.email}. Reset Link: ${resetUrl}`)

    try {
      await sendPasswordResetEmail({ email: user.email, resetUrl, name: user.full_name })
    } catch (emailErr) {
      console.warn('[AUTH] Email dispatch notice:', emailErr.message)
    }

    return res.json({
      success: true,
      message: 'If an active account exists, a reset link has been dispatched to your email.',
      debugLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to process reset request' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {}
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const pool = getPool()
    let resetData = null
    if (pool) {
      const [rows] = await pool.query(
        'SELECT id, user_id AS userId, expires_at AS expiresAt FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL LIMIT 1',
        [tokenHash]
      )
      resetData = rows[0] || null
    } else {
      resetData = memoryStore.password_resets[tokenHash]
    }

    if (!resetData) {
      return res.status(400).json({ success: false, message: 'This password reset link is invalid or has already been used' })
    }

    if (new Date(resetData.expiresAt).getTime() < Date.now()) {
      if (pool) await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?', [tokenHash])
      else delete memoryStore.password_resets[tokenHash]
      return res.status(400).json({ success: false, message: 'This password reset link has expired' })
    }

    const newHash = await bcrypt.hash(password, 12)
    if (pool) {
      await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, resetData.userId])
      await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?', [tokenHash])
    } else {
      const memUser = memoryStore.users.find((u) => u.id === resetData.userId)
      if (memUser) memUser.password_hash = newHash
      delete memoryStore.password_resets[tokenHash]
    }

    return res.json({ success: true, message: 'Your password has been reset successfully. You can now sign in.' })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Password reset failed' })
  }
}

export const selfResetPassword = async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body || {}
    if (!email || !phone || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, registered phone number, and new password are required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pool = getPool()
    let user = null
    if (pool) {
      const [rows] = await pool.query('SELECT id, phone, status FROM users WHERE email = ? LIMIT 1', [normalizedEmail])
      user = rows[0] || null
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail)
    }

    if (!user || user.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Account not found or inactive' })
    }

    const cleanRegisteredPhone = String(user.phone || '').replace(/\D/g, '')
    const cleanInputPhone = String(phone).replace(/\D/g, '')

    const match = cleanRegisteredPhone.slice(-8) === cleanInputPhone.slice(-8)
    if (!match) {
      return res.status(400).json({ success: false, message: 'Verification failed. Phone number does not match account records.' })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    if (pool) await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id])
    else user.password_hash = newHash

    return res.json({ success: true, message: 'Password reset successful! You can now log in.' })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Self password reset failed' })
  }
}

export const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body || {}
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' })
    }
    const newHash = await bcrypt.hash(newPassword, 12)
    const pool = getPool()
    if (pool) await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.authUser.id])
    else {
      const user = memoryStore.users.find((u) => u.id === req.authUser.id)
      if (user) user.password_hash = newHash
    }
    return res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update password' })
  }
}
