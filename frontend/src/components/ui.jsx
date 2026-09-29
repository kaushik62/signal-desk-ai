import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
export const SOURCES = ['Website', 'LinkedIn', 'Facebook Ads', 'Referral', 'Cold Email', 'Other'];
export const statusColors = {
  New: '#6366f1',
  Contacted: '#0ea5e9',
  Interested: '#f59e0b',
  Converted: '#10b981',
  Lost: '#9ca3af',
};

/* ── Legacy class aliases (for backward compat with existing pages) ── */
export const panel      = 'rounded-2xl border border-gray-100 bg-white shadow-card';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-brand-500 to-purple-600 text-white shadow-glow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:scale-100';
export const btnGhost   = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
export const btnDanger  = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-red-600 text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
export const inputCls   = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm placeholder:text-gray-400 transition-all duration-200 focus:border-brand-400 focus:outline-none focus:ring-0 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]';
export const linkCls    = 'text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors';

/* ── Helpers ── */
export const getInitials = (name) =>
  (name || '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const dateOpts = { day: 'numeric', month: 'short', year: 'numeric' };
export const formatDate     = (v) => (v ? new Date(v).toLocaleDateString('en-IN', dateOpts) : 'Never');
export const formatDateTime = (v) => new Date(v).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const formatShort    = (v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* ── Score badge ── */
export function ScoreBadge({ score }) {
  const [label, cls] =
    score >= 70
      ? ['Hot',  'bg-red-50 text-red-700 border border-red-100']
      : score >= 40
      ? ['Warm', 'bg-amber-50 text-amber-700 border border-amber-100']
      : ['Cold', 'bg-gray-100 text-gray-600 border border-gray-200'];
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {score} · {label}
    </span>
  );
}

/* ── Status badge ── */
export function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
      <span className="h-2 w-2 rounded-full" style={{ background: statusColors[status] }} />
      {status}
    </span>
  );
}

/* ── Follow-up badge ── */
const fuTones = {
  pending:   'bg-brand-50 text-brand-700 border border-brand-100',
  sending:   'bg-sky-50 text-sky-700 border border-sky-100',
  sent:      'bg-emerald-50 text-emerald-700 border border-emerald-100',
  failed:    'bg-red-50 text-red-700 border border-red-100',
  cancelled: 'bg-gray-100 text-gray-600 border border-gray-200',
};
export const FollowUpBadge = ({ status }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${fuTones[status] || fuTones.cancelled}`}>
    {status}
  </span>
);

/* ── Spinner ── */
export const Spinner = ({ className = 'py-16' }) => (
  <div className={`flex justify-center ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin text-brand-400" />
  </div>
);

/* ── Empty state ── */
export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {text && <p className="mt-1.5 max-w-sm text-sm text-gray-500 leading-relaxed">{text}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* ── Error banner ── */
export const ErrorBanner = ({ message }) =>
  message ? (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      {message}
    </div>
  ) : null;

/* ── Success banner ── */
export const SuccessBanner = ({ message }) =>
  message ? (
    <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      {message}
    </div>
  ) : null;

/* ── Form field ── */
export const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);

/* ── Stat card ── */
export function StatCard({ label, value, note, icon: Icon, accent = 'indigo' }) {
  const accentMap = {
    indigo: 'from-brand-500 to-purple-600 bg-brand-50 text-brand-600',
    green:  'from-emerald-500 to-teal-600 bg-emerald-50 text-emerald-600',
    amber:  'from-amber-500 to-orange-600 bg-amber-50 text-amber-600',
    red:    'from-red-500 to-pink-600 bg-red-50 text-red-600',
  };
  const [gradient, bg, text] = (accentMap[accent] || accentMap.indigo).split(' ');
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-float hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${text}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-gray-900">{value}</p>
      {note && <p className="mt-1.5 text-xs text-gray-400">{note}</p>}
    </div>
  );
}
