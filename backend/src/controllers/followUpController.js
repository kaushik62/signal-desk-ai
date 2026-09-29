import * as svc from '../services/followUpService.js';

export const list = async (req, res) => res.json(await svc.listFollowUps(req.userId, { status: req.query.status }));
export const create = async (req, res) => res.status(201).json(await svc.scheduleFollowUp(req.userId, req.body));
export const cancel = async (req, res) => res.json(await svc.cancelFollowUp(req.userId, req.params.id));
export const retry = async (req, res) => res.json(await svc.retryFollowUp(req.userId, req.params.id));
