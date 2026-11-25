import bcrypt from 'bcryptjs'
import { getPool, memoryStore } from '../config/db.js'

// 1. LIST EMPLOYEES (WITH MULTI-TENANT FILTERING)
export const listEmployees = async (req, res) => {
  try {
    const { search = '', role = '', companyId = '' } = req.query
    const isSuperAdmin = req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN'
    const userCompanyId = req.user?.companyId || 1

    let list = (memoryStore.employees || []).map((e) => {
      const u = (memoryStore.users || []).find((user) => user.id === e.user_id) || {}
      const r = (memoryStore.roles || []).find((role) => role.id === u.role_id) || {}
      const c = (memoryStore.companies || []).find((comp) => comp.id === (e.company_id || u.company_id || 1)) || {}
      const d = (memoryStore.departments || []).find((dept) => dept.id === e.department_id) || {}
      const p = (memoryStore.positions || []).find((pos) => pos.id === e.position_id) || {}
      return {
        ...e,
        company_id: e.company_id || u.company_id || 1,
        company_name: c.name || 'NexFieldForce Platform HQ',
        company_code: c.code || 'NXF-HQ-001',
        email: u.email || '',
        full_name: u.full_name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
        role_id: u.role_id,
        role_code: r.code || (e.is_field_agent ? 'FIELD_AGENT' : e.is_sales_agent ? 'SALES_AGENT' : 'EMPLOYEE'),
        role_name: r.name || 'Staff Member',
        user_status: u.status || e.employment_status || 'active',
        department_name: d.name || 'General Operations',
        position_title: p.title || 'Staff',
      }
    })

    // Multi-tenant scope: If not Super Admin, strictly filter to caller's company
    if (!isSuperAdmin) {
      list = list.filter((e) => e.company_id === userCompanyId)
    } else if (companyId) {
      list = list.filter((e) => String(e.company_id) === String(companyId) || String(e.company_code).toLowerCase() === String(companyId).toLowerCase())
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((e) =>
        e.first_name?.toLowerCase().includes(q) ||
        e.last_name?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.company_name?.toLowerCase().includes(q)
      )
    }

    if (role && role !== 'all') {
      list = list.filter((e) => e.role_code === role)
    }

    return res.json({ success: true, data: list, total: list.length })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list staff members' })
  }
}

// 2. GET SINGLE EMPLOYEE
export const getEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const emp = (memoryStore.employees || []).find((e) => String(e.id) === String(id) || String(e.user_id) === String(id))
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' })

    const u = (memoryStore.users || []).find((user) => user.id === emp.user_id) || {}
    const r = (memoryStore.roles || []).find((role) => role.id === u.role_id) || {}
    const c = (memoryStore.companies || []).find((comp) => comp.id === (emp.company_id || u.company_id || 1)) || {}
    const d = (memoryStore.departments || []).find((dept) => dept.id === emp.department_id) || {}
    const p = (memoryStore.positions || []).find((pos) => pos.id === emp.position_id) || {}

    return res.json({
      success: true,
      data: {
        ...emp,
        company_id: emp.company_id || u.company_id || 1,
        company_name: c.name,
        company_code: c.code,
        email: u.email,
        full_name: u.full_name || `${emp.first_name} ${emp.last_name}`,
        role_code: r.code || 'EMPLOYEE',
        role_name: r.name || 'Staff Member',
        department_name: d.name || 'General Operations',
        position_title: p.title || 'Staff',
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 3. PROVISION NEW ENTERPRISE STAFF (WITH STRICT MULTI-TENANT ATTACHMENT)
export const createEmployee = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone = '',
      password,
      roleCode = 'FIELD_AGENT',
      companyId,
      departmentId = 1,
      jobTitle = 'Staff Member',
      baseSalary = 350000,
      territory = '',
      employmentType = 'full_time',
      hireDate = new Date().toISOString().slice(0, 10),
    } = req.body || {}

    if (!firstName || !firstName.trim() || !lastName || !lastName.trim() || !email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'First name, last name, and official email are required' })
    }
    if (!password || String(password).trim().length < 12) {
      return res.status(400).json({ success: false, message: 'Set a unique staff password of at least 12 characters' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const existing = (memoryStore.users || []).find((u) => u.email.toLowerCase() === normalizedEmail)
    if (existing) {
      return res.status(400).json({ success: false, message: `An account with email "${normalizedEmail}" already exists on the platform` })
    }

    // Determine target company/tenant
    const isSuperAdmin = req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN'
    let targetCompany = null

    if (companyId) {
      targetCompany = (memoryStore.companies || []).find((c) => String(c.id) === String(companyId) || String(c.code).toLowerCase() === String(companyId).toLowerCase())
    }

    if (!targetCompany) {
      if (req.user?.companyId) {
        targetCompany = (memoryStore.companies || []).find((c) => c.id === req.user.companyId)
      }
      if (!targetCompany) {
        targetCompany = memoryStore.companies?.[0] || { id: 1, name: 'NexFieldForce Platform HQ', code: 'NXF-HQ-001' }
      }
    }

    const targetCompanyId = targetCompany.id
    const companyInitials = targetCompany.name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3) || 'EMP'

    // Role resolution
    const roleObj = (memoryStore.roles || []).find((r) => r.code === roleCode) ||
                    (memoryStore.roles || []).find((r) => r.code === 'EMPLOYEE') ||
                    { id: 7, code: 'EMPLOYEE', name: 'Staff Member' }

    const passwordHash = await bcrypt.hash(String(password).trim(), 12)

    // 1. Create User
    const newUserId = (memoryStore.users || []).length + 1
    const newUser = {
      id: newUserId,
      uuid: `user-${String(newUserId).padStart(4, '0')}`,
      company_id: targetCompanyId,
      email: normalizedEmail,
      password_hash: passwordHash,
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: phone.trim(),
      role_id: roleObj.id,
      role_code: roleObj.code,
      is_super_admin: roleCode === 'SUPER_ADMIN' ? 1 : 0,
      status: 'active',
      created_at: new Date().toISOString(),
    }
    memoryStore.users.push(newUser)

    // 2. Create Employee
    const empId = (memoryStore.employees || []).length + 1
    const empCode = `${companyInitials}-${String(empId).padStart(4, '0')}`
    const isField = roleCode === 'FIELD_AGENT' ? 1 : 0
    const isSales = roleCode === 'SALES_AGENT' ? 1 : 0

    const newEmp = {
      id: empId,
      uuid: `emp-${String(empId).padStart(4, '0')}`,
      company_id: targetCompanyId,
      user_id: newUserId,
      employee_code: empCode,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      department_id: Number(departmentId) || 1,
      position_id: 1,
      employment_type: employmentType,
      employment_status: 'active',
      hire_date: hireDate,
      territory: territory || '',
      is_field_agent: isField,
      is_sales_agent: isSales,
    }
    memoryStore.employees.push(newEmp)

    // 3. Seed Default Leave Balances
    if (Array.isArray(memoryStore.leave_types)) {
      memoryStore.leave_types.forEach((lt) => {
        if (!Array.isArray(memoryStore.leave_balances)) memoryStore.leave_balances = []
        memoryStore.leave_balances.push({
          id: memoryStore.leave_balances.length + 1,
          company_id: targetCompanyId,
          employee_id: empId,
          leave_type_id: lt.id,
          fiscal_year: 2026,
          entitled_days: lt.days_allowed_per_year || 20,
          used_days: 0,
          pending_days: 0,
          remaining_days: lt.days_allowed_per_year || 20,
        })
      })
    }

    // 4. Seed Salary Record
    if (!Array.isArray(memoryStore.salary_records)) memoryStore.salary_records = []
    memoryStore.salary_records.push({
      id: memoryStore.salary_records.length + 1,
      company_id: targetCompanyId,
      employee_id: empId,
      base_salary: Number(baseSalary || 350000),
      currency: 'NGN',
      is_current: 1,
    })

    // Update Company User Count
    if (targetCompany) {
      targetCompany.user_count = ((memoryStore.users || []).filter((u) => u.company_id === targetCompanyId)).length
    }

    return res.status(201).json({
      success: true,
      message: `Staff member "${firstName.trim()} ${lastName.trim()}" provisioned successfully for "${targetCompany.name}"!`,
      data: {
        id: empId,
        userId: newUserId,
        employeeCode: empCode,
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: normalizedEmail,
        role: roleObj.code,
        roleName: roleObj.name,
        companyId: targetCompanyId,
        companyName: targetCompany.name,
        companyCode: targetCompany.code,
      },
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to provision staff member',
    })
  }
}

// 4. UPDATE EMPLOYEE PROFILE
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, phone, departmentId, positionId, employmentStatus, territory } = req.body || {}

    const emp = (memoryStore.employees || []).find((e) => String(e.id) === String(id) || String(e.user_id) === String(id))
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' })

    if (firstName) emp.first_name = firstName.trim()
    if (lastName) emp.last_name = lastName.trim()
    if (phone) emp.phone = phone.trim()
    if (departmentId) emp.department_id = Number(departmentId)
    if (positionId) emp.position_id = Number(positionId)
    if (employmentStatus) emp.employment_status = employmentStatus
    if (territory) emp.territory = territory

    const u = (memoryStore.users || []).find((user) => user.id === emp.user_id)
    if (u && (firstName || lastName)) {
      u.full_name = `${emp.first_name} ${emp.last_name}`
    }

    return res.json({ success: true, message: 'Employee profile updated successfully', data: emp })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 5. ARCHIVE EMPLOYEE
export const archiveEmployee = async (req, res) => {
  try {
    const { id } = req.params
    const emp = (memoryStore.employees || []).find((e) => String(e.id) === String(id) || String(e.user_id) === String(id))
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' })

    emp.employment_status = 'archived'
    const u = (memoryStore.users || []).find((user) => user.id === emp.user_id)
    if (u) u.status = 'inactive'

    return res.json({ success: true, message: `Employee "${emp.first_name} ${emp.last_name}" archived successfully` })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 6. GET ORG CHART
export const getOrgChart = async (req, res) => {
  try {
    const departments = memoryStore.departments || []
    const employees = memoryStore.employees || []
    const users = memoryStore.users || []

    const chart = departments.map((d) => {
      const deptEmployees = employees.filter((e) => e.department_id === d.id).map((e) => {
        const u = users.find((usr) => usr.id === e.user_id) || {}
        return {
          id: e.id,
          name: `${e.first_name} ${e.last_name}`,
          email: u.email,
          role: u.role_code || 'STAFF',
          code: e.employee_code,
        }
      })
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        headCount: deptEmployees.length,
        employees: deptEmployees,
      }
    })

    return res.json({ success: true, data: chart })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
