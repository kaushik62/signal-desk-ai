import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  Zap,
  Target,
  BarChart3,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

import { useAuth } from '../auth.jsx';
import { fieldErrors, errMsg } from '../api.js';

/* ── Reusable form field ── */
function FormField({ label, htmlFor, error, children }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700"
      >
        {label}
      </label>

      {children}

      {error && (
        <p
          id={`${htmlFor}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-red-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Brand panel ── */
function BrandPanel({ isRegister }) {
  const points = [
    {
      icon: Target,
      text: 'AI scores every lead 0–100 automatically',
    },
    {
      icon: Zap,
      text: 'Generate personalised follow-ups in seconds',
    },
    {
      icon: BarChart3,
      text: 'Track conversions with live analytics',
    },
  ];

  return (
    <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-hero-gradient p-12 lg:flex xl:p-16">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />

      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />

      {/* Logo */}
      <div className="relative z-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          <span className="text-lg font-bold tracking-tight text-white">
            SignalDesk AI
          </span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8">
        <div>
          <h2 className="mb-3 whitespace-pre-line text-4xl font-extrabold leading-tight text-white">
            {isRegister
              ? 'Join the future of sales'
              : 'Welcome back,\nsales champion'}
          </h2>

          <p className="text-base leading-relaxed text-gray-400">
            {isRegister
              ? 'Turn your leads into revenue with the power of AI. Start closing more deals today.'
              : 'Your leads are waiting. Sign in to see your pipeline and pick up where you left off.'}
          </p>
        </div>

        <ul className="space-y-4">
          {points.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10">
                <Icon className="h-4 w-4 text-brand-300" />
              </div>

              <span className="text-sm text-gray-300">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-xs text-gray-600">
        © {new Date().getFullYear()} SignalDesk AI · All rights reserved
      </div>
    </div>
  );
}

/* ── Authentication page ── */
export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const isRegister = mode === 'register';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Redirect authenticated users
  if (user) {
    return <Navigate to="/app" replace />;
  }

  /* ── Handle input changes ── */
  const set = (key) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    setError('');
  };

  /* ── Validate form ── */
  const validate = () => {
    const nextErrors = {};
    const email = form.email.trim();

    if (isRegister && !form.name.trim()) {
      nextErrors.name = 'Please enter your name.';
    } else if (
      isRegister &&
      form.name.trim().length > 100
    ) {
      nextErrors.name = 'Name must be 100 characters or fewer.';
    }

    if (!email) {
      nextErrors.email = 'Please enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      nextErrors.password = 'Please enter your password.';
    } else if (
      isRegister &&
      form.password.length < 8
    ) {
      nextErrors.password =
        'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /* ── Submit form ── */
  const submit = async (event) => {
    event.preventDefault();

    if (busy || !validate()) return;

    setBusy(true);
    setError('');

    try {
      const payload = {
        ...(isRegister
          ? { name: form.name.trim() }
          : {}),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      if (isRegister) {
        await register(payload);
      } else {
        await login(payload);
      }

      navigate('/app', { replace: true });
    } catch (err) {
      try {
        setErrors(fieldErrors(err) || {});
      } catch {
        setErrors({});
      }

      setError(
        errMsg(err) ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:block">
        <BrandPanel isRegister={isRegister} />
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen w-full flex-col justify-center px-5 py-10 sm:px-10 lg:px-12 xl:px-20">
        {/* Mobile logo */}
        <Link
          to="/"
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <span className="text-base font-bold text-gray-900">
            SignalDesk AI
          </span>
        </Link>

        <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 sm:p-9">
          {/* Back to home */}
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-gray-950">
              {isRegister
                ? 'Create your account'
                : 'Sign in to SignalDesk'}
            </h1>

            <p className="text-sm text-gray-500">
              {isRegister
                ? 'Start converting leads with AI in minutes'
                : 'Enter your credentials to access your dashboard'}
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={submit}
            noValidate
            className="space-y-5"
          >
            {/* Name */}
            {isRegister && (
              <FormField
                label="Full name"
                htmlFor="field-name"
                error={errors.name}
              >
                <input
                  id="field-name"
                  type="text"
                  className="input w-full transition-shadow focus:ring-2 focus:ring-brand-500/20"
                  value={form.name}
                  onChange={set('name')}
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  maxLength={100}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name
                      ? 'field-name-error'
                      : undefined
                  }
                />
              </FormField>
            )}

            {/* Email */}
            <FormField
              label="Email address"
              htmlFor="field-email"
              error={errors.email}
            >
              <input
                id="field-email"
                type="email"
                className="input w-full transition-shadow focus:ring-2 focus:ring-brand-500/20"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
                placeholder="you@company.com"
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={
                  errors.email
                    ? 'field-email-error'
                    : undefined
                }
              />
            </FormField>

            {/* Password */}
            <FormField
              label="Password"
              htmlFor="field-password"
              error={errors.password}
            >
              <div className="relative">
                <input
                  id="field-password"
                  type={showPass ? 'text' : 'password'}
                  className="input w-full pr-11 transition-shadow focus:ring-2 focus:ring-brand-500/20"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete={
                    isRegister
                      ? 'new-password'
                      : 'current-password'
                  }
                  placeholder={
                    isRegister
                      ? 'At least 8 characters'
                      : 'Enter your password'
                  }
                  required
                  minLength={isRegister ? 8 : undefined}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? 'field-password-error'
                      : undefined
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={
                    showPass ? 'Hide password' : 'Show password'
                  }
                  aria-pressed={showPass}
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormField>

            {/* Forgot password */}
            {!isRegister && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="btn-primary flex w-full items-center justify-center rounded-xl py-3.5 text-base shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={busy}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Please wait…
                </span>
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch login/register */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isRegister
              ? 'Already have an account?'
              : "Don't have an account yet?"}{' '}

            <Link
              id="auth-switch-link"
              to={isRegister ? '/login' : '/register'}
              className="font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              {isRegister ? 'Sign in' : 'Get started free'}
            </Link>
          </p>

          {/* Trust badges */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            {[
              'No credit card',
              'Free tier forever',
              'Setup in 2 min',
            ].map((text) => (
              <span
                key={text}
                className="flex items-center gap-1"
              >
                <Check className="h-3 w-3 text-emerald-500" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}