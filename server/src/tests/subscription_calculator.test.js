import { test } from 'node:test'
import assert from 'node:assert/strict'
import { subscriptionEndDate, calculateQuote } from '../../services/subscription-calculator.js'

test('calendar cycles clamp month ends and handle leap years', () => {
  assert.equal(subscriptionEndDate('2024-01-31', 'monthly'), '2024-02-29')
  assert.equal(subscriptionEndDate('2024-02-29', 'annually'), '2025-02-28')
  assert.equal(subscriptionEndDate('2025-01-01', 'quarterly'), '2025-04-01')
  assert.throws(() => subscriptionEndDate('2025-02-30', 'monthly'))
})

test('shared and module licenses are calculated without double charging', () => {
  const modules = [{ code: 'hr', price: 1000, seats: 2, seatPrice: 100 }, { code: 'sales', price: 2000, seats: 3, seatPrice: 200 }]
  assert.deepEqual(calculateQuote({ modules, licenseModel: 'shared', sharedSeats: 3, sharedSeatPrice: 100, discount: 300, taxBasisPoints: 750 }), { subtotal: 3300, discount: 300, tax: 225, total: 3225 })
  assert.equal(calculateQuote({ modules, licenseModel: 'module' }).total, 3800)
  assert.throws(() => calculateQuote({ modules: [modules[0], modules[0]], licenseModel: 'shared' }))
})
