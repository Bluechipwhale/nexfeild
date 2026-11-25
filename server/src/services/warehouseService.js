import { db } from '../config/database.js';
import { createHash, randomBytes } from 'node:crypto';
import { recordAudit } from '../middleware/auditLogger.js';
import { warehouseStock, positiveQuantity } from './warehouseStockService.js';
import { getLagosTime } from '../utils/nigeriaTime.js';
const ADMIN = ['SUPER_ADMIN', 'ADMIN', 'IT_ADMIN'];
const bad = (message, status = 400) => {
  throw Object.assign(new Error(message), {
    status
  });
};
const text = (value, max = 2000) => String(value || '').trim().slice(0, max);
const date = value => {
  const v = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) bad('Choose a valid date.');
  return v;
};
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const outstanding = line => line.is_returnable ? Math.max(0, line.issued_quantity - line.returned_quantity) : 0;
async function actorFor(actor) {
  const u = actor?.id ? await db.findById('users', actor.id) : null;
  if (!u || u.status !== 'active' || Number(u.company_id) !== Number(actor.company_id)) bad('An active account is required.', 403);
  return u;
}
async function manager(user) {
  return ADMIN.includes(user.role_code) || Boolean(await db.findOne('warehouse_managers', {
    company_id: user.company_id,
    user_id: user.id,
    active: true
  }));
}
async function requireManager(user) {
  if (!(await manager(user))) bad('Warehouse manager approval is required.', 403);
}
async function ownedRequest(id, user, manage = false) {
  const r = await db.findById('warehouse_requests', Number(id));
  if (!r || r.company_id !== user.company_id) bad('Request not found.', 404);
  if (manage) await requireManager(user);else if (r.requester_user_id !== user.id && !(await manager(user))) bad('Request not found.', 404);
  return r;
}
async function notice(request, title, body, forManagers = false) {
  const ids = forManagers ? await warehouseService.managerIds(request.company_id) : [request.requester_user_id];
  for (const userId of new Set(ids)) await db.insert('warehouse_notices', {
    company_id: request.company_id,
    request_id: request.id,
    user_id: userId,
    title,
    body
  });
}
async function event(r, user, action, details) {
  await db.insert('warehouse_events', {
    company_id: r.company_id,
    request_id: r.id,
    actor_id: user.id,
    action,
    details
  });
  await recordAudit(user, `WAREHOUSE_${action}`, 'warehouse_requests', r.id, details);
}
async function refreshStatus(r) {
  if (['PENDING', 'REJECTED', 'CANCELLED'].includes(r.status)) return r;
  const lines = await db.findAll('warehouse_request_lines', {
    request_id: r.id
  });
  const pending = await db.findOne('warehouse_returns', {
    request_id: r.id,
    status: 'PENDING'
  });
  const issued = lines.reduce((n, l) => n + l.issued_quantity, 0),
    remaining = lines.some(l => l.approved_quantity > l.issued_quantity),
    held = lines.some(l => outstanding(l) > 0);
  let status = pending ? 'RETURN_PENDING' : !issued ? 'APPROVED' : remaining ? 'PARTIALLY_ISSUED' : held ? lines.some(l => l.returned_quantity > 0) ? 'PARTIALLY_RETURNED' : 'ISSUED' : 'CLOSED';
  return db.update('warehouse_requests', r.id, {
    status
  });
}
async function operation(actor, action, input, fn) {
  const user = await actorFor(actor),
    id = text(input.client_nonce, 80);
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(id)) bad('Refresh the form and try again: an operation reference is required.');
  const hash = createHash('sha256').update(JSON.stringify(canonical({
    ...input,
    client_nonce: undefined
  }))).digest('hex');
  return db.transaction(async () => {
    const old = await db.findById('warehouse_operations', id);
    if (old) {
      if (old.company_id !== user.company_id || old.user_id !== user.id || old.action !== action || old.payload_hash !== hash) bad('This action reference belongs to a different operation.', 409);
      return old.result;
    }
    const result = await fn(user);
    await db.insert('warehouse_operations', {
      id,
      company_id: user.company_id,
      user_id: user.id,
      action,
      payload_hash: hash,
      result
    });
    return result;
  });
}
export const warehouseService = {
  async managerIds(companyId) {
    const named = await db.findAll('warehouse_managers', {
        company_id: companyId,
        active: true
      }),
      users = await db.findAll('users', {
        company_id: companyId
      });
    return users.filter(u => u.status === 'active' && (ADMIN.includes(u.role_code) || named.some(m => m.user_id === u.id))).map(u => u.id);
  },
  async access(actor) {
    const user = await actorFor(actor);
    return {
      can_manage: await manager(user),
      can_administer: ADMIN.includes(user.role_code)
    };
  },
  async catalogue(actor) {
    const user = await actorFor(actor);
    const [products, bins, requests, lines] = await Promise.all([db.findAll('products', {
      company_id: user.company_id
    }), db.findAll('warehouse_stock_locations', {
      company_id: user.company_id
    }), db.findAll('warehouse_requests', {
      company_id: user.company_id
    }), db.findAll('warehouse_request_lines', {
      company_id: user.company_id
    })]);
    const active = new Set(requests.filter(r => !['CANCELLED', 'REJECTED', 'CLOSED'].includes(r.status)).map(r => r.id)),
      reserved = new Map();
    for (const l of lines) if (active.has(l.request_id)) reserved.set(l.product_id, (reserved.get(l.product_id) || 0) + Math.max(0, l.approved_quantity - l.issued_quantity));
    return products.filter(p => p.status === 'active').map(p => {
      const locations = bins.filter(b => b.product_id === p.id),
        held = reserved.get(p.id) || 0,
        primary = locations.find(b => b.quantity > 0 && b.stock_state === 'AVAILABLE');
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unit: p.unit,
        condition: p.condition,
        place: primary?.place || p.location_of_item || p.warehouse_name,
        space: primary?.space || p.shelf_number || p.shelve_location,
        on_hand: Number(p.stock_quantity || 0),
        reserved: held,
        available: Math.max(0, Number(p.stock_quantity || 0) - held),
        stock_locations: locations,
        quarantined: locations.filter(b => b.stock_state === 'QUARANTINE').reduce((n, b) => n + b.quantity, 0)
      };
    });
  },
  async detail(id, actor, loaded = null) {
    const user = loaded?.user || await actorFor(actor),
      r = loaded ? loaded.requests.find(row => row.id === Number(id)) : await ownedRequest(id, user),
      [lines, returns, events, users, employees, products] = loaded ? [loaded.lines.filter(l=>l.request_id===r.id),loaded.returns.filter(v=>v.request_id===r.id),loaded.events.filter(e=>e.request_id===r.id),loaded.users,loaded.employees,loaded.products] : await Promise.all([db.findAll('warehouse_request_lines', {
        request_id: r.id
      }), db.findAll('warehouse_returns', {
        request_id: r.id
      }), db.findAll('warehouse_events', {
        request_id: r.id
      }), db.findAll('users', {
        company_id: user.company_id
      }), db.findAll('employees', {
        company_id: user.company_id
      }), db.findAll('products', {
        company_id: user.company_id
      })]);
    const borrower = users.find(u => u.id === r.requester_user_id),
      employee = employees.find(e => e.user_id === r.requester_user_id);
    const name = id => users.find(u => u.id === id)?.full_name || 'Former account';
    return {
      ...r,
      requester_name: borrower?.full_name || employee?.full_name || 'Former account',
      staff_id: employee?.staff_id || employee?.employee_code,
      department: employee?.department,
      decision_by_name: r.decision_by ? name(r.decision_by) : null,
      overdue: r.due_date && r.due_date < getLagosTime().dateStr && lines.some(l => outstanding(l) > 0),
      lines: lines.map(l => ({
        ...l,
        product_name: products.find(p => p.id === l.product_id)?.name || 'Archived item',
        sku: products.find(p => p.id === l.product_id)?.sku,
        outstanding_quantity: outstanding(l),
        return_pending: returns.filter(v => v.line_id === l.id && v.status === 'PENDING').reduce((n, v) => n + v.quantity, 0)
      })),
      returns: returns.map(v => ({
        ...v,
        submitted_by_name: name(v.submitted_by),
        received_by_name: v.received_by ? name(v.received_by) : null
      })),
      events: events.sort((a, b) => a.id - b.id).map(e => ({
        ...e,
        actor_name: name(e.actor_id)
      }))
    };
  },
  async list(actor, {
    scope = 'mine'
  } = {}) {
    const user = await actorFor(actor),
      canManage = await manager(user);
    if (scope === 'all' && !canManage) bad('Warehouse manager access required.', 403);
    const rows = await db.findAll('warehouse_requests', {
      company_id: user.company_id
    });
    const tables=['warehouse_request_lines','warehouse_returns','warehouse_events','users','employees','products'];
    const [lines,returns,events,users,employees,products]=await Promise.all(tables.map(table=>db.findAll(table,{company_id:user.company_id})));
    const loaded={user,requests:rows,lines,returns,events,users,employees,products};
    return Promise.all(rows.filter(r => scope === 'all' || r.requester_user_id === user.id).sort((a, b) => b.id - a.id).map(r => this.detail(r.id, user,loaded)));
  },
  async create(input, actor) {
    return operation(actor, 'REQUEST', input, async user => {
      if (!text(input.purpose) || !text(input.use_location)) bad('Purpose and place of use are required.');
      const neededBy = date(input.needed_by),
        dueDate = input.due_date ? date(input.due_date) : null;
      if (neededBy < getLagosTime().dateStr) bad('Needed-by date cannot be in the past.');
      if (!Array.isArray(input.items) || !input.items.length || input.items.length > 30) bad('Choose between 1 and 30 items.');
      const seen = new Set(),
        items = [];
      for (const item of input.items) {
        const product = await db.findById('products', Number(item.product_id));
        if (!product || product.company_id !== user.company_id || product.status !== 'active') bad('Choose an active inventory item.');
        if (seen.has(product.id)) bad('Combine duplicate item quantities into one line.');
        seen.add(product.id);
        const qty = positiveQuantity(item.quantity),
          returnable = item.is_returnable !== false;
        if (returnable && !dueDate) bad('Expected return date is required for borrowed items.');
        items.push({
          product_id: product.id,
          requested_quantity: qty,
          is_returnable: returnable
        });
      }
      if (dueDate && dueDate < neededBy) bad('Return date cannot be before the needed-by date.');
      const r = await db.insert('warehouse_requests', {
        company_id: user.company_id,
        request_number: `WR-${getLagosTime().dateStr.replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`,
        requester_user_id: user.id,
        purpose: text(input.purpose),
        use_location: text(input.use_location),
        needed_by: neededBy,
        due_date: dueDate,
        status: 'PENDING',
        notes: text(input.notes)
      });
      for (const item of items) await db.insert('warehouse_request_lines', {
        company_id: user.company_id,
        request_id: r.id,
        approved_quantity: 0,
        issued_quantity: 0,
        returned_quantity: 0,
        ...item
      });
      await event(r, user, 'REQUESTED', {
        items,
        purpose: r.purpose
      });
      await notice(r, 'Warehouse approval needed', `${user.full_name} submitted ${r.request_number}.`, true);
      return this.detail(r.id, user);
    });
  },
  async decide(id, input, actor) {
    return operation(actor, 'DECIDE', input, async user => {
      const r = await ownedRequest(id, user, true);
      if (r.status !== 'PENDING') bad('Only pending requests can be reviewed.');
      if (r.requester_user_id === user.id) bad('Another warehouse manager must review your own request.', 403);
      const decision = text(input.decision).toUpperCase();
      if (!['APPROVE', 'REJECT'].includes(decision)) bad('Choose Approve or Reject.');
      if (decision === 'REJECT' && !text(input.note)) bad('Explain why this request is rejected.');
      const lines = await db.findAll('warehouse_request_lines', {
        request_id: r.id
      });
      if (decision === 'APPROVE') {
        let total = 0;
        for (const line of lines) {
          const decisionLine = input.items?.find(i => Number(i.line_id) === line.id);
          const qty = Number(decisionLine?.quantity ?? line.requested_quantity);
          const returnable=decisionLine?.is_returnable ?? line.is_returnable;
          if(typeof returnable!=='boolean')bad('Confirm whether each item must be returned.');
          if(qty>0&&returnable&&!input.due_date&&!r.due_date)bad('Set an expected return date for borrowed items.');
          if (!Number.isSafeInteger(qty) || qty < 0 || qty > line.requested_quantity) bad('Approved quantities must be between zero and the requested quantity.');
          const p = await db.findById('products', line.product_id);
          if (qty > Number(p.stock_quantity) - (await warehouseStock.reserved(p.id))) bad(`Not enough unreserved stock to approve ${p.name}.`);
          total += qty;
          await db.update('warehouse_request_lines', line.id, {
            approved_quantity: qty,
            is_returnable:returnable
          });
        }
        if (!total) bad('Approve at least one item or reject the request.');
      }
      await db.update('warehouse_requests', r.id, {
        due_date: input.due_date ? date(input.due_date) : r.due_date,
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        decision_by: user.id,
        decision_at: new Date().toISOString(),
        decision_note: text(input.note)
      });
      await event(r, user, decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', {
        note: text(input.note),
        items: input.items || []
      });
      await notice(r, decision === 'APPROVE' ? 'Warehouse request approved' : 'Warehouse request rejected', `${r.request_number}: ${text(input.note) || 'Check the request for details.'}`);
      return this.detail(r.id, user);
    });
  },
  async issue(id, input, actor) {
    return operation(actor, 'PICKUP', input, async user => {
      const r = await ownedRequest(id, user, true);
      if (r.requester_user_id === user.id) bad('Another warehouse manager must record your collection.', 403);
      if (['PENDING', 'REJECTED', 'CANCELLED', 'CLOSED'].includes(r.status)) bad('Approve this request before recording collection.');
      if (input.recipient_acknowledged !== true) bad('Confirm the items were handed to the named requester.');
      if (!Array.isArray(input.items) || !input.items.length) bad('Choose the items being collected.');
      const seen = new Set();
      for (const item of input.items) {
        const line = await db.findById('warehouse_request_lines', Number(item.line_id));
        if (!line || line.request_id !== r.id || seen.has(line.id)) bad('Choose a valid request line once.');
        seen.add(line.id);
        const qty = positiveQuantity(item.quantity);
        if (qty > line.approved_quantity - line.issued_quantity) bad('Collection exceeds the approved uncollected quantity.');
        const p = await db.findById('products', line.product_id),
          bins = await warehouseStock.ensure(p);
        const source = item.stock_location_id ? bins.find(b => b.id === Number(item.stock_location_id)) : bins.filter(b => b.stock_state === 'AVAILABLE' && b.quantity >= qty)[0];
        if (!source || source.stock_state !== 'AVAILABLE') bad('Choose the source warehouse space.');
        const newQty = await warehouseStock.take(p, qty, {
          stockLocationId: source.id,
          reservedIssue: true
        });
        await db.update('warehouse_request_lines', line.id, {
          issued_quantity: line.issued_quantity + qty
        });
        await db.insert('inventory_movements', {
          company_id: r.company_id,
          product_id: p.id,
          movement_type: 'WAREHOUSE_ISSUE',
          quantity: qty,
          previous_quantity: p.stock_quantity,
          new_quantity: newQty,
          reference_number: r.request_number,
          notes: `Custodian user ${r.requester_user_id}; from ${source.place} / ${source.space}. ${text(input.note)}`,
          recorded_by: user.id
        });
      }
      await refreshStatus(r);
      await event(r, user, 'COLLECTED', {
        recipient_user_id: r.requester_user_id,
        items: input.items,
        note: text(input.note)
      });
      await notice(r, 'Items recorded in your custody', `${r.request_number}: collected items are now listed under your name.`);
      return this.detail(r.id, user);
    });
  },
  async cancel(id, input, actor) {
    return operation(actor, 'CANCEL', input, async user => {
      const r = await ownedRequest(id, user);
      if (!['PENDING', 'APPROVED', 'PARTIALLY_ISSUED'].includes(r.status)) bad('This request cannot be cancelled.');
      const lines = await db.findAll('warehouse_request_lines', {
        request_id: r.id
      });
      const issued = lines.some(l => l.issued_quantity > 0);
      for (const l of lines) await db.update('warehouse_request_lines', l.id, {
        approved_quantity: l.issued_quantity
      });
      if (issued) await refreshStatus(r);else await db.update('warehouse_requests', r.id, {
        status: 'CANCELLED'
      });
      await event(r, user, 'REMAINDER_CANCELLED', {
        note: text(input.note)
      });
      await notice(r, 'Warehouse request updated', `${r.request_number}: uncollected reservations released.`);
      return this.detail(r.id, user);
    });
  },
  async submitReturn(id, input, actor) {
    return operation(actor, 'RETURN_SUBMITTED', input, async user => {
      const r = await ownedRequest(id, user);
      if (user.id !== r.requester_user_id) bad('The named custodian must submit this return.', 403);
      const line = await db.findById('warehouse_request_lines', Number(input.line_id));
      if (!line || line.request_id !== r.id || !line.is_returnable) bad('Choose a returnable item on this request.');
      const qty = positiveQuantity(input.quantity),
        pending = (await db.findAll('warehouse_returns', {
          line_id: line.id,
          status: 'PENDING'
        })).reduce((n, v) => n + v.quantity, 0);
      if (qty > outstanding(line) - pending) bad('Return quantity exceeds the quantity still held without a pending return.');
      if (!text(input.place) || !text(input.space)) bad('Enter the exact return place and shelf, rack or bin.');
      if (!['Good', 'Damaged', 'Needs inspection'].includes(input.condition)) bad('Choose the return condition.');
      const receipt = await db.insert('warehouse_returns', {
        company_id: r.company_id,
        request_id: r.id,
        line_id: line.id,
        submitted_by: user.id,
        quantity: qty,
        place: text(input.place, 200),
        space: text(input.space, 200),
        condition: input.condition,
        notes: text(input.notes),
        status: 'PENDING'
      });
      await refreshStatus(r);
      await event(r, user, 'RETURN_SUBMITTED', {
        return_id: receipt.id,
        quantity: qty,
        place: receipt.place,
        space: receipt.space,
        condition: receipt.condition
      });
      await notice(r, 'Warehouse return needs confirmation', `${r.request_number}: ${qty} item(s) reported returned.`, true);
      return this.detail(r.id, user);
    });
  },
  async receiveReturn(returnId, input, actor) {
    return operation(actor, 'RETURN_RECEIVED', input, async user => {
      await requireManager(user);
      const ret = await db.findById('warehouse_returns', Number(returnId));
      if (!ret || ret.company_id !== user.company_id) bad('Return not found.', 404);
      if (ret.status !== 'PENDING') bad('This return has already been reviewed.');
      const r = await ownedRequest(ret.request_id, user, true),
        accept = input.decision === 'ACCEPT';
      if (r.requester_user_id === user.id) bad('Another warehouse manager must confirm your return.', 403);
      if (!['ACCEPT', 'REJECT'].includes(input.decision)) bad('Choose Accept or Reject.');
      if (!accept && !text(input.note)) bad('Explain why the return is rejected.');
      if (accept) {
        const place = text(input.place || ret.place, 200),
          space = text(input.space || ret.space, 200),
          condition = input.condition || ret.condition;
        if (!place || !space || !['Good', 'Damaged', 'Needs inspection'].includes(condition)) bad('Confirm the exact return place, space and condition.');
        const line = await db.findById('warehouse_request_lines', ret.line_id);
        if (ret.quantity > outstanding(line)) bad('The return exceeds the remaining custody quantity.');
        const p = await db.findById('products', line.product_id),
          newQty = await warehouseStock.put(p, ret.quantity, {
            place,
            space,
            condition,
            stockState: condition === 'Good' ? 'AVAILABLE' : 'QUARANTINE'
          });
        await db.update('warehouse_request_lines', line.id, {
          returned_quantity: line.returned_quantity + ret.quantity
        });
        await db.update('warehouse_returns', ret.id, {
          place,
          space,
          condition
        });
        await db.insert('inventory_movements', {
          company_id: r.company_id,
          product_id: p.id,
          movement_type: condition === 'Good' ? 'WAREHOUSE_RETURN' : 'QUARANTINE_RETURN',
          quantity: ret.quantity,
          previous_quantity: p.stock_quantity,
          new_quantity: newQty,
          reference_number: r.request_number,
          notes: `Return ${ret.id}; ${place} / ${space}; ${condition}`,
          recorded_by: user.id
        });
      }
      await db.update('warehouse_returns', ret.id, {
        status: accept ? 'ACCEPTED' : 'REJECTED',
        received_by: user.id,
        received_at: new Date().toISOString(),
        receipt_note: text(input.note)
      });
      await refreshStatus(r);
      await event(r, user, accept ? 'RETURN_ACCEPTED' : 'RETURN_REJECTED', {
        return_id: ret.id,
        note: text(input.note)
      });
      await notice(r, accept ? 'Warehouse return confirmed' : 'Warehouse return needs attention', `${r.request_number}: ${ret.quantity} item(s) ${accept ? 'removed from your outstanding custody' : 'remain in your custody'}.`);
      return this.detail(r.id, user);
    });
  },
  async acknowledge(id, input, actor) {
    return operation(actor, 'COLLECTION_ACKNOWLEDGED', input, async user => {
      const r = await ownedRequest(id, user);
      if (r.requester_user_id !== user.id) bad('Only the named recipient may acknowledge collection.', 403);
      const lines = await db.findAll('warehouse_request_lines', {
        request_id: r.id
      });
      if (!lines.some(l => l.issued_quantity > 0)) bad('No items have been collected.');
      await event(r, user, 'COLLECTION_ACKNOWLEDGED', {
        items: lines.map(l => ({
          line_id: l.id,
          issued_quantity: l.issued_quantity
        })),
        note: text(input.note)
      });
      return this.detail(r.id, user);
    });
  },
  async moveStock(input, actor) {
    return operation(actor, 'STORAGE_MOVE', input, async user => {
      await requireManager(user);
      const source = await db.findById('warehouse_stock_locations', Number(input.stock_location_id));
      if (!source || source.company_id !== user.company_id) bad('Storage position not found.', 404);
      const qty = positiveQuantity(input.quantity),
        place = text(input.place, 200),
        space = text(input.space, 200);
      if (!place || !space) bad('Destination place and exact space are required.');
      if (qty > source.quantity) bad('Quantity exceeds stock in that space.');
      if (source.place === place && source.space === space) bad('Choose a different destination space.');
      const target = await db.findOne('warehouse_stock_locations', {
        company_id: user.company_id,
        product_id: source.product_id,
        place,
        space,
        stock_state: source.stock_state
      });
      await db.update('warehouse_stock_locations', source.id, {
        quantity: source.quantity - qty
      });
      if (target) await db.update('warehouse_stock_locations', target.id, {
        quantity: target.quantity + qty
      });else await db.insert('warehouse_stock_locations', {
        company_id: user.company_id,
        product_id: source.product_id,
        place,
        space,
        stock_state: source.stock_state,
        quantity: qty,
        condition: source.condition
      });
      await recordAudit(user, 'WAREHOUSE_STORAGE_MOVED', 'products', source.product_id, {
        quantity: qty,
        from: {
          place: source.place,
          space: source.space
        },
        to: {
          place,
          space
        },
        note: text(input.note)
      });
      return {
        success: true
      };
    });
  },
  async releaseQuarantine(input, actor) {
    return operation(actor, 'QUARANTINE_RELEASED', input, async user => {
      await requireManager(user);
      const bin = await db.findById('warehouse_stock_locations', Number(input.stock_location_id));
      if (!bin || bin.company_id !== user.company_id || bin.stock_state !== 'QUARANTINE') bad('Quarantined stock not found.', 404);
      const qty = positiveQuantity(input.quantity);
      if (qty > bin.quantity || !text(input.note)) bad('Enter the inspected quantity and inspection or repair notes.');
      const product = await db.findById('products', bin.product_id);
      await db.update('warehouse_stock_locations', bin.id, {
        quantity: bin.quantity - qty
      });
      const newQty = await warehouseStock.put(product, qty, {
        place: bin.place,
        space: bin.space,
        condition: 'Good'
      });
      await db.insert('inventory_movements', {
        company_id: user.company_id,
        product_id: product.id,
        movement_type: 'QUARANTINE_RELEASE',
        quantity: qty,
        previous_quantity: product.stock_quantity,
        new_quantity: newQty,
        reference_number: `INSPECT-${bin.id}`,
        notes: text(input.note),
        recorded_by: user.id
      });
      await recordAudit(user, 'WAREHOUSE_QUARANTINE_RELEASED', 'products', product.id, {
        stock_location_id: bin.id,
        quantity: qty,
        note: text(input.note)
      });
      return {
        success: true
      };
    });
  },
  async team(actor) {
    const user = await actorFor(actor);
    if (!ADMIN.includes(user.role_code)) bad('Administrator access required.', 403);
    const [users, employees, members] = await Promise.all([db.findAll('users', {
      company_id: user.company_id
    }), db.findAll('employees', {
      company_id: user.company_id
    }), db.findAll('warehouse_managers', {
      company_id: user.company_id
    })]);
    return users.filter(u => u.status === 'active').map(u => ({
      id: u.id,
      name: u.full_name,
      role: u.role_code,
      position: employees.find(e => e.user_id === u.id)?.position,
      enabled: members.some(m => m.user_id === u.id && m.active),
      administrator: ADMIN.includes(u.role_code)
    }));
  },
  async setManager(userId, enabled, actor) {
    const user = await actorFor(actor);
    if (!ADMIN.includes(user.role_code)) bad('Administrator access required.', 403);
    const target = await db.findById('users', Number(userId));
    if (!target || target.company_id !== user.company_id || target.status !== 'active') bad('Choose an active account in this company.');
    const old = await db.findOne('warehouse_managers', {
      company_id: user.company_id,
      user_id: target.id
    });
    if (old) await db.update('warehouse_managers', old.id, {
      active: Boolean(enabled),
      assigned_by: user.id
    });else if (enabled) await db.insert('warehouse_managers', {
      company_id: user.company_id,
      user_id: target.id,
      active: true,
      assigned_by: user.id
    });
    await recordAudit(user, 'WAREHOUSE_MANAGER_UPDATED', 'users', target.id, {
      enabled: Boolean(enabled)
    });
    return this.team(user);
  }
};
