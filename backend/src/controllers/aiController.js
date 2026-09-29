import { getLead } from '../services/leadService.js';
import { generateEmail, TONES } from '../services/aiService.js';
import { httpError } from '../middleware/errorHandler.js';
import { isUuid } from '../middleware/auth.js';

export async function generate(req, res) {

  const { leadId, tone } = req.body ?? {};

  if (!isUuid(leadId)) {
    throw httpError(400, 'A valid lead is required');
  }

  if (!TONES.includes(tone)) {
    throw httpError(400, 'Tone must be Professional or Friendly');
  }

  const lead = await getLead(req.userId, leadId);

  // 5. Generate the email using the lead's information and selected tone
  const email = await generateEmail(lead, tone);

  // 6. Send the generated email back to the frontend
  return res.json(email);
}