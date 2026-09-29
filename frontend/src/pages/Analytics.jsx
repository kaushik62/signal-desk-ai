import { useCallback, useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Users,
  RefreshCw,
  CalendarDays,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

import { api, errMsg } from '../api.js';
import {
  Spinner,
  Empty,
  ErrorBanner,
  panel,
  inputCls,
  statusColors,
  formatShort,
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

const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#8b5cf6',
  '#06b6d4',
  '#64748b',
];

const EMPTY_DATA = {
  total: 0,
  converted: 0,
  conversionRate: 0,
  timeline: [],
  bySource: [],
  byStatus: [],
};

function getChartColor(name, index = 0) {
  return (
    statusColors?.[name] ||
    CHART_COLORS[index % CHART_COLORS.length]
  );
}

function ChartCard({ title, description, icon: Icon, children }) {
  return (
    <section
      className={`${panel} min-w-0 overflow-hidden p-0`}
    >
      <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-relaxed text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="h-72 min-w-0 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon, accent, description }) {
  const accentStyles = {
    indigo: 'bg-brand-50 text-brand-600 ring-brand-100',
    green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    purple: 'bg-purple-50 text-purple-600 ring-purple-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-3 break-words text-3xl font-bold tracking-tight text-gray-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accentStyles[accent] || accentStyles.indigo
            }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function TimeChart({ data, dataKey, name, color = '#6366f1' }) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          icon={TrendingUp}
          title="No timeline data"
          text="Activity will appear here when data is available."
        />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
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

        <YAxis
          allowDecimals={false}
          width={40}
          {...axis}
        />

        <Tooltip
          labelFormatter={formatShort}
          contentStyle={tooltipStyle}
        />

        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke={color}
          strokeWidth={3}
          dot={false}
          activeDot={{
            r: 5,
            fill: color,
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SourceChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          icon={Users}
          title="No source data"
          text="Lead acquisition channels will appear here."
        />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ left: -20, right: 8, top: 8, bottom: 8 }}
      >
        <CartesianGrid
          stroke="#f1f5f9"
          strokeDasharray="3 3"
          vertical={false}
        />

        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={55}
        />

        <YAxis
          allowDecimals={false}
          width={40}
          {...axis}
        />

        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: '#f8fafc' }}
        />

        <Bar
          dataKey="value"
          name="Leads"
          fill="#6366f1"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatusChart({ data }) {
  const total = data.reduce(
    (sum, item) => sum + (Number(item.value) || 0),
    0
  );

  if (!total) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty
          icon={Activity}
          title="No status data"
          text="Lead status distribution will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col sm:flex-row sm:items-center">
      <div className="relative h-52 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((item, index) => (
                <Cell
                  key={item.name || index}
                  fill={getChartColor(item.name, index)}
                />
              ))}
            </Pie>

            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-950">
            {total}
          </span>

          <span className="mt-1 text-xs text-gray-400">
            Total leads
          </span>
        </div>
      </div>

      <div className="mt-4 min-w-0 flex-1 space-y-3 sm:mt-0 sm:pl-4">
        {data.map((item, index) => {
          const count = Number(item.value) || 0;
          const percentage = Math.round((count / total) * 100);

          return (
            <div key={item.name || index}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: getChartColor(item.name, index),
                    }}
                  />

                  <span className="truncate text-xs font-medium text-gray-600">
                    {item.name || 'Unknown'}
                  </span>
                </div>

                <span className="shrink-0 text-xs font-semibold text-gray-800">
                  {count}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: getChartColor(item.name, index),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/analytics', {
        params: { days },
      });

      const result = response?.data ?? {};

      setData({
        ...EMPTY_DATA,
        ...result,
        total: Number(result.total) || 0,
        converted: Number(result.converted) || 0,
        conversionRate: Number(result.conversionRate) || 0,
        timeline: Array.isArray(result.timeline)
          ? result.timeline
          : [],
        bySource: Array.isArray(result.bySource)
          ? result.bySource
          : [],
        byStatus: Array.isArray(result.byStatus)
          ? result.byStatus
          : [],
      });
    } catch (err) {
      setError(
        errMsg(err) || 'Unable to load analytics. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const hasLeads = Number(data?.total) > 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <BarChart3 className="h-5 w-5" />
            </span>

            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Analytics
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Explore lead performance, acquisition channels, and conversion trends.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              aria-label="Analytics date range"
              className={`${inputCls} w-40 py-2 pl-9 text-xs`}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="Refresh analytics"
            title="Refresh analytics"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Initial Loading */}
      {loading && !data ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white">
          <Spinner />
          <p className="text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      ) : error && !data ? (
        <div className={`${panel} flex flex-col items-center gap-4 p-10 text-center`}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Activity className="h-6 w-6" />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900">
              Analytics unavailable
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              We couldn't load your analytics right now.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Try again
          </button>
        </div>
      ) : !hasLeads ? (
        <div className={`${panel} flex min-h-72 items-center justify-center p-6`}>
          <Empty
            icon={BarChart3}
            title="No data for this period"
            text="Add leads or choose a longer date range to see your analytics."
          />
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-gray-800">
                Performance overview
              </h2>

              {loading && (
                <span className="text-xs text-gray-400">
                  Updating...
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Total leads"
                value={data.total}
                icon={Users}
                accent="indigo"
                description="Leads in the selected period"
              />

              <MetricCard
                label="Converted leads"
                value={data.converted}
                icon={CheckCircle2}
                accent="green"
                description="Leads successfully converted"
              />

              <MetricCard
                label="Conversion rate"
                value={`${data.conversionRate}%`}
                icon={TrendingUp}
                accent="purple"
                description="Share of leads converted"
              />
            </div>
          </section>

          {/* Charts */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                Performance breakdown
              </h2>
            </div>

            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
              <ChartCard
                title="Leads created over time"
                description="Track new leads across the selected period."
                icon={Users}
              >
                <TimeChart
                  data={data.timeline}
                  dataKey="created"
                  name="Leads created"
                  color="#6366f1"
                />
              </ChartCard>

              <ChartCard
                title="Lead conversions timeline"
                description="Monitor successful conversions over time."
                icon={TrendingUp}
              >
                <TimeChart
                  data={data.timeline}
                  dataKey="converted"
                  name="Conversions"
                  color="#10b981"
                />
              </ChartCard>

              <ChartCard
                title="Leads by acquisition channel"
                description="See where your leads are coming from."
                icon={ArrowUpRight}
              >
                <SourceChart data={data.bySource} />
              </ChartCard>

              <ChartCard
                title="Lead status distribution"
                description="Understand the current status of your leads."
                icon={Activity}
              >
                <StatusChart data={data.byStatus} />
              </ChartCard>
            </div>
          </section>
        </>
      )}

      <p className="pt-2 text-center text-xs text-gray-400">
        SignalDesk AI · Analytics
      </p>
    </div>
  );
}