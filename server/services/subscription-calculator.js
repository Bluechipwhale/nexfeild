const MONTHS = Object.freeze({ monthly: 1, quarterly: 3, half_yearly: 6, annually: 12 })

export function subscriptionEndDate(startDate, cycle) {
  if (!Object.hasOwn(MONTHS, cycle) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('Invalid subscription date or billing cycle')
  const [year, month, day] = startDate.split('-').map(Number)
  const original = new Date(Date.UTC(year, month - 1, day))
  if (original.toISOString().slice(0, 10) !== startDate) throw new Error('Invalid subscription date')
  const target = new Date(Date.UTC(year, month - 1 + MONTHS[cycle], 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return target.toISOString().slice(0, 10)
}

export function calculateQuote({ modules, licenseModel, sharedSeats = 0, sharedSeatPrice = 0, discount = 0, taxBasisPoints = 0 }) {
  if (!Array.isArray(modules) || !['shared', 'module'].includes(licenseModel)) throw new Error('Invalid quote configuration')
  const integer = value => Number.isSafeInteger(value) && value >= 0
  if (![sharedSeats, sharedSeatPrice, discount, taxBasisPoints].every(integer) || taxBasisPoints > 10000) throw new Error('Invalid quote amount')
  const ids = new Set()
  let subtotal = 0
  for (const item of modules) {
    if (!item.code || ids.has(item.code) || !integer(item.price) || !integer(item.seats ?? 0) || !integer(item.seatPrice ?? 0)) throw new Error('Invalid or duplicate module')
    ids.add(item.code)
    subtotal += item.price + (licenseModel === 'module' ? (item.seats ?? 0) * (item.seatPrice ?? 0) : 0)
  }
  if (licenseModel === 'shared') subtotal += sharedSeats * sharedSeatPrice
  if (!Number.isSafeInteger(subtotal) || discount > subtotal) throw new Error('Invalid quote total')
  const taxable = subtotal - discount
  const tax = Math.round(taxable * taxBasisPoints / 10000)
  if (!Number.isSafeInteger(taxable + tax)) throw new Error('Invalid quote total')
  return { subtotal, discount, tax, total: taxable + tax }
}
