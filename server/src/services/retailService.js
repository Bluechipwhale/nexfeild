import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { selectPrice } from "./commercialPricing.js";
import { salesService } from "./salesService.js";
import { calculateOrderTotals } from "../utils/calculations.js";
import {
  commercialScope,
  commercialOperation,
  ownRecord,
  customerFor,
  employeeFor,
  insertRecord,
  records,
  identifier,
  numeric,
  text,
  requiredText,
  fail,
  fingerprint,
} from "./commercialCore.js";
const secret = () =>
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== "production"
    ? "edgewforce-retail-local-tests-only"
    : fail("Retail authentication is not configured.", 503));
const publicAccount = (account) => ({
  id: account.id,
  company_id: account.company_id,
  customer_id: account.customer_id,
  email: account.email,
  status: account.status,
  requires_password_change: account.requires_password_change,
});
const sign = (account) =>
  jwt.sign(
    {
      token_use: "retail_access",
      retailAccountId: account.id,
      companyId: account.company_id,
      passwordVersion: account.password_version,
    },
    secret(),
    { expiresIn: "8h", issuer: "eedgewforce-retail", audience: "retail" },
  );
const password = (value) => {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    fail("Use a password of 12 to 128 characters.");
  return value;
};
const email = (value) => {
  const e = requiredText(value, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    fail("Enter a valid email address.");
  return e;
};
async function quote(customer, input) {
  if (
    !Array.isArray(input.items) ||
    !input.items.length ||
    input.items.length > 100
  )
    fail("Choose between 1 and 100 products.");
  const rules = await db.find("commercial_records", {
      company_id: customer.company_id,
      kind: "pricing",
    }),
    seen = new Set(),
    lines = [];
  for (const line of input.items) {
    const id = identifier(line.product_id);
    if (seen.has(id)) fail("Combine duplicate product lines.");
    seen.add(id);
    const product = await db.findById("products", id);
    if (
      !product ||
      Number(product.company_id) !== Number(customer.company_id) ||
      product.status !== "active"
    )
      fail("Product is not available.");
    const quantity = numeric(line.quantity, {
      min: 1,
      max: 1000000,
      integer: true,
    });
    lines.push({
      product_id: id,
      name: product.name,
      sku: product.sku,
      quantity,
      ...selectPrice(product, customer, quantity, rules),
    });
  }
  const totals = calculateOrderTotals(lines, 0);
  return {
    items: lines,
    totals,
    price_fingerprint: fingerprint({
      lines: lines.map((l) => ({
        id: l.product_id,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
      totals,
    }),
  };
}
export const retailService = {
  async accounts(actor) {
    const scope = await commercialScope(actor, true);
    return (
      await db.find("commercial_portal_accounts", {
        company_id: scope.companyId,
      })
    ).map(publicAccount);
  },
  async createAccount(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "retail_account", input, async () => {
      const customer = await customerFor(input.customer_id, scope),
        login = email(input.email);
      if (
        await db.findOne("commercial_portal_accounts", {
          company_id: scope.companyId,
          email: login,
        })
      )
        fail("This customer login already exists.", 409);
      const hash = await bcrypt.hash(password(input.password), 12);
      const account = await db.insert("commercial_portal_accounts", {
        company_id: scope.companyId,
        customer_id: customer.id,
        email: login,
        password_hash: hash,
        password_version: 1,
        requires_password_change: true,
        status: "active",
        created_by: scope.user.id,
        created_at: new Date().toISOString(),
      });
      return publicAccount(account);
    });
  },
  async deactivate(actor, id, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(
      scope,
      "retail_account_status",
      { ...input, target_id: Number(id) },
      async () => {
        const account = await ownRecord(
          "commercial_portal_accounts",
          id,
          scope,
        );
        if (!["active", "inactive"].includes(input.status))
          fail("Choose active or inactive.");
        return publicAccount(
          await db.update("commercial_portal_accounts", account.id, {
            status: input.status,
            password_version: account.password_version + 1,
          }),
        );
      },
    );
  },
  async login(input) {
    let account;
    try {
      account = await db.findOne("commercial_portal_accounts", {
        company_id: identifier(input.company_id),
        email: email(input.email),
      });
    } catch {
      fail("Invalid company number, email or password.", 401);
    }
    if (typeof input.password !== "string" || input.password.length > 128)
      fail("Invalid company number, email or password.", 401);
    const valid = await bcrypt.compare(
      input.password,
      account?.password_hash ||
        "$2b$12$w2.KjLnuo9P7MgBkB07wdeI.RJkNcuTdg0YztfFMlva6Dp3xR2rEO",
    );
    if (!valid || account?.status !== "active")
      fail("Invalid company number, email or password.", 401);
    return { token: sign(account), account: publicAccount(account) };
  },
  async authenticate(token, allowPasswordChange = false) {
    let decoded;
    try {
      decoded = jwt.verify(token, secret(), {
        issuer: "eedgewforce-retail",
        audience: "retail",
        algorithms: ["HS256"],
      });
    } catch {
      fail("Sign in to the customer portal again.", 401);
    }
    if (decoded.token_use !== "retail_access")
      fail("A customer session is required.", 401);
    const account = await db.findById(
      "commercial_portal_accounts",
      decoded.retailAccountId,
    );
    if (
      !account ||
      account.status !== "active" ||
      Number(account.company_id) !== Number(decoded.companyId) ||
      Number(account.password_version) !== Number(decoded.passwordVersion)
    )
      fail("Sign in to the customer portal again.", 401);
    if (account.requires_password_change && !allowPasswordChange)
      fail(
        "Change your initial password before using the customer portal.",
        403,
      );
    const customer = await db.findById("customers", account.customer_id);
    if (!customer || customer.status !== "active" || Number(customer.company_id) !== Number(account.company_id))
      fail("Customer account is not available.", 403);
    return {
      account,
      customer,
      companyId: Number(account.company_id),
      actorKey: `retail:${account.id}`,
    };
  },
  async changePassword(context, input) {
    if (db.isCloud)
      fail(
        "Customer password changes require the transactional deployment.",
        503,
      );
    return db.transaction(async () => {
      const current = await db.findById(
        "commercial_portal_accounts",
        context.account.id,
      );
      if (
        !current ||
        current.status !== "active" ||
        Number(current.password_version) !==
          Number(context.account.password_version)
      )
        fail("Sign in again before changing this password.", 401);
      if (
        !(await bcrypt.compare(
          String(input.current_password || ""),
          current.password_hash,
        ))
      )
        fail("The current password is incorrect.", 403);
      const hash = await bcrypt.hash(password(input.new_password), 12);
      const account = await db.update(
        "commercial_portal_accounts",
        current.id,
        {
          password_hash: hash,
          password_version: current.password_version + 1,
          requires_password_change: false,
        },
      );
      return { token: sign(account), account: publicAccount(account) };
    });
  },
  async overview(context) {
    const products = (
        await db.find("products", { company_id: context.companyId })
      ).filter((p) => p.status === "active"),
      rules = await db.find("commercial_records", {
        company_id: context.companyId,
        kind: "pricing",
      });
    return {
      account: publicAccount(context.account),
      customer: {
        id: context.customer.id,
        name: context.customer.name,
        code: context.customer.code,
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        ...selectPrice(p, context.customer, 1, rules),
      })),
      requests: await db.find("commercial_records", {
        company_id: context.companyId,
        kind: "retail_order",
        customer_id: context.customer.id,
      }),
      orders: (
        await db.find("orders", {
          company_id: context.companyId,
          customer_id: context.customer.id,
        })
      ).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        order_date: o.order_date,
        total_amount: o.total_amount,
        status: o.status,
        payment_status: o.payment_status,
        delivery_status: o.delivery_status,
      })),
    };
  },
  async quote(context, input) {
    return quote(context.customer, input);
  },
  async submit(context, input) {
    if (
      input.customer_id &&
      Number(input.customer_id) !== Number(context.customer.id)
    )
      fail("The order must belong to your customer account.", 403);
    return commercialOperation(context, "retail_order", input, async () => {
      const priced = await quote(context.customer, input);
      if (
        input.price_fingerprint &&
        input.price_fingerprint !== priced.price_fingerprint
      )
        fail("Prices changed. Review a fresh quote before submitting.", 409);
      return insertRecord(
        context,
        "retail_order",
        {
          customer_name: context.customer.name,
          items: priced.items,
          totals: priced.totals,
          price_fingerprint: priced.price_fingerprint,
          note: text(input.note || "", 1000),
          source: input.source === "whatsapp" ? "whatsapp" : "customer_portal",
        },
        { customerId: context.customer.id, status: "pending", ownerId: null },
      );
    });
  },
  async cancel(context, id, input) {
    return commercialOperation(
      context,
      "retail_cancel",
      { ...input, target_id: Number(id) },
      async () => {
        const order = await db.findById("commercial_records", identifier(id));
        if (
          !order ||
          Number(order.company_id) !== context.companyId ||
          Number(order.customer_id) !== Number(context.customer.id) ||
          order.kind !== "retail_order"
        )
          fail("Order request not found.", 404);
        if (order.status !== "pending")
          fail("Only pending order requests can be cancelled.", 409);
        return db.update("commercial_records", order.id, {
          status: "cancelled",
          version: order.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
  async review(actor, id, input, req) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(
      scope,
      "retail_review",
      { ...input, target_id: Number(id) },
      async () => {
        const request = await ownRecord("commercial_records", id, scope);
        if (request.kind !== "retail_order" || request.status !== "pending")
          fail("This order request has already been reviewed.", 409);
        const customer = await customerFor(request.customer_id, scope),
          note = requiredText(input.note, 1000);
        if (input.action === "reject")
          return db.update("commercial_records", request.id, {
            status: "rejected",
            payload: { ...request.payload, review_note: note },
            version: request.version + 1,
            updated_at: new Date().toISOString(),
          });
        if (input.action !== "accept") fail("Choose accept or reject.");
        const employee = await employeeFor(input.employee_id, scope),
          priced = await quote(customer, { items: request.payload.items });
        if (priced.price_fingerprint !== request.payload.price_fingerprint)
          fail(
            "Prices changed since the customer submitted this request. Ask the customer to review and submit a new quote.",
            409,
          );
        let payment = "Credit";
        if (input.payment_confirmed === true) {
          requiredText(input.payment_reference, 200);
          payment = "Bank Transfer";
        } else if (
          input.payment_confirmed !== false &&
          input.payment_confirmed != null
        )
          fail("Payment confirmation must be true or false.");
        const order = await salesService.createOrder(
          {
            customer_id: customer.id,
            items: request.payload.items,
            discount: 0,
            payment_method: payment,
            notes: `Customer request ${request.id}. ${note}${input.payment_confirmed ? ` Payment independently verified by reviewer: ${input.payment_reference}.` : ""}`,
            idempotency_key: `retail-${scope.companyId}-${request.id}`,
          },
          employee.id,
          { ...req, user: actor },
        );
        await db.update("orders", order.id, {
          status: "approved",
          delivery_status: "pending",
        });
        if (input.payment_confirmed === true)
          await db.insert("collections", {
            company_id: scope.companyId,
            customer_id: customer.id,
            agent_id: employee.id,
            order_id: order.id,
            amount: order.total_amount,
            payment_method: payment,
            reference_number: input.payment_reference,
            status: "PAID",
            payment_date: new Date().toISOString(),
            notes: "Payment independently verified for this retail order.",
            idempotency_key:
              "retail-paid-" + scope.companyId + "-" + request.id,
          });
        return db.update("commercial_records", request.id, {
          status: "accepted",
          payload: {
            ...request.payload,
            order_id: order.id,
            order_number: order.order_number,
            review_note: note,
            reviewed_by: scope.user.id,
            payment_verified: input.payment_confirmed === true,
          },
          version: request.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
};
