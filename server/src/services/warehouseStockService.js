import { db } from '../config/database.js';
export const positiveQuantity = value => {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000000) throw Object.assign(new Error('Enter a whole quantity between 1 and 1,000,000.'), {
    status: 400
  });
  return n;
};
const text = value => String(value || '').trim();
export const warehouseStock = {
  async reserved(productId) {
    const lines = await db.findAll('warehouse_request_lines', {
      product_id: Number(productId)
    });
    const requests = await db.findAll('warehouse_requests');
    const active = new Set(requests.filter(r => !['CANCELLED', 'REJECTED', 'CLOSED'].includes(r.status)).map(r => r.id));
    return lines.filter(l => active.has(l.request_id)).reduce((n, l) => n + Math.max(0, l.approved_quantity - l.issued_quantity), 0);
  },
  async ensure(product) {
    const existing = await db.findAll('warehouse_stock_locations', {
      product_id: product.id,
      company_id: product.company_id
    });
    if (existing.length) return existing;
    const row = await db.insert('warehouse_stock_locations', {
      company_id: product.company_id,
      product_id: product.id,
      place: product.location_of_item || product.warehouse_name || 'Warehouse',
      space: product.shelf_number || product.shelve_location || 'Unspecified',
      stock_state: 'AVAILABLE',
      condition: product.condition || 'Not specified',
      quantity: Number(product.stock_quantity || 0)
    });
    return [row];
  },
  async take(product, quantity, {
    stockLocationId = null,
    reservedIssue = false
  } = {}) {
    const qty = positiveQuantity(quantity),
      reserved = await this.reserved(product.id);
    if (Number(product.stock_quantity) < qty || !reservedIssue && Number(product.stock_quantity) - reserved < qty) throw new Error(`Not enough unreserved stock for ${product.name}.`);
    const bins = (await this.ensure(product)).filter(b => b.stock_state === 'AVAILABLE' && b.quantity > 0 && (!stockLocationId || Number(b.id) === Number(stockLocationId)));
    if (bins.reduce((n, b) => n + b.quantity, 0) < qty) throw new Error('Not enough stock in that warehouse space. Select the correct source location.');
    let remaining = qty;
    for (const bin of bins) {
      const moved = Math.min(remaining, bin.quantity);
      if (moved) await db.update('warehouse_stock_locations', bin.id, {
        quantity: bin.quantity - moved
      });
      remaining -= moved;
      if (!remaining) break;
    }
    const newQty = Number(product.stock_quantity) - qty;
    await db.update('products', product.id, {
      stock_quantity: newQty,
      quantity_display: String(newQty)
    });
    return newQty;
  },
  async put(product, quantity, {
    place,
    space,
    condition = 'Good',
    stockState = 'AVAILABLE'
  } = {}) {
    const qty = positiveQuantity(quantity);
    await this.ensure(product);
    const position = {
      company_id: product.company_id,
      product_id: product.id,
      place: text(place) || product.location_of_item || product.warehouse_name || 'Warehouse',
      space: text(space) || product.shelf_number || product.shelve_location || 'Unspecified',
      stock_state: stockState
    };
    let bin = await db.findOne('warehouse_stock_locations', position);
    if (bin) await db.update('warehouse_stock_locations', bin.id, {
      quantity: bin.quantity + qty,
      condition
    });else bin = await db.insert('warehouse_stock_locations', {
      ...position,
      quantity: qty,
      condition
    });
    const newQty = Number(product.stock_quantity) + (stockState === 'AVAILABLE' ? qty : 0);
    const updates = {
      stock_quantity: newQty,
      quantity_display: String(newQty)
    };
    if (!Number(product.stock_quantity) && stockState === 'AVAILABLE') Object.assign(updates, {
      warehouse_name: position.place,
      location_of_item: position.place,
      shelf_number: position.space,
      shelve_location: position.space,
      condition
    });
    await db.update('products', product.id, updates);
    return newQty;
  }
};
