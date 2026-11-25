import { memoryStore } from '../config/db.js'

export const getLiveMonitoringData = async (req, res) => {
  const agents = memoryStore.location_logs.map((log) => {
    const user = memoryStore.users.find((u) => u.id === log.user_id)
    const emp = memoryStore.employees.find((e) => e.user_id === log.user_id)
    const activeRoute = memoryStore.routes.find((r) => String(r.agentId) === String(log.user_id))
    return {
      userId: log.user_id,
      fullName: log.user_name || user?.full_name || 'Agent',
      role: log.role || 'FIELD_AGENT',
      phone: user?.phone || '+2348000000000',
      latitude: log.latitude,
      longitude: log.longitude,
      speed: log.speed,
      accuracy: log.accuracy,
      status: log.status,
      lastUpdate: log.recorded_at,
      routeName: activeRoute?.name || 'Balogun Prime Coverage',
      routeCompletion: activeRoute?.completion || 70,
    }
  })

  const customerPins = memoryStore.customers.map((c) => ({
    id: c.id,
    name: c.name,
    customerType: c.customerType,
    latitude: c.latitude,
    longitude: c.longitude,
    balance: c.balance,
    lastVisitAt: c.lastVisitAt,
  }))

  const routes = memoryStore.routes.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    completion: r.completion,
    waypoints: r.waypoints,
  }))

  return res.json({
    success: true,
    data: {
      activeAgentsCount: agents.length,
      totalVisitsToday: (memoryStore.field_visits || []).length,
      totalSalesToday: (memoryStore.orders || []).reduce((sum, o) => sum + (o.total || 0), 0),
      openAlertsCount: (memoryStore.alerts || []).length,
      agents,
      customerPins,
      routes,
      alerts: memoryStore.alerts || [],
    },
  })
}

export const listAlerts = async (req, res) => {
  return res.json({ success: true, data: memoryStore.alerts || [] })
}
