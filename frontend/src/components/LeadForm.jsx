import { useState } from 'react';
import { X } from 'lucide-react';
import { api, errMsg, fieldErrors } from '../api.js';
import { Field, ErrorBanner, inputCls, btnPrimary, btnGhost, STATUSES, SOURCES } from './ui.jsx';

export default function LeadForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lead?.name ?? '', email: lead?.email ?? '', company: lead?.company ?? '',
    source: lead?.source ?? 'Website', status: lead?.status ?? 'New', notes: lead?.notes ?? '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const local = validate();
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true); setError('');
    try {
      const res = lead ? await api.put(`/leads/${lead.id}`, form) : await api.post('/leads', form);
      onSaved(res.data);
    } catch (e) {
      setErrors(fieldErrors(e)); setError(errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-gray-900/40" onClick={onClose}>
      <form onSubmit={submit} noValidate onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold">{lead ? 'Edit lead' : 'Add lead'}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <ErrorBanner message={error} />
          <Field label="Full name" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} autoFocus /></Field>
          <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
          <Field label="Company (optional)" error={errors.company}><input className={inputCls} value={form.company} onChange={set('company')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" error={errors.source}><select className={inputCls} value={form.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Status" error={errors.status}><select className={inputCls} value={form.status} onChange={set('status')}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label="Notes (optional)" error={errors.notes}>
            <textarea rows={5} className={inputCls} value={form.notes} onChange={set('notes')} placeholder="Budget, property requirements, business needs…" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={busy}>{busy ? 'Saving…' : lead ? 'Save changes' : 'Add lead'}</button>
        </div>
      </form>
    </div>
  );
}
