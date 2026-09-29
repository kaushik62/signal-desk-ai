import { env } from '../config/env.js';
import { httpError } from '../middleware/errorHandler.js';

export const TONES = ['Professional', 'Friendly'];

export async function generateEmail(lead, tone) {
  if (!env.groqApiKey) throw httpError(503, 'AI email generation is not configured. Set GROQ_API_KEY.');

  const context = [
    `Name: ${lead.name}`,
    `Company: ${lead.company || 'not provided'}`,
    `Status: ${lead.status}`,
    `Notes: ${lead.notes || 'none'}`,
  ].join('\n');

  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You write short sales follow-up emails (under 150 words). Use only the facts given. ' +
              'Do not invent prices, dates or promises. Sign off with "Best regards" and no name. ' +
              'Reply with JSON only: {"subject": string, "body": string}.',
          },
          { role: 'user', content: `Tone: ${tone}\nLead:\n${context}\nWrite a follow-up email that fits the lead's status.` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    console.error('Groq fetch error:', err.message);
    throw httpError(504, 'The AI service did not respond. Try again.');
  }
  if (!res.ok) {
    const errorBody = await res.text().catch(() => '');
    console.error(`Groq API error (${res.status}):`, errorBody);
    throw httpError(502, `The AI service returned an error (${res.status}). Try again.`);
  }

  try {
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const subject = parsed.subject || parsed.Subject;
    const body = parsed.body || parsed.Body || parsed.email || parsed.email_body || parsed.message;
    if (typeof subject !== 'string' || typeof body !== 'string') throw new Error('shape');
    if (!subject.trim() || subject.length > 200 || !body.trim() || body.length > 4000) throw new Error('size');
    return { subject: subject.trim(), body: body.trim() };
  } catch (err) {
    console.error('Groq response parse error:', err.message);
    throw httpError(502, 'The AI returned an unusable email. Try regenerating.');
  }
}
