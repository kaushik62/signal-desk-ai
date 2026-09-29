import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Send,
  CalendarClock,
  ArrowLeft,
  UserRound,
  Building2,
  Mail,
  FileText,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

import { api, errMsg, fieldErrors } from '../api.js';

import {
  Spinner,
  ErrorBanner,
  SuccessBanner,
  Field,
  ScoreBadge,
  StatusBadge,
  panel,
  inputCls,
  btnPrimary,
  btnGhost,
} from '../components/ui.jsx';

function getLocalDateTimeMin() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 16);
}

function isValidDateTime(value) {
  if (!value) return false;

  const date = new Date(value);

  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export default function Compose() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loadingLead, setLoadingLead] = useState(true);

  const [tone, setTone] = useState('Professional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [when, setWhen] = useState('');

  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const hasDraft = Boolean(subject.trim() || body.trim());
  const hasValidDraft = Boolean(subject.trim() && body.trim());
  const isBusy = Boolean(busy);

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setErrors({});
  };

  const fetchLead = useCallback(async () => {
    if (!id) {
      setError('Lead ID is missing.');
      setLoadingLead(false);
      return;
    }

    setLoadingLead(true);
    setError('');

    try {
      const response = await api.get(`/leads/${id}`);
      const fetchedLead = response?.data?.lead;

      if (!fetchedLead) {
        throw new Error('Lead information could not be found.');
      }

      setLead(fetchedLead);
    } catch (err) {
      setError(
        errMsg(err) || 'Unable to load lead information. Please try again.'
      );
    } finally {
      setLoadingLead(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const generate = async () => {
    if (!id || isBusy) return;

    clearMessages();
    setBusy('generate');

    try {
      const response = await api.post('/ai/generate-email', {
        leadId: id,
        tone,
      });

      const generatedSubject = response?.data?.subject;
      const generatedBody = response?.data?.body;

      if (!generatedSubject || !generatedBody) {
        throw new Error(
          'The AI response was incomplete. Please try generating again.'
        );
      }

      setSubject(generatedSubject);
      setBody(generatedBody);
      setSuccess('Email draft generated successfully.');
    } catch (err) {
      setError(
        errMsg(err) || 'Unable to generate the email. Please try again.'
      );
    } finally {
      setBusy('');
    }
  };

  const submit = async (scheduledAt) => {
    if (!id || isBusy) return;

    clearMessages();

    const nextErrors = {};

    if (!subject.trim()) {
      nextErrors.subject = 'Subject line is required.';
    }

    if (!body.trim()) {
      nextErrors.emailBody = 'Email body is required.';
    }

    if (scheduledAt !== undefined && scheduledAt !== null) {
      const scheduledDate = new Date(scheduledAt);

      if (
        !when ||
        Number.isNaN(scheduledDate.getTime()) ||
        scheduledDate.getTime() <= Date.now()
      ) {
        nextErrors.scheduledAt = 'Choose a future date and time.';
      }
    }

    if (scheduledAt === null) {
      nextErrors.scheduledAt = 'Choose a date and time.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const isScheduled = scheduledAt !== undefined;

    setBusy(isScheduled ? 'schedule' : 'send');

    try {
      await api.post('/follow-ups', {
        leadId: id,
        subject: subject.trim(),
        emailBody: body.trim(),
        scheduledAt,
      });

      setSuccess(
        isScheduled
          ? 'Follow-up scheduled successfully.'
          : 'Email queued for sending.'
      );

      // Prevent another submission while navigating.
      setBusy('success');

      window.setTimeout(() => {
        navigate(`/app/leads/${id}`);
      }, 1000);
    } catch (err) {
      setErrors(fieldErrors(err) || {});
      setError(
        errMsg(err) ||
        `Unable to ${isScheduled ? 'schedule' : 'send'} the follow-up.`
      );
      setBusy('');
    }
  };

  if (loadingLead) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-500">Loading lead information...</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10">
        <ErrorBanner message={error || 'Lead not found.'} />

        <Link to="/app/leads" className={btnGhost}>
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-8">
      {/* Page header */}
      <div className="space-y-4">
        <Link
          to={`/app/leads/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lead
        </Link>

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Sparkles className="h-5 w-5" />
              </span>

              <h1 className="text-2xl font-bold tracking-tight text-gray-950">
                Compose follow-up
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Create a personalized email and send it or schedule it for later.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-1.5 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-600">
              {hasDraft ? 'Draft in progress' : 'New email'}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Lead information */}
        <aside className={`${panel} overflow-hidden p-0`}>
          <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-gray-900">
              Lead information
            </h2>

            <p className="mt-1 text-xs text-gray-400">
              Personalize your message for this contact.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <UserRound className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <Link
                  to={`/app/leads/${lead.id}`}
                  className="break-words font-semibold text-gray-900 transition-colors hover:text-brand-600"
                >
                  {lead.name || 'Unnamed lead'}
                </Link>

                <p className="mt-1 break-all text-sm text-gray-500">
                  {lead.email || 'No email address'}
                </p>
              </div>
            </div>

            {lead.company && (
              <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <Building2 className="h-4 w-4 shrink-0 text-gray-400" />

                <span className="break-words text-sm text-gray-700">
                  {lead.company}
                </span>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Lead status
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={lead.status} />
                <ScoreBadge score={lead.score} />
              </div>
            </div>

            {lead.notes && (
              <div className="border-t border-gray-100 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Notes
                  </p>
                </div>

                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">
                  {lead.notes}
                </p>
              </div>
            )}

            {!lead.email && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Email address missing
                </p>

                <p className="mt-1 text-xs leading-relaxed text-amber-700">
                  Add an email address to this lead before sending a follow-up.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Email composer */}
        <section className={`${panel} min-w-0 overflow-hidden p-0 lg:col-span-2`}>
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Email composer
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                Write your message or generate a draft with AI.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 sm:self-auto">
              <Sparkles className="h-3.5 w-3.5" />
              AI assisted
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* AI controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-52">
                <Field label="Email tone">
                  <select
                    className={inputCls}
                    value={tone}
                    onChange={(event) => setTone(event.target.value)}
                    disabled={isBusy}
                  >
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                  </select>
                </Field>
              </div>

              <button
                type="button"
                className={`${btnPrimary} w-full justify-center sm:w-auto`}
                onClick={generate}
                disabled={isBusy}
              >
                {busy === 'generate' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : hasDraft ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}

                {busy === 'generate'
                  ? 'Generating...'
                  : hasDraft
                    ? 'Regenerate draft'
                    : 'Generate with AI'}
              </button>
            </div>

            {/* Recipient */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500">
                To
              </label>

              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />

                <span className="min-w-0 break-all text-sm text-gray-700">
                  {lead.email || 'No email address'}
                </span>
              </div>
            </div>

            {/* Subject */}
            <Field label="Subject line" error={errors.subject}>
              <input
                type="text"
                className={inputCls}
                value={subject}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    subject: undefined,
                  }));
                  setError('');
                  setSuccess('');
                }}
                maxLength={200}
                placeholder="Enter email subject..."
                disabled={isBusy}
              />
            </Field>

            {/* Body */}
            <Field label="Email body" error={errors.emailBody}>
              <textarea
                rows={12}
                className={`${inputCls} min-h-64 resize-y leading-relaxed`}
                value={body}
                onChange={(event) => {
                  setBody(event.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    emailBody: undefined,
                  }));
                  setError('');
                  setSuccess('');
                }}
                placeholder="Write your email here, or generate a personalized draft with AI..."
                disabled={isBusy}
              />
            </Field>

            <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
              <span>Review your message before sending.</span>
              <span>{body.length} characters</span>
            </div>

            {/* Actions */}
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <button
                  type="button"
                  className={`${btnPrimary} w-full justify-center sm:w-auto`}
                  disabled={
                    isBusy ||
                    !hasValidDraft ||
                    !lead.email
                  }
                  onClick={() => submit(undefined)}
                >
                  {busy === 'send' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}

                  {busy === 'send' ? 'Sending...' : 'Send now'}
                </button>

                <div className="w-full sm:flex-1 sm:min-w-56">
                  <Field
                    label="Schedule for later"
                    error={errors.scheduledAt}
                  >
                    <input
                      type="datetime-local"
                      className={inputCls}
                      value={when}
                      min={getLocalDateTimeMin()}
                      onChange={(event) => {
                        setWhen(event.target.value);
                        setErrors((previous) => ({
                          ...previous,
                          scheduledAt: undefined,
                        }));
                        setError('');
                        setSuccess('');
                      }}
                      disabled={isBusy}
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  className={`${btnGhost} w-full justify-center sm:w-auto`}
                  disabled={
                    isBusy ||
                    !hasValidDraft ||
                    !lead.email ||
                    !when
                  }
                  onClick={() => {
                    if (!isValidDateTime(when)) {
                      setErrors({
                        scheduledAt: 'Choose a future date and time.',
                      });
                      return;
                    }

                    submit(new Date(when).toISOString());
                  }}
                >
                  {busy === 'schedule' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}

                  {busy === 'schedule'
                    ? 'Scheduling...'
                    : 'Schedule follow-up'}
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />

                <p className="text-xs leading-relaxed text-gray-500">
                  Sending queues the email for delivery. Scheduling creates a
                  follow-up for the selected future date and time.
                </p>
              </div>

              {success && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400">
        SignalDesk AI · Personalized lead follow-ups
      </p>
    </div>
  );
}