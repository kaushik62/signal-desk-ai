import { User, Mail, Settings as SettingsIcon } from 'lucide-react';

import { useAuth } from '../auth.jsx';
import { panel } from '../components/ui.jsx';

export default function Settings() {
  const { user } = useAuth();

  const displayName = user?.name?.trim() || 'User';
  const displayEmail = user?.email || '—';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
          <SettingsIcon className="h-5 w-5 text-brand-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Settings
          </h1>

          <p className="mt-0.5 text-sm text-gray-500">
            Manage your profile and account preferences.
          </p>
        </div>
      </div>

      {/* Profile Information Card */}
      <section
        className={`${panel} overflow-hidden`}
        aria-labelledby="profile-heading"
      >
        {/* Card Header */}
        <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2
            id="profile-heading"
            className="flex items-center gap-2 text-base font-semibold text-gray-900"
          >
            <User className="h-5 w-5 text-brand-600" />
            Profile Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your personal account details.
          </p>
        </div>

        {/* Profile Details */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 text-2xl font-bold text-white shadow-md shadow-brand-600/20"
              role="img"
              aria-label={`Avatar for ${displayName}`}
            >
              {initial}
            </div>

            {/* Name and Email */}
            <div className="grid w-full flex-1 gap-5 sm:grid-cols-2">
              {/* Full Name */}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Full Name
                </p>

                <p className="mt-1.5 break-words text-sm font-semibold text-gray-900">
                  {displayName}
                </p>
              </div>

              {/* Email Address */}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Email Address
                </p>

                <p className="mt-1.5 flex items-center gap-2 break-all text-sm font-semibold text-gray-900">
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400">
        SignalDesk AI · Account Settings
      </p>
    </div>
  );
}