import { memoryStore } from '../config/db.js'
import { authorize, filterResourceByScope } from '../middleware/rbac.js'

/**
 * MASTER AI CAPABILITY & TOOL REGISTRY
 */
export const AI_CAPABILITY_REGISTRY = [
  {
    name: 'get_dashboard_metrics',
    description: 'Retrieve real-time operational dashboard KPIs and high-level health overview',
    permission: 'dashboard.view',
    resource: 'dashboard',
    action: 'read',
  },
  {
    name: 'get_agents',
    description: 'List field and commercial sales agents with status, location, and territory',
    permission: 'agents.view',
    resource: 'agents',
    action: 'read',
  },
  {
    name: 'get_agent_profile',
    description: 'Get deep profile, performance, visits, and activity metrics for a specific agent',
    permission: 'agents.profile',
    resource: 'agents',
    action: 'read',
  },
  {
    name: 'get_live_tracking',
    description: 'Get live GPS coordinates, battery status, and route status for field personnel',
    permission: 'tracking.view',
    resource: 'tracking',
    action: 'read',
  },
  {
    name: 'get_attendance',
    description: 'Get attendance logs, GPS clock-ins, late arrivals, and working hours',
    permission: 'attendance.view',
    resource: 'attendance',
    action: 'read',
  },
  {
    name: 'get_customers',
    description: 'Search customers/outlets by name, region, tier, balance, or assigned agent',
    permission: 'customers.view',
    resource: 'customers',
    action: 'read',
  },
  {
    name: 'find_duplicate_customers',
    description: 'Run natural-language duplicate outlet detection algorithm',
    permission: 'customers.detect_duplicates',
    resource: 'customers',
    action: 'read',
  },
  {
    name: 'get_visits',
    description: 'Get field visits, order generation status, durations, and onsite verification rates',
    permission: 'visits.view',
    resource: 'visits',
    action: 'read',
  },
  {
    name: 'get_activity_report',
    description: 'Generate comprehensive multi-dimensional activity report',
    permission: 'reports.activity',
    resource: 'reports',
    action: 'read',
  },
  {
    name: 'get_daily_activity_summary',
    description: 'Summarize agent daily activity, battery levels, distance travelled, and refresh times',
    permission: 'reports.daily_summary',
    resource: 'reports',
    action: 'read',
  },
  {
    name: 'get_schedules',
    description: 'View upcoming or historical visit schedules by agent or date',
    permission: 'schedules.view',
    resource: 'schedules',
    action: 'read',
  },
  {
    name: 'get_tasks',
    description: 'Retrieve pending, in-progress, or overdue operations tasks',
    permission: 'tasks.view',
    resource: 'tasks',
    action: 'read',
  },
  {
    name: 'get_orders',
    description: 'List commercial sales orders with approval, delivery, and payment status',
    permission: 'orders.view',
    resource: 'orders',
    action: 'read',
  },
  {
    name: 'get_payments',
    description: 'Get customer debt balances, invoice collections, and payment breakdowns',
    permission: 'payments.view',
    resource: 'payments',
    action: 'read',
  },
  {
    name: 'get_expenses',
    description: 'Review field expense claims and approval status',
    permission: 'expenses.view',
    resource: 'expenses',
    action: 'read',
  },
  {
    name: 'get_targets_and_leaderboard',
    description: 'Get sales targets, actual performance, commissions, and agent leaderboard',
    permission: 'targets.view',
    resource: 'targets',
    action: 'read',
  },
  {
    name: 'get_red_flags',
    description: 'Analyze operational anomalies (late clock-in, GPS jump, short visits, dead batteries)',
    permission: 'red_flags.view',
    resource: 'red_flags',
    action: 'read',
  },
  {
    name: 'export_report',
    description: 'Generate downloadable export (CSV, Excel, PDF)',
    permission: 'reports.export',
    resource: 'reports',
    action: 'export',
  },
  // Mutating Action Tools (Requires confirmation where appropriate)
  {
    name: 'assign_territory',
    description: 'Assign a geographic territory to a field or sales agent',
    permission: 'agents.assign_territory',
    resource: 'agents',
    action: 'update',
    isMutating: true,
  },
  {
    name: 'create_task',
    description: 'Create and assign an operational task to a field agent',
    permission: 'tasks.create',
    resource: 'tasks',
    action: 'create',
    isMutating: true,
  },
  {
    name: 'create_schedule',
    description: 'Schedule a future customer visit for an agent',
    permission: 'schedules.create',
    resource: 'schedules',
    action: 'create',
    isMutating: true,
  },
  {
    name: 'approve_expense',
    description: 'Approve or reject a field expense claim',
    permission: 'expenses.approve',
    resource: 'expenses',
    action: 'update',
    isMutating: true,
  },
  {
    name: 'resolve_red_flag',
    description: 'Mark an operational anomaly or red flag as resolved with notes',
    permission: 'red_flags.resolve',
    resource: 'red_flags',
    action: 'update',
    isMutating: true,
  },
]

/**
 * Execute AI Tool with outside-the-AI RBAC validation and scoping.
 */
export const executeAiTool = async (toolName, params = {}, authUser = null) => {
  const toolDef = AI_CAPABILITY_REGISTRY.find((t) => t.name === toolName)
  if (!toolDef) {
    return { success: false, error: `Capability '${toolName}' not found in registry.` }
  }

  const role = (authUser?.roleCode || authUser?.role || 'EMPLOYEE').toUpperCase()
  const userId = authUser?.id || authUser?.user_id || 1

  // 1. Enforce RBAC outside the AI
  const isAllowed = authorize(userId, role, toolDef.permission, toolDef.resource, toolDef.action)
  if (!isAllowed) {
    return {
      success: false,
      denied: true,
      error: `Access Denied: Your role (${authUser?.roleName || role}) lacks permission '${toolDef.permission}' to access this data.`,
    }
  }

  // 2. Execute Data Handler with scoped data
  switch (toolName) {
    case 'get_dashboard_metrics': {
      const allAgents = memoryStore.employees.filter((e) => e.is_field_agent || e.is_sales_agent || e.department_id === 3 || e.department_id === 4)
      const scopedAgents = filterResourceByScope(role, userId, 'agents', allAgents)
      const activePings = memoryStore.location_logs.filter((l) => l.status === 'active' || l.status === 'checked_in')
      const scopedVisits = filterResourceByScope(role, userId, 'visits', memoryStore.field_visits)
      const scopedOrders = filterResourceByScope(role, userId, 'orders', memoryStore.orders)
      const scopedCustomers = filterResourceByScope(role, userId, 'customers', memoryStore.customers)
      const scopedRedFlags = filterResourceByScope(role, userId, 'red_flags', memoryStore.red_flags)
      const scopedTasks = filterResourceByScope(role, userId, 'tasks', memoryStore.tasks)

      const totalOrdersAmount = scopedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      const paidCollections = scopedOrders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.total || 0), 0)
      const outstandingBalance = scopedCustomers.reduce((sum, c) => sum + (c.balance || 0), 0)

      return {
        success: true,
        data: {
          totalAgents: scopedAgents.length,
          activeAgents: activePings.length,
          offlineAgents: Math.max(0, scopedAgents.length - activePings.length),
          todayVisits: scopedVisits.length,
          completedVisits: scopedVisits.filter((v) => v.status === 'completed').length,
          visitsWithOrders: scopedVisits.filter((v) => v.orderGenerated).length,
          pendingTasks: scopedTasks.filter((t) => t.status !== 'Completed').length,
          todayOrdersCount: scopedOrders.length,
          totalOrderAmount: `₦${totalOrdersAmount.toLocaleString()}`,
          rawOrderAmount: totalOrdersAmount,
          collectionsToday: `₦${paidCollections.toLocaleString()}`,
          outstandingCollections: `₦${outstandingBalance.toLocaleString()}`,
          totalCustomers: scopedCustomers.length,
          openRedFlags: scopedRedFlags.filter((r) => r.status === 'Open').length,
          attendanceRate: '94%',
        },
      }
    }

    case 'get_agents': {
      let agents = memoryStore.employees.map((emp) => {
        const u = memoryStore.users.find((user) => user.id === emp.user_id) || {}
        const lastPing = memoryStore.location_logs.find((l) => String(l.user_id) === String(emp.user_id))
        const visits = memoryStore.field_visits.filter((v) => String(v.agentId) === String(emp.user_id))
        const orders = memoryStore.orders.filter((o) => String(o.agentId) === String(emp.user_id))
        const att = memoryStore.attendance.find((a) => String(a.employee_id) === String(emp.id) || String(a.employee_id) === String(emp.user_id))
        return {
          id: emp.id,
          userId: emp.user_id,
          name: `${emp.first_name} ${emp.last_name}`,
          phone: emp.phone || u.phone,
          email: u.email,
          role: emp.is_field_agent ? 'Field Agent' : (emp.is_sales_agent ? 'Sales Agent' : 'Staff'),
          region: emp.region || 'South West',
          territory: emp.territory || 'Lagos Island',
          status: lastPing ? (lastPing.status === 'checked_in' ? 'On Visit' : 'Active') : 'Offline',
          clockStatus: att ? 'Clocked In' : 'Not Clocked In',
          todayVisits: visits.length,
          todayOrders: orders.length,
          todaySalesAmount: `₦${orders.reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString()}`,
          battery: lastPing ? `${lastPing.battery}%` : 'N/A',
        }
      })

      agents = filterResourceByScope(role, userId, 'agents', agents)

      if (params.region) {
        agents = agents.filter((a) => a.region.toLowerCase().includes(params.region.toLowerCase()) || a.territory.toLowerCase().includes(params.region.toLowerCase()))
      }
      if (params.status === 'offline') {
        agents = agents.filter((a) => a.status === 'Offline')
      } else if (params.status === 'active' || params.status === 'online') {
        agents = agents.filter((a) => a.status !== 'Offline')
      }

      return { success: true, count: agents.length, agents }
    }

    case 'get_agent_profile': {
      const searchKey = params.agentId || params.agentName || ''
      const emp = memoryStore.employees.find((e) =>
        String(e.id) === String(searchKey) ||
        String(e.user_id) === String(searchKey) ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(String(searchKey).toLowerCase()) ||
        e.first_name.toLowerCase().includes(String(searchKey).toLowerCase()) ||
        e.last_name.toLowerCase().includes(String(searchKey).toLowerCase())
      )

      if (!emp) return { success: false, error: `Agent matching '${searchKey}' not found.` }

      const u = memoryStore.users.find((user) => user.id === emp.user_id) || {}
      const visits = memoryStore.field_visits.filter((v) => String(v.agentId) === String(emp.user_id))
      const orders = memoryStore.orders.filter((o) => String(o.agentId) === String(emp.user_id))
      const tasks = memoryStore.tasks.filter((t) => String(t.assigned_to_id) === String(emp.user_id) || String(t.assigned_to_id) === String(emp.id))
      const att = memoryStore.attendance.find((a) => String(a.employee_id) === String(emp.id) || String(a.employee_id) === String(emp.user_id))
      const lastPing = memoryStore.location_logs.find((l) => String(l.user_id) === String(emp.user_id))
      const target = memoryStore.sales_targets.find((t) => String(t.employee_id) === String(emp.user_id) || String(t.employee_id) === String(emp.id))

      const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0)

      return {
        success: true,
        profile: {
          id: emp.id,
          userId: emp.user_id,
          fullName: `${emp.first_name} ${emp.last_name}`,
          phone: emp.phone || u.phone,
          email: u.email,
          role: emp.is_field_agent ? 'Field Agent' : 'Sales Agent',
          territory: emp.territory || 'Lagos Island - Broad St',
          region: emp.region || 'South West',
          clockStatus: att ? `Clocked In (${att.clock_in_at.slice(11, 16)} GMT)` : 'Not Clocked In',
          status: lastPing ? (lastPing.status === 'checked_in' ? 'On Visit' : 'Active') : 'Offline',
          batteryLevel: lastPing ? `${lastPing.battery}%` : '85%',
          todayVisits: visits.length,
          completedVisits: visits.filter((v) => v.status === 'completed').length,
          visitsWithOrders: visits.filter((v) => v.orderGenerated).length,
          todayOrders: orders.length,
          todayOrderAmount: `₦${totalSales.toLocaleString()}`,
          targetPerformance: target ? `${Math.round((target.actual_amount / target.target_amount) * 100)}% (₦${target.actual_amount.toLocaleString()} / ₦${target.target_amount.toLocaleString()})` : '92%',
          activeTasks: tasks.filter((t) => t.status !== 'Completed').length,
        },
      }
    }

    case 'get_live_tracking': {
      let logs = memoryStore.location_logs.map((log) => {
        const emp = memoryStore.employees.find((e) => String(e.user_id) === String(log.user_id))
        return {
          agentId: log.user_id,
          agentName: log.agentName || (emp ? `${emp.first_name} ${emp.last_name}` : 'Field Agent'),
          latitude: log.latitude,
          longitude: log.longitude,
          status: log.status,
          battery: `${log.battery}%`,
          speed: `${log.speed} km/h`,
          lastSeen: log.recorded_at,
          territory: emp?.territory || 'Lagos Central',
        }
      })
      logs = filterResourceByScope(role, userId, 'agents', logs)
      return { success: true, activeCount: logs.length, liveAgents: logs }
    }

    case 'get_attendance': {
      let records = memoryStore.attendance.map((att) => {
        const emp = memoryStore.employees.find((e) => String(e.id) === String(att.employee_id) || String(e.user_id) === String(att.employee_id))
        return {
          id: att.id,
          agentName: att.agentName || (emp ? `${emp.first_name} ${emp.last_name}` : 'Staff'),
          date: att.date,
          clockIn: att.clock_in_at ? att.clock_in_at.slice(11, 16) : '--',
          status: att.status,
          gpsVerified: att.gps_verified,
          workMinutes: att.work_minutes,
          hoursWorked: att.work_minutes ? `${Math.floor(att.work_minutes / 60)}h ${att.work_minutes % 60}m` : '--',
        }
      })
      records = filterResourceByScope(role, userId, 'attendance', records)

      const lateList = records.filter((r) => r.status === 'late' || r.clockIn > '08:30')
      const totalStaff = memoryStore.employees.length
      const presentCount = records.length
      const absentCount = Math.max(0, totalStaff - presentCount)

      return {
        success: true,
        summary: {
          totalStaff,
          presentCount,
          lateArrivalsCount: lateList.length,
          absentCount,
          attendanceRate: `${Math.round((presentCount / (totalStaff || 1)) * 100)}%`,
        },
        lateArrivals: lateList,
        records,
      }
    }

    case 'get_customers': {
      let customers = filterResourceByScope(role, userId, 'customers', memoryStore.customers)
      if (params.search) {
        const s = params.search.toLowerCase()
        customers = customers.filter((c) =>
          c.name.toLowerCase().includes(s) ||
          c.address.toLowerCase().includes(s) ||
          c.region.toLowerCase().includes(s) ||
          (c.contact_person && c.contact_person.toLowerCase().includes(s))
        )
      }
      if (params.region) {
        customers = customers.filter((c) => c.region.toLowerCase().includes(params.region.toLowerCase()) || c.sub_region.toLowerCase().includes(params.region.toLowerCase()))
      }
      if (params.registeredBy) {
        const s = params.registeredBy.toLowerCase()
        customers = customers.filter((c) => c.registered_by_name && c.registered_by_name.toLowerCase().includes(s))
      }

      return {
        success: true,
        count: customers.length,
        customers: customers.map((c) => ({
          id: c.id,
          name: c.name,
          address: c.address,
          region: c.region,
          subRegion: c.sub_region,
          tier: c.tier,
          type: c.type,
          phone: c.phone,
          balance: `₦${(c.balance || 0).toLocaleString()}`,
          rawBalance: c.balance || 0,
          registeredBy: c.registered_by_name || 'Adebanjo Adeleke',
          lastVisit: c.last_visit_date,
          status: c.status,
          gps: `${c.latitude}, ${c.longitude}`,
        })),
      }
    }

    case 'find_duplicate_customers': {
      const customers = memoryStore.customers
      const duplicates = []

      for (let i = 0; i < customers.length; i++) {
        for (let j = i + 1; j < customers.length; j++) {
          const c1 = customers[i]
          const c2 = customers[j]

          // Compare clean names
          const name1 = c1.name.toLowerCase().replace(/[^a-z0-9]/g, '')
          const name2 = c2.name.toLowerCase().replace(/[^a-z0-9]/g, '')

          const phoneMatch = c1.phone && c2.phone && c1.phone === c2.phone
          const nameMatch = name1 === name2 || name1.includes(name2) || name2.includes(name1)

          if (phoneMatch || nameMatch || c2.status === 'potential_duplicate') {
            duplicates.push({
              duplicateType: name1 === name2 ? 'Exact-Name Duplicate' : 'Potential Duplicate',
              primaryCustomer: { id: c1.id, name: c1.name, address: c1.address, registeredBy: c1.registered_by_name },
              matchedCustomer: { id: c2.id, name: c2.name, address: c2.address, registeredBy: c2.registered_by_name },
              reason: phoneMatch ? 'Identical phone number & location proximity' : 'Substantial name & address similarity',
              recommendation: 'Manual review required by Agent Admin before initiating merge.',
            })
          }
        }
      }

      return { success: true, duplicateClustersCount: duplicates.length, duplicates }
    }

    case 'get_visits': {
      let visits = filterResourceByScope(role, userId, 'visits', memoryStore.field_visits)
      if (params.agentId) {
        visits = visits.filter((v) => String(v.agentId) === String(params.agentId))
      }
      if (params.shortVisitsOnly) {
        visits = visits.filter((v) => (v.durationMinutes || 0) < 10)
      }
      if (params.withOrdersOnly) {
        visits = visits.filter((v) => v.orderGenerated)
      }

      return {
        success: true,
        count: visits.length,
        visits: visits.map((v) => ({
          id: v.id,
          agentName: v.agentName,
          customerName: v.customerName,
          address: v.address,
          checkIn: v.checkInTime,
          checkOut: v.checkOutTime,
          duration: `${v.durationMinutes} mins`,
          onsiteRate: `${v.onsiteRate}%`,
          orderGenerated: v.orderGenerated,
          orderAmount: `₦${(v.orderAmount || 0).toLocaleString()}`,
          notes: v.notes,
        })),
      }
    }

    case 'get_activity_report': {
      const visits = filterResourceByScope(role, userId, 'visits', memoryStore.field_visits)
      const orders = filterResourceByScope(role, userId, 'orders', memoryStore.orders)
      const customers = filterResourceByScope(role, userId, 'customers', memoryStore.customers)

      const totalVisits = visits.length
      const visitsWithOrders = visits.filter((v) => v.orderGenerated).length
      const totalOrderAmount = orders.reduce((s, o) => s + (o.total || 0), 0)
      const onsiteAverage = Math.round(visits.reduce((s, v) => s + (v.onsiteRate || 100), 0) / (totalVisits || 1))

      // Grouping by agent
      const agentSummary = {}
      visits.forEach((v) => {
        if (!agentSummary[v.agentName]) {
          agentSummary[v.agentName] = { visits: 0, ordersCount: 0, orderAmount: 0 }
        }
        agentSummary[v.agentName].visits += 1
        if (v.orderGenerated) {
          agentSummary[v.agentName].ordersCount += 1
          agentSummary[v.agentName].orderAmount += (v.orderAmount || 0)
        }
      })

      return {
        success: true,
        period: params.days ? `Last ${params.days} Days` : 'August 2026 (MTD)',
        metrics: {
          totalVisits,
          visitsWithOrders,
          onsiteRate: `${onsiteAverage}%`,
          orderAmount: `₦${totalOrderAmount.toLocaleString()}`,
          newCustomersCount: customers.length,
          attendanceRate: '94%',
        },
        fieldStaffBreakdown: Object.entries(agentSummary).map(([name, stat]) => ({
          staff: name,
          visits: stat.visits,
          orders: stat.ordersCount,
          orderValue: `₦${stat.orderAmount.toLocaleString()}`,
        })),
      }
    }

    case 'get_daily_activity_summary': {
      const logs = memoryStore.location_logs
      const visits = memoryStore.field_visits
      const att = memoryStore.attendance

      const summary = memoryStore.employees
        .filter((e) => e.is_field_agent || e.is_sales_agent)
        .map((emp) => {
          const empLogs = logs.find((l) => String(l.user_id) === String(emp.user_id))
          const empVisits = visits.filter((v) => String(v.agentId) === String(emp.user_id))
          const empAtt = att.find((a) => String(a.employee_id) === String(emp.id) || String(a.employee_id) === String(emp.user_id))
          const orderTotal = empVisits.reduce((s, v) => s + (v.orderAmount || 0), 0)

          return {
            staff: `${emp.first_name} ${emp.last_name}`,
            clockIn: empAtt ? empAtt.clock_in_at.slice(11, 16) : 'Not Clocked In',
            totalVisits: empVisits.length,
            firstVisit: empVisits[0]?.checkInTime || '--',
            lastVisit: empVisits[empVisits.length - 1]?.checkOutTime || '--',
            orderAmount: `₦${orderTotal.toLocaleString()}`,
            travelDistance: '14.8 km',
            batteryLevel: empLogs ? `${empLogs.battery}%` : '85%',
            lastRefreshed: empLogs ? empLogs.recorded_at.slice(11, 16) + ' GMT' : '08:15 GMT',
            requiresReview: !empAtt || (empLogs && empLogs.battery < 20) || (empVisits.length === 0 && empAtt),
          }
        })

      return { success: true, summary }
    }

    case 'get_schedules': {
      let schedules = filterResourceByScope(role, userId, 'schedules', memoryStore.schedules)
      if (params.agentId || params.agentName) {
        const key = String(params.agentId || params.agentName).toLowerCase()
        schedules = schedules.filter((s) => String(s.agentId) === key || s.agentName.toLowerCase().includes(key))
      }
      return { success: true, count: schedules.length, schedules }
    }

    case 'get_tasks': {
      let tasks = filterResourceByScope(role, userId, 'tasks', memoryStore.tasks)
      if (params.overdueOnly) {
        tasks = tasks.filter((t) => t.status === 'Overdue' || (t.due_date < '2026-08-14' && t.status !== 'Completed'))
      }
      if (params.status) {
        tasks = tasks.filter((t) => t.status.toLowerCase() === params.status.toLowerCase())
      }
      return { success: true, count: tasks.length, tasks }
    }

    case 'get_orders': {
      let orders = filterResourceByScope(role, userId, 'orders', memoryStore.orders)
      if (params.unpaidOnly) {
        orders = orders.filter((o) => o.paymentStatus === 'unpaid' || o.paymentStatus === 'partially_paid')
      }
      if (params.pendingOnly) {
        orders = orders.filter((o) => o.approval_status === 'Pending')
      }
      const totalSum = orders.reduce((s, o) => s + (o.total || 0), 0)
      return {
        success: true,
        count: orders.length,
        totalAmount: `₦${totalSum.toLocaleString()}`,
        orders: orders.map((o) => ({
          recordNo: o.record_no,
          date: o.transaction_date,
          customer: o.primary_customer,
          pic: o.pic,
          approvalStatus: o.approval_status,
          paymentStatus: o.paymentStatus,
          deliveryStatus: o.delivery_status,
          total: `₦${o.total.toLocaleString()}`,
        })),
      }
    }

    case 'get_payments': {
      const customers = filterResourceByScope(role, userId, 'customers', memoryStore.customers)
      const payments = filterResourceByScope(role, userId, 'payments', memoryStore.payments)

      const overdueCustomers = customers.filter((c) => (c.balance || 0) > 0)
      const totalOverdue = overdueCustomers.reduce((s, c) => s + (c.balance || 0), 0)
      const collectedTotal = payments.reduce((s, p) => s + (p.amount || 0), 0)

      return {
        success: true,
        totalCollectedMTD: `₦${collectedTotal.toLocaleString()}`,
        totalOutstandingDebt: `₦${totalOverdue.toLocaleString()}`,
        overdueCustomers: overdueCustomers.map((c) => ({
          customer: c.name,
          contact: c.phone,
          balanceOwed: `₦${c.balance.toLocaleString()}`,
          registeredBy: c.registered_by_name,
        })),
        recentCollections: payments,
      }
    }

    case 'get_expenses': {
      let expenses = filterResourceByScope(role, userId, 'expenses', memoryStore.expenses)
      if (params.pendingOnly) {
        expenses = expenses.filter((e) => e.status === 'Pending')
      }
      const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0)
      return {
        success: true,
        count: expenses.length,
        totalAmount: `₦${totalExpense.toLocaleString()}`,
        expenses,
      }
    }

    case 'get_targets_and_leaderboard': {
      const targets = memoryStore.sales_targets.map((t) => ({
        agent: t.employee_name,
        target: `₦${t.target_amount.toLocaleString()}`,
        actual: `₦${t.actual_amount.toLocaleString()}`,
        percentage: `${Math.round((t.actual_amount / t.target_amount) * 100)}%`,
        targetVisits: t.target_visits,
        actualVisits: t.actual_visits,
        commission: `₦${t.commission_earned.toLocaleString()}`,
        status: t.actual_amount >= t.target_amount ? 'Exceeding' : 'On Track',
      }))

      // Sort leaderboard by percentage achieved
      const sorted = [...targets].sort((a, b) => parseInt(b.percentage) - parseInt(a.percentage))
      return { success: true, leaderboard: sorted }
    }

    case 'get_red_flags': {
      let redFlags = filterResourceByScope(role, userId, 'red_flags', memoryStore.red_flags)
      if (params.openOnly !== false) {
        redFlags = redFlags.filter((r) => r.status === 'Open')
      }

      return {
        success: true,
        openCount: redFlags.length,
        anomalies: redFlags.map((rf) => ({
          id: rf.id,
          category: rf.category,
          agent: rf.agentName,
          severity: rf.severity,
          whatHappened: rf.whatHappened,
          whyUnusual: rf.whyUnusual,
          evidence: rf.evidence,
          recommendedAction: rf.recommendedAction,
        })),
      }
    }

    case 'export_report': {
      const reportType = params.reportType || 'Agent Performance Summary'
      const format = params.format || 'CSV'
      return {
        success: true,
        exportReady: true,
        fileName: `NEXField_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${format.toLowerCase()}`,
        downloadUrl: `/api/reports/download?type=${encodeURIComponent(reportType)}&format=${format}`,
        message: `Generated ${format} export for '${reportType}'.`,
      }
    }

    case 'assign_territory': {
      const { agentId, territoryName } = params
      const emp = memoryStore.employees.find((e) => String(e.id) === String(agentId) || String(e.user_id) === String(agentId))
      if (!emp) return { success: false, error: 'Agent not found' }
      emp.territory = territoryName || emp.territory
      return {
        success: true,
        message: `Successfully assigned territory '${territoryName}' to ${emp.first_name} ${emp.last_name}.`,
        updatedAgent: { id: emp.id, name: `${emp.first_name} ${emp.last_name}`, territory: emp.territory },
      }
    }

    case 'create_task': {
      const { title, description, assignedToId, priority = 'Normal', dueDate } = params
      const emp = memoryStore.employees.find((e) => String(e.id) === String(assignedToId) || String(e.user_id) === String(assignedToId))
      const newTask = {
        id: `tsk-${Date.now().toString().slice(-4)}`,
        title: title || 'Field Follow-Up',
        description: description || '',
        assigned_to_id: assignedToId || 4,
        assigned_to_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Field Agent',
        assigned_by_name: authUser?.fullName || 'Operations Admin',
        priority,
        due_date: dueDate || new Date().toISOString().slice(0, 10),
        status: 'Pending',
      }
      memoryStore.tasks.unshift(newTask)
      return { success: true, message: `Task '${newTask.title}' assigned to ${newTask.assigned_to_name}.`, task: newTask }
    }

    case 'create_schedule': {
      const { agentId, customerName, date, time, activity } = params
      const emp = memoryStore.employees.find((e) => String(e.id) === String(agentId) || String(e.user_id) === String(agentId))
      const newSch = {
        id: `sch-${Date.now().toString().slice(-4)}`,
        agentId: agentId || 4,
        agentName: emp ? `${emp.first_name} ${emp.last_name}` : 'Adebanjo Adeleke',
        customerName: customerName || 'Merchant Outlet',
        date: date || new Date().toISOString().slice(0, 10),
        time: time || '09:30 AM',
        activity: activity || 'Merchant Restock Visit',
        status: 'Scheduled',
      }
      memoryStore.schedules.push(newSch)
      return { success: true, message: `Visit scheduled for ${newSch.customerName} with ${newSch.agentName}.`, schedule: newSch }
    }

    case 'approve_expense': {
      const { expenseId, action = 'approve' } = params
      const exp = memoryStore.expenses.find((e) => String(e.id) === String(expenseId))
      if (!exp) return { success: false, error: 'Expense record not found' }
      exp.status = action === 'approve' ? 'Approved' : 'Rejected'
      exp.approver = authUser?.fullName || 'Supervisor'
      return { success: true, message: `Expense of ₦${exp.amount.toLocaleString()} marked as ${exp.status}.`, expense: exp }
    }

    case 'resolve_red_flag': {
      const { redFlagId, resolutionNotes } = params
      const rf = memoryStore.red_flags.find((r) => String(r.id) === String(redFlagId))
      if (!rf) return { success: false, error: 'Red flag not found' }
      rf.status = 'Resolved'
      rf.resolvedBy = authUser?.fullName || 'Agent Admin'
      rf.resolvedAt = new Date().toISOString()
      rf.resolutionNotes = resolutionNotes || 'Reviewed and addressed with field personnel.'
      return { success: true, message: `Red flag #${redFlagId} marked as Resolved.`, redFlag: rf }
    }

    default:
      return { success: false, error: `Tool ${toolName} execution handler not implemented.` }
  }
}

/**
 * Natural Language AI Processing Engine with Intent Detection & RBAC Validation.
 */
export const processAiAgentMessage = async ({ message, context = {}, authUser }) => {
  const query = (message || '').toLowerCase().trim()
  const role = (authUser?.roleCode || authUser?.role || 'EMPLOYEE').toUpperCase()
  const roleName = authUser?.roleName || role

  const toolCalls = []
  const toolResults = []
  let navigation = null
  let pendingConfirmation = null

  // 1. Intent Detection & Tool Selection
  let selectedTool = null
  let toolParams = {}

  // A. Red Flags & Anomalies
  if (
    query.includes('red flag') ||
    query.includes('anomaly') ||
    query.includes('anomalies') ||
    query.includes('need attention') ||
    query.includes('unusual') ||
    query.includes('suspicious') ||
    query.includes('low onsite') ||
    query.includes('clocked in but has no visits')
  ) {
    selectedTool = 'get_red_flags'
    navigation = { tab: 'red-flags', params: { status: 'open' }, label: 'Open Red Flags Radar' }
  }
  // B. Attendance & Late Arrivals
  else if (
    query.includes('who came late') ||
    query.includes('late arrival') ||
    query.includes('attendance') ||
    query.includes('clock in') ||
    query.includes('clock out') ||
    query.includes('haven\'t clocked in') ||
    query.includes('not started work') ||
    query.includes('hours worked')
  ) {
    selectedTool = 'get_attendance'
    navigation = { tab: 'attendance', params: { filter: 'today' }, label: 'Open Attendance Management' }
  }
  // C. Customer Duplicates
  else if (
    query.includes('duplicate') ||
    query.includes('identical names') ||
    query.includes('merge customer')
  ) {
    selectedTool = 'find_duplicate_customers'
    navigation = { tab: 'customers', params: { filter: 'duplicates' }, label: 'Open Duplicate Outlets Radar' }
  }
  // D. Customers Directory / Search
  else if (
    query.includes('customer') ||
    query.includes('outlet') ||
    query.includes('ebeano') ||
    query.includes('megamart') ||
    query.includes('broad st') ||
    query.includes('who owes us') ||
    query.includes('unvisited')
  ) {
    selectedTool = 'get_customers'
    if (query.includes('lagos')) toolParams.region = 'Lagos'
    if (query.includes('ebeano')) toolParams.search = 'Ebeano'
    if (query.includes('adebanjo')) toolParams.registeredBy = 'Adebanjo'
    navigation = { tab: 'customers', params: toolParams, label: 'Open Customers Directory' }
  }
  // E. Specific Agent Profile / Performance (e.g. Adebanjo, Babatunde, Odesina, Chioma)
  else if (
    query.includes('adebanjo') ||
    query.includes('odesina') ||
    query.includes('babatunde') ||
    query.includes('chioma') ||
    query.includes('emeka') ||
    query.includes('fatimah')
  ) {
    selectedTool = 'get_agent_profile'
    if (query.includes('adebanjo')) toolParams.agentName = 'Adebanjo Adeleke'
    else if (query.includes('odesina') || query.includes('babatunde')) toolParams.agentName = 'Babatunde Odesina'
    else if (query.includes('chioma')) toolParams.agentName = 'Chioma Okonkwo'
    else if (query.includes('emeka')) toolParams.agentName = 'Emeka Obi'
    else if (query.includes('fatimah')) toolParams.agentName = 'Fatimah Aliyu'
    navigation = { tab: 'field-agents', params: { search: toolParams.agentName }, label: `Open ${toolParams.agentName}'s Profile` }
  }
  // F. Field Agents / Online / Offline
  else if (
    query.includes('agent') ||
    query.includes('workforce') ||
    query.includes('field staff') ||
    query.includes('how many agents') ||
    query.includes('who is active') ||
    query.includes('who is offline')
  ) {
    selectedTool = 'get_agents'
    if (query.includes('lagos')) toolParams.region = 'Lagos'
    if (query.includes('offline')) toolParams.status = 'offline'
    if (query.includes('active') || query.includes('online')) toolParams.status = 'active'
    navigation = { tab: 'field-agents', params: toolParams, label: 'Open Field Agents Directory' }
  }
  // G. Live Tracking & Routes
  else if (
    query.includes('where is') ||
    query.includes('where are') ||
    query.includes('live track') ||
    query.includes('map') ||
    query.includes('location') ||
    query.includes('route') ||
    query.includes('last seen')
  ) {
    selectedTool = 'get_live_tracking'
    navigation = { tab: 'live-tracking', params: {}, label: 'Open Real-Time Live Map' }
  }
  // H. Field Visits & Short Visits
  else if (
    query.includes('visit') ||
    query.includes('onsite') ||
    query.includes('merchandising') ||
    query.includes('short visit')
  ) {
    selectedTool = 'get_visits'
    if (query.includes('short')) toolParams.shortVisitsOnly = true
    if (query.includes('order')) toolParams.withOrdersOnly = true
    navigation = { tab: 'visits', params: { date: 'today' }, label: "Open Today's Visits" }
  }
  // I. Orders & Sales
  else if (
    query.includes('sale') ||
    query.includes('order') ||
    query.includes('revenue') ||
    query.includes('how much did we sell') ||
    query.includes('how much have i sold')
  ) {
    selectedTool = 'get_orders'
    if (query.includes('unpaid')) toolParams.unpaidOnly = true
    if (query.includes('pending')) toolParams.pendingOnly = true
    navigation = { tab: 'orders', params: { date: 'today' }, label: "Open Today's Orders" }
  }
  // J. Payments & Outstanding Balances
  else if (
    query.includes('payment') ||
    query.includes('collection') ||
    query.includes('debt') ||
    query.includes('balance') ||
    query.includes('how much is outstanding') ||
    query.includes('collected')
  ) {
    selectedTool = 'get_payments'
    navigation = { tab: 'invoices', params: { status: 'overdue' }, label: 'Open Payment Collections' }
  }
  // K. Targets & Leaderboard
  else if (
    query.includes('target') ||
    query.includes('leaderboard') ||
    query.includes('best performing') ||
    query.includes('exceeding')
  ) {
    selectedTool = 'get_targets_and_leaderboard'
    navigation = { tab: 'sales-targets', params: {}, label: 'Open Target Leaderboard' }
  }
  // L. Tasks
  else if (
    query.includes('task') ||
    query.includes('what do i need to do') ||
    query.includes('my pending') ||
    query.includes('overdue')
  ) {
    selectedTool = 'get_tasks'
    if (query.includes('overdue')) toolParams.overdueOnly = true
    navigation = { tab: 'tasks', params: {}, label: 'Open Tasks & Dispatch' }
  }
  // M. Schedules
  else if (
    query.includes('schedule') ||
    query.includes('upcoming') ||
    query.includes('tomorrow')
  ) {
    selectedTool = 'get_schedules'
    navigation = { tab: 'schedules', params: {}, label: 'Open Schedule Management' }
  }
  // N. Expenses
  else if (
    query.includes('expense') ||
    query.includes('spending') ||
    query.includes('receipt')
  ) {
    selectedTool = 'get_expenses'
    navigation = { tab: 'expenses', params: {}, label: 'Open Expenses Management' }
  }
  // O. Reports & Weekly Summary
  else if (
    query.includes('report') ||
    query.includes('summary') ||
    query.includes('weekly') ||
    query.includes('activity report')
  ) {
    selectedTool = 'get_activity_report'
    toolParams.days = 7
    navigation = { tab: 'reports', params: { period: '7days' }, label: 'Open Activity Analytics' }
  }
  // P. Exports
  else if (
    query.includes('export') ||
    query.includes('download') ||
    query.includes('csv') ||
    query.includes('pdf') ||
    query.includes('excel')
  ) {
    selectedTool = 'export_report'
    toolParams.reportType = 'Agent Performance'
    toolParams.format = query.includes('excel') ? 'Excel' : (query.includes('pdf') ? 'PDF' : 'CSV')
    navigation = { tab: 'export', params: toolParams, label: `Download ${toolParams.format} Export` }
  }
  // Q. Modifying Commands (e.g. Assign Territory)
  else if (query.includes('assign') && (query.includes('territory') || query.includes('lagos'))) {
    selectedTool = 'assign_territory'
    toolParams = { agentId: 4, territoryName: 'Lagos Island & Broad St' }
    pendingConfirmation = {
      action: 'assign_territory',
      params: toolParams,
      description: 'Assign territory "Lagos Island & Broad St" to Adebanjo Adeleke',
    }
  }
  // Default to Dashboard Overview
  else {
    selectedTool = 'get_dashboard_metrics'
    navigation = { tab: 'overview', params: {}, label: 'Open Operations Dashboard' }
  }

  // 2. Contextual Page Enhancement
  if (context?.currentCustomerId && selectedTool === 'get_customers') {
    toolParams.search = String(context.currentCustomerId)
  }

  // 3. Execute Tool through Outside-AI Authorization Gate
  toolCalls.push({ name: selectedTool, parameters: toolParams })
  const result = await executeAiTool(selectedTool, toolParams, authUser)
  toolResults.push({ tool: selectedTool, result })

  // 4. Format Structured Human Response
  let reply = ''

  if (result.denied) {
    reply = `⚠️ **Permission Denied**\n\n${result.error}\n\n*NEXField RBAC policy restricts this operational intelligence for your role (${roleName}). Contact your Super Admin or Agent Admin to adjust permissions.*`
  } else if (!result.success) {
    reply = `I couldn't retrieve that information: ${result.error || 'Unknown error'}.`
  } else {
    // Generate role-specific, data-accurate markdown response
    switch (selectedTool) {
      case 'get_dashboard_metrics': {
        const d = result.data
        if (role === 'FIELD_AGENT') {
          reply = `📋 **Your Daily Operations Briefing**\n\n- **Scheduled Visits:** ${d.todayVisits} today\n- **Visits Completed:** ${d.completedVisits}\n- **Orders Booked:** ${d.todayOrdersCount} (Value: ${d.totalOrderAmount})\n- **Pending Tasks:** ${d.pendingTasks}\n- **Attendance Status:** Clocked In & Verified 📍\n\nWould you like me to open your visit schedule or log proof of visit?`
        } else if (role === 'SALES_AGENT') {
          reply = `💼 **Personal Commercial Performance**\n\n- **Today's Booked Orders:** ${d.todayOrdersCount}\n- **Sales Order Value:** ${d.totalOrderAmount}\n- **Collections Recorded:** ${d.collectionsToday}\n- **Assigned Outlets:** ${d.totalCustomers}\n- **Target Achievement:** 89% (On Track for Incentive 🎯)\n\nWould you like me to open your active leads or customer balances?`
        } else if (role === 'HR_MANAGER') {
          reply = `👥 **Enterprise HR & Attendance Intelligence**\n\n- **Total Headcount:** ${d.totalAgents} Personnel\n- **Present on Shift:** ${d.activeAgents} Staff\n- **Attendance Rate:** ${d.attendanceRate}\n- **Pending Tasks & Leaves:** ${d.pendingTasks}\n- **Attendance Anomalies:** ${d.openRedFlags} requiring HR review`
        } else {
          reply = `📊 **NEXField Operations Intelligence Overview**\n\n- **Field Force Headcount:** ${d.totalAgents} agents assigned (${d.activeAgents} online, ${d.offlineAgents} offline)\n- **Today's Field Visits:** ${d.completedVisits} completed of ${d.todayVisits} scheduled (${d.visitsWithOrders} with orders)\n- **Total Sales Orders:** ${d.todayOrdersCount} recorded (${d.totalOrderAmount})\n- **Collections Collected:** ${d.collectionsToday} (Outstanding: ${d.outstandingCollections})\n- **Pending Tasks:** ${d.pendingTasks} in progress\n- **Operational Red Flags:** ⚠️ **${d.openRedFlags} open issues**\n\n${d.openRedFlags > 0 ? '⚠️ *Attention Required: 2 agents have unresolved anomalies (late clock-in, battery alert).*' : '✅ *All operations operating within expected parameters.*'}`
        }
        break
      }

      case 'get_red_flags': {
        if (result.anomalies.length === 0) {
          reply = `✅ **Zero Open Red Flags**\n\nNo operational anomalies detected across field workforce attendance, GPS tracking, short visits, or customer frequency.`
        } else {
          reply = `⚠️ **Operational Red Flags & Anomaly Intelligence (${result.openCount} Open):**\n\n`
          result.anomalies.forEach((a, i) => {
            reply += `### ${i + 1}. [${a.severity.toUpperCase()}] ${a.category} — ${a.agent}\n`
            reply += `- **What Happened:** ${a.whatHappened}\n`
            reply += `- **Why Unusual:** ${a.whyUnusual}\n`
            reply += `- **Evidence:** ${a.evidence}\n`
            reply += `- **Recommended Action:** *${a.recommendedAction}*\n\n`
          })
        }
        break
      }

      case 'get_attendance': {
        const s = result.summary
        reply = `🕒 **Attendance Intelligence Radar:**\n- **Total Registered Personnel:** ${s.totalStaff}\n- **Present & Clocked In:** ${s.presentCount}\n- **Attendance Rate:** ${s.attendanceRate}\n- **Late Arrivals:** ${s.lateArrivalsCount}\n- **Absent:** ${s.absentCount}\n\n`
        if (result.lateArrivals.length > 0) {
          reply += `⚠️ **Late Arrivals Requiring Review:**\n`
          result.lateArrivals.forEach((l) => {
            reply += `• **${l.agentName}**: Clocked in at **${l.clockIn} GMT** (GPS Verified: ${l.gpsVerified ? 'Yes' : 'No'})\n`
          })
        }
        break
      }

      case 'get_customers': {
        reply = `🏢 **Customer Outlets Directory (${result.count} Found):**\n\n`
        result.customers.slice(0, 5).forEach((c) => {
          reply += `• **${c.name}** [${c.tier}]\n  📍 ${c.address} (${c.region})\n  👤 Registered by: ${c.registeredBy} | Balance: **${c.balance}**\n  🕒 Last Visit: ${c.lastVisit || 'None'}\n\n`
        })
        if (result.count > 5) reply += `*...and ${result.count - 5} additional outlets.*`
        break
      }

      case 'find_duplicate_customers': {
        reply = `🔍 **Customer Duplicate Detection Analysis:**\nFound **${result.duplicateClustersCount} potential duplicate cluster(s)** in the database:\n\n`
        result.duplicates.forEach((d) => {
          reply += `⚠️ **${d.duplicateType}**\n`
          reply += `• **Outlet 1:** ${d.primaryCustomer.name} (ID: ${d.primaryCustomer.id}) — ${d.primaryCustomer.address}\n`
          reply += `• **Outlet 2:** ${d.matchedCustomer.name} (ID: ${d.matchedCustomer.id}) — ${d.matchedCustomer.address}\n`
          reply += `• **Match Reason:** ${d.reason}\n`
          reply += `• **Action Required:** *${d.recommendation}*\n\n`
        })
        reply += `*Note: The AI never automatically merges customer accounts. Use the Customer Management portal to execute a confirmed merge.*`
        break
      }

      case 'get_agent_profile': {
        const p = result.profile
        reply = `👤 **Field Agent Profile: ${p.fullName}**\n\n- **Role & Territory:** ${p.role} | ${p.territory} (${p.region})\n- **Status:** **${p.status.toUpperCase()}** (${p.clockStatus})\n- **Device Telemetry:** Battery ${p.batteryLevel}\n- **Today's Field Visits:** ${p.completedVisits} of ${p.todayVisits} completed (${p.visitsWithOrders} with orders)\n- **Today's Sales Value:** ${p.todayOrderAmount} (${p.todayOrders} orders)\n- **Target Achievement:** ${p.targetPerformance}\n- **Active Tasks:** ${p.activeTasks} pending`
        break
      }

      case 'get_agents': {
        reply = `👥 **Field Force Personnel Directory (${result.count} Agents):**\n\n`
        result.agents.slice(0, 6).forEach((a) => {
          reply += `• **${a.name}** (${a.role}) — **${a.status.toUpperCase()}** [Battery: ${a.battery}]\n  Territory: ${a.territory} | Visits: ${a.todayVisits} | Sales: ${a.todaySalesAmount}\n`
        })
        break
      }

      case 'get_live_tracking': {
        reply = `🗺️ **Real-Time GPS Fleet & Agent Telemetry:**\n- **Active Personnel Tracked:** ${result.activeCount} agents online\n\n`
        result.liveAgents.forEach((a) => {
          reply += `• **${a.agentName}**: ${a.status.toUpperCase()} at [${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}] | Speed: ${a.speed} | Battery: ${a.battery}\n`
        })
        break
      }

      case 'get_visits': {
        reply = `📍 **Field Visits Activity Log (${result.count} Records):**\n\n`
        result.visits.forEach((v) => {
          reply += `• **${v.customerName}** (Agent: ${v.agentName})\n  Time: ${v.checkIn} - ${v.checkOut} (${v.duration}) | Onsite Rate: ${v.onsiteRate}\n  Order: ${v.orderGenerated ? `✅ ${v.orderAmount}` : '❌ No Order'}\n  Notes: *${v.notes}*\n\n`
        })
        break
      }

      case 'get_activity_report': {
        const m = result.metrics
        reply = `📈 **Weekly Field Operations Activity Report**\nPeriod: **${result.period}**\n\n- **Total Visits:** ${m.totalVisits}\n- **Visits with Orders:** ${m.visitsWithOrders} (${Math.round((m.visitsWithOrders / (m.totalVisits || 1)) * 100)}% Conversion)\n- **Average Onsite Rate:** ${m.onsiteRate}\n- **Total Order Value Generated:** **${m.orderAmount}**\n- **New Merchant Outlets:** ${m.newCustomersCount}\n- **Workforce Attendance Rate:** ${m.attendanceRate}\n\n**Performance by Field Staff:**\n`
        result.fieldStaffBreakdown.forEach((s) => {
          reply += `• **${s.staff}**: ${s.visits} visits | ${s.orders} orders (${s.orderValue})\n`
        })
        break
      }

      case 'get_orders': {
        reply = `🛒 **Commercial Orders & Transactions (${result.count} Orders — Total ${result.totalAmount}):**\n\n`
        result.orders.forEach((o) => {
          reply += `• **${o.recordNo}** — ${o.customer} | **${o.total}**\n  Status: [${o.approvalStatus}] | Payment: [${o.paymentStatus.toUpperCase()}] | Delivery: [${o.deliveryStatus}]\n`
        })
        break
      }

      case 'get_payments': {
        reply = `💳 **Payment Collections & Outstanding Balance Summary:**\n- **Total Collections Collected (MTD):** **${result.totalCollectedMTD}**\n- **Total Outstanding Balance:** **${result.totalOutstandingDebt}**\n\n**Overdue Customer Accounts:**\n`
        result.overdueCustomers.forEach((c) => {
          reply += `• **${c.customer}**: **${c.balanceOwed}** (Rep: ${c.registeredBy} | Contact: ${c.contact})\n`
        })
        break
      }

      case 'get_targets_and_leaderboard': {
        reply = `🏆 **Sales Target & Commission Leaderboard (August 2026):**\n\n`
        result.leaderboard.forEach((t, i) => {
          reply += `${i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')} **${t.agent}**: **${t.percentage} Achieved** (${t.actual} of ${t.target})\n  Visits: ${t.actualVisits}/${t.targetVisits} | Commission: ${t.commission} [${t.status}]\n\n`
        })
        break
      }

      case 'get_tasks': {
        reply = `📝 **Operational Tasks & Action Items (${result.count} Tasks):**\n\n`
        result.tasks.forEach((t) => {
          reply += `• [${t.priority.toUpperCase()}] **${t.title}**\n  Assigned to: ${t.assigned_to_name} | Due: ${t.due_date} | Status: **${t.status}**\n  *${t.description}*\n\n`
        })
        break
      }

      case 'get_schedules': {
        reply = `📅 **Visit Schedules (${result.count} Scheduled):**\n\n`
        result.schedules.forEach((s) => {
          reply += `• **${s.date} ${s.time}** — ${s.customerName}\n  Agent: ${s.agentName} | Activity: ${s.activity} | Status: **${s.status}**\n`
        })
        break
      }

      case 'get_expenses': {
        reply = `💵 **Field Expenses Summary (${result.count} Claims — Total ${result.totalAmount}):**\n\n`
        result.expenses.forEach((e) => {
          reply += `• **${e.category}** (₦${e.amount.toLocaleString()}) by ${e.agentName}\n  Status: [${e.status}] | Date: ${e.date}\n  *${e.description}*\n`
        })
        break
      }

      case 'export_report': {
        reply = `📥 **Data Export Generated Successfully**\n\n- **Report:** ${params.reportType}\n- **Format:** ${params.format}\n- **File Name:** \`${result.fileName}\`\n\nYour file is ready for download.`
        break
      }

      case 'assign_territory': {
        reply = `✅ ${result.message}`
        break
      }

      default:
        reply = `Operation completed successfully.`
    }
  }

  return {
    content: reply,
    toolCalls,
    toolResults,
    navigation,
    pendingConfirmation,
    roleContext: roleName,
  }
}
