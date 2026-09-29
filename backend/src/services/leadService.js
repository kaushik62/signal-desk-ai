import { pool } from '../config/db.js';
import { httpError } from '../middleware/errorHandler.js';
import { computeScore } from './scoring.js';
import { cancelForLead } from './followUpService.js';

export const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
export const SOURCES = ['Website', 'LinkedIn', 'Facebook Ads', 'Referral', 'Cold Email', 'Other'];

export function validateLead(body = {}) {
  const errors = {};
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const company = String(body.company ?? '').trim();
  const notes = String(body.notes ?? '').trim();
  const source = body.source || 'Other';
  const status = body.status || 'New';

  if (!name) errors.name = 'Full name is required';
  else if (name.length > 120) errors.name = 'Name is too long';
  if (!email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) errors.email = 'Enter a valid email address';
  if (company.length > 120) errors.company = 'Company name is too long';
  if (notes.length > 5000) errors.notes = 'Notes are too long';
  if (!SOURCES.includes(source)) errors.source = 'Choose a valid source';
  if (!STATUSES.includes(status)) errors.status = 'Choose a valid status';

  if (Object.keys(errors).length) throw httpError(400, 'Fix the highlighted fields', errors);
  return { name, email, company: company || null, notes: notes || null, source, status };
}

const sentCount = async (leadId) =>
  (await pool.query(`SELECT count(*)::int AS n FROM follow_ups WHERE lead_id=$1 AND status='sent'`, [leadId])).rows[0].n;

export async function recalcScore(leadId) {
  const { rows: [lead] } = await pool.query('SELECT * FROM leads WHERE id=$1', [leadId]);
  if (!lead) return;
  const score = computeScore(lead, await sentCount(leadId));
  await pool.query('UPDATE leads SET score=$1 WHERE id=$2', [score, leadId]);
}

export async function listLeads(userId, q) {
  const params = [userId];
  const where = ['user_id=$1'];
  if (q.search) {
    params.push(`%${String(q.search).slice(0, 100)}%`);
    where.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`);
  }
  if (STATUSES.includes(q.status)) { params.push(q.status); where.push(`status=$${params.length}`); }
  if (SOURCES.includes(q.source)) { params.push(q.source); where.push(`source=$${params.length}`); }

  const sortCol = q.sort === 'created' ? 'created_at' : 'score';
  const order = q.order === 'asc' ? 'ASC' : 'DESC';
  const limit = Math.min(Math.max(parseInt(q.limit) || 10, 1), 50);
  const page = Math.max(parseInt(q.page) || 1, 1);
  const clause = where.join(' AND ');

  const [{ rows: [{ total }] }, { rows: leads }] = await Promise.all([
    pool.query(`SELECT count(*)::int AS total FROM leads WHERE ${clause}`, params),
    pool.query(
      `SELECT * FROM leads WHERE ${clause} ORDER BY ${sortCol} ${order}, created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    ),
  ]);
  return { leads, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getLead(userId, id) {
  const { rows: [lead] } = await pool.query('SELECT * FROM leads WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!lead) throw httpError(404, 'Lead not found');
  return lead;
}

export async function createLead(userId, body) {
  const d = validateLead(body);
  const contacted = d.status === 'New' ? null : new Date();
  const score = computeScore({ ...d, last_contacted_at: contacted }, 0);
  const { rows: [lead] } = await pool.query(
    `INSERT INTO leads (user_id, name, email, company, source, status, notes, score, last_contacted_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [userId, d.name, d.email, d.company, d.source, d.status, d.notes, score, contacted]
  );
  return lead;
}

export async function updateLead(userId, id, body) {
  const existing = await getLead(userId, id);
  const d = validateLead(body);
  const contacted = d.status !== existing.status && d.status === 'Contacted' ? new Date() : existing.last_contacted_at;
  const score = computeScore({ ...d, last_contacted_at: contacted }, await sentCount(id));
  const { rows: [lead] } = await pool.query(
    `UPDATE leads SET name=$3, email=$4, company=$5, source=$6, status=$7, notes=$8, score=$9,
       last_contacted_at=$10, updated_at=now() WHERE id=$1 AND user_id=$2 RETURNING *`,
    [id, userId, d.name, d.email, d.company, d.source, d.status, d.notes, score, contacted]
  );
  if (['Converted', 'Lost'].includes(d.status)) await cancelForLead(id);
  return lead;
}

export async function deleteLead(userId, id) {
  await cancelForLead(id);
  const { rowCount } = await pool.query('DELETE FROM leads WHERE id=$1 AND user_id=$2', [id, userId]);
  if (!rowCount) throw httpError(404, 'Lead not found');
}
