import express from 'express'
import { randomUUID } from 'node:crypto'
import { getPool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()
router.use(authenticateToken)
router.get('/mine', async (req, res, next) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ message: 'Attendance database is unavailable.' })
  if (!req.user.employeeId) return res.status(403).json({ message: 'An employee profile is required.' })
  try {
    const [rows] = await pool.execute('SELECT id, attendance_date, clock_in_at, clock_out_at, status FROM attendance WHERE company_id = ? AND employee_id = ? ORDER BY attendance_date DESC LIMIT 30', [req.user.companyId, req.user.employeeId])
    res.json({ data: rows })
  } catch (error) { next(error) }
})
router.post('/clock-out', async (req, res, next) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ message: 'Attendance database is unavailable.' })
  if (!req.user.employeeId) return res.status(403).json({ message: 'An employee profile is required.' })
  const { latitude, longitude } = req.body || {}
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90 || typeof longitude !== 'number' || longitude < -180 || longitude > 180) return res.status(400).json({ message: 'A valid GPS location is required.' })
  try {
    const [result] = await pool.execute("UPDATE attendance SET clock_out_at = UTC_TIMESTAMP(), clock_out_lat = ?, clock_out_lng = ?, work_minutes = GREATEST(0, TIMESTAMPDIFF(MINUTE, clock_in_at, UTC_TIMESTAMP())) WHERE company_id = ? AND employee_id = ? AND attendance_date = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+01:00')) AND clock_in_at IS NOT NULL AND clock_out_at IS NULL", [latitude, longitude, req.user.companyId, req.user.employeeId])
    if (!result.affectedRows) return res.status(409).json({ message: 'No open shift found for today.' })
    res.json({ message: 'Clock-out recorded.' })
  } catch (error) { next(error) }
})
router.post('/clock-in', async (req, res, next) => {
  const pool = getPool()
  if (!pool) return res.status(503).json({ message: 'Attendance database is unavailable.' })
  if (!req.user.employeeId) return res.status(403).json({ message: 'An employee profile is required.' })
  const { latitude, longitude, photo } = req.body || {}
  if (typeof latitude !== 'number' || latitude < -90 || latitude > 90 || typeof longitude !== 'number' || longitude < -180 || longitude > 180 || typeof photo !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo) || photo.length > 2800000) return res.status(400).json({ message: 'A valid camera photo and GPS location are required.' })
  const bytes = Buffer.from(photo.split(',')[1], 'base64')
  if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) return res.status(400).json({ message: 'Invalid JPEG photo.' })
  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    const [result] = await connection.execute("INSERT INTO attendance (uuid, company_id, employee_id, attendance_date, clock_in_at, clock_in_lat, clock_in_lng, status) VALUES (?, ?, ?, DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+01:00')), UTC_TIMESTAMP(), ?, ?, 'present')", [randomUUID(), req.user.companyId, req.user.employeeId, latitude, longitude])
    await connection.execute('INSERT INTO attendance_photos (attendance_id, company_id, employee_id, photo) VALUES (?, ?, ?, ?)', [result.insertId, req.user.companyId, req.user.employeeId, bytes])
    await connection.commit()
    res.status(201).json({ message: 'Clock-in recorded.', id: result.insertId })
  } catch (error) {
    if (connection) await connection.rollback()
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'You have already clocked in today.' })
    next(error)
  } finally { connection?.release() }
})
export default router
