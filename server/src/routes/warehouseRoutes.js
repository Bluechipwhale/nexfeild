import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { warehouseService as service } from '../services/warehouseService.js';
const router = express.Router();
router.use(requireAuth);
const action = fn => async (req, res, next) => {
  try {
    res.json({
      data: await fn(req)
    });
  } catch (e) {
    next(e);
  }
};
router.get('/access', action(r => service.access(r.user)));
router.get('/catalogue', action(r => service.catalogue(r.user)));
router.get('/requests', action(r => service.list(r.user, r.query)));
router.get('/requests/:id', action(r => service.detail(r.params.id, r.user)));
router.post('/requests', action(r => service.create(r.body, r.user)));
router.post('/requests/:id/decision', action(r => service.decide(r.params.id, r.body, r.user)));
router.post('/requests/:id/issue', action(r => service.issue(r.params.id, r.body, r.user)));
router.post('/requests/:id/acknowledge', action(r => service.acknowledge(r.params.id, r.body, r.user)));
router.post('/stock/move', action(r => service.moveStock(r.body, r.user)));
router.post('/stock/release-quarantine', action(r => service.releaseQuarantine(r.body, r.user)));
router.post('/requests/:id/cancel', action(r => service.cancel(r.params.id, r.body, r.user)));
router.post('/requests/:id/returns', action(r => service.submitReturn(r.params.id, r.body, r.user)));
router.post('/returns/:id/receive', action(r => service.receiveReturn(r.params.id, r.body, r.user)));
router.get('/team', action(r => service.team(r.user)));
router.put('/team/:id', action(r => service.setManager(r.params.id, r.body.enabled, r.user)));
export async function warehouseManagerOnly(req, res, next) {
  try {
    if (!(await service.access(req.user)).can_manage) return res.status(403).json({
      error: {
        message: 'Only a warehouse manager or administrator may change stock.'
      }
    });
    next();
  } catch (e) {
    next(e);
  }
}
export default router;
