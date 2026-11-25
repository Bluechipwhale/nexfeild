import { db } from "../config/database.js";
import { commercialPricing } from "./commercialPricing.js";
import { salesService } from "./salesService.js";
import { stockAccountFor } from "./commercialStock.js";
import {
  commercialScope,
  commercialOperation,
  customerFor,
  employeeFor,
  ownRecord,
  records,
  insertRecord,
  requiredText,
  text,
  numeric,
  fail,
  fingerprint,
} from "./commercialCore.js";
async function priced(scope, input) {
  return commercialPricing.quote(scope.user, {
    customer_id: input.customer_id,
    items: input.items,
    discount: input.discount || 0,
  });
}
async function recordFor(scope, id) {
  const r = await ownRecord("commercial_records", id, scope);
  if (r.kind !== "staff_order") fail("Order request not found.", 404);
  if (!scope.manager && Number(r.owner_id) !== Number(scope.user.id))
    fail("This request belongs to another staff account.", 403);
  return r;
}
export const commercialOrders = {
  async submit(actor, input) {
    const scope = await commercialScope(actor);
    if (!scope.manager && scope.user.role_code !== "SALES_AGENT")
      fail("A sales account is required.", 403);
    return commercialOperation(scope, "staff_order_submit", input, async () => {
      const quote = await priced(scope, input),
        customer = await customerFor(input.customer_id, scope),
        employee = await employeeFor(
          input.employee_id || scope.employee?.id,
          scope,
        );
      if (input.stock_account_id)
        await stockAccountFor(input.stock_account_id, scope);
      const record = await insertRecord(
        scope,
        "staff_order",
        {
          customer_name: customer.name,
          customer_id: customer.id,
          employee_id: employee.id,
          items: quote.items,
          totals: quote.totals,
          discount: Number(input.discount || 0),
          payment_method: ["Credit", "Cash", "Bank Transfer"].includes(
            input.payment_method,
          )
            ? input.payment_method
            : "Credit",
          stock_account_id: input.stock_account_id
            ? Number(input.stock_account_id)
            : null,
          note: text(input.note || "", 1000),
          revisions: [],
        },
        { customerId: customer.id, status: "pending" },
      );
      return { ...record, request_number: `REQ-${record.id}` };
    });
  },
  async revise(actor, id, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(
      scope,
      "staff_order_revise",
      { ...input, target_id: Number(id) },
      async () => {
        const record = await recordFor(scope, id);
        if (
          !["pending", "changes"].includes(record.status) ||
          record.version !== Number(input.version)
        )
          fail("Refresh this pending request before changing it.", 409);
        const quote = await priced(scope, {
          ...input,
          customer_id: record.customer_id,
        });
        return db.update("commercial_records", record.id, {
          status: "pending",
          payload: {
            ...record.payload,
            items: quote.items,
            totals: quote.totals,
            discount: Number(input.discount || 0),
            note: requiredText(input.note, 1000),
            revisions: [
              ...(record.payload.revisions || []),
              {
                version: record.version,
                items: record.payload.items,
                totals: record.payload.totals,
                note: record.payload.note,
                changed_by: scope.user.id,
                at: new Date().toISOString(),
              },
            ].slice(-20),
          },
          version: record.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
  async review(actor, id, input, req) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(
      scope,
      "staff_order_review",
      { ...input, target_id: Number(id) },
      async () => {
        const record = await recordFor(scope, id);
        if (
          !["pending", "changes"].includes(record.status) ||
          record.version !== Number(input.version)
        )
          fail("This request changed or was reviewed. Refresh it.", 409);
        const note = requiredText(input.note, 1000);
        if (["reject", "changes"].includes(input.action))
          return db.update("commercial_records", record.id, {
            status: input.action === "reject" ? "rejected" : "changes",
            payload: {
              ...record.payload,
              review_note: note,
              reviewed_by: scope.user.id,
            },
            version: record.version + 1,
            updated_at: new Date().toISOString(),
          });
        if (input.action !== "approve")
          fail("Choose approve, reject or request changes.");
        await employeeFor(record.payload.employee_id, scope);
        const quote = await priced(scope, {
            ...record.payload,
            customer_id: record.customer_id,
          }),
          hash = fingerprint(
            quote.items.map((i) => [i.product_id, i.quantity, i.unit_price]),
          );
        const oldHash = fingerprint(
          record.payload.items.map((i) => [
            i.product_id,
            i.quantity,
            i.unit_price,
          ]),
        );
        if (hash !== oldHash)
          fail(
            "Prices changed. Revise the request using a fresh quote before approval.",
            409,
          );
        const paid = input.payment_confirmed === true;
        if (record.payload.payment_method !== "Credit" && !paid)
          fail(
            "Verify the actual payment before approving a cash or transfer order.",
          );
        const paymentReference = paid
          ? requiredText(input.payment_reference, 200)
          : null;
        const order = await salesService.createOrder(
          {
            customer_id: record.customer_id,
            items: quote.items,
            discount: record.payload.discount,
            payment_method: paid
              ? record.payload.payment_method === "Credit"
                ? "Bank Transfer"
                : record.payload.payment_method
              : "Credit",
            stock_account_id: record.payload.stock_account_id || null,
            notes: `Approved request REQ-${record.id}. ${note}`,
            idempotency_key: `commercial-${scope.companyId}-${record.id}`,
          },
          record.payload.employee_id,
          { ...req, user: actor },
        );
        await db.update("orders", order.id, {
          status: "approved",
          delivery_status: "pending",
        });
        if (paid)
          await db.insert("collections", {
            company_id: scope.companyId,
            customer_id: record.customer_id,
            agent_id: record.payload.employee_id,
            order_id: order.id,
            amount: order.total_amount,
            payment_method: order.payment_method,
            reference_number: paymentReference,
            status: "PAID",
            payment_date: new Date().toISOString(),
            notes: `Payment verified by reviewer for ${order.order_number}.`,
            idempotency_key: `commercial-paid-${scope.companyId}-${record.id}`,
          });
        return db.update("commercial_records", record.id, {
          status: "approved",
          payload: {
            ...record.payload,
            order_id: order.id,
            order_number: order.order_number,
            review_note: note,
            reviewed_by: scope.user.id,
            payment_reference: paymentReference,
          },
          version: record.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
  async shipment(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "shipment_dispatch", input, async () => {
      const order = await ownRecord("orders", input.order_id, scope);
      if (
        ["cancelled", "rejected", "draft", "pending"].includes(
          String(order.status).toLowerCase(),
        )
      )
        fail("Approve the order before dispatch.");
      const driver = await employeeFor(input.employee_id, scope),
        lines = await db.find("order_items", {
          company_id: scope.companyId,
          order_id: order.id,
        }),
        old = (await records(scope, "shipment")).filter(
          (r) => Number(r.payload.order_id) === Number(order.id),
        );
      const legacy = await db.find("deliveries", {
        company_id: scope.companyId,
        order_id: order.id,
      });
      if (
        legacy.some(
          (d) =>
            !old.some((r) => Number(r.payload.delivery_id) === Number(d.id)),
        )
      )
        fail(
          "This order already has a full-order delivery. Finish that workflow instead of creating a duplicate shipment.",
          409,
        );
      if (!Array.isArray(input.lines) || !input.lines.length)
        fail("Choose quantities to dispatch.");
      const seen = new Set(),
        shipment = [];
      for (const item of input.lines) {
        const line = lines.find(
          (l) => Number(l.product_id) === Number(item.product_id),
        );
        if (!line || seen.has(line.product_id))
          fail("Choose distinct products from this order.");
        seen.add(line.product_id);
        const allocated = old
            .filter((r) => r.status !== "cancelled")
            .reduce(
              (n, r) =>
                n +
                (r.payload.lines.find(
                  (l) => Number(l.product_id) === Number(item.product_id),
                )?.quantity || 0),
              0,
            ),
          quantity = numeric(item.quantity, {
            min: 1,
            max: 1000000,
            integer: true,
          });
        if (quantity + allocated > Number(line.quantity))
          fail("Shipment quantities exceed the unallocated order units.", 409);
        shipment.push({ product_id: line.product_id, quantity });
      }
      const delivery = await db.insert("deliveries", {
        company_id: scope.companyId,
        order_id: order.id,
        customer_id: order.customer_id,
        driver_name: [driver.first_name, driver.last_name]
          .filter(Boolean)
          .join(" "),
        driver_phone: driver.phone || null,
        vehicle_number: requiredText(input.vehicle_number, 100),
        dispatch_time: new Date().toISOString(),
        delivery_status: "IN_TRANSIT",
      });
      await db.update("orders", order.id, {
        delivery_status: "PARTIALLY_DISPATCHED",
      });
      return insertRecord(
        scope,
        "shipment",
        {
          order_id: order.id,
          order_number: order.order_number,
          delivery_id: delivery.id,
          employee_id: driver.id,
          lines: shipment,
          vehicle_number: input.vehicle_number,
        },
        { customerId: order.customer_id, status: "dispatched" },
      );
    });
  },
  async proof(actor, id, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(
      scope,
      "shipment_proof",
      { ...input, target_id: Number(id) },
      async () => {
        const shipment = await ownRecord("commercial_records", id, scope);
        if (shipment.kind !== "shipment" || shipment.status !== "dispatched")
          fail("Shipment is not awaiting delivery proof.", 409);
        if (
          !scope.manager &&
          Number(shipment.payload.employee_id) !== Number(scope.employee?.id)
        )
          fail("This shipment is not assigned to you.", 403);
        const evidence = await ownRecord(
          "commercial_records",
          input.evidence_id,
          scope,
        );
        if (
          evidence.kind !== "evidence" ||
          (!scope.manager &&
            Number(evidence.owner_id) !== Number(scope.user.id))
        )
          fail("Upload your delivery photo first.");
        let signature = null;
        if (input.signature_id) {
          const proof = await ownRecord(
            "commercial_records",
            input.signature_id,
            scope,
          );
          if (
            proof.kind !== "evidence" ||
            (!scope.manager && Number(proof.owner_id) !== Number(scope.user.id))
          )
            fail("Invalid recipient signature.");
          signature = proof.payload.url;
        }
        const recipient = requiredText(input.recipient_name, 200),
          updated = await db.update("commercial_records", shipment.id, {
            status: "delivered",
            payload: {
              ...shipment.payload,
              recipient_name: recipient,
              photo_url: evidence.payload.url,
              signature_url: signature,
              delivered_at: new Date().toISOString(),
            },
            version: shipment.version + 1,
            updated_at: new Date().toISOString(),
          });
        await db.update("deliveries", shipment.payload.delivery_id, {
          delivery_status: "DELIVERED",
          actual_delivery_time: new Date().toISOString(),
          recipient_name: recipient,
          proof_of_delivery_photo: evidence.payload.url,
          recipient_signature: signature,
        });
        const order = await ownRecord(
            "orders",
            shipment.payload.order_id,
            scope,
          ),
          lines = await db.find("order_items", {
            company_id: scope.companyId,
            order_id: order.id,
          }),
          all = (await records(scope, "shipment")).filter(
            (r) =>
              Number(r.payload.order_id) === Number(order.id) &&
              r.status === "delivered",
          );
        const complete = lines.every(
          (line) =>
            all.reduce(
              (n, r) =>
                n +
                (r.payload.lines.find(
                  (i) => Number(i.product_id) === Number(line.product_id),
                )?.quantity || 0),
              0,
            ) >= line.quantity,
        );
        await db.update("orders", order.id, {
          delivery_status: complete ? "DELIVERED" : "PARTIALLY_DELIVERED",
          status: complete ? "delivered" : order.status,
        });
        return updated;
      },
    );
  },
};
