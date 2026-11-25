import { createHash } from "node:crypto";
import { db } from "../config/database.js";
import { storageService } from "./storageService.js";
import { salesService } from "./salesService.js";
import { commercialPricing } from "./commercialPricing.js";
import {
  commercialScope,
  commercialOperation,
  customerFor,
  visibleCustomer,
  employeeFor,
  ownRecord,
  records,
  insertRecord,
  identifier,
  numeric,
  text,
  requiredText,
  date,
  day,
  fail,
  fingerprint,
} from "./commercialCore.js";
const configurationKinds = [
  "pricing",
  "target",
  "distributor",
  "coverage",
  "form",
  "bi_embed",
];
const isClosed = (value) =>
  ["cancelled", "canceled", "rejected", "draft", "request_changes"].includes(
    String(value).toLowerCase(),
  );
const between = (value, start, end) => {
  if (!value) return false;
  const d = String(value).length > 10 ? day(value) : String(value);
  return d >= start && d <= end;
};
const salesAllowed = (scope) =>
  scope.manager || scope.user.role_code === "SALES_AGENT";
const distance = (a, b) => {
  const rad = (n) => (n * Math.PI) / 180,
    dLat = rad(b.latitude - a.latitude),
    dLng = rad(b.longitude - a.longitude);
  return (
    6371000 *
    2 *
    Math.atan2(
      Math.sqrt(
        Math.sin(dLat / 2) ** 2 +
          Math.cos(rad(a.latitude)) *
            Math.cos(rad(b.latitude)) *
            Math.sin(dLng / 2) ** 2,
      ),
      Math.sqrt(
        1 -
          (Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(a.latitude)) *
              Math.cos(rad(b.latitude)) *
              Math.sin(dLng / 2) ** 2),
      ),
    )
  );
};
const hasPoint = (point) =>
  point?.latitude != null &&
  point?.longitude != null &&
  Number.isFinite(Number(point.latitude)) &&
  Number.isFinite(Number(point.longitude)) &&
  Math.abs(Number(point.latitude)) <= 90 &&
  Math.abs(Number(point.longitude)) <= 180;
function visibleRecord(record, scope, customers) {
  if (scope.manager) return true;
  if (
    [
      "staff_order",
      "retail_order",
      "campaign",
      "consent",
      "erp_import",
    ].includes(record.kind)
  )
    return (
      record.kind === "staff_order" &&
      scope.user.role_code === "SALES_AGENT" &&
      Number(record.owner_id) === Number(scope.user.id)
    );
  if (record.kind === "stock_account")
    return Number(record.payload.employee_id) === Number(scope.employee?.id);
  if (record.kind === "stock_count")
    return Number(record.owner_id) === Number(scope.user.id);
  if (record.kind === "shipment")
    return Number(record.payload.employee_id) === Number(scope.employee?.id);
  if (record.kind === "form")
    return (
      record.status === "active" &&
      (!record.payload.employee_ids?.length ||
        record.payload.employee_ids.some((id) =>
          scope.team.includes(Number(id)),
        )) &&
      (!record.payload.customer_ids?.length ||
        customers.some((c) =>
          record.payload.customer_ids.includes(Number(c.id)),
        ))
    );
  if (["pricing", "bi_embed", "distributor"].includes(record.kind))
    return false;
  if (record.kind === "target")
    return record.payload.subject_type === "staff"
      ? scope.team.includes(Number(record.payload.subject_id))
      : customers.some(
          (c) => Number(c.id) === Number(record.payload.subject_id),
        );
  return (
    Number(record.owner_id) === Number(scope.user.id) ||
    scope.team.includes(Number(record.payload.employee_id)) ||
    (record.customer_id &&
      customers.some((c) => Number(c.id) === Number(record.customer_id)))
  );
}
async function catalogue(scope) {
  const customerList = (
    await db.find("customers", { company_id: scope.companyId })
  ).filter((c) => visibleCustomer(c, scope));
  const employees = (
    await db.find("employees", { company_id: scope.companyId })
  ).filter(
    (e) =>
      e.status === "active" &&
      (scope.manager || scope.team.includes(Number(e.id))),
  );
  const products = (
    await db.find("products", { company_id: scope.companyId })
  ).filter((p) => p.status === "active");
  return { customers: customerList, employees, products };
}
async function validateConfiguration(scope, kind, input) {
  const name = requiredText(input.name),
    payload = { name };
  if (kind === "pricing") {
    const product = await ownRecord("products", input.product_id, scope);
    Object.assign(payload, {
      product_id: product.id,
      min_quantity: numeric(input.min_quantity ?? 1, {
        min: 1,
        max: 1000000,
        integer: true,
      }),
      priority: numeric(input.priority ?? 0, { max: 1000, integer: true }),
    });
    if (input.max_quantity != null && input.max_quantity !== "") {
      payload.max_quantity = numeric(input.max_quantity, {
        min: payload.min_quantity,
        max: 1000000,
        integer: true,
      });
    }
    if (input.customer_id)
      payload.customer_id = (await customerFor(input.customer_id, scope)).id;
    for (const key of ["tier", "customer_type"])
      if (input[key]) payload[key] = requiredText(input[key], 100);
    for (const key of ["start_date", "end_date"])
      if (input[key]) payload[key] = date(input[key]);
    if (
      payload.start_date &&
      payload.end_date &&
      payload.start_date > payload.end_date
    )
      fail("Price start date must precede its end date.");
    if (input.unit_price !== "" && input.unit_price != null)
      payload.unit_price = numeric(input.unit_price);
    else
      payload.discount_percent = numeric(input.discount_percent, { max: 100 });
  } else if (kind === "target") {
    if (
      !["staff", "customer"].includes(input.subject_type) ||
      !["sales", "orders", "visits", "collections", "units"].includes(
        input.metric,
      )
    )
      fail("Choose a supported target subject and metric.");
    Object.assign(payload, {
      subject_type: input.subject_type,
      subject_id:
        input.subject_type === "staff"
          ? (await employeeFor(input.subject_id, scope)).id
          : (await customerFor(input.subject_id, scope)).id,
      metric: input.metric,
      value: numeric(input.value, { min: 0.01 }),
      start_date: date(input.start_date),
      end_date: date(input.end_date),
    });
    if (payload.start_date > payload.end_date)
      fail("Target dates are reversed.");
    if (input.product_id) {
      if (!["sales", "units"].includes(input.metric))
        fail("Product-specific targets support sales and units metrics.");
      payload.product_id = (
        await ownRecord("products", input.product_id, scope)
      ).id;
    }
  } else if (kind === "distributor") {
    const customer = await customerFor(input.customer_id, scope),
      parent = input.parent_id
        ? (await customerFor(input.parent_id, scope)).id
        : null;
    if (parent === customer.id)
      fail("A customer cannot be its own distributor.");
    const links = await records(scope, "distributor"),
      seen = new Set([customer.id]);
    let cursor = parent;
    while (cursor) {
      if (seen.has(cursor)) fail("This distributor link would create a cycle.");
      seen.add(cursor);
      cursor =
        links.find(
          (r) => r.status === "active" && Number(r.customer_id) === cursor,
        )?.payload.parent_id || null;
    }
    Object.assign(payload, {
      customer_id: customer.id,
      parent_id: parent,
      tier: requiredText(input.tier || "Distributor", 100),
    });
  } else if (kind === "coverage") {
    Object.assign(payload, {
      customer_id: (await customerFor(input.customer_id, scope)).id,
      interval_days: numeric(input.interval_days, {
        min: 1,
        max: 366,
        integer: true,
      }),
    });
  } else if (kind === "form") {
    if (
      !Array.isArray(input.fields) ||
      !input.fields.length ||
      input.fields.length > 40
    )
      fail("A visit form needs between 1 and 40 questions.");
    if (input.fields.filter((f) => f.type === "photo").length > 5)
      fail("A form may contain up to five photo questions.");
    const seen = new Set();
    payload.fields = [];
    if (input.employee_ids?.length) {
      payload.employee_ids = [];
      for (const id of input.employee_ids)
        payload.employee_ids.push((await employeeFor(id, scope)).id);
    }
    if (input.customer_ids?.length) {
      payload.customer_ids = [];
      for (const id of input.customer_ids)
        payload.customer_ids.push((await customerFor(id, scope)).id);
    }
    for (const field of input.fields) {
      const key = requiredText(field.id, 60);
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) || seen.has(key))
        fail(
          "Question references must be distinct letters, digits or underscores.",
        );
      seen.add(key);
      if (
        ![
          "text",
          "long_text",
          "number",
          "choice",
          "multiple",
          "boolean",
          "date",
          "photo",
          "stock",
        ].includes(field.type)
      )
        fail("Unsupported question type.");
      const item = {
        id: key,
        label: requiredText(field.label, 200),
        type: field.type,
        required: field.required === true,
      };
      if (["choice", "multiple"].includes(field.type)) {
        if (
          !Array.isArray(field.options) ||
          !field.options.length ||
          field.options.length > 30
        )
          fail("Choose between 1 and 30 answer options.");
        item.options = [
          ...new Set(field.options.map((option) => requiredText(option, 100))),
        ];
      }
      if (field.type === "stock")
        item.product_id = (
          await ownRecord("products", field.product_id, scope)
        ).id;
      if (field.type === "number") {
        if (field.min !== "" && field.min != null)
          item.min = numeric(field.min, { min: -1000000000 });
        if (field.max !== "" && field.max != null)
          item.max = numeric(field.max, { min: item.min ?? -1000000000 });
      }
      payload.fields.push(item);
    }
  } else if (kind === "bi_embed") {
    let url;
    try {
      url = new URL(input.url);
    } catch {
      fail("Enter a valid Looker Studio report URL.");
    }
    if (
      url.protocol !== "https:" ||
      url.hostname !== "lookerstudio.google.com" ||
      !/^\/embed\/reporting\//.test(url.pathname) ||
      url.username ||
      url.password
    )
      fail("Use the HTTPS embed/reporting URL supplied by Looker Studio.");
    payload.url = url.href;
  } else fail("Unsupported commercial configuration.");
  return payload;
}
async function progress(scope, targets, customers) {
  const [orders, visits, collections, items] = await Promise.all(
    ["orders", "visits", "collections", "order_items"].map((table) =>
      db.find(table, { company_id: scope.companyId }),
    ),
  );
  return targets.map((target) => {
    const p = target.payload,
      subject = (rows) =>
        rows.filter((row) =>
          p.subject_type === "staff"
            ? Number(row.sales_agent_id ?? row.agent_id) ===
              Number(p.subject_id)
            : Number(row.customer_id) === Number(p.subject_id),
        );
    let actual = 0;
    if (["sales", "orders", "units"].includes(p.metric)) {
      const eligible = subject(orders).filter(
        (o) =>
          !isClosed(o.status) &&
          between(o.order_date || o.created_at, p.start_date, p.end_date),
      );
      if (p.metric === "orders") actual = eligible.length;
      else if (p.metric === "sales" && !p.product_id)
        actual = eligible.reduce((n, o) => n + Number(o.total_amount || 0), 0);
      else {
        const ids = new Set(eligible.map((o) => Number(o.id)));
        actual = items
          .filter(
            (i) =>
              ids.has(Number(i.order_id)) &&
              (!p.product_id || Number(i.product_id) === Number(p.product_id)),
          )
          .reduce(
            (n, i) =>
              n +
              Number(p.metric === "units" ? i.quantity : i.total_price || 0),
            0,
          );
      }
    } else if (p.metric === "visits")
      actual = subject(visits).filter(
        (v) =>
          String(v.status).toLowerCase() === "completed" &&
          between(
            v.check_in_time || v.actual_arrival || v.planned_date,
            p.start_date,
            p.end_date,
          ),
      ).length;
    else
      actual = subject(collections)
        .filter(
          (c) =>
            ["paid", "confirmed", "completed", "success"].includes(
              String(c.status).toLowerCase(),
            ) &&
            between(c.payment_date || c.created_at, p.start_date, p.end_date),
        )
        .reduce((n, c) => n + Number(c.amount || 0), 0);
    return {
      ...target,
      actual: Math.round(actual * 100) / 100,
      remaining: Math.max(0, p.value - actual),
      percent: Math.round((actual / p.value) * 1000) / 10,
    };
  });
}
export const commercialService = {
  async overview(actor) {
    const scope = await commercialScope(actor),
      data = await catalogue(scope),
      all = await db.find("commercial_records", {
        company_id: scope.companyId,
      });
    const visible = all.filter((r) => visibleRecord(r, scope, data.customers)),
      targets = await progress(
        scope,
        visible.filter((r) => r.kind === "target" && r.status === "active"),
        data.customers,
      );
    const customerFields = (c) =>
      salesAllowed(scope) ||
      ["ACCOUNTANT", "SENIOR_ACCOUNTANT"].includes(scope.user.role_code)
        ? c
        : {
            id: c.id,
            name: c.name,
            code: c.code,
            latitude: c.latitude,
            longitude: c.longitude,
            territory: c.territory,
            contact_person: c.contact_person,
            phone: c.phone,
          };
    const orderRows = salesAllowed(scope)
        ? (await db.find("orders", { company_id: scope.companyId })).filter(
            (o) =>
              data.customers.some(
                (c) => Number(c.id) === Number(o.customer_id),
              ),
          )
        : [],
      orderItems = await db.find("order_items", {
        company_id: scope.companyId,
      });
    return {
      orders: orderRows.map((o) => ({
        ...o,
        items: orderItems.filter((i) => Number(i.order_id) === Number(o.id)),
      })),
      permissions: {
        manage: scope.manager,
        sell: salesAllowed(scope),
        employee_id: scope.employee?.id || null,
      },
      customers: data.customers.map(customerFields),
      employees: data.employees.map((e) => ({
        id: e.id,
        name: [e.first_name, e.last_name].filter(Boolean).join(" "),
        role: e.role_code || e.position,
      })),
      products: data.products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        ...(salesAllowed(scope)
          ? { price: p.price, stock_quantity: p.stock_quantity }
          : {}),
      })),
      records: visible.filter((r) => r.kind !== "evidence"),
      targets,
    };
  },
  async configure(actor, kind, input, id = null) {
    const scope = await commercialScope(actor, true);
    if (!configurationKinds.includes(kind)) fail("Unsupported configuration.");
    return commercialOperation(
      scope,
      `configure_${kind}`,
      { ...input, target_id: id ? Number(id) : null },
      async () => {
        const payload = await validateConfiguration(scope, kind, input),
          status = ["active", "draft", "archived"].includes(input.status)
            ? input.status
            : "active";
        if (id) {
          const old = await ownRecord("commercial_records", id, scope);
          if (old.kind !== kind) fail("Wrong configuration type.");
          if (Number(input.version) !== Number(old.version))
            fail("This record changed. Refresh before editing.", 409);
          if (
            ["coverage", "distributor"].includes(kind) &&
            Number(old.customer_id) !== Number(payload.customer_id)
          )
            fail(
              "Edit the existing customer configuration without changing its customer.",
            );
          if (kind === "form" && old.status === "active")
            fail(
              "Published forms are immutable. Create a new form version instead.",
              409,
            );
          return db.update("commercial_records", old.id, {
            payload,
            status,
            version: old.version + 1,
            updated_at: new Date().toISOString(),
          });
        }
        const key = ["distributor", "coverage"].includes(kind)
          ? String(payload.customer_id)
          : null;
        if (
          key &&
          (await records(scope, kind)).some((r) => r.record_key === key)
        )
          fail(
            "This customer already has a configuration. Edit that record instead.",
            409,
          );
        return insertRecord(scope, kind, payload, {
          status,
          customerId: payload.customer_id || null,
          key,
        });
      },
    );
  },
  async archive(actor, id, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(
      scope,
      "configuration_archive",
      { ...input, target_id: Number(id) },
      async () => {
        const old = await ownRecord("commercial_records", id, scope);
        if (!configurationKinds.includes(old.kind))
          fail("Only configuration records can be archived here.");
        if (Number(input.version) !== Number(old.version))
          fail("Refresh this record before archiving.", 409);
        return db.update("commercial_records", old.id, {
          status: "archived",
          version: old.version + 1,
          updated_at: new Date().toISOString(),
        });
      },
    );
  },
  async call(actor, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(scope, "call", input, async () => {
      const customer = await customerFor(input.customer_id, scope);
      if (
        !["connected", "no_answer", "callback", "wrong_number"].includes(
          input.outcome,
        )
      )
        fail("Choose a call outcome.");
      return insertRecord(
        scope,
        "call",
        {
          customer_name: customer.name,
          outcome: input.outcome,
          duration_seconds:
            input.duration_seconds == null || input.duration_seconds === ""
              ? null
              : numeric(input.duration_seconds, { max: 86400, integer: true }),
          note: text(input.note || "", 2000),
          recorded_at: new Date().toISOString(),
          source: "manual",
          next_date: input.next_date ? date(input.next_date) : null,
        },
        { customerId: customer.id },
      );
    });
  },
  async plan(actor, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(scope, "visit_plan", input, async () => {
      const customer = await customerFor(input.customer_id, scope),
        employee = await employeeFor(
          input.employee_id || scope.employee?.id,
          scope,
        ),
        plannedDate = date(input.date),
        time = input.time || "09:00";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
        fail("Choose a valid Lagos appointment time.");
      const visit = await db.insert("visits", {
        company_id: scope.companyId,
        agent_id: employee.id,
        customer_id: customer.id,
        status: "planned",
        planned_date: plannedDate,
        planned_time: new Date(`${plannedDate}T${time}:00+01:00`).toISOString(),
        visit_purpose: requiredText(input.purpose || "Customer visit", 200),
        created_at: new Date().toISOString(),
      });
      return insertRecord(
        scope,
        "visit_plan",
        {
          visit_id: visit.id,
          customer_name: customer.name,
          employee_id: employee.id,
          date: plannedDate,
          time,
          purpose: input.purpose || "Customer visit",
        },
        { customerId: customer.id },
      );
    });
  },
  async evidence(actor, file, input) {
    const scope = await commercialScope(actor);
    if (!file?.buffer || file.buffer.length > 8 * 1024 * 1024)
      fail("Choose an image smaller than 8MB.");
    const b = file.buffer;
    const valid =
      (file.mimetype === "image/jpeg" && b[0] === 255 && b[1] === 216) ||
      (file.mimetype === "image/png" &&
        b
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.mimetype === "image/webp" &&
        b.toString("ascii", 0, 4) === "RIFF" &&
        b.toString("ascii", 8, 12) === "WEBP");
    if (!valid) fail("Choose an actual JPEG, PNG or WebP image.");
    return commercialOperation(
      scope,
      "evidence",
      { ...input, file_hash: createHash("sha256").update(b).digest("hex") },
      async () =>
        insertRecord(
          scope,
          "evidence",
          {
            url: await storageService.uploadFile(file, "commercial-evidence"),
            mime: file.mimetype,
            size: b.length,
          },
          { status: "active" },
        ),
    );
  },
  async respondWithEvidence(actor, input, files = []) {
    const scope = await commercialScope(actor);
    let answers;
    try {
      answers = JSON.parse(input.answers);
    } catch {
      fail("Form answers are invalid.");
    }
    if (files.length > 5) fail("Use up to five photos per submission.");
    const signature = files.map((file) =>
      createHash("sha256").update(file.buffer).digest("hex"),
    );
    return commercialOperation(
      scope,
      "response_with_photos",
      { ...input, file_hashes: signature },
      async () => {
        for (const [key, value] of Object.entries(answers)) {
          if (typeof value === "string" && /^upload:[0-4]$/.test(value)) {
            const index = Number(value.slice(7));
            if (!files[index]) fail("A required photo is missing.");
            const image = await this.evidence(actor, files[index], {
              client_nonce: fingerprint([
                input.client_nonce || input.idempotency_key,
                key,
              ]),
            });
            answers[key] = image.id;
          }
        }
        return this.respond(actor, {
          ...input,
          answers,
          client_nonce: fingerprint([
            input.client_nonce || input.idempotency_key,
            "answers",
          ]),
        });
      },
    );
  },
  async respond(actor, input) {
    const scope = await commercialScope(actor);
    return commercialOperation(scope, "form_response", input, async () => {
      const form = await ownRecord("commercial_records", input.form_id, scope),
        customer = await customerFor(input.customer_id, scope);
      if (form.kind !== "form" || form.status !== "active")
        fail("Choose a published visit form.");
      if (
        !scope.manager &&
        form.payload.employee_ids?.length &&
        !form.payload.employee_ids.some((id) => scope.team.includes(Number(id)))
      )
        fail("This form is not assigned to your team.", 403);
      if (
        form.payload.customer_ids?.length &&
        !form.payload.customer_ids.includes(Number(customer.id))
      )
        fail("This form is not assigned to that customer.", 403);
      const supplied = input.answers;
      if (!supplied || typeof supplied !== "object" || Array.isArray(supplied))
        fail("Form answers are required.");
      const answers = {};
      const allowed = new Set(form.payload.fields.map((f) => f.id));
      if (Object.keys(supplied).some((key) => !allowed.has(key)))
        fail("Answer contains an unknown question.");
      for (const field of form.payload.fields) {
        const value = supplied[field.id],
          empty =
            value == null ||
            (typeof value === "string" && !value.trim()) ||
            (Array.isArray(value) && !value.length);
        if (empty) {
          if (field.required) fail(`Complete: ${field.label}`);
          answers[field.id] = null;
          continue;
        }
        if (["text", "long_text"].includes(field.type))
          answers[field.id] = text(value, field.type === "text" ? 300 : 2000);
        else if (["number", "stock"].includes(field.type))
          answers[field.id] = numeric(value, {
            min: field.type === "stock" ? 0 : (field.min ?? -1000000000),
            max: field.max ?? 1000000000,
            integer: field.type === "stock",
          });
        else if (field.type === "boolean") {
          if (typeof value !== "boolean")
            fail(`Choose yes or no: ${field.label}`);
          answers[field.id] = value;
        } else if (field.type === "date") answers[field.id] = date(value);
        else if (field.type === "choice") {
          if (!field.options.includes(value))
            fail(`Choose a listed answer: ${field.label}`);
          answers[field.id] = value;
        } else if (field.type === "multiple") {
          if (
            !Array.isArray(value) ||
            value.some((v) => !field.options.includes(v))
          )
            fail(`Choose listed answers: ${field.label}`);
          answers[field.id] = [...new Set(value)];
        } else if (field.type === "photo") {
          const image = await ownRecord("commercial_records", value, scope);
          if (
            image.kind !== "evidence" ||
            (!scope.manager && Number(image.owner_id) !== Number(scope.user.id))
          )
            fail("Choose evidence uploaded by this account.");
          answers[field.id] = { evidence_id: image.id, url: image.payload.url };
        }
      }
      let gps = null;
      if (input.latitude != null || input.longitude != null)
        gps = {
          latitude: numeric(input.latitude, { min: -90, max: 90 }),
          longitude: numeric(input.longitude, { min: -180, max: 180 }),
          accuracy: numeric(input.accuracy, { max: 100000 }),
        };
      if (input.visit_id) {
        const visit = await ownRecord("visits", input.visit_id, scope);
        if (
          Number(visit.customer_id) !== Number(customer.id) ||
          (!scope.manager && !scope.team.includes(Number(visit.agent_id)))
        )
          fail("Visit does not belong to this customer and staff scope.");
      }
      return insertRecord(
        scope,
        "form_response",
        {
          form_id: form.id,
          form_version: form.version,
          form_name: form.payload.name,
          questions: form.payload.fields,
          answers,
          customer_name: customer.name,
          gps,
          visit_id: input.visit_id ? identifier(input.visit_id) : null,
          received_at: new Date().toISOString(),
        },
        { customerId: customer.id },
      );
    });
  },
  async order(actor, input, req) {
    const scope = await commercialScope(actor);
    if (!salesAllowed(scope))
      fail("A sales account is required to place orders.", 403);
    await customerFor(input.customer_id, scope);
    const employee = await employeeFor(
      input.employee_id || scope.employee?.id,
      scope,
    );
    return commercialOperation(scope, "order", input, async () =>
      salesService.createOrder(
        {
          ...input,
          idempotency_key: input.client_nonce || input.idempotency_key,
        },
        employee.id,
        { ...req, user: actor },
      ),
    );
  },
  async recommendations(actor, input = {}) {
    const scope = await commercialScope(actor),
      data = await catalogue(scope),
      [orders, items, visits, coverage] = await Promise.all([
        db.find("orders", { company_id: scope.companyId }),
        db.find("order_items", { company_id: scope.companyId }),
        db.find("visits", { company_id: scope.companyId }),
        records(scope, "coverage"),
      ]);
    const today = day(),
      stamp = Date.parse(`${today}T12:00:00Z`),
      eligible = orders.filter((o) => !isClosed(o.status));
    const visitSuggestions = data.customers
      .map((customer) => {
        const dates = visits
          .filter(
            (v) =>
              Number(v.customer_id) === Number(customer.id) &&
              String(v.status).toLowerCase() === "completed",
          )
          .map((v) => v.check_in_time || v.actual_arrival || v.planned_date)
          .filter((v) => v && Number.isFinite(Date.parse(v)))
          .sort();
        const latest = dates.at(-1),
          interval =
            coverage.find(
              (r) =>
                r.status === "active" &&
                Number(r.customer_id) === Number(customer.id),
            )?.payload.interval_days || null,
          days = latest
            ? Math.max(0, Math.floor((stamp - Date.parse(latest)) / 86400000))
            : null;
        return {
          customer_id: customer.id,
          name: customer.name,
          latitude: customer.latitude,
          longitude: customer.longitude,
          last_visit: latest || null,
          days_since_visit: days,
          interval_days: interval,
          due: interval != null && (days == null || days >= interval),
          reason: latest
            ? interval
              ? `${days} days since last recorded visit; planned interval ${interval} days.`
              : `Last recorded visit ${day(latest)}; no visit interval set.`
            : "No completed visit is recorded.",
        };
      })
      .sort(
        (a, b) =>
          Number(b.due) - Number(a.due) ||
          (b.days_since_visit ?? 100000) - (a.days_since_visit ?? 100000),
      );
    let route = visitSuggestions;
    if (input.latitude != null && input.longitude != null) {
      const start = {
          latitude: numeric(input.latitude, { min: -90, max: 90 }),
          longitude: numeric(input.longitude, { min: -180, max: 180 }),
        },
        remaining = route.filter(hasPoint);
      route = [];
      let current = start;
      while (remaining.length) {
        remaining.sort((a, b) => distance(current, a) - distance(current, b));
        const next = remaining.shift();
        route.push({
          ...next,
          distance_from_previous_m: Math.round(distance(current, next)),
        });
        current = next;
      }
      route.push(...visitSuggestions.filter((p) => !hasPoint(p)));
    }
    let repeat = [],
      crossSell = [];
    if (input.customer_id) {
      const customer = await customerFor(input.customer_id, scope),
        ownOrders = eligible.filter(
          (o) => Number(o.customer_id) === Number(customer.id),
        ),
        ownIds = new Set(ownOrders.map((o) => Number(o.id))),
        history = new Map();
      for (const line of items.filter((i) => ownIds.has(Number(i.order_id))))
        history.set(
          Number(line.product_id),
          (history.get(Number(line.product_id)) || 0) +
            Number(line.quantity || 0),
        );
      repeat = [...history.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id, quantity]) => ({
          product: data.products.find((p) => Number(p.id) === id),
          quantity,
          reason: `${quantity} units in this customer's recorded eligible orders.`,
        }))
        .filter((r) => r.product)
        .slice(0, 10)
        .map((r) => ({
          ...r,
          product: {
            id: r.product.id,
            name: r.product.name,
            sku: r.product.sku,
          },
        }));
      const similar = data.customers.filter(
          (c) =>
            Number(c.id) !== Number(customer.id) &&
            ((c.tier && c.tier === customer.tier) ||
              (c.customer_type && c.customer_type === customer.customer_type)),
        ),
        similarIds = new Set(similar.map((c) => Number(c.id))),
        baskets = new Map();
      for (const order of eligible.filter((o) =>
        similarIds.has(Number(o.customer_id)),
      )) {
        const bucket = baskets.get(Number(order.customer_id)) || new Set();
        for (const line of items.filter(
          (i) => Number(i.order_id) === Number(order.id),
        ))
          bucket.add(Number(line.product_id));
        baskets.set(Number(order.customer_id), bucket);
      }
      const frequency = new Map();
      for (const basket of baskets.values())
        for (const id of basket)
          if (!history.has(id)) frequency.set(id, (frequency.get(id) || 0) + 1);
      crossSell = [...frequency.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id, count]) => ({
          product: data.products.find((p) => Number(p.id) === id),
          reason: `Purchased by ${count} similar, visible customer accounts; not recorded for this customer.`,
        }))
        .filter((r) => r.product)
        .map((r) => ({
          ...r,
          product: {
            id: r.product.id,
            name: r.product.name,
            sku: r.product.sku,
          },
        }));
    }
    return {
      visits: route,
      repeat,
      cross_sell: crossSell,
      method:
        "Recorded-history rules, not a trained prediction model. Distances are straight-line estimates, not road routes.",
    };
  },
  async analytics(actor, input = {}) {
    const scope = await commercialScope(actor),
      data = await catalogue(scope),
      start = date(input.start || day()),
      end = date(input.end || start);
    if (start > end) fail("Report dates are reversed.");
    const ids = new Set(data.customers.map((c) => Number(c.id))),
      orders = (
        await db.find("orders", { company_id: scope.companyId })
      ).filter(
        (o) =>
          ids.has(Number(o.customer_id)) &&
          !isClosed(o.status) &&
          between(o.order_date || o.created_at, start, end),
      ),
      collections = (
        await db.find("collections", { company_id: scope.companyId })
      ).filter(
        (c) =>
          ids.has(Number(c.customer_id)) &&
          between(c.payment_date || c.created_at, start, end),
      );
    const financials =
      scope.manager ||
      ["SALES_AGENT", "ACCOUNTANT", "SENIOR_ACCOUNTANT"].includes(
        scope.user.role_code,
      );
    const completedVisits = (
      await db.find("visits", { company_id: scope.companyId })
    ).filter(
      (v) =>
        ids.has(Number(v.customer_id)) &&
        String(v.status).toLowerCase() === "completed" &&
        between(
          v.check_in_time || v.actual_arrival || v.planned_date,
          start,
          end,
        ),
    ).length;
    if (!financials)
      return {
        company_id: scope.companyId,
        start,
        end,
        financials: false,
        completed_visits: completedVisits,
        daily: [],
        distributors: [],
        targets: await progress(
          scope,
          (await records(scope, "target")).filter(
            (r) =>
              r.status === "active" && visibleRecord(r, scope, data.customers),
          ),
          data.customers,
        ),
      };
    const byDay = {};
    for (const order of orders) {
      const d = String(order.order_date || order.created_at).slice(0, 10);
      byDay[d] ??= { date: d, orders: 0, sales: 0 };
      byDay[d].orders++;
      byDay[d].sales += Number(order.total_amount || 0);
    }
    const targets = (await records(scope, "target")).filter(
        (r) => r.status === "active" && visibleRecord(r, scope, data.customers),
      ),
      links = await records(scope, "distributor");
    const distributors = links
      .filter((r) => r.status === "active" && ids.has(Number(r.customer_id)))
      .map((link) => {
        const descendants = new Set([Number(link.customer_id)]);
        let grew = true;
        while (grew) {
          grew = false;
          for (const child of links)
            if (
              child.status === "active" &&
              descendants.has(Number(child.payload.parent_id)) &&
              !descendants.has(Number(child.customer_id))
            ) {
              descendants.add(Number(child.customer_id));
              grew = true;
            }
        }
        return {
          customer_id: link.customer_id,
          parent_id: link.payload.parent_id,
          tier: link.payload.tier,
          accounts: descendants.size,
          sales: orders
            .filter((o) => descendants.has(Number(o.customer_id)))
            .reduce((n, o) => n + Number(o.total_amount || 0), 0),
        };
      });
    return {
      financials: true,
      completed_visits: completedVisits,
      company_id: scope.companyId,
      start,
      end,
      generated_at: new Date().toISOString(),
      sales: orders.reduce((n, o) => n + Number(o.total_amount || 0), 0),
      orders: orders.length,
      recorded_collections: collections.reduce(
        (n, c) => n + Number(c.amount || 0),
        0,
      ),
      confirmed_collections: collections
        .filter((c) =>
          ["paid", "confirmed", "completed", "success"].includes(
            String(c.status).toLowerCase(),
          ),
        )
        .reduce((n, c) => n + Number(c.amount || 0), 0),
      daily: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
      targets: await progress(scope, targets, data.customers),
      distributors,
    };
  },
};
