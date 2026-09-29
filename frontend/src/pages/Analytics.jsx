import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, CheckCircle2, Users } from 'lucide-react';
import { api, errMsg } from '../api.js';
import { Spinner, Empty, ErrorBanner, panel, inputCls, statusColors, formatShort } from '../components/ui.jsx';

const tooltipStyle = { borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const axis = { tick: { fontSize: 11, fill: '#9ca3af' }, tickLine: false, axisLine: false };

const Card = ({ title, children }) => (
  <div className={`${panel} p-6`}>
    <h2 className="mb-4 text-sm font-semibold text-gray-900">{title}</h2>
    <div className="h-60">{children}</div>
  </div>
);

const TimeChart = ({ data, dataKey, name }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
      <CartesianGrid stroke="#f3f4f6" vertical={false} />
      <XAxis dataKey="date" tickFormatter={formatShort} minTickGap={24} {...axis} />
      <YAxis allowDecimals={false} {...axis} />
      <Tooltip labelFormatter={formatShort} contentStyle={tooltipStyle} />
      <Line type="monotone" dataKey={dataKey} name={name} stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
    </LineChart>
  </ResponsiveContainer>
);

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.get('/analytics', { params: { days } }).then((r) => { setData(r.data); setError(''); }).catch((e) => setError(errMsg(e)));
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">Deep dive performance metrics and conversion analysis</p>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range" className={`${inputCls} w-36 text-xs py-2`}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <ErrorBanner message={error} />

      {!data ? <Spinner /> : data.total === 0 ? (
        <div className={panel}><Empty icon={BarChart3} title="No data for this period" text="Add leads or choose a longer date range to see analytics." /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Total leads', data.total, Users, 'text-brand-600 bg-brand-50'],
              ['Converted', data.converted, CheckCircle2, 'text-emerald-600 bg-emerald-50'],
              ['Conversion rate', `${data.conversionRate}%`, TrendingUp, 'text-purple-600 bg-purple-50']
            ].map(([label, value, Icon, badgeCls]) => (
              <div key={label} className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-float hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{label}</p>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${badgeCls}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-extrabold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Leads created over time">
              <TimeChart data={data.timeline} dataKey="created" name="Leads created" />
            </Card>

            <Card title="Lead conversions timeline">
              <TimeChart data={data.timeline} dataKey="converted" name="Conversions" />
            </Card>

            <Card title="Leads by acquisition channel">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bySource} margin={{ left: -20, right: 8, top: 4 }}>
                  <CartesianGrid stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" {...axis} />
                  <YAxis allowDecimals={false} {...axis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" name="Leads" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Lead status distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={2} stroke="none" label={({ name, value }) => `${name} (${value})`}>
                    {data.byStatus.map((d) => <Cell key={d.name} fill={statusColors[d.name]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
