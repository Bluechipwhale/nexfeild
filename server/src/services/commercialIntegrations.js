import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "../config/database.js";
import { inventoryService } from "./inventoryService.js";
import { customerService } from "./customerService.js";
import { retailService } from "./retailService.js";
import {
  commercialScope,
  commercialOperation,
  customerFor,
  records,
  ownRecord,
  insertRecord,
  identifier,
  numeric,
  text,
  requiredText,
  fail,
  fingerprint,
} from "./commercialCore.js";
const phone = (value) => {
  let p = String(value || "").replace(/[\s()-]/g, "");
  if (/^0\d{10}$/.test(p)) p = "+234" + p.slice(1);
  if (/^\d{8,15}$/.test(p)) p = "+" + p;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
};
const sameSecret = (left, right) => {
  const a = Buffer.from(String(left || "")),
    b = Buffer.from(String(right || ""));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
};
const providerCompany = (scope) =>
  Number(process.env.MESSAGING_COMPANY_ID) === Number(scope.companyId);
// Provider callbacks may arrive before the send response, or out of order.
export function receiptState(current, next) {
  const rank = { processing: -2, attempting: -1, unknown: -1, accepted: 0, queued: 0, sent: 1, suppressed: 2, failed: 2, undelivered: 2, delivered: 3, read: 4 };
  return (rank[current] ?? -2) > (rank[next] ?? -2) ? current : next;
}
async function recordReceipt(id, patch) {
  return db.transaction(async () => {
    const current = await db.findById('commercial_campaign_deliveries', id);
    if (!current) fail('Delivery not found.', 404);
    const status = receiptState(current.status, patch.status);
    return db.update('commercial_campaign_deliveries', id, {...patch, status, ...(current.provider_id ? {provider_id:current.provider_id} : {}), ...(status !== patch.status ? {note: current.note} : {}), updated_at:new Date().toISOString()});
  });
}
export const providerStatus = (scope) => ({
  sms: {
    configured:
      providerCompany(scope) &&
      Boolean(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM,
      ),
  },
  whatsapp: {
    mode: "WhatsApp Business Cloud API. Business account connection, approved templates and verified delivery webhooks are required for live messaging.",
    configured:
      providerCompany(scope) &&
      Boolean(
        process.env.WHATSAPP_ACCESS_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        /^v\d+\.\d+$/.test(process.env.WHATSAPP_API_VERSION || ""),
      ),
  },
  webhook: {
    configured:
      providerCompany(scope) &&
      Boolean(
        process.env.WHATSAPP_APP_SECRET && process.env.WHATSAPP_VERIFY_TOKEN,
      ),
  },
  erp: {
    configured: false,
    provider: "SAP",
    edition_confirmed: false,
    mode: "SAP setup required: ask your SAP administrator to confirm Business One, S/4HANA or ECC, the authorised API endpoint and customer/product mappings. Company-scoped import/export contracts are available; no live SAP synchronisation is active.",
  },
  bi: {
    configured: true,
    mode: "Authenticated, company-scoped analytics JSON feed; optional Looker Studio embed.",
  },
});
async function sendProvider(channel, customer, campaign, delivery) {
  const to = phone(customer.phone);
  if (!to) fail("Customer phone number is invalid.");
  let response;
  if (channel === "sms") {
    const params = new URLSearchParams({
      To: to,
      From: process.env.TWILIO_FROM,
      Body: campaign.payload.message,
    });
    if (process.env.PUBLIC_BASE_URL)
      params.set(
        "StatusCallback",
        `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/api/commercial-webhooks/sms?delivery=${delivery.id}`,
      );
    response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(process.env.TWILIO_ACCOUNT_SID)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`,
            ).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
        signal: AbortSignal.timeout(15000),
      },
    );
  } else {
    response = await fetch(
      `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.slice(1),
          type: "template",
          template: {
            name: campaign.payload.template_name,
            language: { code: campaign.payload.language || "en" },
            ...(campaign.payload.parameters?.length
              ? {
                  components: [
                    {
                      type: "body",
                      parameters: campaign.payload.parameters.map((value) => ({
                        type: "text",
                        text: value,
                      })),
                    },
                  ],
                }
              : {}),
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    return {
      status: "failed",
      provider_id: null,
      note: "Provider rejected this request. Review the provider account and approved content.",
    };
  const providerId = channel === "sms" ? body.sid : body.messages?.[0]?.id;
  if (!providerId)
    return {
      status: "unknown",
      provider_id: null,
      note: "Provider response lacked a message reference. Review before retrying.",
    };
  return {
    status: "accepted",
    provider_id: providerId,
    note: "Accepted by provider; delivery is not yet confirmed.",
  };
}
async function audience(scope, campaign) {
  const consent = await records(scope, "consent"),
    customers = await db.find("customers", { company_id: scope.companyId });
  return campaign.payload.customer_ids.map((id) => {
    const customer = customers.find((c) => Number(c.id) === Number(id)),
      grant = consent.find(
        (r) =>
          Number(r.customer_id) === Number(id) &&
          r.payload.channel === campaign.payload.channel,
      );
    return {
      customer,
      eligible: Boolean(
        customer && phone(customer.phone) && grant?.payload.allowed === true,
      ),
      reason: !customer
        ? "Customer unavailable"
        : !phone(customer.phone)
          ? "No valid phone number"
          : grant?.payload.allowed !== true
            ? "No recorded opt-in"
            : "Recorded opt-in",
    };
  });
}
export const commercialIntegrations = {
  async status(actor) {
    const scope = await commercialScope(actor, true);
    return providerStatus(scope);
  },
  async consent(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "consent", input, async () => {
      const customer = await customerFor(input.customer_id, scope);
      if (
        !["sms", "whatsapp"].includes(input.channel) ||
        typeof input.allowed !== "boolean"
      )
        fail("Choose channel and consent status.");
      const payload = {
          channel: input.channel,
          allowed: input.allowed,
          evidence: requiredText(input.evidence, 1000),
          recorded_by: scope.user.id,
          recorded_at: new Date().toISOString(),
        },
        key = `${customer.id}:${input.channel}`,
        old = (await records(scope, "consent")).find(
          (r) => r.record_key === key,
        );
      return old
        ? db.update("commercial_records", old.id, {
            payload,
            version: old.version + 1,
            updated_at: new Date().toISOString(),
          })
        : insertRecord(scope, "consent", payload, {
            customerId: customer.id,
            key,
          });
    });
  },
  async draft(actor, input) {
    const scope = await commercialScope(actor, true);
    return commercialOperation(scope, "campaign_draft", input, async () => {
      if (
        !["sms", "whatsapp"].includes(input.channel) ||
        !Array.isArray(input.customer_ids) ||
        !input.customer_ids.length ||
        input.customer_ids.length > 500
      )
        fail("Choose a channel and between 1 and 500 customers.");
      const ids = [...new Set(input.customer_ids.map(identifier))];
      for (const id of ids) await customerFor(id, scope);
      const payload = {
        name: requiredText(input.name),
        channel: input.channel,
        customer_ids: ids,
        message:
          input.channel === "sms" ? requiredText(input.message, 1000) : "",
        template_name:
          input.channel === "whatsapp"
            ? requiredText(input.template_name, 200)
            : null,
        language: input.language || "en",
        parameters: Array.isArray(input.parameters)
          ? input.parameters.map((p) => requiredText(p, 1000))
          : [],
      };
      if (
        input.channel === "whatsapp" &&
        !/^[a-z0-9_]+$/.test(payload.template_name)
      )
        fail("Use the approved WhatsApp template name.");
      return insertRecord(scope, "campaign", payload, { status: "draft" });
    });
  },
  async preview(actor, id) {
    const scope = await commercialScope(actor, true),
      campaign = await ownRecord("commercial_records", id, scope);
    if (campaign.kind !== "campaign") fail("Campaign not found.", 404);
    const list = await audience(scope, campaign);
    return {
      campaign,
      audience: list.map((row) => ({
        customer_id: row.customer?.id || null,
        name: row.customer?.name || "Unavailable",
        eligible: row.eligible,
        reason: row.reason,
      })),
      provider: providerStatus(scope)[campaign.payload.channel],
      deliveries: await db.find("commercial_campaign_deliveries", {
        company_id: scope.companyId,
        campaign_id: campaign.id,
      }),
    };
  },
  async sendBatch(actor, id, input, { send = sendProvider } = {}) {
    const scope = await commercialScope(actor, true),
      campaign = await ownRecord("commercial_records", id, scope);
    if (
      campaign.kind !== "campaign" ||
      !["draft", "sending", "completed"].includes(campaign.status)
    )
      fail("Campaign is unavailable.");
    if (input.confirm !== true)
      fail("Review the audience and explicitly confirm this send.");
    if (!providerStatus(scope)[campaign.payload.channel].configured)
      fail(
        "This provider is not configured for this company. No messages were sent.",
        503,
      );
    const claim = await commercialOperation(
      scope,
      "campaign_batch",
      { ...input, target_id: Number(id) },
      async () => {
        const list = await audience(scope, campaign),
          old = await db.find("commercial_campaign_deliveries", {
            company_id: scope.companyId,
            campaign_id: campaign.id,
          }),
          claimed = old.filter(d => d.status === 'processing' && list.some(r => r.eligible && Number(r.customer.id) === Number(d.customer_id))).slice(0,25).map(d => d.id);
        for (const row of list
          .filter(
            (r) =>
              r.eligible &&
              !old.some((d) => Number(d.customer_id) === Number(r.customer.id)),
          )
          .slice(0, 25 - claimed.length)) {
          const delivery = await db.insert("commercial_campaign_deliveries", {
            company_id: scope.companyId,
            campaign_id: campaign.id,
            customer_id: row.customer.id,
            channel: campaign.payload.channel,
            status: "processing",
            provider_id: null,
            note: "Claimed for one provider attempt.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          claimed.push(delivery.id);
        }
        await db.update("commercial_records", campaign.id, {
          status: claimed.length ? "sending" : "completed",
          updated_at: new Date().toISOString(),
        });
        return { id: campaign.id, delivery_ids: claimed };
      },
    );
    for (const deliveryId of claim.delivery_ids) {
      const delivery = await db.findById(
        "commercial_campaign_deliveries",
        deliveryId,
      );
      if (delivery.status !== "processing") continue;
      const locked = await db.transaction(async () => {
        const current = await db.findById(
          "commercial_campaign_deliveries",
          deliveryId,
        );
        if (current.status !== "processing") return false;
        await db.update("commercial_campaign_deliveries", deliveryId, {
          status: "attempting",
          updated_at: new Date().toISOString(),
        });
        return true;
      });
      if (!locked) continue;
      let result;
      try {
        const customer = await ownRecord(
            "customers",
            delivery.customer_id,
            scope,
          ),
          grants = await audience(scope, {
            ...campaign,
            payload: { ...campaign.payload, customer_ids: [customer.id] },
          });
        result = grants[0].eligible
          ? await send(campaign.payload.channel, customer, campaign, delivery)
          : {
              status: "suppressed",
              note: "Customer consent or phone changed before sending.",
            };
      } catch {
        result = {
          status: "unknown",
          note: "No confirmed provider response. Review before retrying; this recipient is not automatically resent.",
        };
      }
      await recordReceipt(deliveryId, {
        ...result,
        updated_at: new Date().toISOString(),
      });
    }
    const remainingAudience = await audience(scope, campaign), attempted = await db.find('commercial_campaign_deliveries',{company_id:scope.companyId,campaign_id:campaign.id});
    await db.update('commercial_records',campaign.id,{status:remainingAudience.some(r=>r.eligible&&!attempted.some(d=>Number(d.customer_id)===Number(r.customer.id)))?'sending':'completed',updated_at:new Date().toISOString()});
    return this.preview(actor, id);
  },
  async export(actor, entity) {
    const scope = await commercialScope(actor, true);
    if (
      ![
        "customers",
        "products",
        "orders",
        "order_items",
        "collections",
      ].includes(entity)
    )
      fail("Choose a supported export entity.");
    const rows = await db.find(entity, { company_id: scope.companyId });
    return {
      contract: "eedgewforce-commercial-v1",
      entity,
      company_id: scope.companyId,
      generated_at: new Date().toISOString(),
      rows,
    };
  },
  async importPreview(actor, input) {
    const scope = await commercialScope(actor, true);
    if (
      !["customers", "products"].includes(input.entity) ||
      !Array.isArray(input.rows) ||
      !input.rows.length ||
      input.rows.length > 1000
    )
      fail("Import 1 to 1,000 customer or product catalogue rows.");
    const allowed =
      input.entity === "customers"
        ? [
            "code",
            "name",
            "customer_type",
            "tier",
            "territory",
            "address",
            "contact_person",
            "phone",
            "email",
          ]
        : ["sku", "name", "category", "unit", "price", "reorder_level"];
    const rows = input.rows.map((row, index) => {
      if (
        !row ||
        typeof row !== "object" ||
        Array.isArray(row) ||
        Object.keys(row).some((k) => !allowed.includes(k))
      )
        fail(
          `Row ${index + 1} contains unsupported fields. Balances, stock quantities and company ownership cannot be imported here.`,
        );
      const next = {};
      for (const [key, value] of Object.entries(row))
        next[key] = ["price", "reorder_level"].includes(key)
          ? numeric(value, { integer: key === "reorder_level" })
          : text(value, key === "address" ? 1000 : 200);
      requiredText(next.name);
      requiredText(next[input.entity === "customers" ? "code" : "sku"]);
      return next;
    });
    const keys = rows.map((r) => r.code || r.sku);
    if (new Set(keys).size !== keys.length)
      fail("The import contains duplicate account or product codes.");
    return {
      entity: input.entity,
      rows,
      preview_hash: fingerprint({ entity: input.entity, rows }),
      company_id: scope.companyId,
    };
  },
  async importCommit(actor, input) {
    const scope = await commercialScope(actor, true),
      preview = await this.importPreview(actor, input);
    if (input.preview_hash !== preview.preview_hash || input.confirm !== true)
      fail("Review the current import preview before confirming.");
    return commercialOperation(scope, "erp_import", input, async () => {
      const results = [];
      for (const row of preview.rows) {
        const key = input.entity === "customers" ? "code" : "sku",
          old = await db.findOne(input.entity, {
            company_id: scope.companyId,
            [key]: row[key],
          });
        const result = old
          ? input.entity === "products"
            ? await inventoryService.updateProduct(old.id, row, scope.user)
            : await customerService.updateCustomer(old.id, row, scope.user)
          : input.entity === "products"
            ? await inventoryService.createProduct(
                { ...row, stock_quantity: 0 },
                scope.user,
              )
            : await customerService.createCustomer(row, scope.user);
        results.push({
          id: result.id,
          code: row[key],
          action: old ? "updated" : "created",
        });
      }
      return insertRecord(
        scope,
        "erp_import",
        {
          entity: input.entity,
          rows: results,
          contract: "eedgewforce-commercial-v1",
        },
        { status: "completed" },
      );
    });
  },
  async whatsappWebhook(raw, signature) {
    if (!Buffer.isBuffer(raw)) fail('An application/json webhook body is required.', 415);
    if (
      !process.env.WHATSAPP_APP_SECRET ||
      !process.env.MESSAGING_COMPANY_ID ||
      !process.env.WHATSAPP_PHONE_NUMBER_ID
    )
      fail("WhatsApp inbound ordering is not configured.", 503);
    const expected =
      "sha256=" +
      createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
        .update(raw)
        .digest("hex");
    if (!sameSecret(signature, expected))
      fail("Invalid webhook signature.", 403);
    let body;
    try {
      body = JSON.parse(raw.toString("utf8"));
    } catch {
      fail("Invalid webhook body.");
    }
    let count = 0;
    for (const entry of body.entry || [])
      for (const change of entry.changes || []) {
        const value = change.value;
        if (
          String(value?.metadata?.phone_number_id) !==
          String(process.env.WHATSAPP_PHONE_NUMBER_ID)
        )
          continue;
        for (const status of value.statuses || []) {
          const delivery = await db.findOne("commercial_campaign_deliveries", {
            company_id: Number(process.env.MESSAGING_COMPANY_ID),
            provider_id: status.id,
          });
          if (
            delivery &&
            ["sent", "delivered", "read", "failed"].includes(status.status)
          )
            await recordReceipt(delivery.id, {
              status: status.status,
              note: "Verified WhatsApp provider receipt.",
              updated_at: new Date().toISOString(),
            });
        }
        for (const message of value.messages || []) {
          if (
            message.type !== "text" ||
            !/^ORDER\s/i.test(message.text?.body || "")
          )
            continue;
          const companyId = Number(process.env.MESSAGING_COMPANY_ID),
            customers = await db.find("customers", { company_id: companyId }),
            matching = phone(message.from) ? customers.filter(c => phone(c.phone) === phone(message.from)) : [],
            customer = matching.length === 1 ? matching[0] : null;
          if (!customer) continue;
          const account = await db.findOne("commercial_portal_accounts", {
            company_id: companyId,
            customer_id: customer.id,
            status: "active",
          });
          if (!account) continue;
          const products = await db.find("products", { company_id: companyId }),
            lines = message.text.body
              .replace(/^ORDER\s+/i, "")
              .split(",")
              .map((part) => {
                const match = part.trim().match(/^([^\s]+)\s+(\d+)$/);
                if (!match) fail("Use ORDER SKU quantity, SKU quantity.");
                const product = products.find(
                  (p) => p.sku === match[1] && p.status === "active",
                );
                if (!product) fail("Unknown product code.");
                return { product_id: product.id, quantity: Number(match[2]) };
              });
          await retailService.submit(
            {
              account,
              customer,
              companyId,
              actorKey: `whatsapp:${account.id}`,
            },
            {
              items: lines,
              note: "Received through the verified WhatsApp business webhook.",
              source: "whatsapp",
              client_nonce: fingerprint(["whatsapp", message.id]),
            },
          );
          count++;
        }
      }
    return { received: true, order_requests: count };
  },
  verifyWhatsapp(query) {
    if (
      !process.env.WHATSAPP_VERIFY_TOKEN ||
      query["hub.mode"] !== "subscribe" ||
      !sameSecret(query["hub.verify_token"], process.env.WHATSAPP_VERIFY_TOKEN)
    )
      fail("Webhook verification failed.", 403);
    return String(query["hub.challenge"] || "");
  },
  async smsReceipt(params, signature, originalUrl) {
    if (!process.env.TWILIO_AUTH_TOKEN || !process.env.PUBLIC_BASE_URL)
      fail("SMS receipts are not configured.", 503);
    const url = process.env.PUBLIC_BASE_URL.replace(/\/$/, "") + originalUrl,
      source =
        url +
        Object.keys(params)
          .sort()
          .map((key) => key + params[key])
          .join(""),
      expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN)
        .update(source)
        .digest("base64");
    if (!sameSecret(signature, expected))
      fail("Invalid provider signature.", 403);
    const delivery = await db.findById(
      "commercial_campaign_deliveries",
      identifier(
        new URL(originalUrl, "https://local").searchParams.get("delivery"),
      ),
    );
    if (
      !delivery ||
      delivery.channel !== "sms" ||
      Number(delivery.company_id) !==
        Number(process.env.MESSAGING_COMPANY_ID) ||
      (delivery.provider_id && delivery.provider_id !== params.MessageSid)
    )
      fail("Delivery not found.", 404);
    if (
      !["queued", "sent", "delivered", "undelivered", "failed"].includes(
        params.MessageStatus,
      )
    )
      fail("Unsupported delivery status.");
    await recordReceipt(delivery.id, {
      status: params.MessageStatus,
      provider_id: params.MessageSid,
      note: "Verified SMS provider receipt.",
      updated_at: new Date().toISOString(),
    });
    return { received: true };
  },
};
