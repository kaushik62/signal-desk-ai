import { pool } from '../config/db.js';
import { httpError } from '../middleware/errorHandler.js';
import { computeScore } from './scoring.js';
import { cancelForLead } from './followUpService.js';
import { clearStaleCache } from './staleService.js';

export const STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Converted',
  'Lost',
];

export const SOURCES = [
  'Website',
  'LinkedIn',
  'Facebook Ads',
  'Referral',
  'Cold Email',
  'Other',
];

// Validate lead data
export function validateLead(body = {}) {
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const company = String(body.company || '').trim();
  const notes = String(body.notes || '').trim();
  const source = body.source || 'Other';
  const status = body.status || 'New';

  const errors = {};

  if (!name) errors.name = 'Name is required';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email';
  }
  if (!SOURCES.includes(source)) errors.source = 'Invalid source';
  if (!STATUSES.includes(status)) errors.status = 'Invalid status';

  if (Object.keys(errors).length) {
    throw httpError(400, 'Please fix the errors', errors);
  }

  return {
    name,
    email,
    company: company || null,
    notes: notes || null,
    source,
    status,
  };
}

// Count sent follow-ups
async function sentCount(leadId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM follow_ups
     WHERE lead_id = $1 AND status = 'sent'`,
    [leadId]
  );

  return rows[0].count;
}

// Recalculate lead score
export async function recalcScore(leadId) {
  const { rows: [lead] } = await pool.query(
    'SELECT * FROM leads WHERE id = $1',
    [leadId]
  );

  if (!lead) return;

  const score = computeScore(lead, await sentCount(leadId));

  await pool.query(
    'UPDATE leads SET score = $1 WHERE id = $2',
    [score, leadId]
  );
}

// Get all leads with filters and pagination
export async function listLeads(userId, query = {}) {
  const params = [userId];
  const conditions = ['user_id = $1'];

  if (query.search) {
    params.push(`%${query.search}%`);
    conditions.push(
      `(name ILIKE $${params.length}
        OR email ILIKE $${params.length}
        OR company ILIKE $${params.length})`
    );
  }

  if (STATUSES.includes(query.status)) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }

  if (SOURCES.includes(query.source)) {
    params.push(query.source);
    conditions.push(`source = $${params.length}`);
  }

  const page = Math.max(Number(query.page) || 1, 1);

  const [count, result] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total
       FROM leads
       WHERE ${conditions.join(' AND ')}`,
      params
    ),

    pool.query(
      `SELECT *
       FROM leads
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${query.sort === 'created' ? 'created_at' : 'score'
      } ${query.order === 'asc' ? 'ASC' : 'DESC'},
       created_at DESC
       LIMIT 10 OFFSET ${(page - 1) * 10}`,
      params
    ),
  ]);

  return {
    leads: result.rows,
    total: count.rows[0].total,
    page,
    pages: Math.ceil(count.rows[0].total / 10),
  };
}

// Get one lead
export async function getLead(userId, id) {
  const { rows: [lead] } = await pool.query(
    'SELECT * FROM leads WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  if (!lead) throw httpError(404, 'Lead not found');

  return lead;
}

// Create lead
export async function createLead(userId, body) {
  const lead = validateLead(body);
  const contacted = lead.status === 'New' ? null : new Date();

  const score = computeScore(
    { ...lead, last_contacted_at: contacted },
    0
  );

  const { rows: [created] } = await pool.query(
    `INSERT INTO leads
      (user_id, name, email, company, source, status, notes, score, last_contacted_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      userId,
      lead.name,
      lead.email,
      lead.company,
      lead.source,
      lead.status,
      lead.notes,
      score,
      contacted,
    ]
  );

  await clearStaleCache(userId);

  return created;
}

// Update lead
export async function updateLead(userId, id, body) {
  const existing = await getLead(userId, id);
  const lead = validateLead(body);

  const contacted =
    lead.status === 'Contacted' && lead.status !== existing.status
      ? new Date()
      : existing.last_contacted_at;

  const score = computeScore(
    { ...lead, last_contacted_at: contacted },
    await sentCount(id)
  );

  const { rows: [updated] } = await pool.query(
    `UPDATE leads
     SET name = $3, email = $4, company = $5, source = $6,
         status = $7, notes = $8, score = $9,
         last_contacted_at = $10, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [
      id,
      userId,
      lead.name,
      lead.email,
      lead.company,
      lead.source,
      lead.status,
      lead.notes,
      score,
      contacted,
    ]
  );

  if (['Converted', 'Lost'].includes(lead.status)) {
    await cancelForLead(id);
  }

  await clearStaleCache(userId);

  return updated;
}

// Delete lead
export async function deleteLead(userId, id) {
  await getLead(userId, id);
  await cancelForLead(id);

  await pool.query(
    'DELETE FROM leads WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  await clearStaleCache(userId);
}