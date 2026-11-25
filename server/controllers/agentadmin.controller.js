import { memoryStore } from '../config/db.js'

// 1. Dashboard KPIs
export const getDashboardKpis = async (req, res) => {
  const agents = memoryStore.employees.filter((e) => e.is_field_agent || e.is_sales_agent || e.department_id === 3)
  const totalAgents = agents.length
  const activeAgents = memoryStore.location_logs.filter((l) => l.status === 'checked_in' || l.status === 'active').length
  const offlineAgents = Math.max(0, totalAgents - activeAgents)

  const todayVisits = memoryStore.field_visits.length
  const completedVisits = memoryStore.field_visits.filter((v) => v.status === 'completed').length
  const pendingTasks = memoryStore.field_assignments.filter((t) => t.status !== 'COMPLETED').length

  const todayOrders = memoryStore.orders.length
  const orderAmount = memoryStore.orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const newCustomers = memoryStore.customers.length
  const paymentCollected = memoryStore.orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0)
  const outstandingPayments = orderAmount - paymentCollected

  const redFlagsCount = memoryStore.red_flags.filter((r) => r.status === 'Open').length

  return res.json({
    success: true,
    data: {
      totalAgents,
      activeAgents,
      offlineAgents,
      todayVisits,
      completedVisits,
      pendingTasks,
      todayOrders,
      orderAmount,
      visitsWithOrders: completedVisits,
      newCustomers,
      paymentCollected,
      outstandingPayments,
      redFlagsCount,
      currentTime: new Date().toISOString(),
      lastDataRefresh: new Date().toISOString(),
      activeGroup: memoryStore.groups[0]?.name || 'Lagos_Central_General',
    },
  })
}

// 2. Field Agents Directory & Profile
export const listFieldAgents = async (req, res) => {
  const agents = memoryStore.employees
    .filter((e) => e.is_field_agent || e.is_sales_agent || e.department_id === 3 || e.position_id === 4 || e.position_id === 5)
    .map((emp) => {
      const u = memoryStore.users.find((user) => user.id === emp.user_id) || {}
      const lastPing = memoryStore.location_logs.find((l) => String(l.user_id) === String(emp.user_id))
      return {
        id: emp.id,
        userId: emp.user_id,
        employeeId: emp.employee_code,
        name: `${emp.first_name} ${emp.last_name}`,
        phone: emp.phone || u.phone || '+2348000000000',
        email: u.email || '',
        group: memoryStore.groups[0]?.name || 'Lagos_Central_General',
        region: 'South West',
        territory: 'Lagos Island - Broad St',
        status: lastPing ? (lastPing.status === 'checked_in' ? 'On Visit' : 'Active') : 'Offline',
        clockStatus: lastPing ? 'Clocked In' : 'Not Clocked In',
        currentLocation: lastPing ? `${lastPing.latitude.toFixed(4)}, ${lastPing.longitude.toFixed(4)}` : 'Lagos HQ',
        battery: 85,
        todayVisits: memoryStore.field_visits.filter((v) => String(v.agentId) === String(emp.user_id)).length,
        todayOrders: memoryStore.orders.filter((o) => String(o.agentId) === String(emp.user_id)).length,
        performanceScore: '94%',
      }
    })

  return res.json({ success: true, data: agents })
}

export const getFieldAgentProfile = async (req, res) => {
  const { id } = req.params
  const emp = memoryStore.employees.find((e) => String(e.id) === String(id) || String(e.user_id) === String(id))
  if (!emp) return res.status(404).json({ success: false, message: 'Agent not found' })

  const u = memoryStore.users.find((user) => user.id === emp.user_id) || {}
  const agentVisits = memoryStore.field_visits.filter((v) => String(v.agentId) === String(emp.user_id))
  const agentOrders = memoryStore.orders.filter((o) => String(o.agentId) === String(emp.user_id))
  const agentTasks = memoryStore.field_assignments.filter((t) => String(t.assigned_to_employee_id) === String(emp.id))
  const agentExpenses = memoryStore.expenses.filter((e) => String(e.agentId) === String(emp.id) || String(e.agentId) === String(emp.user_id))

  return res.json({
    success: true,
    data: {
      profile: {
        id: emp.id,
        employeeCode: emp.employee_code,
        fullName: `${emp.first_name} ${emp.last_name}`,
        phone: emp.phone || u.phone,
        email: u.email,
        group: memoryStore.groups[0]?.name || 'Lagos_Central_General',
        region: 'South West',
        territory: 'Lagos Island - Broad St',
        status: 'Active',
        supervisor: 'Operations Supervisor',
      },
      todayActivity: {
        clockIn: '08:15 AM',
        clockOut: null,
        hoursWorked: '4.5h',
        visitsCount: agentVisits.length,
        completedVisits: agentVisits.filter((v) => v.status === 'completed').length,
        ordersCount: agentOrders.length,
        orderAmount: agentOrders.reduce((s, o) => s + (o.total || 0), 0),
        batteryLevel: '82%',
        distanceTravelledKm: 14.8,
        lastGpsUpdate: new Date().toISOString(),
      },
      visits: agentVisits,
      orders: agentOrders,
      tasks: agentTasks,
      expenses: agentExpenses,
    },
  })
}

// 3. Live Tracking
export const listLiveTracking = async (req, res) => {
  const agents = memoryStore.employees
    .filter((e) => e.is_field_agent || e.is_sales_agent || e.department_id === 3)
    .map((emp) => {
      const u = memoryStore.users.find((user) => user.id === emp.user_id) || {}
      const lastLog = memoryStore.location_logs.find((l) => String(l.user_id) === String(emp.user_id))
      return {
        id: emp.id,
        userId: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`,
        role: emp.is_field_agent ? 'FIELD_AGENT' : 'SALES_AGENT',
        status: lastLog ? (lastLog.status === 'checked_in' ? 'On Visit' : 'Active') : 'Offline',
        markerColor: lastLog ? (lastLog.status === 'checked_in' ? 'blue' : 'green') : 'red',
        latitude: lastLog?.latitude || 6.4544,
        longitude: lastLog?.longitude || 3.3947,
        currentCustomer: 'Gold Line Retail Mart',
        speed: lastLog?.speed || 0,
        battery: 84,
        lastSeen: lastLog?.recorded_at || new Date().toISOString(),
      }
    })

  return res.json({
    success: true,
    data: {
      agents,
      customerPins: memoryStore.customers.map((c) => ({
        id: c.id,
        name: c.name,
        lat: c.latitude || 6.4544,
        lng: c.longitude || 3.3947,
        balance: c.balance || 0,
      })),
      routes: memoryStore.routes,
    },
  })
}

// 4. Attendance & GPS Verification
export const listAttendance = async (req, res) => {
  const list = memoryStore.attendance.map((att) => {
    const emp = memoryStore.employees.find((e) => String(e.id) === String(att.employee_id))
    return {
      ...att,
      agentName: emp ? `${emp.first_name} ${emp.last_name}` : 'Field Agent',
      employeeCode: emp?.employee_code || 'EMP-0001',
      gpsVerified: true,
      clockInLocation: 'Lagos Island (6.4544, 3.3947)',
      clockOutLocation: att.clock_out_at ? 'Yaba Main Corridor (6.5167, 3.3833)' : '--',
      hoursWorked: att.work_minutes ? `${Math.floor(att.work_minutes / 60)}h ${att.work_minutes % 60}m` : '--',
    }
  })
  return res.json({ success: true, data: list })
}

// 5. Visits & Merchandising Reports (with photo evidence & competitor report)
export const listVisits = async (req, res) => {
  return res.json({ success: true, data: memoryStore.field_visits })
}

// 6. Expenses Management
export const listExpenses = async (req, res) => {
  return res.json({ success: true, data: memoryStore.expenses })
}

export const createExpense = async (req, res) => {
  const { category, amount, description } = req.body || {}
  const newExp = {
    id: `exp-${Date.now().toString().slice(-4)}`,
    agentId: req.authUser?.id || '1',
    agentName: req.authUser?.fullName || 'Field Agent',
    category: category || 'Transport',
    amount: Number(amount || 0),
    description: description || '',
    status: 'Pending',
    date: new Date().toISOString().slice(0, 10),
  }
  memoryStore.expenses.unshift(newExp)
  return res.status(201).json({ success: true, message: 'Expense submitted for approval', data: newExp })
}

export const reviewExpense = async (req, res) => {
  const { id } = req.params
  const { action } = req.body || {}
  const exp = memoryStore.expenses.find((e) => String(e.id) === String(id))
  if (exp) {
    exp.status = action === 'approve' ? 'Approved' : 'Rejected'
    exp.approver = req.authUser?.fullName || 'Agent Admin'
    exp.approvalDate = new Date().toISOString().slice(0, 10)
  }
  return res.json({ success: true, message: `Expense ${action}d!`, data: exp })
}

// 7. Red Flags & Anomaly Detection
export const listRedFlags = async (req, res) => {
  return res.json({ success: true, data: memoryStore.red_flags })
}

export const resolveRedFlag = async (req, res) => {
  const { id } = req.params
  const rf = memoryStore.red_flags.find((r) => String(r.id) === String(id))
  if (rf) {
    rf.status = 'Resolved'
    rf.resolvedBy = req.authUser?.fullName || 'Agent Admin'
    rf.resolvedAt = new Date().toISOString()
  }
  return res.json({ success: true, message: 'Red flag issue marked as resolved', data: rf })
}

// 8. Requests Management (Change Location, Stock Requests)
export const listRequests = async (req, res) => {
  return res.json({ success: true, data: memoryStore.requests })
}

export const updateRequestStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body || {}
  const reqItem = memoryStore.requests.find((r) => String(r.id) === String(id))
  if (reqItem) {
    reqItem.status = status || 'Approved'
  }
  return res.json({ success: true, message: `Request updated to ${status}`, data: reqItem })
}

// 9. Schedules & Route Planning
export const listSchedules = async (req, res) => {
  return res.json({ success: true, data: memoryStore.schedules })
}

export const createSchedule = async (req, res) => {
  const { agentId, customerName, date, time } = req.body || {}
  const emp = memoryStore.employees.find((e) => String(e.id) === String(agentId) || String(e.user_id) === String(agentId))
  const newSch = {
    id: `sch-${Date.now().toString().slice(-4)}`,
    agentId,
    agentName: emp ? `${emp.first_name} ${emp.last_name}` : 'Field Agent',
    customerName: customerName || 'Merchant Outlet',
    date: date || new Date().toISOString().slice(0, 10),
    time: time || '10:00',
    status: 'Scheduled',
  }
  memoryStore.schedules.push(newSch)
  return res.status(201).json({ success: true, message: 'Visit schedule created', data: newSch })
}

// 10. Operational Group Management
export const listGroups = async (req, res) => {
  return res.json({ success: true, data: memoryStore.groups })
}

export const createGroup = async (req, res) => {
  const { name, code, region, target } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' })
  }
  const cleanName = name.trim().replace(/\s+/g, '_')
  const newGroup = {
    id: `grp-${Date.now().toString().slice(-4)}`,
    name: cleanName,
    code: code || cleanName.slice(0, 5).toUpperCase(),
    region: region || 'South West',
    target: Number(target) || 500,
  }
  memoryStore.groups.push(newGroup)
  return res.status(201).json({ success: true, message: `Group ${cleanName} created!`, data: newGroup })
}
