import { env } from '../config/env.js';
import { httpError } from '../middleware/errorHandler.js';

export const TONES = ['Professional', 'Friendly'];

export async function generateEmail(lead, tone) {
  if (!env.groqApiKey) throw httpError(503, 'AI email generation is not configured. Set GROQ_API_KEY.');

  const context = [
    `Name: ${lead.name}`,
    `Status: ${lead.status}`,
    `Notes: ${lead.notes}`,
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
              'You are SignalDesk AI, an AI sales assistant that writes clear, natural, and personalized follow-up emails. ' +
              'Write a concise email under 150 words, excluding the subject line. ' +
              'Use only the facts and details provided about the lead. ' +
              'Make the email relevant to the lead’s notes, needs, and current status when those details are available. ' +
              'Follow the requested tone: Professional or Friendly. ' +
              'Keep the message helpful, conversational, and focused on building a relationship. ' +
              'Include a clear, relevant subject line. ' +
              'Do not invent prices, dates, discounts, product details, or promises. ' +
              'Do not make unsupported assumptions or use generic, pushy sales language. ' +
              'End the email body with "Best regards," followed by "SignalDesk AI" on the next line. ' +
              'Return valid JSON only, with no Markdown, explanations, or additional text. ' +
              'Use exactly this structure: {"subject": string, "body": string}.',
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
