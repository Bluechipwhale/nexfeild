import { db } from "../config/database.js";
import { warehouseStock } from "./warehouseStockService.js";
import {
  commercialScope,
  commercialOperation,
  ownRecord,
  records,
  employeeFor,
  identifier,
  numeric,
  requiredText,
  insertRecord,
  fail,
} from "./commercialCore.js";
export async function stockAccountFor(id, scope, manage = false) {
  const account = await ownRecord("commercial_records", id, scope);
  if (account.kind !== "stock_account" || account.status !== "active")
    fail("Stock account is not active.");
  if (
    !scope.manager &&
    Number(account.payload.employee_id) !== Number(scope.employee?.id)
  )
    fail("Stock account is not assigned to you.", 403);
  if (manage && !scope.manager)
    fail("A commercial administrator must approve stock transfers.", 403);
  return account;
}
async function balanceFor(account, productId) {
  return (
    (await db.findOne("commercial_balances", {
      company_id: account.company_id,
      account_id: account.id,
      product_id: Number(productId),
    })) ||
    (await db.insert("commercial_balances", {
      company_id: account.company_id,
      account_id: account.id,
      product_id: Number(productId),
      quantity: 0,
      created_at: new Date().toISOString(),
    }))
  );
}
async function change(account, productId, delta, movement, scope, input) {
  const balance = await balanceFor(account, productId),
    next = Number(balance.quantity) + delta;
  if (next < 0) fail("This stock account does not have enough units.", 409);
  await db.update("commercial_balances", balance.id, { quantity: next });
  await db.insert("commercial_stock_events", {
    company_id: scope.companyId,
    account_id: account.id,
    product_id: Number(productId),
    actor_id: scope.user.id,
    movement,
    quantity: delta,
    balance_after: next,
    reference: input.reference || "",
    note: input.note || "",
    created_at: new Date().toISOString(),
  });
  return next;
}
export const commercialStock = {
  async accounts(actor) {
    const scope = await commercialScope(actor);
    return (await records(scope, "stock_account")).filter(
      (a) =>
        scope.manager ||
        Number(a.payload.employee_id) === Number(scope.employee?.id),
    );
  },
  async create(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "stock_account", input, async () => {
      const employee = await employeeFor(input.employee_id, scope);
      return insertRecord(scope, "stock_account", {
        name: requiredText(input.name),
        employee_id: employee.id,
        type: ["van", "outlet"].includes(input.type) ? input.type : "van",
      });
    });
  },
  async detail(actor, id) {
    const scope = await commercialScope(actor),
      account = await stockAccountFor(id, scope);
    return {
      account,
      balances: await db.find("commercial_balances", {
        company_id: scope.companyId,
        account_id: account.id,
      }),
      events: await db.find(
        "commercial_stock_events",
        { company_id: scope.companyId, account_id: account.id },
        { order: { column: "id", ascending: false }, limit: 200 },
      ),
      counts: (await records(scope, "stock_count")).filter(
        (r) => Number(r.payload.account_id) === Number(account.id),
      ),
    };
  },
  async move(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "stock_move", input, async () => {
      const account = await stockAccountFor(input.account_id, scope, true),
        product = await ownRecord("products", input.product_id, scope),
        quantity = numeric(input.quantity, {
          min: 1,
          max: 1000000,
          integer: true,
        }),
        note = requiredText(input.note, 1000);
      let balance;
      if (input.movement === "load") {
        await warehouseStock.take(product, quantity);
        balance = await change(account, product.id, quantity, "LOAD", scope, {
          note,
        });
      } else if (input.movement === "return") {
        balance = await change(
          account,
          product.id,
          -quantity,
          "RETURN",
          scope,
          { note },
        );
        await warehouseStock.put(product, quantity, {
          place: requiredText(input.place),
          space: requiredText(input.space),
          condition: "Good",
        });
      } else if (input.movement === "loss") {
        balance = await change(account, product.id, -quantity, "LOSS", scope, {
          note,
        });
      } else if (input.movement === "transfer") {
        const destination = await stockAccountFor(
          input.destination_id,
          scope,
          true,
        );
        if (destination.id === account.id)
          fail("Choose a different destination.");
        balance = await change(
          account,
          product.id,
          -quantity,
          "TRANSFER_OUT",
          scope,
          { note },
        );
        await change(destination, product.id, quantity, "TRANSFER_IN", scope, {
          note,
        });
      } else fail("Choose load, return, transfer or loss.");
      if (["load", "return"].includes(input.movement)) {
        const next = await db.findById("products", product.id);
        await db.insert("inventory_transactions", {
          product_id: product.id,
          change_quantity: input.movement === "load" ? -quantity : quantity,
          previous_quantity: product.stock_quantity,
          new_quantity: next.stock_quantity,
          type: input.movement === "load" ? "VAN_LOAD" : "VAN_RETURN",
          reference_id: "STOCK-ACCOUNT-" + account.id,
          notes: note,
          created_by: scope.employee?.id || null,
        });
        await db.insert('inventory_movements', {
          company_id: scope.companyId, product_id: product.id,
          movement_type: input.movement === 'load' ? 'VAN_LOAD' : 'VAN_RETURN',
          quantity, previous_quantity: product.stock_quantity, new_quantity: next.stock_quantity,
          reference_number: 'STOCK-ACCOUNT-' + account.id, notes: note, recorded_by: scope.user.id,
        });
      }
      return {
        id: account.id,
        account_id: account.id,
        product_id: product.id,
        balance,
      };
    });
  },
  async consume(actor, accountId, productId, quantity, reference) {
    const scope = await commercialScope(actor),
      account = await stockAccountFor(accountId, scope);
    return change(
      account,
      productId,
      -numeric(quantity, { min: 1, max: 1000000, integer: true }),
      "SALE",
      scope,
      { reference, note: "Recorded sales order" },
    );
  },
  async available(actor, accountId, productId) {
    const scope = await commercialScope(actor),
      account = await stockAccountFor(accountId, scope);
    return Number(
      (
        await db.findOne("commercial_balances", {
          company_id: scope.companyId,
          account_id: account.id,
          product_id: Number(productId),
        })
      )?.quantity || 0,
    );
  },
  async count(actor, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(scope, "stock_count", input, async () => {
      const account = await stockAccountFor(input.account_id, scope);
      if (
        !Array.isArray(input.lines) ||
        !input.lines.length ||
        input.lines.length > 200
      )
        fail("Enter between 1 and 200 counted lines.");
      const seen = new Set(),
        lines = [];
      for (const line of input.lines) {
        const product = await ownRecord("products", line.product_id, scope);
        if (seen.has(product.id)) fail("Count each product once.");
        seen.add(product.id);
        const balance = await balanceFor(account, product.id);
        lines.push({
          product_id: product.id,
          expected: Number(balance.quantity),
          counted: numeric(line.counted, { integer: true, max: 1000000 }),
        });
      }
      return insertRecord(
        scope,
        "stock_count",
        { account_id: account.id, lines, note: requiredText(input.note, 1000) },
        { status: "pending" },
      );
    });
  },
  async approveCount(actor, id, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(
      scope,
      "stock_count_review",
      { ...input, target_id: Number(id) },
      async () => {
        const count = await ownRecord("commercial_records", id, scope);
        if (count.kind !== "stock_count" || count.status !== "pending")
          fail("Count is no longer awaiting review.", 409);
        const account = await stockAccountFor(
            count.payload.account_id,
            scope,
            true,
          ),
          note = requiredText(input.note, 1000);
        for (const line of count.payload.lines) {
          const balance = await balanceFor(account, line.product_id);
          if (Number(balance.quantity) !== line.expected)
            fail(
              "Stock changed after counting. Submit a new count before adjusting it.",
              409,
            );
        }
        if (input.approve === true)
          for (const line of count.payload.lines) {
            const delta = line.counted - line.expected;
            if (delta)
              await change(
                account,
                line.product_id,
                delta,
                "COUNT_ADJUSTMENT",
                scope,
                { note },
              );
          }
        else if (input.approve !== false) fail("Choose approve or reject.");
        return db.update("commercial_records", count.id, {
          status: input.approve ? "approved" : "rejected",
          payload: {
            ...count.payload,
            review_note: note,
            reviewed_by: scope.user.id,
          },
          version: count.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
};
