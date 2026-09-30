import * as svc from '../services/followUpService.js';

export const list = async (req, res, next) => {
  try {
    const result = await svc.listFollowUps(req.userId, {
      status: req.query.status,
      leadId: req.query.leadId,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const result = await svc.scheduleFollowUp(req.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const result = await svc.cancelFollowUp(req.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const retry = async (req, res, next) => {
  try {
    const result = await svc.retryFollowUp(req.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
