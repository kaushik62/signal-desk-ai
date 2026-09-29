import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Flame, CheckCircle2, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { api, errMsg } from '../api.js';
import { Spinner, Empty, ErrorBanner, ScoreBadge, StatusBadge, statusColors, panel, linkCls, inputCls, formatDate, formatDateTime, formatShort, FollowUpBadge } from '../components/ui.jsx';

const tooltipStyle = { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };
const axis = { tick: { fontSize: 11, fill: '#6b7280' }, tickLine: false, axisLine: false };

export default function Overview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/dashboard', { params: { days } })
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [days]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { summary: s, byStatus, timeline, attention, upcoming, stale } = data;
  const statusTotal = byStatus.reduce((n, d) => n + d.value, 0);

  const cards = [
    { label: 'Total leads', value: s.total, note: `${s.new_this_week} added this week`, icon: Users },
    { label: 'Hot leads', value: s.hot, note: 'Score 70 or higher', icon: Flame },
    { label: 'Converted leads', value: s.converted, note: s.total ? `${Math.round((s.converted / s.total) * 100)}% of all leads` : 'No leads yet', icon: CheckCircle2 },
    { label: 'Pending follow-ups', value: s.pending, note: 'Scheduled to send', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon }) => (
          <div key={label} className={`${panel} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{label}</p>
              <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-gray-500">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className={`${panel} p-5 lg:col-span-2`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Lead conversions</h2>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range" className={`${inputCls} w-36 py-1.5 text-xs`}>
              <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatShort} minTickGap={24} {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip labelFormatter={formatShort} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="converted" name="Conversions" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${panel} p-5`}>
          <h2 className="mb-4 text-sm font-semibold">Lead status</h2>
          {statusTotal === 0 ? <Empty icon={Inbox} title="No leads yet" /> : (
            <>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                      {byStatus.map((d) => <Cell key={d.name} fill={statusColors[d.name]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-semibold">{statusTotal}</span><span className="text-xs text-gray-500">leads</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5">
                {byStatus.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-xs"><StatusBadge status={d.name} /><span className="text-gray-500">{d.value}</span></li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={`${panel} p-0 lg:col-span-2`}>
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold">Leads requiring attention</h2>
            <Link to="/leads" className={linkCls}>View all leads</Link>
          </div>
          {attention.length === 0 ? <Empty icon={CheckCircle2} title="You're caught up" text="Warm and hot leads not contacted in the last 3 days show up here when they need attention." /> : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-y border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <tr>{['Name', 'Company', 'Score', 'Status', 'Last contacted', 'Action'].map((h) => <th key={h} className="px-5 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attention.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium"><Link to={`/leads/${l.id}`} className="hover:text-indigo-600">{l.name}</Link></td>
                      <td className="px-5 py-3 text-gray-600">{l.company || '—'}</td>
                      <td className="px-5 py-3"><ScoreBadge score={l.score} /></td>
                      <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                      <td className="px-5 py-3 text-gray-600">{formatDate(l.last_contacted_at)}</td>
                      <td className="px-5 py-3"><Link to={`/leads/${l.id}/compose`} className={linkCls}>Generate follow-up</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`${panel} p-5`}>
          <h2 className="mb-3 text-sm font-semibold">Upcoming follow-ups</h2>
          {upcoming.length === 0 ? <Empty icon={Clock} title="Nothing scheduled" /> : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((f) => (
                <li key={f.id} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/leads/${f.lead_id}`} className="truncate text-sm font-medium hover:text-indigo-600">{f.lead_name}</Link>
                    <FollowUpBadge status={f.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-600">{f.subject}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(f.scheduled_at)}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/follow-ups" className={`${linkCls} mt-1 inline-block`}>View all follow-ups</Link>
        </div>

        <div className={`${panel} p-5 lg:col-span-3`}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Stale leads <span className="text-xs font-normal text-gray-500">Not contacted for 7+ days</span>
          </h2>
          {stale.length === 0 ? <p className="text-sm text-gray-500">No stale leads.</p> : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stale.map((l) => (
                <li key={l.id} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="mt-0.5 text-xs text-gray-600">Last contacted {formatDate(l.last_contacted_at)} · {l.inactive_days} days inactive</p>
                  <Link to={`/leads/${l.id}/compose`} className={`${linkCls} mt-2 inline-block`}>Generate follow-up</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
