import { memoryStore } from '../config/db.js'

export const listSalaryRecords = async (req, res) => {
  const list = memoryStore.salary_records.map((s) => {
    const emp = memoryStore.employees.find((e) => e.id === s.employee_id) || {}
    const dept = memoryStore.departments.find((d) => d.id === emp.department_id) || {}
    const pos = memoryStore.positions.find((p) => p.id === emp.position_id) || {}
    return {
      ...s,
      employee_name: `${emp.first_name || 'Staff'} ${emp.last_name || 'Member'}`,
      department_name: dept.name || 'Operations',
      position_title: pos.title || 'Staff',
    }
  })
  return res.json({ success: true, data: list })
}

export const listPayrollPeriods = async (req, res) => {
  return res.json({ success: true, data: [] })
}

export const createPayrollPeriod = async (req, res) => {
  return res.status(201).json({ success: true, message: 'Payroll run generated' })
}

export const listPayslips = async (req, res) => {
  return res.json({ success: true, data: [] })
}
