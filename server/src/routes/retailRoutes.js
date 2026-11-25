import express from "express";
import rateLimit from "express-rate-limit";
import { retailService as service } from "../services/retailService.js";
const router = express.Router();
const action = (fn) => async (req, res, next) => {
  try {
    res.set("Cache-Control", "no-store").json({ data: await fn(req) });
  } catch (e) {
    next(e);
  }
};
router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    skipSuccessfulRequests: true,
  }),
  action((r) => service.login(r.body)),
);
router.use(async (req, res, next) => {
  try {
    req.retail = await service.authenticate(
      String(req.headers.authorization || "").replace(/^Bearer /i, ""),
      ["/password", "/session"].includes(req.path),
    );
    next();
  } catch (e) {
    next(e);
  }
});
router.get(
  "/session",
  action((r) => ({
    company_id: r.retail.companyId,
    email: r.retail.account.email,
    requires_password_change: r.retail.account.requires_password_change,
  })),
);
router.post(
  "/password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  action((r) => service.changePassword(r.retail, r.body)),
);
router.get(
  "/overview",
  action((r) => service.overview(r.retail)),
);
router.post(
  "/quote",
  action((r) => service.quote(r.retail, r.body)),
);
router.post(
  "/orders",
  action((r) => service.submit(r.retail, r.body)),
);
router.post(
  "/orders/:id/cancel",
  action((r) => service.cancel(r.retail, r.params.id, r.body)),
);
export default router;
