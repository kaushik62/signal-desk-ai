import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Users, ArrowDown, ArrowUp } from 'lucide-react';
import { api, errMsg } from '../api.js';
import LeadForm from '../components/LeadForm.jsx';
import {
  Spinner, Empty, ErrorBanner, ScoreBadge, StatusBadge, formatDate,
  panel, inputCls, btnPrimary, btnGhost, STATUSES, SOURCES,
} from '../components/ui.jsx';

export default function Leads() {
  const [filters, setFilters] = useState({ search: '', status: '', source: '', sort: 'score', order: 'desc', page: 1 });
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.search === search ? f : { ...f, search, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
    api.get('/leads', { params })
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(errMsg(e)));
  }, [filters]);
  useEffect(load, [load]);

  const change = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, page: 1 });
  const toggleSort = (sort) =>
    setFilters({ ...filters, sort, order: filters.sort === sort && filters.order === 'desc' ? 'asc' : 'desc', page: 1 });
  const remove = async (lead) => {
    if (!window.confirm(`Delete ${lead.name}? Their follow-ups will be deleted too.`)) return;
    try { await api.delete(`/leads/${lead.id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  const SortIcon = filters.order === 'asc' ? ArrowUp : ArrowDown;
  const sortBtn = (key, label) => (
    <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 font-medium hover:text-brand-600 transition-colors">
      {label} {filters.sort === key && <SortIcon className="h-3 w-3" />}
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className={`${inputCls} pl-10`}
            placeholder="Search name, email or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search leads"
            id="leads-search-input"
          />
        </div>
        <select className={`${inputCls} w-36`} value={filters.status} onChange={change('status')} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${inputCls} w-36`} value={filters.source} onChange={change('source')} aria-label="Filter by source">
          <option value="">All sources</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button id="add-lead-btn" className={btnPrimary} onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      <ErrorBanner message={error} />

      {/* Table */}
      <div className={`${panel} overflow-hidden`}>
        {!data ? (
          <Spinner />
        ) : data.leads.length === 0 ? (
          <Empty
            icon={Users}
            title={
              data.total === 0 && !filters.search && !filters.status && !filters.source
                ? 'No leads yet'
                : 'No leads match your filters'
            }
            text="Add a lead to start tracking your pipeline."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/80 text-xs text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                  <th className="px-5 py-3">{sortBtn('score', 'Score')}</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last contacted</th>
                  <th className="px-5 py-3">{sortBtn('created', 'Created')}</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.leads.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-gray-50/80">
                    <td className="px-5 py-3.5">
                      <Link to={`/app/leads/${l.id}`} className="font-medium hover:text-brand-600 transition-colors">{l.name}</Link>
                      <p className="text-xs text-gray-400 mt-0.5">{l.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{l.company || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500">{l.source}</td>
                    <td className="px-5 py-3.5"><ScoreBadge score={l.score} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(l.last_contacted_at)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(l.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditing(l)}
                          className="rounded-xl p-1.5 text-gray-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          aria-label={`Edit ${l.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(l)}
                          className="rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label={`Delete ${l.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3.5 text-sm text-gray-500">
            <span className="text-xs">{data.total} lead{data.total === 1 ? '' : 's'} · Page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <button className={btnGhost} disabled={data.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              <button className={btnGhost} disabled={data.page >= data.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <LeadForm
          lead={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
