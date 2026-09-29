import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Mail, CalendarClock, History, ArrowLeft } from 'lucide-react';
import { api, errMsg } from '../api.js';
import LeadForm from '../components/LeadForm.jsx';
import FollowUpList from '../components/FollowUpList.jsx';
import { Spinner, Empty, ErrorBanner, ScoreBadge, StatusBadge, formatDate, panel, btnPrimary, btnGhost } from '../components/ui.jsx';

export default function LeadDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api.get(`/leads/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);
  useEffect(load, [load]);

  if (error) return (
    <div className="space-y-3">
      <ErrorBanner message={error} />
      <Link to="/app/leads" className={btnGhost}><ArrowLeft className="h-4 w-4" /> Back to leads</Link>
    </div>
  );
  if (!data) return <Spinner />;

  const { lead, followUps } = data;
  const canEmail = !['Converted', 'Lost'].includes(lead.status);
  const scheduled = followUps.filter((f) => f.status === 'pending');
  const history = followUps.filter((f) => f.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link to="/app/leads" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      {/* Lead card */}
      <div className={`${panel} p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {lead.email}{lead.company ? ` · ${lead.company}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </button>
            {canEmail ? (
              <>
                <Link className={btnGhost} to={`/app/leads/${lead.id}/compose`}>
                  <CalendarClock className="h-4 w-4" /> Schedule
                </Link>
                <Link className={btnPrimary} to={`/app/leads/${lead.id}/compose`}>
                  <Mail className="h-4 w-4" /> Generate email
                </Link>
              </>
            ) : (
              <span className="self-center text-xs text-gray-500">
                Emails disabled for {lead.status.toLowerCase()} leads
              </span>
            )}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-4 border-t border-gray-100 pt-5">
          <div>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Score</dt>
            <dd><ScoreBadge score={lead.score} /></dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Status</dt>
            <dd><StatusBadge status={lead.status} /></dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Source</dt>
            <dd className="font-medium text-gray-900">{lead.source}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">Last contacted</dt>
            <dd className="font-medium text-gray-900">{formatDate(lead.last_contacted_at)}</dd>
          </div>
        </dl>

        {lead.notes && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Notes</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{lead.notes}</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${panel} p-6`}>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Scheduled emails</h3>
          {scheduled.length
            ? <FollowUpList items={scheduled} onChange={load} showLead={false} />
            : <Empty icon={CalendarClock} title="Nothing scheduled" text="Generate an email to schedule a follow-up." />
          }
        </div>
        <div className={`${panel} p-6`}>
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Follow-up history</h3>
          {history.length
            ? <FollowUpList items={history} onChange={load} showLead={false} />
            : <Empty icon={History} title="No follow-ups sent yet" />
          }
        </div>
      </div>

      {editing && <LeadForm lead={lead} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}
