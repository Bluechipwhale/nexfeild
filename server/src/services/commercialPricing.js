import { db } from "../config/database.js";
import { calculateOrderTotals } from "../utils/calculations.js";
import {
  commercialScope,
  customerFor,
  ownRecord,
  records,
  identifier,
  numeric,
  day,
  fail,
  fingerprint,
} from "./commercialCore.js";
const same = (a, b) =>
  String(a || "")
    .trim()
    .toLowerCase() ===
  String(b || "")
    .trim()
    .toLowerCase();
export function selectPrice(product, customer, quantity, rules, today = day()) {
  const eligible = rules
    .filter((record) => {
      const rule = record.payload;
      return (
        record.status === "active" &&
        Number(rule.product_id) === Number(product.id) &&
        (!rule.customer_id ||
          Number(rule.customer_id) === Number(customer.id)) &&
        (!rule.tier || same(rule.tier, customer.tier)) &&
        (!rule.customer_type ||
          same(rule.customer_type, customer.customer_type)) &&
        quantity >= Number(rule.min_quantity || 1) &&
        (!rule.max_quantity || quantity <= rule.max_quantity) &&
        (!rule.start_date || rule.start_date <= today) &&
        (!rule.end_date || rule.end_date >= today)
      );
    })
    .sort((a, b) => {
      const specificity = (r) =>
        (r.payload.customer_id ? 4 : 0) +
        (r.payload.tier ? 2 : 0) +
        (r.payload.customer_type ? 1 : 0);
      return (
        specificity(b) - specificity(a) ||
        Number(b.payload.priority || 0) - Number(a.payload.priority || 0) ||
        Number(b.payload.min_quantity || 1) -
          Number(a.payload.min_quantity || 1) ||
        Number(a.id) - Number(b.id)
      );
    });
  const rule = eligible[0],
    base = numeric(product.price),
    price = rule
      ? rule.payload.unit_price != null
        ? numeric(rule.payload.unit_price)
        : base *
          (1 - numeric(rule.payload.discount_percent, { max: 100 }) / 100)
      : base;
  return {
    unit_price: Math.round(price * 100) / 100,
    base_price: base,
    pricing_rule_id: rule?.id || null,
    pricing_rule_name: rule?.payload.name || null,
  };
}
export const commercialPricing = {
  async quote(actor, input) {
    const scope = await commercialScope(actor);
    if (!scope.manager && scope.user.role_code !== "SALES_AGENT")
      fail("A sales account is required to view quotes.", 403);
    const customer = await customerFor(input.customer_id, scope);
    if(customer.status!=="active")fail("Choose an active customer account.");
    if (
      !Array.isArray(input.items) ||
      !input.items.length ||
      input.items.length > 100
    )
      fail("Choose between 1 and 100 order lines.");
    const seen = new Set(),
      rules = await records(scope, "pricing"),
      items = [];
    for (const line of input.items) {
      const id = identifier(line.product_id);
      if (seen.has(id)) fail("Combine duplicate product lines.");
      seen.add(id);
      const product = await ownRecord("products", id, scope);
      if (product.status !== "active")
        fail("This product is not available for ordering.");
      const quantity = numeric(line.quantity, {
        min: 1,
        max: 1000000,
        integer: true,
      });
      items.push({
        product_id: id,
        name: product.name,
        sku: product.sku,
        quantity,
        ...selectPrice(product, customer, quantity, rules),
      });
    }
    const discount = input.discount == null ? 0 : numeric(input.discount);
    const totals = calculateOrderTotals(items, discount);
    if (discount > totals.subtotal)
      fail("Discount exceeds the quoted subtotal.");
    return {
      company_id: scope.companyId,
      customer_id: customer.id,
      items,
      totals,
      price_fingerprint: fingerprint({
        items: items.map((i) => [i.product_id, i.quantity, i.unit_price]),
        discount,
      }),
      quoted_at: new Date().toISOString(),
    };
  },
  async rulesForCompany(companyId) {
    return db.find("commercial_records", {
      company_id: Number(companyId),
      kind: "pricing",
    });
  },
};
