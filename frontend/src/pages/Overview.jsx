import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Inbox,
  RefreshCw,
  ArrowUpRight,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';

import { api, errMsg } from '../api.js';
import {
  Spinner,
  Empty,
  ErrorBanner,
  ScoreBadge,
  StatusBadge,
  statusColors,
  panel,
  linkCls,
  inputCls,
  formatDate,
  formatDateTime,
  formatShort,
  FollowUpBadge,
} from '../components/ui.jsx';

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const axis = {
  tick: { fontSize: 11, fill: '#9ca3af' },
  tickLine: false,
  axisLine: false,
};

const defaultSummary = {
  total: 0,
  hot: 0,
  converted: 0,
  pending: 0,
  new_this_week: 0,
};

const accentMap = {
  indigo: {
    bg: 'bg-brand-50',
    text: 'text-brand-600',
    ring: 'ring-brand-100',
    gradient: 'from-brand-500/10',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    ring: 'ring-red-100',
    gradient: 'from-red-500/10',
  },
  green: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-100',
    gradient: 'from-emerald-500/10',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-100',
    gradient: 'from-amber-500/10',
  },
};

function StatCard({ label, value, note, icon: Icon, accent }) {
  const styles = accentMap[accent] || accentMap.indigo;

  return (
    <div
      className={[
        'group relative overflow-hidden rounded-2xl border border-gray-100',
        'bg-gradient-to-br',
        styles.gradient,
        'to-white p-5 shadow-sm transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md sm:p-6',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.bg} ${styles.text} ${styles.ring}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <span className="text-xs leading-relaxed text-gray-500">{note}</span>
      </div>
    </div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>

        {description && (
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

export default function Overview() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/analytics/dashboard', {
        params: { days },
      });

      setData(response?.data ?? {});
    } catch (err) {
      setError(
        errMsg(err) || 'Unable to load your dashboard. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/analytics/dashboard', {
          params: { days },
        });

        if (!cancelled) {
          setData(response?.data ?? {});
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            errMsg(err) || 'Unable to load your dashboard. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [days]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-500">Loading your dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12">
        <ErrorBanner message={error} />

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="mx-auto flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Try again
        </button>
      </div>
    );
  }

  const summary = data?.summary ?? defaultSummary;
  const byStatus = Array.isArray(data?.byStatus) ? data.byStatus : [];
  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
  const attention = Array.isArray(data?.attention) ? data.attention : [];
  const upcoming = Array.isArray(data?.upcoming) ? data.upcoming : [];
  const stale = Array.isArray(data?.stale) ? data.stale : [];

  const total = Number(summary.total) || 0;
  const hot = Number(summary.hot) || 0;
  const converted = Number(summary.converted) || 0;
  const pending = Number(summary.pending) || 0;
  const newThisWeek = Number(summary.new_this_week) || 0;

  const statusTotal = byStatus.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  const conversionRate =
    total > 0 ? Math.round((converted / total) * 100) : 0;

  const cards = [
    {
      label: 'Total leads',
      value: total,
      note: `${newThisWeek} added this week`,
      icon: Users,
      accent: 'indigo',
    },
    {
      label: 'Hot leads',
      value: hot,
      note: 'Score 70 or higher',
      icon: Flame,
      accent: 'red',
    },
    {
      label: 'Converted leads',
      value: converted,
      note: total ? `${conversionRate}% of all leads` : 'No leads yet',
      icon: CheckCircle2,
      accent: 'green',
    },
    {
      label: 'Pending follow-ups',
      value: pending,
      note: 'Scheduled to send',
      icon: Clock,
      accent: 'amber',
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <TrendingUp className="h-5 w-5" />
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Overview
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Track your leads, follow-ups, and sales performance.
          </p>
        </div>

        {/* Date Range + Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Select analytics date range"
              className={`${inputCls} w-40 py-2 pl-9 text-xs`}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            disabled={loading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Statistics */}
      <section aria-label="Lead statistics">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Performance at a glance
          </h2>

          {loading && (
            <span className="text-xs text-gray-400">Refreshing...</span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Conversions */}
        <section
          className={`${panel} min-w-0 overflow-hidden p-0 lg:col-span-2`}
          aria-labelledby="conversion-heading"
        >
          <SectionHeader
            title="Lead conversions"
            description="Track converted leads over time."
          />

          <div className="p-4 sm:p-6">
            {timeline.length === 0 ? (
              <div className="flex h-64 items-center justify-center">
                <Empty
                  icon={TrendingUp}
                  title="No conversion data"
                  text="Conversion activity will appear here when leads are converted."
                />
              </div>
            ) : (
              <div className="h-64 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeline}
                    margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="#f1f5f9"
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShort}
                      minTickGap={24}
                      {...axis}
                    />

                    <YAxis allowDecimals={false} {...axis} />

                    <Tooltip
                      labelFormatter={formatShort}
                      contentStyle={tooltipStyle}
                    />

                    <Line
                      type="monotone"
                      dataKey="converted"
                      name="Conversions"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: '#6366f1',
                        stroke: '#ffffff',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Lead Status */}
        <section
          className={`${panel} min-w-0 overflow-hidden p-0`}
          aria-labelledby="status-heading"
        >
          <SectionHeader
            title="Lead status"
            description="How your leads are distributed."
          />

          <div className="p-5 sm:p-6">
            {statusTotal === 0 ? (
              <div className="flex min-h-56 items-center justify-center">
                <Empty icon={Inbox} title="No leads yet" />
              </div>
            ) : (
              <>
                <div className="relative h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byStatus}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {byStatus.map((item) => (
                          <Cell
                            key={item.name}
                            fill={statusColors?.[item.name] || '#94a3b8'}
                          />
                        ))}
                      </Pie>

                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-gray-950">
                      {statusTotal}
                    </span>
                    <span className="mt-0.5 text-xs text-gray-400">
                      Total leads
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-3">
                  {byStatus.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              statusColors?.[item.name] || '#94a3b8',
                          }}
                        />
                        <StatusBadge status={item.name} />
                      </div>

                      <span className="text-sm font-semibold text-gray-700">
                        {item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Leads Requiring Attention */}
        <section
          className={`${panel} min-w-0 overflow-hidden p-0 lg:col-span-2`}
          aria-labelledby="attention-heading"
        >
          <SectionHeader
            title="Leads requiring attention"
            description="Warm and hot leads not contacted in 3+ days."
            action={
              <Link
                to="/app/leads"
                className={`${linkCls} inline-flex shrink-0 items-center gap-1`}
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />

          {attention.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center px-5 py-8">
              <Empty
                icon={CheckCircle2}
                title="You're all caught up!"
                text="Leads needing follow-up will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50/70 text-xs text-gray-500">
                  <tr>
                    {[
                      'Name',
                      'Company',
                      'Score',
                      'Status',
                      'Last contacted',
                      'Action',
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-5 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {attention.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition-colors hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        <Link
                          to={`/app/leads/${lead.id}`}
                          className="transition-colors hover:text-brand-600"
                        >
                          {lead.name || 'Unnamed lead'}
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {lead.company || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <ScoreBadge score={lead.score} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={lead.status} />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                        {formatDate(lead.last_contacted_at)}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/app/leads/${lead.id}/compose`}
                          className={`${linkCls} whitespace-nowrap`}
                        >
                          Generate follow-up
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Upcoming Follow-ups */}
        <section
          className={`${panel} min-w-0 overflow-hidden p-0`}
          aria-labelledby="upcoming-heading"
        >
          <SectionHeader
            title="Upcoming follow-ups"
            description="Your scheduled outreach."
          />

          <div className="p-5 sm:p-6">
            {upcoming.length === 0 ? (
              <div className="flex min-h-40 items-center justify-center">
                <Empty
                  icon={Clock}
                  title="Nothing scheduled"
                  text="Your upcoming follow-ups will appear here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcoming.map((followUp) => (
                  <li key={followUp.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to={`/app/leads/${followUp.lead_id}`}
                        className="min-w-0 truncate text-sm font-semibold text-gray-800 transition-colors hover:text-brand-600"
                      >
                        {followUp.lead_name || 'Unnamed lead'}
                      </Link>

                      <FollowUpBadge status={followUp.status} />
                    </div>

                    <p className="mt-1.5 truncate text-xs text-gray-500">
                      {followUp.subject || 'No subject'}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(followUp.scheduled_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <Link
              to="/app/follow-ups"
              className={`${linkCls} mt-5 inline-flex items-center gap-1`}
            >
              View all follow-ups
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Stale Leads */}
        <section
          className={`${panel} min-w-0 overflow-hidden p-0 lg:col-span-3`}
          aria-labelledby="stale-heading"
        >
          <SectionHeader
            title="Stale leads"
            description="Leads that have not been contacted for 7+ days."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {stale.length} {stale.length === 1 ? 'lead' : 'leads'}
              </span>
            }
          />

          <div className="p-5 sm:p-6">
            {stale.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    No stale leads
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Great work! Your leads are being followed up.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {stale.map((lead) => (
                  <li
                    key={lead.id}
                    className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 transition-colors hover:bg-amber-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-semibold text-gray-900">
                        {lead.name || 'Unnamed lead'}
                      </p>

                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    </div>

                    {lead.company && (
                      <p className="mt-1 truncate text-xs text-gray-500">
                        {lead.company}
                      </p>
                    )}

                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      Last contacted {formatDate(lead.last_contacted_at)}
                    </p>

                    <p className="mt-1 text-xs font-medium text-amber-700">
                      {Number(lead.inactive_days) || 0} days inactive
                    </p>

                    <Link
                      to={`/app/leads/${lead.id}/compose`}
                      className={`${linkCls} mt-3 inline-flex items-center gap-1`}
                    >
                      Generate follow-up
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400">
        SignalDesk AI · Lead performance overview
      </p>
    </div>
  );
}