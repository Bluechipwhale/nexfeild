import bcrypt from 'bcryptjs'
import { memoryStore, supabaseClient } from '../config/db.js'

// 1. LIST ALL CLIENT COMPANIES (FOR SUPER ADMIN)
export const listCompanies = async (req, res) => {
  try {
    const companies = Array.isArray(memoryStore.companies) ? memoryStore.companies : []
    const users = Array.isArray(memoryStore.users) ? memoryStore.users : []

    const formatted = companies.map((c) => {
      const companyUsers = users.filter((u) => u.company_id === c.id)
      return {
        ...c,
        user_count: companyUsers.length || c.user_count || 1,
        active_users_today: Math.round((companyUsers.length || c.user_count || 1) * 0.75),
      }
    })

    return res.json({ success: true, data: formatted })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to list client companies' })
  }
}

// 2. GET COMPANY DETAILS & USAGE
export const getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params
    const companies = Array.isArray(memoryStore.companies) ? memoryStore.companies : []
    const company = companies.find((c) => String(c.id) === String(id) || String(c.code).toLowerCase() === String(id).toLowerCase())

    if (!company) {
      return res.status(404).json({ success: false, message: 'Client company not found' })
    }

    const rawUsers = (memoryStore.users || []).filter((u) => u.company_id === company.id)
    const employees = (memoryStore.employees || []).filter((e) => e.company_id === company.id)
    const departments = (memoryStore.departments || []).filter((d) => d.company_id === company.id)

    const formattedUsers = rawUsers.map((u) => {
      const r = (memoryStore.roles || []).find((role) => role.id === u.role_id) || {}
      const e = employees.find((emp) => emp.user_id === u.id) || {}
      const d = departments.find((dept) => dept.id === e.department_id) || {}
      return {
        id: u.id,
        uuid: u.uuid,
        email: u.email,
        full_name: u.full_name,
        phone: u.phone,
        role_id: u.role_id,
        role_code: u.role_code || r.code || 'EMPLOYEE',
        role_name: r.name || (u.role_code === 'COMPANY_ADMIN' ? 'Company Administrator' : 'Staff Member'),
        employee_code: e.employee_code || `EMP-${u.id}`,
        first_name: e.first_name || u.full_name?.split(' ')[0] || '',
        last_name: e.last_name || u.full_name?.split(' ').slice(1).join(' ') || '',
        department_name: d.name || 'General',
        status: u.status || 'active',
        created_at: u.created_at,
      }
    })

    const roleStats = {
      totalUsers: formattedUsers.length,
      companyAdmins: formattedUsers.filter((u) => u.role_code === 'COMPANY_ADMIN').length,
      hrManagers: formattedUsers.filter((u) => u.role_code === 'HR_MANAGER' || u.role_code === 'HR_ADMIN').length,
      supervisors: formattedUsers.filter((u) => u.role_code === 'SUPERVISOR' || u.role_code === 'MANAGER').length,
      salesAgents: formattedUsers.filter((u) => u.role_code === 'SALES_AGENT').length,
      fieldAgents: formattedUsers.filter((u) => u.role_code === 'FIELD_AGENT').length,
      staff: formattedUsers.filter((u) => u.role_code === 'EMPLOYEE' || (!u.role_code && !u.is_super_admin)).length,
    }

    return res.json({
      success: true,
      data: {
        ...company,
        users: formattedUsers,
        employees,
        departments,
        stats: roleStats,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 2B. UPDATE COMPANY PROFILE (FOR SUPER ADMIN & COMPANY ADMIN)
export const updateCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      legalName,
      industry,
      contactPerson,
      phone,
      email,
      address,
      logoUrl,
      employeeLimit,
      salesAgentLimit,
      fieldAgentLimit,
      subscriptionPlan,
      renewalDate,
    } = req.body || {}

    const company = (memoryStore.companies || []).find((c) => String(c.id) === String(id) || String(c.code) === String(id))
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' })

    if (name && name.trim()) company.name = name.trim()
    if (legalName && legalName.trim()) company.legal_name = legalName.trim()
    if (industry && industry.trim()) company.industry = industry.trim()
    if (contactPerson && contactPerson.trim()) company.contact_person = contactPerson.trim()
    if (phone && phone.trim()) company.phone = phone.trim()
    if (email && email.trim()) company.email = email.trim()
    if (address && address.trim()) company.address = address.trim()
    if (logoUrl) company.logo_url = logoUrl
    if (employeeLimit !== undefined) company.employee_limit = Number(employeeLimit)
    if (salesAgentLimit !== undefined) company.sales_agent_limit = Number(salesAgentLimit)
    if (fieldAgentLimit !== undefined) company.field_agent_limit = Number(fieldAgentLimit)
    if (subscriptionPlan) company.subscription_plan = subscriptionPlan
    if (renewalDate) company.renewal_date = renewalDate

    return res.json({
      success: true,
      message: `Profile for "${company.name}" updated successfully!`,
      data: company,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 3. 6-STEP ONBOARDING WIZARD: REGISTER & CONFIGURE CLIENT COMPANY
export const onboardCompany = async (req, res) => {
  try {
    const {
      name,
      legalName,
      industry = 'Commercial Retail & Distribution',
      type = 'Client Organization',
      address = 'Lagos, Nigeria',
      phone = '+2348000000000',
      email = '',
      contactPerson = 'Managing Director',
      adminFullName = 'Company Administrator',
      adminEmail = '',
      adminPassword = '',
      subscriptionPlan = 'Commercial Sales + Field Force Enterprise',
      subscriptionStatus = 'active',
      startDate = new Date().toISOString().slice(0, 10),
      renewalDate = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      employeeLimit = 100,
      salesAgentLimit = 30,
      fieldAgentLimit = 30,
      enabledModules = ['sales', 'field_force', 'reports', 'ai'],
      rules = {},
      departments = ['Executive Leadership', 'Sales & Field Force', 'Human Resources'],
    } = req.body || {}

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' })
    }

    if (!adminEmail || !adminEmail.trim()) {
      return res.status(400).json({ success: false, message: 'Company Administrator email is required' })
    }

    if (!Array.isArray(memoryStore.companies)) {
      memoryStore.companies = []
    }
    if (!Array.isArray(memoryStore.users)) {
      memoryStore.users = []
    }
    if (!Array.isArray(memoryStore.employees)) {
      memoryStore.employees = []
    }
    if (!Array.isArray(memoryStore.departments)) {
      memoryStore.departments = []
    }

    const companyId = memoryStore.companies.length + 1
    const companyInitials = name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 3) || 'NXF'
    const companyCode = `NXF-${companyInitials}-${String(companyId).padStart(3, '0')}`

    const tempPassword = String(adminPassword || '').trim()
    if (tempPassword.length < 12) {
      return res.status(400).json({ success: false, message: 'Set an administrator password of at least 12 characters' })
    }
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(tempPassword, salt)

    // 1. Create Company Environment
    const newCompany = {
      id: companyId,
      uuid: `comp-${String(companyId).padStart(3, '0')}`,
      code: companyCode,
      name: name.trim(),
      legal_name: legalName ? legalName.trim() : `${name.trim()} Ltd`,
      industry: industry.trim(),
      type,
      email: email ? email.trim() : adminEmail.trim(),
      phone: phone.trim(),
      contact_person: contactPerson.trim(),
      address: address.trim(),
      currency: 'NGN',
      timezone: 'Africa/Lagos',
      subscription_plan: subscriptionPlan,
      subscription_status: subscriptionStatus,
      start_date: startDate,
      renewal_date: renewalDate,
      user_count: 1,
      employee_limit: Number(employeeLimit || 100),
      sales_agent_limit: Number(salesAgentLimit || 30),
      field_agent_limit: Number(fieldAgentLimit || 30),
      enabled_modules: Array.isArray(enabledModules) ? enabledModules : ['sales', 'field_force', 'reports'],
      rules: {
        gps_required: rules?.gps_required ?? true,
        photo_required: rules?.photo_required ?? true,
        geofence_required: rules?.geofence_required ?? true,
        target_system: rules?.target_system ?? true,
        commission_enabled: rules?.commission_enabled ?? true,
        approval_required: rules?.approval_required ?? true,
        signature_required: rules?.signature_required ?? true,
      },
      created_at: new Date().toISOString(),
    }

    memoryStore.companies.push(newCompany)

    // 2. Create Initial Company Administrator User
    const adminUserId = memoryStore.users.length + 1
    const newAdminUser = {
      id: adminUserId,
      uuid: `user-${String(adminUserId).padStart(4, '0')}`,
      company_id: companyId,
      email: adminEmail.trim().toLowerCase(),
      password_hash: passwordHash,
      full_name: adminFullName.trim() || `${name.trim()} Administrator`,
      phone: phone.trim(),
      role_id: 9, // COMPANY_ADMIN
      role_code: 'COMPANY_ADMIN',
      is_super_admin: 0,
      status: 'active',
      created_at: new Date().toISOString(),
    }
    memoryStore.users.push(newAdminUser)

    // 3. Create Initial Employee Record
    const newEmp = {
      id: memoryStore.employees.length + 1,
      uuid: `emp-${String(memoryStore.employees.length + 1).padStart(4, '0')}`,
      company_id: companyId,
      user_id: adminUserId,
      employee_code: `${companyInitials}-0001`,
      first_name: adminFullName.trim().split(' ')[0] || 'Admin',
      last_name: adminFullName.trim().split(' ').slice(1).join(' ') || 'Lead',
      gender: 'prefer_not_to_say',
      phone: phone.trim(),
      department_id: 1,
      position_id: 8,
      employment_type: 'full_time',
      employment_status: 'active',
      hire_date: startDate,
      is_field_agent: 0,
      is_sales_agent: 0,
    }
    memoryStore.employees.push(newEmp)

    // 4. Create Starter Departments
    departments.forEach((deptName, idx) => {
      memoryStore.departments.push({
        id: memoryStore.departments.length + 1,
        company_id: companyId,
        code: `${companyInitials}-D${idx + 1}`,
        name: deptName,
        description: `Department for ${deptName}`,
      })
    })

    return res.status(201).json({
      success: true,
      message: `Client organization "${newCompany.name}" onboarded and provisioned successfully!`,
      data: {
        company: newCompany,
        administrator: {
          email: newAdminUser.email,
          fullName: newAdminUser.full_name,
          temporaryPassword: tempPassword,
          activationLink: `http://localhost:3000?activateCompany=${newCompany.code}&email=${encodeURIComponent(newAdminUser.email)}`,
        },
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to onboard company' })
  }
}

// 4. UPDATE COMPANY MODULES & RULES
export const updateCompanyModules = async (req, res) => {
  try {
    const { id } = req.params
    const { enabledModules, rules, subscriptionPlan, renewalDate } = req.body || {}

    const company = (memoryStore.companies || []).find((c) => String(c.id) === String(id) || String(c.code) === String(id))
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' })

    if (Array.isArray(enabledModules)) {
      company.enabled_modules = enabledModules
    }
    if (rules && typeof rules === 'object') {
      company.rules = { ...company.rules, ...rules }
    }
    if (subscriptionPlan) company.subscription_plan = subscriptionPlan
    if (renewalDate) company.renewal_date = renewalDate

    return res.json({
      success: true,
      message: `Configuration for "${company.name}" updated successfully!`,
      data: company,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 5. UPDATE COMPANY STATUS (ACTIVATE / SUSPEND / DEACTIVATE)
export const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body || {}

    if (!['active', 'trial', 'suspended', 'deactivated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be active, trial, suspended, or deactivated' })
    }

    const company = (memoryStore.companies || []).find((c) => String(c.id) === String(id) || String(c.code) === String(id))
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' })

    company.subscription_status = status

    return res.json({
      success: true,
      message: `Company "${company.name}" status changed to ${status.toUpperCase()}`,
      data: company,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 6. RESET COMPANY ADMINISTRATOR PASSWORD / GENERATE ACTIVATION LINK
export const resetCompanyAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body || {}

    const company = (memoryStore.companies || []).find((c) => String(c.id) === String(id) || String(c.code) === String(id))
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' })

    const adminUser = (memoryStore.users || []).find((u) => u.company_id === company.id && u.role_code === 'COMPANY_ADMIN')
    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'Company administrator user not found' })
    }

    const tempPassword = String(newPassword || '').trim()
    if (tempPassword.length < 12) {
      return res.status(400).json({ success: false, message: 'Set a new administrator password of at least 12 characters' })
    }
    const salt = await bcrypt.genSalt(10)
    adminUser.password_hash = await bcrypt.hash(tempPassword, salt)

    return res.json({
      success: true,
      message: `Credentials reset for company administrator (${adminUser.email})`,
      data: {
        companyCode: company.code,
        adminEmail: adminUser.email,
        temporaryPassword: tempPassword,
        activationLink: `http://localhost:3000?activateCompany=${company.code}&email=${encodeURIComponent(adminUser.email)}`,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

// 7. SUPER ADMIN SAAS PLATFORM OVERVIEW DASHBOARD
export const getSaaSDashboard = async (req, res) => {
  try {
    const companies = Array.isArray(memoryStore.companies) ? memoryStore.companies : []
    const users = Array.isArray(memoryStore.users) ? memoryStore.users : []

    const totalCompanies = companies.length
    const activeCompanies = companies.filter((c) => c.subscription_status === 'active').length
    const trialCompanies = companies.filter((c) => c.subscription_status === 'trial').length
    const suspendedCompanies = companies.filter((c) => c.subscription_status === 'suspended').length
    const totalPlatformUsers = users.length
    const activeUsersToday = Math.round(totalPlatformUsers * 0.82)

    // Module adoption calculation
    const moduleCounts = {
      hr: 0,
      sales: 0,
      field_force: 0,
      attendance: 0,
      crm: 0,
      agent_training: 0,
      orders: 0,
      collections: 0,
    }

    companies.forEach((c) => {
      const mods = c.enabled_modules || []
      if (mods.includes('hr')) moduleCounts.hr++
      if (mods.includes('sales')) moduleCounts.sales++
      if (mods.includes('field_force')) moduleCounts.field_force++
      if (mods.includes('attendance')) moduleCounts.attendance++
      if (mods.includes('crm')) moduleCounts.crm++
      if (mods.includes('agent_training')) moduleCounts.agent_training++
      if (mods.includes('orders')) moduleCounts.orders++
      if (mods.includes('collections')) moduleCounts.collections++
    })

    const recentOnboardings = companies.slice(-4).reverse().map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      industry: c.industry,
      status: c.subscription_status,
      plan: c.subscription_plan,
      modules: c.enabled_modules,
      startDate: c.start_date,
    }))

    return res.json({
      success: true,
      data: {
        kpis: {
          totalCompanies,
          activeCompanies,
          trialCompanies,
          suspendedCompanies,
          totalPlatformUsers,
          activeUsersToday,
          companiesOnboarding: 2,
        },
        moduleAdoption: moduleCounts,
        recentOnboardings,
        companiesList: companies,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
