import { getPool, memoryStore } from '../config/db.js'
import { writeAuditLog } from '../middleware/audit.js'

export const listDepartments = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const isSuperAdmin = req.authUser?.isSuperAdmin || req.user?.isSuperAdmin

    if (pool) {
      const query = isSuperAdmin
        ? `SELECT d.*, COUNT(e.id) as employee_count, u.full_name as head_name
           FROM departments d
           LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
           LEFT JOIN users u ON d.head_user_id = u.id
           GROUP BY d.id ORDER BY d.name ASC`
        : `SELECT d.*, COUNT(e.id) as employee_count, u.full_name as head_name
           FROM departments d
           LEFT JOIN employees e ON e.department_id = d.id AND e.employment_status = 'active'
           LEFT JOIN users u ON d.head_user_id = u.id
           WHERE d.company_id = ?
           GROUP BY d.id ORDER BY d.name ASC`
      const params = isSuperAdmin ? [] : [companyId]
      const [rows] = await pool.query(query, params)
      return res.json({ success: true, data: rows })
    }

    // In-Memory fallback
    let list = (memoryStore.departments || []).map((d) => {
      const emps = (memoryStore.employees || []).filter((e) => e.department_id === d.id)
      const headUser = (memoryStore.users || []).find((u) => u.id === d.head_user_id) || {}
      return {
        ...d,
        employee_count: emps.length,
        head_name: headUser.full_name || 'Department Lead',
      }
    })

    if (!isSuperAdmin) {
      list = list.filter((d) => d.company_id === companyId)
    }

    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list departments' })
  }
}

export const createDepartment = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const { name, code, description, headUserId = null } = req.body || {}

    if (!name || !code) return res.status(400).json({ success: false, message: 'Department name and code are required' })

    if (pool) {
      const [result] = await pool.query(
        'INSERT INTO departments (company_id, code, name, description, head_user_id) VALUES (?, ?, ?, ?, ?)',
        [companyId, code.toUpperCase().trim(), name.trim(), description || null, headUserId || null]
      )
      await writeAuditLog(req, 'create_department', 'departments', result.insertId, { name, code })
      return res.status(201).json({ success: true, message: 'Department created successfully', id: result.insertId })
    }

    const newDept = {
      id: (memoryStore.departments || []).length + 1,
      company_id: companyId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      description: description || `Department for ${name}`,
      head_user_id: headUserId,
    }
    if (!Array.isArray(memoryStore.departments)) memoryStore.departments = []
    memoryStore.departments.push(newDept)

    return res.status(201).json({ success: true, message: 'Department created successfully', data: newDept })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create department' })
  }
}

export const listPositions = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const isSuperAdmin = req.authUser?.isSuperAdmin || req.user?.isSuperAdmin

    if (pool) {
      const query = isSuperAdmin
        ? `SELECT p.*, d.name as department_name, COUNT(e.id) as employee_count
           FROM positions p
           JOIN departments d ON p.department_id = d.id
           LEFT JOIN employees e ON e.position_id = p.id AND e.employment_status = 'active'
           GROUP BY p.id ORDER BY p.title ASC`
        : `SELECT p.*, d.name as department_name, COUNT(e.id) as employee_count
           FROM positions p
           JOIN departments d ON p.department_id = d.id
           LEFT JOIN employees e ON e.position_id = p.id AND e.employment_status = 'active'
           WHERE p.company_id = ?
           GROUP BY p.id ORDER BY p.title ASC`
      const params = isSuperAdmin ? [] : [companyId]
      const [rows] = await pool.query(query, params)
      return res.json({ success: true, data: rows })
    }

    // In-Memory fallback
    let list = (memoryStore.positions || []).map((p) => {
      const dept = (memoryStore.departments || []).find((d) => d.id === p.department_id) || {}
      const emps = (memoryStore.employees || []).filter((e) => e.position_id === p.id)
      return {
        ...p,
        department_name: dept.name || 'General Operations',
        employee_count: emps.length,
      }
    })

    if (!isSuperAdmin) {
      list = list.filter((p) => p.company_id === companyId)
    }

    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list positions' })
  }
}

export const createPosition = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const { title, code, departmentId, gradeLevel, minSalary, maxSalary, description } = req.body || {}

    if (!title || !code || !departmentId) return res.status(400).json({ success: false, message: 'Title, code, and department are required' })

    if (pool) {
      const [result] = await pool.query(
        'INSERT INTO positions (company_id, department_id, title, code, grade_level, min_salary, max_salary, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [companyId, departmentId, title.trim(), code.toUpperCase().trim(), gradeLevel || null, minSalary || null, maxSalary || null, description || null]
      )
      await writeAuditLog(req, 'create_position', 'positions', result.insertId, { title, code })
      return res.status(201).json({ success: true, message: 'Position created successfully', id: result.insertId })
    }

    const newPos = {
      id: (memoryStore.positions || []).length + 1,
      company_id: companyId,
      department_id: Number(departmentId),
      title: title.trim(),
      code: code.toUpperCase().trim(),
      grade_level: gradeLevel || 'L1',
      min_salary: minSalary || 150000,
      max_salary: maxSalary || 500000,
      description: description || `Position for ${title}`,
    }
    if (!Array.isArray(memoryStore.positions)) memoryStore.positions = []
    memoryStore.positions.push(newPos)

    return res.status(201).json({ success: true, message: 'Position created successfully', data: newPos })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create position' })
  }
}

export const listLocations = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const isSuperAdmin = req.authUser?.isSuperAdmin || req.user?.isSuperAdmin

    if (pool) {
      const query = isSuperAdmin
        ? 'SELECT * FROM locations ORDER BY is_headquarters DESC, name ASC'
        : 'SELECT * FROM locations WHERE company_id = ? ORDER BY is_headquarters DESC, name ASC'
      const params = isSuperAdmin ? [] : [companyId]
      const [rows] = await pool.query(query, params)
      return res.json({ success: true, data: rows })
    }

    // In-Memory fallback
    const defaultLocations = [
      { id: 1, company_id: 1, code: 'HQ-LOS', name: 'NexFieldForce Platform HQ', city: 'Lagos', state: 'Lagos', is_headquarters: 1 },
      { id: 2, company_id: 1, code: 'BR-IKJ', name: 'Ikeja Commercial Operations Center', city: 'Ikeja', state: 'Lagos', is_headquarters: 0 },
      { id: 3, company_id: 1, code: 'BR-VI', name: 'Victoria Island Regional Office', city: 'VI', state: 'Lagos', is_headquarters: 0 },
    ]

    const list = Array.isArray(memoryStore.locations) && memoryStore.locations.length > 0
      ? memoryStore.locations
      : defaultLocations

    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list locations' })
  }
}

export const createLocation = async (req, res) => {
  try {
    const pool = getPool()
    const companyId = req.authUser?.companyId || req.user?.companyId || 1
    const { name, code, address, city, state, latitude, longitude, isHeadquarters = 0 } = req.body || {}

    if (!name || !code) return res.status(400).json({ success: false, message: 'Location name and code are required' })

    if (pool) {
      const [result] = await pool.query(
        'INSERT INTO locations (company_id, code, name, address, city, state, latitude, longitude, is_headquarters) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [companyId, code.toUpperCase().trim(), name.trim(), address || null, city || null, state || null, latitude || null, longitude || null, isHeadquarters ? 1 : 0]
      )
      await writeAuditLog(req, 'create_location', 'locations', result.insertId, { name, code })
      return res.status(201).json({ success: true, message: 'Location created successfully', id: result.insertId })
    }

    const newLoc = {
      id: (memoryStore.locations || []).length + 1,
      company_id: companyId,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      address: address || '',
      city: city || 'Lagos',
      state: state || 'Lagos',
      latitude: latitude || 6.5244,
      longitude: longitude || 3.3792,
      is_headquarters: isHeadquarters ? 1 : 0,
    }
    if (!Array.isArray(memoryStore.locations)) memoryStore.locations = []
    memoryStore.locations.push(newLoc)

    return res.status(201).json({ success: true, message: 'Location created successfully', data: newLoc })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create location' })
  }
}
