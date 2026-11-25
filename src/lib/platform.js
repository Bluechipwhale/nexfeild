import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import Papa from 'papaparse'

export const cn = (...inputs) => twMerge(clsx(inputs))
export const currency = (value = 0) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
export const integer = (value = 0) => new Intl.NumberFormat('en-NG').format(value)
export const formatDate = (value) => (value ? format(new Date(value), 'dd MMM yyyy') : '--')
export const formatDateTime = (value) => (value ? format(new Date(value), 'dd MMM yyyy, HH:mm') : '--')
export const uid = (prefix = 'item') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`
export const sumBy = (items, mapper) => items.reduce((sum, item) => sum + mapper(item), 0)
export const average = (items) => (items.length ? sumBy(items, (item) => item) / items.length : 0)

export const groupByPeriod = (items, getDate, getValue, periods = 7) => {
  const rows = []
  for (let index = periods - 1; index >= 0; index -= 1) {
    const day = new Date()
    day.setHours(0, 0, 0, 0)
    day.setDate(day.getDate() - index)
    rows.push({
      label: format(day, 'EEE'),
      value: items
        .filter((item) => new Date(getDate(item)).toDateString() === day.toDateString())
        .reduce((sum, item) => sum + getValue(item), 0),
    })
  }
  return rows
}

export const buildMetrics = (state) => {
  const totalSales = sumBy(state.orders, (order) => order.total)
  const totalCollections = sumBy(state.payments, (payment) => payment.amount)
  const outstandingPayments = sumBy(state.orders, (order) => order.total - order.paidAmount)
  const completedVisits = state.visits.filter((visit) => visit.status === 'completed').length
  const clockedInStaff = state.users.filter((user) => user.clockedIn).length
  const activeRoutes = state.routes.filter((route) => route.status === 'active').length
  const activeVehicles = state.vehicles.filter((vehicle) => vehicle.status === 'active').length
  const idleAgents = state.location_logs.filter((log) => log.speed === 0).length
  const visitDurations = state.visits.map((visit) => visit.durationMinutes || 0)
  return {
    totalAgents: state.users.filter((user) => user.role === 'Field Agent').length,
    totalVehicles: state.vehicles.length,
    clockedInStaff,
    activeRoutes,
    completedVisits,
    missedVisits: Math.max(activeRoutes * 3 - completedVisits, 0),
    totalSales,
    totalCollections,
    outstandingPayments,
    activeVehicles,
    idleAgents,
    routeCompletion: average(state.routes.map((route) => route.completion || 0)),
    averageVisitDuration: average(visitDurations),
  }
}

export const buildAlerts = (state) => {
  const derived = []
  state.routes.forEach((route) => {
    if ((route.completion || 0) < 60) {
      derived.push({
        id: `derived-route-${route.id}`,
        type: 'missed_route',
        title: `${route.name} below coverage target`,
        description: `Route completion is ${route.completion}%. Review missed streets and reassign support if needed.`,
        severity: 'high',
        status: 'open',
        createdAt: new Date().toISOString(),
      })
    }
  })
  state.vehicles.forEach((vehicle) => {
    if (vehicle.status === 'maintenance') {
      derived.push({
        id: `derived-maint-${vehicle.id}`,
        type: 'maintenance',
        title: `${vehicle.name} is under maintenance`,
        description: `Vehicle ${vehicle.plateNumber} is unavailable until maintenance is cleared.`,
        severity: 'medium',
        status: 'open',
        createdAt: new Date().toISOString(),
      })
    }
  })
  state.orders.forEach((order) => {
    if (order.total - order.paidAmount > 0) {
      derived.push({
        id: `derived-payment-${order.id}`,
        type: 'payment_overdue',
        title: `Outstanding balance on ${order.id}`,
        description: `Balance due: ${currency(order.total - order.paidAmount)}.`,
        severity: 'medium',
        status: 'open',
        createdAt: new Date().toISOString(),
      })
    }
  })
  return [...state.alerts, ...derived]
}

export const buildAiFallback = (state) => {
  const metrics = buildMetrics(state)
  const topRoute = [...state.routes].sort((a, b) => (b.completion || 0) - (a.completion || 0))[0]
  const topVehicle = [...state.vehicles].sort((a, b) => (b.mileageToday || 0) - (a.mileageToday || 0))[0]
  return [
    { title: 'Daily agent performance report', summary: `${metrics.clockedInStaff} staff are clocked in with ${metrics.completedVisits} visits completed. Average route completion is ${metrics.routeCompletion.toFixed(1)}%.`, actions: ['Prioritize low-completion routes before close of business.', 'Follow up on open balances above NGN 25,000.'] },
    { title: 'Route performance analysis', summary: `${topRoute?.name || 'No route'} is currently leading coverage at ${topRoute?.completion || 0}% completion.`, actions: ['Assign support to routes below 60%.', 'Review missed streets and customer revisit density.'] },
    { title: 'Vehicle usage analysis', summary: `${topVehicle?.name || 'No active vehicle'} logged the highest mileage today at ${topVehicle?.mileageToday || 0} km.`, actions: ['Cross-check fuel usage with mileage.', 'Schedule service for low-fuel or maintenance vehicles.'] },
    { title: 'Market opportunity report', summary: `Outstanding balances total ${currency(metrics.outstandingPayments)}. Markets with low coverage need additional push on retailer conversions.`, actions: ['Offer bundle campaigns in Yaba and Ikorodu.', 'Revisit retailers with recent visit notes but no order conversion.'] },
    { title: 'Suspicious activity detection', summary: `${metrics.idleAgents} live location logs indicate idle agents or parked vehicles requiring follow-up.`, actions: ['Validate idle sessions longer than 20 minutes.', 'Review route deviation and unauthorized movement placeholders.'] },
    { title: 'Sales forecast', summary: `If current run-rate holds, projected weekly collections are ${currency(metrics.totalCollections * 3.2)}.`, actions: ['Push transfer-first collections.', 'Target high-balance customers before Friday.'] },
  ]
}

export const generateAiReport = async (state) => {
  const useOpenAI = import.meta.env.VITE_ENABLE_OPENAI === 'true'
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const baseUrl = import.meta.env.VITE_OPENAI_API_BASE || 'https://api.openai.com/v1'
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini'
  const fallback = buildAiFallback(state)

  if (!useOpenAI || !apiKey) return fallback

  try {
    const response = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: 'Return concise JSON array reports with title, summary, and actions.' }] },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(state) }] },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'routeforce360_report',
            schema: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'summary', 'actions'],
                additionalProperties: false,
              },
            },
          },
        },
      }),
    })
    if (!response.ok) throw new Error('AI request failed')
    const payload = await response.json()
    const text = payload.output?.[0]?.content?.[0]?.text || payload.output_text
    return JSON.parse(text)
  } catch (error) {
    console.warn('OpenAI module fallback activated', error)
    return fallback
  }
}

export const exportCsv = (filename, rows) => {
  const csv = Papa.unparse(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportPdf = (filename, title, rows) => {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text(title, 14, 20)
  autoTable(doc, {
    startY: 30,
    head: [Object.keys(rows[0] || { Info: '' })],
    body: rows.map((row) => Object.values(row)),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [18, 38, 58] },
  })
  doc.save(filename)
}
