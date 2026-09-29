import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Mail, CalendarClock, History } from 'lucide-react';
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

  if (error) return <div className="space-y-3"><ErrorBanner message={error} /><Link to="/leads" className={btnGhost}>Back to leads</Link></div>;
  if (!data) return <Spinner />;

  const { lead, followUps } = data;
  const canEmail = !['Converted', 'Lost'].includes(lead.status);
  const scheduled = followUps.filter((f) => f.status === 'pending');
  const history = followUps.filter((f) => f.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className={`${panel} space-y-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{lead.name}</h2>
            <p className="text-sm text-gray-500">{lead.email}{lead.company ? ` · ${lead.company}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit lead</button>
            {canEmail ? (
              <>
                <Link className={btnGhost} to={`/leads/${lead.id}/compose`}><CalendarClock className="h-4 w-4" /> Schedule follow-up</Link>
                <Link className={btnPrimary} to={`/leads/${lead.id}/compose`}><Mail className="h-4 w-4" /> Generate email</Link>
              </>
            ) : <span className="self-center text-xs text-gray-500">Emails are disabled for {lead.status.toLowerCase()} leads</span>}
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-4">
          <div><dt className="text-gray-500">Score</dt><dd className="mt-1"><ScoreBadge score={lead.score} /></dd></div>
          <div><dt className="text-gray-500">Status</dt><dd className="mt-1"><StatusBadge status={lead.status} /></dd></div>
          <div><dt className="text-gray-500">Source</dt><dd className="mt-1 font-medium">{lead.source}</dd></div>
          <div><dt className="text-gray-500">Last contacted</dt><dd className="mt-1 font-medium">{formatDate(lead.last_contacted_at)}</dd></div>
        </dl>
        <div>
          <h3 className="text-sm text-gray-500">Notes</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm">{lead.notes || 'No notes yet.'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${panel} p-5`}>
          <h3 className="mb-1 text-sm font-semibold">Scheduled emails</h3>
          {scheduled.length ? <FollowUpList items={scheduled} onChange={load} showLead={false} /> : <Empty icon={CalendarClock} title="Nothing scheduled" />}
        </div>
        <div className={`${panel} p-5`}>
          <h3 className="mb-1 text-sm font-semibold">Follow-up history</h3>
          {history.length ? <FollowUpList items={history} onChange={load} showLead={false} /> : <Empty icon={History} title="No follow-ups sent yet" />}
        </div>
      </div>
      {editing && <LeadForm lead={lead} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />}
    </div>
  );
}
