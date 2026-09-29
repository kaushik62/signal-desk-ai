import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { api, errMsg } from '../api.js';
import { Spinner, Empty, ErrorBanner, panel, inputCls, statusColors, formatShort } from '../components/ui.jsx';

const tooltipStyle = { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 };
const axis = { tick: { fontSize: 11, fill: '#6b7280' }, tickLine: false, axisLine: false };

const Card = ({ title, children }) => (
  <div className={`${panel} p-5`}><h2 className="mb-4 text-sm font-semibold">{title}</h2><div className="h-56">{children}</div></div>
);

const TimeChart = ({ data, dataKey, name }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data} margin={{ left: -20, right: 8, top: 4 }}>
      <CartesianGrid stroke="#f3f4f6" vertical={false} />
      <XAxis dataKey="date" tickFormatter={formatShort} minTickGap={24} {...axis} />
      <YAxis allowDecimals={false} {...axis} />
      <Tooltip labelFormatter={formatShort} contentStyle={tooltipStyle} />
      <Line type="monotone" dataKey={dataKey} name={name} stroke="#4f46e5" strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

export default function Analytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics', { params: { days } }).then((r) => { setData(r.data); setError(''); }).catch((e) => setError(errMsg(e)));
  }, [days]);

  const select = (
    <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range" className={`${inputCls} w-36`}>
      <option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Leads created in the selected period</p>{select}</div>
      <ErrorBanner message={error} />
      {!data ? <Spinner /> : data.total === 0 ? (
        <div className={panel}><Empty icon={BarChart3} title="No data for this period" text="Add leads or choose a longer date range to see analytics." /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Total leads', data.total], ['Converted', data.converted], ['Conversion rate', `${data.conversionRate}%`]].map(([label, value]) => (
              <div key={label} className={`${panel} p-5`}><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Leads created"><TimeChart data={data.timeline} dataKey="created" name="Leads created" /></Card>
            <Card title="Conversions"><TimeChart data={data.timeline} dataKey="converted" name="Conversions" /></Card>
            <Card title="Lead sources">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bySource} margin={{ left: -20, right: 8, top: 4 }}>
                  <CartesianGrid stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="name" {...axis} /><YAxis allowDecimals={false} {...axis} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="value" name="Leads" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Lead status">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none" label={({ name, value }) => `${name} ${value}`}>
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
