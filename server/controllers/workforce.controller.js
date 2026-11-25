import { memoryStore } from '../config/db.js'

export const listAssignments = async (req, res) => {
  const list = memoryStore.field_assignments.map((a) => {
    const emp = memoryStore.employees.find((e) => e.id === a.assigned_to_employee_id) || {}
    return {
      ...a,
      agent_name: `${emp.first_name || 'John'} ${emp.last_name || 'Agent'}`,
    }
  })
  return res.json({ success: true, data: list })
}

export const createAssignment = async (req, res) => {
  const { title, customerName = 'Ikeja Hub' } = req.body || {}
  const item = {
    id: memoryStore.field_assignments.length + 1,
    title: title.trim(),
    assigned_to_employee_id: 2,
    customer_name: customerName,
    priority: 'medium',
    status: 'ASSIGNED',
  }
  memoryStore.field_assignments.push(item)
  return res.status(201).json({ success: true, message: 'Work order dispatched', id: item.id })
}

export const updateAssignmentStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const item = memoryStore.field_assignments.find((a) => String(a.id) === String(id))
  if (item) item.status = status
  return res.json({ success: true, message: 'Status updated' })
}

export const listFieldVisits = async (req, res) => {
  return res.json({ success: true, data: [] })
}

export const listVehicles = async (req, res) => {
  return res.json({ success: true, data: [] })
}
