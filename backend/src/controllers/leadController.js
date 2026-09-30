import * as leads from '../services/leadService.js';
import { listFollowUps } from '../services/followUpService.js';

export const list = async (req, res, next) => {
  try {
    res.json(await leads.listLeads(req.userId, req.query));
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    res.status(201).json(await leads.createLead(req.userId, req.body));
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    res.json(await leads.updateLead(req.userId, req.params.id, req.body));
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await leads.deleteLead(req.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

export const detail = async (req, res, next) => {
  try {
    const lead = await leads.getLead(req.userId, req.params.id);
    res.json({ lead, followUps: await listFollowUps(req.userId, { leadId: lead.id }) });
  } catch (err) {
    next(err);
  }
};
