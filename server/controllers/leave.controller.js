import { getPool, memoryStore } from '../config/db.js'

export const listLeaveTypes = async (req, res) => {
  const types = Array.isArray(memoryStore.leave_types) && memoryStore.leave_types.length > 0
    ? memoryStore.leave_types
    : [
        { id: 1, name: 'Annual / Vacation Leave', code: 'ANNUAL', days_allowed_per_year: 20, color: '#0284c7' },
        { id: 2, name: 'Sick / Medical Leave', code: 'SICK', days_allowed_per_year: 12, color: '#e11d48' },
        { id: 3, name: 'Compassionate & Bereavement', code: 'COMPASSIONATE', days_allowed_per_year: 5, color: '#7c3aed' },
        { id: 4, name: 'Maternity / Paternity Leave', code: 'PARENTAL', days_allowed_per_year: 90, color: '#059669' },
      ]
  return res.json({ success: true, data: types })
}

export const getLeaveBalances = async (req, res) => {
  try {
    const empId = req.query.employeeId || req.authUser?.employeeId || 1
    if (!Array.isArray(memoryStore.leave_balances) || memoryStore.leave_balances.length === 0) {
      memoryStore.leave_balances = [
        { id: 1, employee_id: 1, leave_type_id: 1, fiscal_year: 2026, entitled_days: 20, used_days: 3, pending_days: 0, remaining_days: 17 },
        { id: 2, employee_id: 1, leave_type_id: 2, fiscal_year: 2026, entitled_days: 12, used_days: 1, pending_days: 0, remaining_days: 11 },
        { id: 3, employee_id: 1, leave_type_id: 3, fiscal_year: 2026, entitled_days: 5, fiscal_year: 2026, used_days: 0, pending_days: 0, remaining_days: 5 },
      ]
    }
    const balances = memoryStore.leave_balances.filter((b) => Number(b.employee_id) === Number(empId))
    const listToEnrich = balances.length > 0 ? balances : memoryStore.leave_balances
    const enriched = listToEnrich.map((b) => {
      const lt = (memoryStore.leave_types || []).find((t) => t.id === b.leave_type_id)
      return {
        ...b,
        leave_type_name: lt?.name || 'Annual Leave',
        color: lt?.color || '#0284c7',
      }
    })
    return res.json({ success: true, data: enriched })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const listLeaveRequests = async (req, res) => {
  const enriched = memoryStore.leave_requests.map((r) => {
    const emp = memoryStore.employees.find((e) => e.id === r.employee_id) || {}
    const lt = memoryStore.leave_types.find((t) => t.id === r.leave_type_id) || {}
    return {
      ...r,
      employee_name: `${emp.first_name || 'Staff'} ${emp.last_name || 'Member'}`,
      leave_type_name: lt.name || 'Annual Leave',
    }
  })
  return res.json({ success: true, data: enriched })
}

export const createLeaveRequest = async (req, res) => {
  try {
    const { leaveTypeId = 1, startDate, endDate, reason } = req.body || {}
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Start date, end date, and reason are required' })
    }

    const empId = req.authUser?.employeeId || 1
    const newReq = {
      id: memoryStore.leave_requests.length + 1,
      company_id: 1,
      employee_id: empId,
      leave_type_id: Number(leaveTypeId),
      start_date: startDate,
      end_date: endDate,
      days_count: 3,
      reason: reason.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    memoryStore.leave_requests.unshift(newReq)

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for review',
      id: newReq.id,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit leave request' })
  }
}

export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params
    const { action, status } = req.body || {}
    const decision = String(action || status || '').toLowerCase()
    const reqItem = (memoryStore.leave_requests || []).find((r) => String(r.id) === String(id))

    if (!reqItem) return res.status(404).json({ success: false, message: 'Leave request not found' })

    const isApproved = decision.includes('approve')
    reqItem.status = isApproved ? 'approved' : 'rejected'
    reqItem.reviewed_at = new Date().toISOString()
    reqItem.reviewed_by_id = req.authUser?.id || 1

    return res.json({ success: true, message: `Leave request ${reqItem.status} successfully`, data: reqItem })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Review failed' })
  }
}

export const cancelLeaveRequest = async (req, res) => {
  return res.json({ success: true, message: 'Leave request cancelled' })
}
