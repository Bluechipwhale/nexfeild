import { memoryStore } from '../config/db.js'

export const getFieldDashboard = async (req, res) => {
  const employeeId = String(req.authUser?.employeeId || req.authUser?.id || '1')
  const myAssignments = memoryStore.field_assignments.filter((a) => String(a.assigned_to_employee_id) === employeeId)
  const myVisits = memoryStore.field_visits.filter((v) => String(v.agentId) === String(req.authUser?.id))

  return res.json({
    success: true,
    data: {
      todayTasks: myAssignments.length,
      completedTasks: myAssignments.filter((a) => a.status === 'COMPLETED').length,
      pendingTasks: myAssignments.filter((a) => a.status !== 'COMPLETED').length,
      todayVisits: myVisits.length,
      completedVisits: myVisits.filter((v) => v.status === 'completed').length,
      activeRoutes: memoryStore.routes.length,
      activeVehicles: memoryStore.vehicles.filter((v) => v.status === 'active').length,
      targetProgress: '0%',
    },
  })
}

export const listRoutes = async (req, res) => {
  return res.json({ success: true, data: memoryStore.routes })
}

export const createRoute = async (req, res) => {
  const { name, marketId, agentId, supervisorId, startTime = '08:00', endTime = '17:00', waypoints = [] } = req.body || {}
  if (!name) return res.status(400).json({ success: false, message: 'Route name is required' })

  const marketObj = memoryStore.markets.find((m) => m.id === marketId)
  const agentObj = memoryStore.employees.find((e) => String(e.id) === String(agentId) || String(e.user_id) === String(agentId))

  const routeId = `route-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`
  const newRoute = {
    id: routeId,
    name: name.trim(),
    marketId: marketId || (memoryStore.markets[0]?.id || ''),
    marketName: marketObj?.name || 'Assigned Territory',
    agentId: agentId || '',
    agentName: agentObj ? `${agentObj.first_name} ${agentObj.last_name}` : 'Unassigned',
    supervisorId: supervisorId || '',
    startTime,
    endTime,
    completion: 0,
    status: 'active',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    waypoints: Array.isArray(waypoints) && waypoints.length > 0 ? waypoints : [
      { lat: 6.4501, lng: 3.3912, label: 'Start Point' },
      { lat: 6.4544, lng: 3.3947, label: 'Stop Point' },
    ],
    history: [],
    created_at: new Date().toISOString(),
  }
  memoryStore.routes.push(newRoute)
  return res.status(201).json({ success: true, message: 'Route created and assigned to agent successfully', data: newRoute })
}

export const listAssignments = async (req, res) => {
  const list = memoryStore.field_assignments.map((a) => {
    const emp = memoryStore.employees.find((e) => e.id === a.assigned_to_employee_id)
    return {
      ...a,
      agent_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Field Agent',
    }
  })
  return res.json({ success: true, data: list })
}

export const createAssignment = async (req, res) => {
  const { title, description, assignedToEmployeeId, customerName = 'Retail Outlet', priority = 'medium', dueDate } = req.body || {}
  if (!title) return res.status(400).json({ success: false, message: 'Assignment title is required' })

  const item = {
    id: memoryStore.field_assignments.length + 1,
    company_id: 1,
    title: title.trim(),
    description: description || '',
    assigned_to_employee_id: Number(assignedToEmployeeId || 1),
    customer_name: customerName,
    priority,
    status: 'ASSIGNED',
    due_date: dueDate || new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  }
  memoryStore.field_assignments.unshift(item)
  return res.status(201).json({ success: true, message: 'Field task assigned successfully', data: item })
}

export const updateAssignmentStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const item = memoryStore.field_assignments.find((a) => String(a.id) === String(id))
  if (item) {
    item.status = status
    if (status === 'COMPLETED') item.completed_at = new Date().toISOString()
  }
  return res.json({ success: true, message: 'Assignment status updated', data: item })
}

export const listVisits = async (req, res) => {
  const { date, status } = req.query || {}
  let visits = [...memoryStore.field_visits]
  if (date === 'today') {
    const todayStr = new Date().toISOString().slice(0, 10)
    visits = visits.filter((v) => (v.checkInAt || v.check_in_at || '').slice(0, 10) === todayStr || true)
  }
  if (status && status !== 'all') {
    visits = visits.filter((v) => (v.status || 'completed').toLowerCase() === status.toLowerCase())
  }
  return res.json({ success: true, data: visits })
}

export const recordVisit = async (req, res) => {
  const {
    customerId,
    routeId = '',
    notes = '',
    customerFeedback = '',
    proofPhotoUrl = '',
    stockStatus = 'Adequate',
    competitorReport = '',
    companyReport = '',
    latitude = 6.4544,
    longitude = 3.3947,
    durationMinutes = 15,
    orderId,
  } = req.body || {}

  if (!customerId) return res.status(400).json({ success: false, message: 'Customer selection is required' })

  const customer = memoryStore.customers.find((c) => c.id === customerId)
  const newVisit = {
    id: `VIS-${String(Date.now()).slice(-4)}`,
    customerId,
    customerName: customer?.name || 'Retail Outlet',
    routeId,
    agentId: String(req.authUser?.id || '1'),
    agentName: req.authUser?.fullName || 'Field Agent',
    checkInAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
    checkOutAt: new Date().toISOString(),
    durationMinutes: Number(durationMinutes),
    latitude: Number(latitude),
    longitude: Number(longitude),
    proofPhotoUrl: proofPhotoUrl || '',
    stockStatus,
    competitorReport,
    companyReport,
    notes,
    customerFeedback,
    orderId: orderId || null,
    status: 'completed',
    createdAt: new Date().toISOString(),
  }
  memoryStore.field_visits.unshift(newVisit)

  // Update telemetry log
  memoryStore.location_logs.unshift({
    id: memoryStore.location_logs.length + 1,
    user_id: req.authUser?.id || 1,
    user_name: req.authUser?.fullName || 'Field Agent',
    role: req.authUser?.roleCode || 'FIELD_AGENT',
    latitude: Number(latitude),
    longitude: Number(longitude),
    speed: 0,
    accuracy: 5,
    status: 'checked_in',
    recorded_at: new Date().toISOString(),
  })

  return res.status(201).json({ success: true, message: 'Visit and merchandising photo report recorded successfully!', data: newVisit })
}

export const listVehicles = async (req, res) => {
  return res.json({ success: true, data: memoryStore.vehicles })
}

export const createVehicle = async (req, res) => {
  const { registrationNumber, model, fuelLevel = 100, currentMileage = 0 } = req.body || {}
  const v = {
    id: `veh-${Date.now().toString().slice(-4)}`,
    registrationNumber,
    model,
    fuelLevel: Number(fuelLevel),
    currentMileage: Number(currentMileage),
    status: 'active',
  }
  memoryStore.vehicles.push(v)
  return res.status(201).json({ success: true, message: 'Fleet vehicle registered', data: v })
}
