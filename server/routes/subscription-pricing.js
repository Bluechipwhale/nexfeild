import express from 'express'
import { getPool } from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'
import { calculateQuote } from '../services/subscription-calculator.js'

const router = express.Router()
const cycles = new Set(['monthly', 'quarterly', 'half_yearly', 'annually'])
const admin = (req, res, next) => req.user?.isSuperAdmin ? next() : res.status(403).json({ message: 'Super administrator access required.' })
const database = (_req, res, next) => getPool() ? next() : res.status(503).json({ message: 'Subscription database is not configured.' })
router.use(authenticateToken, database)

router.get('/modules', async (_req, res, next) => {
  try {
    const [rows] = await getPool().execute('SELECT id, code, name, description FROM saas_modules WHERE is_active = 1 ORDER BY name')
    res.json({ data: rows })
  } catch (error) { next(error) }
})

router.post('/modules', admin, async (req, res, next) => {
  const { code, name, description = null } = req.body || {}
  if (typeof code !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(code) || typeof name !== 'string' || !name.trim() || name.length > 150 || (description !== null && (typeof description !== 'string' || description.length > 4000))) return res.status(400).json({ message: 'Invalid module details.' })
  try {
    const [result] = await getPool().execute('INSERT INTO saas_modules (code, name, description) VALUES (?, ?, ?)', [code, name.trim(), description])
    res.status(201).json({ id: result.insertId })
  } catch (error) { if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Module code already exists.' }); next(error) }
})

router.post('/prices', admin, async (req, res, next) => {
  const { moduleId = null, priceType, billingCycle, currency, amountMinor, effectiveFrom, effectiveUntil = null } = req.body || {}
  const validModule = priceType === 'shared_license' ? moduleId === null : Number.isSafeInteger(moduleId) && moduleId > 0
  if (!['module', 'shared_license', 'module_license'].includes(priceType) || !validModule || !cycles.has(billingCycle) || !/^[A-Z]{3}$/.test(currency || '') || !Number.isSafeInteger(amountMinor) || amountMinor < 0 || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(effectiveFrom || '') || (effectiveUntil !== null && (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(effectiveUntil) || effectiveUntil <= effectiveFrom))) return res.status(400).json({ message: 'Invalid price details.' })
  try {
    const [result] = await getPool().execute('INSERT INTO saas_prices (module_id, price_type, billing_cycle, currency, amount_minor, effective_from, effective_until) VALUES (?, ?, ?, ?, ?, ?, ?)', [moduleId, priceType, billingCycle, currency, amountMinor, effectiveFrom, effectiveUntil])
    res.status(201).json({ id: result.insertId })
  } catch (error) { next(error) }
})

router.post('/quote', async (req, res, next) => {
  const { moduleCodes, billingCycle, currency, seats, licenseModel } = req.body || {}
  if (!Array.isArray(moduleCodes) || !moduleCodes.length || moduleCodes.length > 50 || moduleCodes.some(code => typeof code !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(code)) || new Set(moduleCodes).size !== moduleCodes.length || !cycles.has(billingCycle) || !/^[A-Z]{3}$/.test(currency || '') || !['shared', 'module'].includes(licenseModel) || !Number.isSafeInteger(seats) || seats < 0 || seats > 100000) return res.status(400).json({ message: 'Invalid quote request.' })
  try {
    const [rows] = await getPool().execute(`SELECT m.code, p.price_type, p.amount_minor FROM saas_modules m JOIN saas_prices p ON p.module_id = m.id WHERE m.is_active = 1 AND m.code IN (${moduleCodes.map(() => '?').join(',')}) AND p.billing_cycle = ? AND p.currency = ? AND p.effective_from <= UTC_TIMESTAMP() AND (p.effective_until IS NULL OR p.effective_until > UTC_TIMESTAMP()) ORDER BY p.effective_from DESC, p.id DESC`, [...moduleCodes, billingCycle, currency])
    const find = (code, type) => rows.find(row => row.code === code && row.price_type === type)
    const modules = moduleCodes.map(code => ({ code, price: Number(find(code, 'module')?.amount_minor), seats, seatPrice: licenseModel === 'module' ? Number(find(code, 'module_license')?.amount_minor) : 0 }))
    let sharedSeatPrice = 0
    if (licenseModel === 'shared') {
      const [prices] = await getPool().execute("SELECT amount_minor FROM saas_prices WHERE module_id IS NULL AND price_type = 'shared_license' AND billing_cycle = ? AND currency = ? AND effective_from <= UTC_TIMESTAMP() AND (effective_until IS NULL OR effective_until > UTC_TIMESTAMP()) ORDER BY effective_from DESC, id DESC LIMIT 1", [billingCycle, currency])
      sharedSeatPrice = Number(prices[0]?.amount_minor)
    }
    try { return res.json({ currency, billingCycle, licenseModel, ...calculateQuote({ modules, licenseModel, sharedSeats: seats, sharedSeatPrice }) }) }
    catch { return res.status(422).json({ message: 'Pricing is not configured for this selection.' }) }
  } catch (error) { next(error) }
})

export default router
