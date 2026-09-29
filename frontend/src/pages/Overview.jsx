import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Users, Flame, CheckCircle2, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { api, errMsg } from '../api.js';
import {
  Spinner, Empty, ErrorBanner, ScoreBadge, StatusBadge, statusColors,
  panel, linkCls, inputCls, formatDate, formatDateTime, formatShort, FollowUpBadge,
} from '../components/ui.jsx';

const tooltipStyle = { borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const axis = { tick: { fontSize: 11, fill: '#9ca3af' }, tickLine: false, axisLine: false };

export default function Overview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.get('/analytics/dashboard', { params: { days } })
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [days]);

  if (!data) return error ? <ErrorBanner message={error} /> : <Spinner />;
  const { summary: s, byStatus, timeline, attention, upcoming, stale } = data;
  const statusTotal = byStatus.reduce((n, d) => n + d.value, 0);

  const cards = [
    { label: 'Total leads',       value: s.total,     note: `${s.new_this_week} added this week`, icon: Users,        accent: 'indigo' },
    { label: 'Hot leads',         value: s.hot,        note: 'Score 70 or higher',                 icon: Flame,        accent: 'red'    },
    { label: 'Converted leads',   value: s.converted,  note: s.total ? `${Math.round((s.converted / s.total) * 100)}% of all leads` : 'No leads yet', icon: CheckCircle2, accent: 'green'  },
    { label: 'Pending follow-ups',value: s.pending,    note: 'Scheduled to send',                  icon: Clock,        accent: 'amber'  },
  ];

  const accentMap = {
    indigo: { bg: 'bg-brand-50', text: 'text-brand-600', ring: 'ring-brand-100' },
    red:    { bg: 'bg-red-50',   text: 'text-red-600',   ring: 'ring-red-100'   },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber:  { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
  };

  return (
    <div className="space-y-6">
      <ErrorBanner message={error} />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, accent }) => {
          const { bg, text } = accentMap[accent];
          return (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-float hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${text}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-gray-900">{value}</p>
              <p className="mt-1.5 text-xs text-gray-400">{note}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Line chart */}
        <div className={`${panel} p-6 lg:col-span-2`}>
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Lead conversions</h2>
              <p className="text-xs text-gray-400 mt-0.5">Converted leads over time</p>
            </div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              aria-label="Date range"
              className={`${inputCls} w-36 py-2 text-xs`}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatShort} minTickGap={24} {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip labelFormatter={formatShort} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="converted" name="Conversions" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className={`${panel} p-6`}>
          <h2 className="mb-5 text-sm font-semibold text-gray-900">Lead status</h2>
          {statusTotal === 0 ? (
            <Empty icon={Inbox} title="No leads yet" />
          ) : (
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
                  <span className="text-2xl font-extrabold text-gray-900">{statusTotal}</span>
                  <span className="text-xs text-gray-400">leads</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {byStatus.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-xs">
                    <StatusBadge status={d.name} />
                    <span className="font-medium text-gray-600">{d.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Attention table */}
        <div className={`${panel} p-0 lg:col-span-2`}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Leads requiring attention</h2>
              <p className="text-xs text-gray-400 mt-0.5">Warm & hot leads not contacted in 3+ days</p>
            </div>
            <Link to="/app/leads" className={linkCls}>View all →</Link>
          </div>
          {attention.length === 0 ? (
            <Empty
              icon={CheckCircle2}
              title="You're all caught up!"
              text="Warm and hot leads not contacted in the last 3 days show up here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-500">
                  <tr>
                    {['Name', 'Company', 'Score', 'Status', 'Last contacted', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attention.map((l) => (
                    <tr key={l.id} className="transition-colors hover:bg-gray-50/80">
                      <td className="px-5 py-3.5 font-medium">
                        <Link to={`/app/leads/${l.id}`} className="hover:text-brand-600 transition-colors">{l.name}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{l.company || '—'}</td>
                      <td className="px-5 py-3.5"><ScoreBadge score={l.score} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                      <td className="px-5 py-3.5 text-gray-500">{formatDate(l.last_contacted_at)}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/app/leads/${l.id}/compose`} className={linkCls}>Generate follow-up</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming follow-ups */}
        <div className={`${panel} p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Upcoming follow-ups</h2>
          </div>
          {upcoming.length === 0 ? (
            <Empty icon={Clock} title="Nothing scheduled" />
          ) : (
            <ul className="divide-y divide-gray-50">
              {upcoming.map((f) => (
                <li key={f.id} className="py-3.5 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/app/leads/${f.lead_id}`} className="truncate text-sm font-medium hover:text-brand-600 transition-colors">
                      {f.lead_name}
                    </Link>
                    <FollowUpBadge status={f.status} />
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{f.subject}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(f.scheduled_at)}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/app/follow-ups" className={`${linkCls} mt-3 inline-block`}>View all follow-ups</Link>
        </div>

        {/* Stale leads */}
        <div className={`${panel} p-6 lg:col-span-3`}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Stale leads
            <span className="text-xs font-normal text-gray-400">Not contacted for 7+ days</span>
          </h2>
          {stale.length === 0 ? (
            <p className="text-sm text-gray-500">No stale leads. Great work! 🎉</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stale.map((l) => (
                <li key={l.id} className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 transition-all hover:bg-amber-50">
                  <p className="text-sm font-semibold text-gray-900">{l.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Last contacted {formatDate(l.last_contacted_at)} · <strong>{l.inactive_days}d</strong> inactive
                  </p>
                  <Link to={`/app/leads/${l.id}/compose`} className={`${linkCls} mt-2 inline-block`}>
                    Generate follow-up →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
