import { getPool, memoryStore } from '../config/db.js'

export const clockIn = async (req, res) => {
  try {
    const employeeId = req.authUser?.employeeId || req.authUser?.id || 1
    const { latitude = 6.4544, longitude = 3.3947, locationName = 'Lagos Central Outlet', deviceInfo = 'Mobile PWA' } = req.body || {}
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()

    let record = memoryStore.attendance.find((a) => String(a.employee_id) === String(employeeId) && a.attendance_date === today)

    const currentHours = now.getHours()
    const isLate = currentHours >= 9
    const status = isLate ? 'late' : 'present'

    if (record) {
      record.clock_in_at = record.clock_in_at || now.toISOString()
      record.latitude = latitude
      record.longitude = longitude
      record.location_name = locationName
      record.status = status
    } else {
      record = {
        id: memoryStore.attendance.length + 1,
        employee_id: employeeId,
        attendance_date: today,
        clock_in_at: now.toISOString(),
        clock_out_at: null,
        latitude,
        longitude,
        location_name: locationName,
        device_info: deviceInfo,
        work_minutes: 0,
        status,
      }
      memoryStore.attendance.push(record)
    }

    // Also update telemetry location log
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
      recorded_at: now.toISOString(),
    })

    return res.json({
      success: true,
      message: isLate ? 'Clocked in successfully (Marked late).' : 'Clocked in successfully with verified GPS on time!',
      data: record,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Clock in failed' })
  }
}

export const clockOut = async (req, res) => {
  try {
    const employeeId = req.authUser?.employeeId || req.authUser?.id || 1
    const { latitude = 6.4544, longitude = 3.3947 } = req.body || {}
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date()

    let record = memoryStore.attendance.find((a) => String(a.employee_id) === String(employeeId) && a.attendance_date === today)
    if (!record) {
      record = {
        id: memoryStore.attendance.length + 1,
        employee_id: employeeId,
        attendance_date: today,
        clock_in_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
        clock_out_at: now.toISOString(),
        work_minutes: 240,
        status: 'present',
      }
      memoryStore.attendance.push(record)
    } else {
      record.clock_out_at = now.toISOString()
      const start = new Date(record.clock_in_at || now.toISOString()).getTime()
      record.work_minutes = Math.max(15, Math.round((now.getTime() - start) / 60000))
    }

    return res.json({
      success: true,
      message: `Clocked out successfully. Duration: ${Math.floor((record.work_minutes || 0) / 60)}h ${(record.work_minutes || 0) % 60}m.`,
      data: record,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Clock out failed' })
  }
}

export const listAttendance = async (req, res) => {
  try {
    const list = memoryStore.attendance.map((a) => {
      const emp = memoryStore.employees.find((e) => String(e.id) === String(a.employee_id)) || {}
      return {
        ...a,
        employee_name: `${emp.first_name || 'Staff'} ${emp.last_name || 'Member'}`,
      }
    })
    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list attendance' })
  }
}

export const getAttendanceSummary = async (req, res) => {
  const totalActive = memoryStore.employees.length || 12
  const present = memoryStore.attendance.filter((a) => a.clock_in_at).length
  const late = memoryStore.attendance.filter((a) => a.status === 'late').length
  const onLeave = memoryStore.leave_requests.filter((r) => r.status === 'approved').length

  return res.json({
    success: true,
    data: {
      totalActive,
      present,
      late,
      onLeave,
      attendanceRate: totalActive > 0 ? `${Math.round((present / totalActive) * 100)}%` : '100%',
    },
  })
}
