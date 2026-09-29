import { useCallback, useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { api, errMsg } from '../api.js';
import FollowUpList from '../components/FollowUpList.jsx';
import { Spinner, Empty, ErrorBanner, panel, inputCls } from '../components/ui.jsx';

export default function FollowUps() {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api.get('/follow-ups', { params: { status: status || undefined } })
      .then((r) => { setItems(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [status]);
  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Scheduled and sent emails</p>
        <select className={`${inputCls} w-40`} value={status} onChange={(e) => { setItems(null); setStatus(e.target.value); }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {['pending', 'sent', 'failed', 'cancelled'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>
      <ErrorBanner message={error} />
      <div className={`${panel} px-5 py-2`}>
        {!items ? <Spinner /> : items.length === 0 ? (
          <Empty icon={Mail} title="No follow-ups yet" text="Open a lead and choose Generate email to schedule one." />
        ) : <FollowUpList items={items} onChange={load} />}
      </div>
    </div>
  );
}
