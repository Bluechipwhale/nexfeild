import { createHash } from "node:crypto";
import { db } from "../config/database.js";
export const commercialManagers = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_ADMIN",
  "CEO",
  "CTO",
  "MANAGER",
  "SALES_MANAGER",
];
export const commercialRoles = [
  ...commercialManagers,
  "SUPERVISOR",
  "SALES_AGENT",
  "FIELD_AGENT",
  "BRAND_AMBASSADOR",
  "PROMOTER",
  "ACCOUNTANT",
  "SENIOR_ACCOUNTANT",
];
export const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export const identifier = (value) => {
  if (!['number','string'].includes(typeof value) || String(value).trim() === '') fail('Choose a valid record.');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1) fail("Choose a valid record.");
  return n;
};
export const text = (value, max = 2000) => {
  if (typeof value !== "string" || value.trim().length > max)
    fail(`Enter text of up to ${max} characters.`);
  return value.trim();
};
export const requiredText = (value, max = 200) => {
  const result = text(value, max);
  if (!result) fail("Complete the required text.");
  return result;
};
export const numeric = (
  value,
  { min = 0, max = 1000000000000, integer = false } = {},
) => {
  if (!['number','string'].includes(typeof value) || String(value).trim() === "" || !Number.isFinite(Number(value)))
    fail("Enter a valid number.");
  const n = Number(value);
  if (n < min || n > max || (integer && !Number.isSafeInteger(n)))
    fail("Number is outside the allowed range.");
  return n;
};
export const date = (value) => {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail("Choose a valid date.");
  return value;
};
export const day = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(
    new Date(value),
  );
export const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export const fingerprint = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
export async function commercialScope(actor, manage = false) {
  const user = actor?.id ? await db.findById("users", Number(actor.id)) : null;
  if (
    !user ||
    user.status !== "active" ||
    Number(user.company_id) !== Number(actor.company_id) ||
    !commercialRoles.includes(user.role_code)
  )
    fail("An active commercial account is required.", 403);
  const manager = commercialManagers.includes(user.role_code);
  if (manage && !manager)
    fail("Commercial administrator access is required.", 403);
  const employee = await db.findOne("employees", {
    company_id: user.company_id,
    user_id: user.id,
  });
  if (!manager && employee?.status !== "active")
    fail("An active linked staff profile is required.", 403);
  const team = (await db.find("employees", { company_id: user.company_id }))
    .filter(
      (e) =>
        Number(e.id) === Number(employee?.id) ||
        (user.role_code === "SUPERVISOR" &&
          Number(e.supervisor_id) === Number(employee?.id)),
    )
    .map((e) => Number(e.id));
  return { user, companyId: Number(user.company_id), manager, employee, team };
}
export async function ownRecord(table, id, scope) {
  const record = await db.findById(table, identifier(id));
  if (!record || Number(record.company_id) !== scope.companyId)
    fail("Record not found.", 404);
  return record;
}
export function visibleCustomer(customer, scope) {
  return (
    scope.manager ||
    ["ACCOUNTANT", "SENIOR_ACCOUNTANT"].includes(scope.user.role_code) ||
    scope.team.includes(Number(customer.assigned_agent_id)) ||
    (scope.user.role_code === "SUPERVISOR" &&
      Number(customer.assigned_supervisor_id) === Number(scope.employee?.id)) ||
    Number(customer.registered_by) === Number(scope.employee?.id)
  );
}
export async function customerFor(id, scope) {
  const customer = await ownRecord("customers", id, scope);
  if (!visibleCustomer(customer, scope))
    fail("Customer is outside your assigned accounts.", 403);
  return customer;
}
export async function employeeFor(id, scope) {
  const employee = await ownRecord("employees", id, scope);
  if (employee.status !== "active") fail("Choose an active staff member.");
  if (!scope.manager && !scope.team.includes(Number(employee.id)))
    fail("This staff member is outside your team.", 403);
  return employee;
}
export async function records(scope, kind) {
  return db.find("commercial_records", { company_id: scope.companyId, kind });
}
export async function commercialOperation(scope, action, input, write) {
  if (db.isCloud)
    fail(
      "Commercial writes require the transactional MySQL deployment. Complete the cloud transaction adapter before activation.",
      503,
    );
  const nonce = requiredText(input.client_nonce || input.idempotency_key, 100);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(nonce))
    fail("Refresh this form to create a valid action reference.");
  const id = fingerprint([
      scope.companyId,
      scope.user?.id ?? scope.actorKey,
      nonce,
    ]),
    hash = fingerprint({
      ...input,
      client_nonce: undefined,
      idempotency_key: undefined,
    });
  return db.transaction(async () => {
    const old = await db.findById("commercial_operations", id);
    if (old) {
      if (old.action !== action || old.fingerprint !== hash)
        fail("This action reference was already used for different data.", 409);
      return old.result;
    }
    const result = await write();
    await db.insert("commercial_operations", {
      id,
      company_id: scope.companyId,
      actor_key: String(scope.user?.id ?? scope.actorKey),
      action,
      fingerprint: hash,
      result,
      created_at: new Date().toISOString(),
    });
    await db.insert("audit_logs", {
      company_id: scope.companyId,
      actor_id: scope.user?.id || null,
      actor_email: scope.user?.email || "customer portal",
      action: `COMMERCIAL_${action.toUpperCase()}`,
      entity: "commercial",
      entity_id: String(result?.id || ""),
      metadata: { operation_id: id },
      created_at: new Date().toISOString(),
    });
    return result;
  });
}
export async function insertRecord(
  scope,
  kind,
  payload,
  {
    customerId = null,
    status = "active",
    key = null,
    ownerId = scope.user?.id || null,
  } = {},
) {
  return db.insert("commercial_records", {
    company_id: scope.companyId,
    kind,
    record_key: key || fingerprint([kind, Date.now(), Math.random()]),
    owner_id: ownerId,
    customer_id: customerId,
    status,
    version: 1,
    payload,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}
