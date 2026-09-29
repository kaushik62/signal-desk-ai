import { useEffect, useState } from 'react';
import { X, UserRound, Mail, FileText } from 'lucide-react';
import { api, errMsg, fieldErrors } from '../api.js';
import {
  Field,
  ErrorBanner,
  inputCls,
  btnPrimary,
  btnGhost,
  STATUSES,
  SOURCES,
} from './ui.jsx';

export default function LeadForm({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lead?.name ?? '',
    email: lead?.email ?? '',
    source: lead?.source ?? 'Website',
    status: lead?.status ?? 'New',
    notes: lead?.notes ?? '',
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && !busy) {
        onClose?.();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [busy, onClose]);

  const set = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      return next;
    });

    setError('');
  };

  const validate = () => {
    const nextErrors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const notes = form.notes.trim();

    if (!name) {
      nextErrors.name = 'Full name is required.';
    } else if (name.length > 100) {
      nextErrors.name = 'Name must be 100 characters or fewer.';
    }

    if (!email) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    } else if (email.length > 254) {
      nextErrors.email = 'Email must be 254 characters or fewer.';
    }

    if (!notes) {
      nextErrors.notes = 'Notes are required.';
    } else if (notes.length > 5000) {
      nextErrors.notes = 'Notes must be 5000 characters or fewer.';
    }

    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    setError('');

    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      source: form.source,
      status: form.status,
      notes: form.notes.trim(),
    };

    setBusy(true);

    try {
      const response = lead
        ? await api.put(`/leads/${lead.id}`, payload)
        : await api.post('/leads', payload);

      onSaved?.(response.data);
    } catch (err) {
      setErrors(fieldErrors(err) ?? {});
      setError(errMsg(err) || 'Unable to save this lead. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (!busy) onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
      role="presentation"
    >
      <form
        onSubmit={submit}
        noValidate
        onMouseDown={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
        aria-labelledby="lead-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Lead management
            </p>

            <h2
              id="lead-form-title"
              className="mt-1 text-xl font-semibold tracking-tight text-slate-900"
            >
              {lead ? 'Edit lead' : 'Add a new lead'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {lead
                ? 'Update the contact information below.'
                : 'Add a contact to your sales pipeline.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <ErrorBanner message={error} />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Contact information
              </h3>
            </div>

            <Field label="Full name *" error={errors.name}>
              <input
                type="text"
                name="name"
                autoComplete="name"
                autoFocus
                required
                maxLength={100}
                placeholder="e.g. Rahul Sharma"
                className={inputCls}
                value={form.name}
                onChange={set('name')}
                aria-invalid={Boolean(errors.name)}
              />
            </Field>

            <Field label="Email address *" error={errors.email}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="rahul@example.com"
                className={inputCls}
                value={form.email}
                onChange={set('email')}
                aria-invalid={Boolean(errors.email)}
              />
            </Field>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Lead details
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Lead source" error={errors.source}>
                <select
                  name="source"
                  className={inputCls}
                  value={form.source}
                  onChange={set('source')}
                  aria-invalid={Boolean(errors.source)}
                >
                  {SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lead status" error={errors.status}>
                <select
                  name="status"
                  className={inputCls}
                  value={form.status}
                  onChange={set('status')}
                  aria-invalid={Boolean(errors.status)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-slate-900">
                Notes *
              </h3>
              <span className="text-xs text-slate-400">Required</span>
            </div>

            <Field label="Additional information *" error={errors.notes}>
              <textarea
                name="notes"
                rows={5}
                required
                maxLength={5000}
                placeholder="Add the lead's requirements, budget, interests, or next steps..."
                className={`${inputCls} min-h-28 resize-y`}
                value={form.notes}
                onChange={set('notes')}
                aria-invalid={Boolean(errors.notes)}
              />

              <p className="mt-1.5 text-right text-xs text-slate-400">
                {form.notes.length}/5000
              </p>
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <p className="hidden text-xs text-slate-500 sm:block">
            * Required fields
          </p>

          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={handleClose}
              disabled={busy}
            >
              Cancel
            </button>

            <button
              type="submit"
              className={btnPrimary}
              disabled={busy}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Saving...
                </span>
              ) : lead ? (
                'Save changes'
              ) : (
                'Create lead'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}