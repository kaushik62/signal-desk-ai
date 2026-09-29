import * as leads from '../services/leadService.js';
import { listFollowUps } from '../services/followUpService.js';

export const list = async (req, res) => res.json(await leads.listLeads(req.userId, req.query));
export const create = async (req, res) => res.status(201).json(await leads.createLead(req.userId, req.body));
export const update = async (req, res) => res.json(await leads.updateLead(req.userId, req.params.id, req.body));
export const remove = async (req, res) => {
  await leads.deleteLead(req.userId, req.params.id);
  res.status(204).end();
};
export const detail = async (req, res) => {
  const lead = await leads.getLead(req.userId, req.params.id);
  res.json({ lead, followUps: await listFollowUps(req.userId, { leadId: lead.id }) });
};
