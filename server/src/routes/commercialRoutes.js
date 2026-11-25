import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { commercialService as service } from "../services/commercialService.js";
import { commercialPricing } from "../services/commercialPricing.js";
import { commercialStock as stock } from "../services/commercialStock.js";
import { commercialOrders as orders } from "../services/commercialOrders.js";
import { commercialIntegrations as integrations } from "../services/commercialIntegrations.js";
import { retailService as retail } from "../services/retailService.js";
const router = express.Router(),
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });
const action = (fn) => async (req, res, next) => {
  try {
    res.json({ data: await fn(req) });
  } catch (e) {
    next(e);
  }
};
router.use(requireAuth);
router.get(
  "/overview",
  action((r) => service.overview(r.user)),
);
router.get(
  "/recommendations",
  action((r) => service.recommendations(r.user, r.query)),
);
router.get(
  "/analytics",
  action((r) => service.analytics(r.user, r.query)),
);
router.post(
  "/quote",
  action((r) => commercialPricing.quote(r.user, r.body)),
);
router.post(
  "/config/:kind",
  action((r) => service.configure(r.user, r.params.kind, r.body)),
);
router.put(
  "/config/:kind/:id",
  action((r) => service.configure(r.user, r.params.kind, r.body, r.params.id)),
);
router.post(
  "/config/:id/archive",
  action((r) => service.archive(r.user, r.params.id, r.body)),
);
router.post(
  "/calls",
  action((r) => service.call(r.user, r.body)),
);
router.post(
  "/plans",
  action((r) => service.plan(r.user, r.body)),
);
router.post(
  "/evidence",
  upload.single("file"),
  action((r) => service.evidence(r.user, r.file, r.body)),
);
router.post(
  "/responses",
  action((r) => service.respond(r.user, r.body)),
);
router.post(
  "/responses-with-evidence",
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 8 * 1024 * 1024,
      files: 5,
      fields: 12,
      fieldSize: 100000,
    },
  }).array("photos", 5),
  action((r) => service.respondWithEvidence(r.user, r.body, r.files)),
);
router.post(
  "/orders",
  action((r) => orders.submit(r.user, r.body)),
);
router.put(
  "/orders/:id",
  action((r) => orders.revise(r.user, r.params.id, r.body)),
);
router.post(
  "/orders/:id/review",
  action((r) => orders.review(r.user, r.params.id, r.body, r)),
);
router.post(
  "/shipments",
  action((r) => orders.shipment(r.user, r.body)),
);
router.post(
  "/shipments/:id/proof",
  action((r) => orders.proof(r.user, r.params.id, r.body)),
);
router.get(
  "/stock",
  action((r) => stock.accounts(r.user)),
);
router.post(
  "/stock",
  action((r) => stock.create(r.user, r.body)),
);
router.get(
  "/stock/:id",
  action((r) => stock.detail(r.user, r.params.id)),
);
router.post(
  "/stock/move",
  action((r) => stock.move(r.user, r.body)),
);
router.post(
  "/stock/counts",
  action((r) => stock.count(r.user, r.body)),
);
router.post(
  "/stock/counts/:id/review",
  action((r) => stock.approveCount(r.user, r.params.id, r.body)),
);
router.get(
  "/providers",
  action((r) => integrations.status(r.user)),
);
router.post(
  "/consent",
  action((r) => integrations.consent(r.user, r.body)),
);
router.post(
  "/campaigns",
  action((r) => integrations.draft(r.user, r.body)),
);
router.get(
  "/campaigns/:id",
  action((r) => integrations.preview(r.user, r.params.id)),
);
router.post(
  "/campaigns/:id/send",
  action((r) => integrations.sendBatch(r.user, r.params.id, r.body)),
);
router.get(
  "/export/:entity",
  action((r) => integrations.export(r.user, r.params.entity)),
);
router.post(
  "/import/preview",
  action((r) => integrations.importPreview(r.user, r.body)),
);
router.post(
  "/import/commit",
  action((r) => integrations.importCommit(r.user, r.body)),
);
router.get(
  "/retail/accounts",
  action((r) => retail.accounts(r.user)),
);
router.post(
  "/retail/accounts",
  action((r) => retail.createAccount(r.user, r.body)),
);
router.post(
  "/retail/accounts/:id/status",
  action((r) => retail.deactivate(r.user, r.params.id, r.body)),
);
router.post(
  "/retail/orders/:id/review",
  action((r) => retail.review(r.user, r.params.id, r.body, r)),
);
export default router;
