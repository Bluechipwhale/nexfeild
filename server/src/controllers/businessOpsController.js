import { businessOpsService } from '../services/businessOpsService.js';

const respondError = (res, error, status = 400) => res.status(status).json({
  success: false,
  error: { code: 'BUSINESS_OPS_ERROR', message: error.message || 'Unable to process this request.' },
});

export const businessOpsController = {
  async summary(req, res) {
    try {
      res.json({ success: true, data: await businessOpsService.summary(req.user) });
    } catch (error) {
      respondError(res, error, 500);
    }
  },

  async list(req, res) {
    try {
      res.json({ success: true, data: await businessOpsService.list(req.params.module, req.user) });
    } catch (error) {
      respondError(res, error);
    }
  },

  async create(req, res) {
    try {
      const record = await businessOpsService.create(req.params.module, req.body, req.user);
      res.status(201).json({ success: true, data: record });
    } catch (error) {
      respondError(res, error);
    }
  },

  async update(req, res) {
    try {
      const record = await businessOpsService.update(req.params.module, req.params.id, req.body, req.user);
      res.json({ success: true, data: record });
    } catch (error) {
      respondError(res, error);
    }
  },
};
