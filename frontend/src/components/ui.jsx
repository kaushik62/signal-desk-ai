import { Loader2, AlertCircle } from 'lucide-react';

export const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
export const SOURCES = ['Website', 'LinkedIn', 'Facebook Ads', 'Referral', 'Cold Email', 'Other'];
export const statusColors = { New: '#6366f1', Contacted: '#0ea5e9', Interested: '#f59e0b', Converted: '#10b981', Lost: '#9ca3af' };

export const panel = 'rounded-xl border border-gray-200 bg-white shadow-card';
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export const btnPrimary = `${btn} bg-indigo-600 text-white hover:bg-indigo-700`;
export const btnGhost = `${btn} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`;
export const inputCls = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400';
export const linkCls = 'text-xs font-medium text-indigo-600 hover:text-indigo-700';

export const getInitials = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
export const formatDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', dateOpts) : 'Never');
export const formatDateTime = (v) =>
  new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const formatShort = (v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export function ScoreBadge({ score }) {
  const [label, tone] = score >= 70 ? ['Hot', 'bg-red-50 text-red-700'] : score >= 40 ? ['Warm', 'bg-amber-50 text-amber-700'] : ['Cold', 'bg-gray-100 text-gray-600'];
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{score} · {label}</span>;
}

export function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
      <span className="h-2 w-2 rounded-full" style={{ background: statusColors[status] }} />
      {status}
    </span>
  );
}

const fuTones = { pending: 'bg-indigo-50 text-indigo-700', sending: 'bg-sky-50 text-sky-700', sent: 'bg-emerald-50 text-emerald-700', failed: 'bg-red-50 text-red-700', cancelled: 'bg-gray-100 text-gray-600' };
export const FollowUpBadge = ({ status }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${fuTones[status]}`}>{status}</span>
);

export const Spinner = ({ className = 'py-16' }) => (
  <div className={`flex justify-center ${className}`}><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
);

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <Icon className="mb-3 h-7 w-7 text-gray-300" />
      <p className="text-sm font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export const ErrorBanner = ({ message }) =>
  message ? (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
    </div>
  ) : null;

export const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);
