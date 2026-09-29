import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Sparkles, RefreshCw, Send, CalendarClock } from 'lucide-react';
import { api, errMsg, fieldErrors } from '../api.js';
import { Spinner, ErrorBanner, Field, ScoreBadge, StatusBadge, panel, inputCls, btnPrimary, btnGhost } from '../components/ui.jsx';

export default function Compose() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [tone, setTone] = useState('Professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get(`/leads/${id}`).then((r) => setLead(r.data.lead)).catch((e) => setError(errMsg(e)));
  }, [id]);

  if (!lead) return error ? <div className="space-y-3"><ErrorBanner message={error} /><Link to="/leads" className={btnGhost}>Back to leads</Link></div> : <Spinner />;

  const generate = async () => {
    setBusy('generate'); setError(''); setSuccess('');
    try {
      const { data } = await api.post('/ai/generate-email', { leadId: id, tone });
      setSubject(data.subject); setBody(data.body);
    } catch (e) { setError(errMsg(e)); } finally { setBusy(''); }
  };

  const submit = async (scheduledAt) => {
    setError(''); setErrors({});
    if (scheduledAt === null) { setErrors({ scheduledAt: 'Choose a date and time' }); return; }
    setBusy(scheduledAt ? 'schedule' : 'send');
    try {
      await api.post('/follow-ups', { leadId: id, subject, emailBody: body, scheduledAt });
      setSuccess(scheduledAt ? 'Follow-up scheduled.' : 'Email queued for sending.');
      setTimeout(() => navigate(`/leads/${id}`), 900);
    } catch (e) { setErrors(fieldErrors(e)); setError(errMsg(e)); setBusy(''); }
  };

  const hasDraft = subject || body;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className={`${panel} space-y-3 p-5 lg:self-start`}>
        <h2 className="text-sm font-semibold">Lead</h2>
        <div>
          <Link to={`/leads/${lead.id}`} className="font-medium hover:text-indigo-600">{lead.name}</Link>
          <p className="text-sm text-gray-500">{lead.email}</p>
          {lead.company && <p className="text-sm text-gray-500">{lead.company}</p>}
        </div>
        <div className="flex items-center gap-3"><StatusBadge status={lead.status} /><ScoreBadge score={lead.score} /></div>
        <p className="whitespace-pre-wrap text-sm text-gray-600">{lead.notes || 'No notes.'}</p>
      </div>

      <div className={`${panel} space-y-4 p-5 lg:col-span-2`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <Field label="Tone">
              <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)}><option>Professional</option><option>Friendly</option></select>
            </Field>
          </div>
          <button className={btnPrimary} onClick={generate} disabled={!!busy}>
            {busy === 'generate' ? <RefreshCw className="h-4 w-4 animate-spin" /> : hasDraft ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {busy === 'generate' ? 'Generating…' : hasDraft ? 'Regenerate' : 'Generate email'}
          </button>
        </div>
        <ErrorBanner message={error} />
        {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
        <Field label="Subject" error={errors.subject}><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} /></Field>
        <Field label="Email body" error={errors.emailBody}><textarea rows={12} className={inputCls} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
        <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
          <button className={btnPrimary} disabled={!!busy || !subject.trim() || !body.trim()} onClick={() => submit(undefined)}>
            <Send className="h-4 w-4" /> {busy === 'send' ? 'Sending…' : 'Send now'}
          </button>
          <div className="w-56"><Field label="Send at" error={errors.scheduledAt}><input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} /></Field></div>
          <button className={btnGhost} disabled={!!busy || !subject.trim() || !body.trim()} onClick={() => submit(when ? new Date(when).toISOString() : null)}>
            <CalendarClock className="h-4 w-4" /> {busy === 'schedule' ? 'Scheduling…' : 'Schedule follow-up'}
          </button>
        </div>
      </div>
    </div>
  );
}
