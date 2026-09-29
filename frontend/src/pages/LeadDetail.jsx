import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Pencil,
  Mail,
  CalendarClock,
  History,
  ArrowLeft,
  RefreshCw,
  Building2,
  FileText,
  Clock,
  UserRound,
  CheckCircle2,
} from 'lucide-react';

import { api, errMsg } from '../api.js';
import LeadForm from '../components/LeadForm.jsx';
import FollowUpList from '../components/FollowUpList.jsx';

import {
  Spinner,
  Empty,
  ErrorBanner,
  ScoreBadge,
  StatusBadge,
  formatDate,
  panel,
  btnPrimary,
  btnGhost,
} from '../components/ui.jsx';

function SectionHeader({ icon: Icon, title, description, count }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
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

      {typeof count === 'number' && (
        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {count}
        </span>
      )}
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </dt>

      <dd className="break-words text-sm font-medium text-gray-800">
        {children || '—'}
      </dd>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (!id) {
        setError('Lead ID is missing.');
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const response = await api.get(`/leads/${id}`);
        const result = response?.data;

        if (!result?.lead) {
          throw new Error('Lead could not be found.');
        }

        setData({
          lead: result.lead,
          followUps: Array.isArray(result.followUps)
            ? result.followUps
            : [],
        });
      } catch (err) {
        setError(
          errMsg(err) || 'Unable to load lead details. Please try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    let active = true;

    const fetchLead = async () => {
      setLoading(true);
      setError('');
      setData(null);

      try {
        if (!id) {
          throw new Error('Lead ID is missing.');
        }

        const response = await api.get(`/leads/${id}`);
        const result = response?.data;

        if (!result?.lead) {
          throw new Error('Lead could not be found.');
        }

        if (active) {
          setData({
            lead: result.lead,
            followUps: Array.isArray(result.followUps)
              ? result.followUps
              : [],
          });
        }
      } catch (err) {
        if (active) {
          setError(
            errMsg(err) || 'Unable to load lead details. Please try again.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLead();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-500">Loading lead details...</p>
      </div>
    );
  }

  if (!data?.lead) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-10">
        <ErrorBanner
          message={error || 'Unable to find this lead.'}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={refreshing}
            className={btnPrimary}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Try again
          </button>

          <Link to="/app/leads" className={btnGhost}>
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </Link>
        </div>
      </div>
    );
  }

  const { lead, followUps } = data;

  const status = String(lead.status || '');
  const canEmail = !['converted', 'lost'].includes(status.toLowerCase());

  const scheduled = followUps.filter(
    (followUp) => followUp.status === 'pending'
  );

  const history = followUps.filter(
    (followUp) => followUp.status !== 'pending'
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-8">
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/app/leads"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>

        <button
          type="button"
          onClick={() => load({ silent: true })}
          disabled={refreshing}
          className={btnGhost}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Lead profile */}
      <section className={`${panel} overflow-hidden p-0`}>
        <div className="border-b border-gray-100 bg-gradient-to-r from-brand-50/70 via-white to-white px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-gray-100">
                <UserRound className="h-7 w-7" />
              </div>

              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold tracking-tight text-gray-950">
                  {lead.name || 'Unnamed lead'}
                </h1>

                <p className="mt-1 break-all text-sm text-gray-500">
                  {lead.email || 'No email address'}
                </p>

                {lead.company && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-400">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">{lead.company}</span>
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={lead.status} />
                  <ScoreBadge score={lead.score} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={btnGhost}
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit lead
              </button>

              {canEmail && (
                <>
                  <Link
                    className={btnGhost}
                    to={`/app/leads/${lead.id}/compose`}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Schedule
                  </Link>

                  <Link
                    className={btnPrimary}
                    to={`/app/leads/${lead.id}/compose`}
                  >
                    <Mail className="h-4 w-4" />
                    Generate email
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lead details */}
        <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7 xl:grid-cols-4">
          <DetailItem label="Lead score">
            <ScoreBadge score={lead.score} />
          </DetailItem>

          <DetailItem label="Lead status">
            <StatusBadge status={lead.status} />
          </DetailItem>

          <DetailItem label="Acquisition source">
            {lead.source}
          </DetailItem>

          <DetailItem label="Last contacted">
            {formatDate(lead.last_contacted_at)}
          </DetailItem>
        </div>

        {lead.notes && (
          <div className="mx-5 mb-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 sm:mx-7 sm:mb-7">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />

              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Notes
              </h2>
            </div>

            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
              {lead.notes}
            </p>
          </div>
        )}

        {!canEmail && (
          <div className="mx-5 mb-5 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:mx-7 sm:mb-7">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-sm text-amber-800">
              Email actions are disabled for {status.toLowerCase()} leads.
            </p>
          </div>
        )}

        {canEmail && !lead.email && (
          <div className="mx-5 mb-5 rounded-xl border border-amber-100 bg-amber-50 p-4 sm:mx-7 sm:mb-7">
            <p className="text-sm font-medium text-amber-800">
              This lead has no email address.
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Add an email address before composing a follow-up.
            </p>
          </div>
        )}
      </section>

      {/* Follow-up sections */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <section className={`${panel} min-w-0 p-5 sm:p-6`}>
          <SectionHeader
            icon={CalendarClock}
            title="Scheduled follow-ups"
            description="Emails waiting to be sent."
            count={scheduled.length}
          />

          {scheduled.length > 0 ? (
            <FollowUpList
              items={scheduled}
              onChange={() => load({ silent: true })}
              showLead={false}
            />
          ) : (
            <Empty
              icon={CalendarClock}
              title="Nothing scheduled"
              text="Schedule a follow-up to keep this lead engaged."
            />
          )}
        </section>

        <section className={`${panel} min-w-0 p-5 sm:p-6`}>
          <SectionHeader
            icon={History}
            title="Follow-up history"
            description="Previously processed follow-ups."
            count={history.length}
          />

          {history.length > 0 ? (
            <FollowUpList
              items={history}
              onChange={() => load({ silent: true })}
              showLead={false}
            />
          ) : (
            <Empty
              icon={History}
              title="No follow-up history"
              text="Sent and completed follow-ups will appear here."
            />
          )}
        </section>
      </div>

      {/* Edit lead modal */}
      {editing && (
        <LeadForm
          lead={lead}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load({ silent: true });
          }}
        />
      )}

      <p className="pt-2 text-center text-xs text-gray-400">
        SignalDesk AI · Lead details
      </p>
    </div>
  );
}