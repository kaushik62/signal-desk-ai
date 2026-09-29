import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { api, errMsg } from '../api.js';
import { FollowUpBadge, formatDateTime, btnGhost, ErrorBanner } from './ui.jsx';

export default function FollowUpList({ items, onChange, showLead = true }) {
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  const act = async (id, action) => {
    setError('');
    try { await api.post(`/follow-ups/${id}/${action}`); onChange(); } catch (e) { setError(errMsg(e)); }
  };

  return (
    <div>
      <ErrorBanner message={error} />
      <ul className="divide-y divide-gray-100">
        {items.map((f) => (
          <li key={f.id} className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setOpen(open === f.id ? null : f.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open === f.id}>
                {open === f.id ? <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{f.subject}</span>
                  <span className="block text-xs text-gray-500">
                    {showLead && <><Link to={`/app/leads/${f.lead_id}`} className="text-brand-600 font-medium hover:underline">{f.lead_name}</Link> · </>}
                    {f.status === 'sent' ? `Sent ${formatDateTime(f.sent_at)}` : `Scheduled ${formatDateTime(f.scheduled_at)}`}
                  </span>
                </span>
              </button>
              <FollowUpBadge status={f.status} />
              {f.status === 'pending' && <button className={btnGhost} onClick={() => act(f.id, 'cancel')}>Cancel</button>}
              {f.status === 'failed' && <button className={btnGhost} onClick={() => act(f.id, 'retry')}>Retry</button>}
            </div>
            {open === f.id && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-sans text-sm text-gray-700">{f.email_body}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}
