import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import {
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  Target,
  Mail,
  BarChart3,
  Users,
  Clock3,
  ShieldCheck,
  Menu,
  X,
  Check,
  Zap,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
];

const features = [
  {
    icon: Target,
    title: 'Lead management',
    description:
      'Keep your leads organized with searchable records, clear statuses, and important customer notes.',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Sparkles,
    title: 'AI-powered assistance',
    description:
      'Generate personalized follow-up emails using lead information, notes, and your preferred tone.',
    color: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon: Clock3,
    title: 'Follow-up scheduling',
    description:
      'Schedule follow-ups, keep track of pending tasks, and stay on top of your sales pipeline.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: BarChart3,
    title: 'Pipeline analytics',
    description:
      'Understand your lead pipeline with clear summaries and conversion analytics.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: Users,
    title: 'Lead prioritization',
    description:
      'Use lead scores and statuses to identify which opportunities need your attention.',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: ShieldCheck,
    title: 'Account protection',
    description:
      'Keep your sales workflow organized with authenticated access to your account.',
    color: 'bg-rose-100 text-rose-700',
  },
];

const steps = [
  {
    number: '01',
    title: 'Add your leads',
    description:
      'Create lead records with contact details, source, status, and notes.',
  },
  {
    number: '02',
    title: 'Understand your pipeline',
    description:
      'Review lead statuses and scores to decide where to focus your attention.',
  },
  {
    number: '03',
    title: 'Generate follow-ups',
    description:
      'Use AI to draft a relevant email based on the lead’s information.',
  },
  {
    number: '04',
    title: 'Schedule and track',
    description:
      'Review your follow-ups and monitor progress from your dashboard.',
  },
];

function Brand({ compact = false }) {
  return (
    <Link
      to="/"
      aria-label="SignalDesk AI home"
      className="inline-flex items-center gap-2.5"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
        <Sparkles className="h-[18px] w-[18px] text-white" />
      </span>

      {!compact && (
        <span className="text-lg font-bold tracking-tight text-white">
          SignalDesk <span className="text-violet-300">AI</span>
        </span>
      )}
    </Link>
  );
}

function Navbar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled || menuOpen
          ? 'border-white/10 bg-slate-950/95 shadow-lg backdrop-blur-xl'
          : 'border-transparent bg-slate-950/40 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <div onClick={closeMenu}>
          <Brand />
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-violet-600/30"
              >
                Get started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </nav>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/10 bg-slate-950 px-5 py-5 md:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-2">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              {user ? (
                <Link
                  to="/app"
                  onClick={closeMenu}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  Open dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function DashboardPreview() {
  const leads = [
    { initials: 'AM', name: 'Arjun Mehta', status: 'Interested', color: 'bg-emerald-400' },
    { initials: 'SK', name: 'Sneha Kumar', status: 'Contacted', color: 'bg-amber-400' },
    { initials: 'RP', name: 'Ravi Pillai', status: 'New', color: 'bg-sky-400' },
  ];

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-8 rounded-[40px] bg-violet-600/20 blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

          <div className="ml-3 flex-1 rounded-md bg-white/5 px-3 py-1.5 text-[11px] text-slate-500">
            SignalDesk AI · Dashboard preview
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Workspace</p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Sales overview
              </h2>
            </div>

            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              All leads
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Total leads', value: '—', icon: Users },
              { label: 'Follow-ups', value: '—', icon: Mail },
              { label: 'Conversions', value: '—', icon: Target },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <Icon className="h-4 w-4 text-violet-300" />
                <p className="mt-3 text-xl font-bold text-white">{value}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">
                Recent leads
              </span>
              <span className="text-xs text-slate-500">Preview</span>
            </div>

            {leads.map((lead) => (
              <div
                key={lead.name}
                className="flex items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-200">
                  {lead.initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {lead.name}
                  </p>
                  <p className="text-xs text-slate-500">Lead record</p>
                </div>

                <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${lead.color}`} />
                  {lead.status}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-violet-400/20 bg-violet-500/10 p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
              <Sparkles className="h-4 w-4 text-violet-200" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-white">
                AI follow-up assistant
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Create a personalized follow-up based on your lead’s details.
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500">
            Illustrative preview · Not live customer data
          </p>
        </div>
      </div>

      <div className="absolute -right-3 top-20 hidden items-center gap-2 rounded-xl border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl sm:flex lg:-right-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
          <Check className="h-4 w-4 text-emerald-300" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">Stay organized</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Every lead in one place
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const { user } = useAuth();

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 pt-28 text-white sm:pt-2 lg:min-h-[760px]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(124,58,237,0.22),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.16),transparent_40%)]" />

      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-12 sm:px-8 sm:pb-28 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-28">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-200 sm:text-sm">
            <Sparkles className="h-4 w-4" />
            Your smarter Leads workspace
          </div>

          <h1 className="text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
            Turn more leads into
            <span className="mt-1 block bg-gradient-to-r from-violet-300 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
              meaningful conversations.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
            Manage leads, generate personalized follow-up emails with AI, and
            keep your sales pipeline moving—all from one simple workspace.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              to={user ? '/app' : '/register'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:shadow-violet-600/30"
            >
              {user ? 'Open dashboard' : 'Get started for free'}
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              Explore features
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-400">
            {[
              'Organize your leads',
              'AI-assisted emails',
              'Track follow-ups',
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative isolate scroll-mt-24 overflow-hidden bg-slate-50 py-24 sm:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        {/* Section heading */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-700 shadow-sm">
            <Zap className="h-4 w-4" />
            Everything you need to grow
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Turn more leads into
            <span className="mt-2 block bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              lasting customers.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            From your first interaction to the final conversion, manage every
            lead and follow-up in one streamlined workspace.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description, color }, index) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-900/[0.08] sm:p-8"
            >
              {/* Hover accent */}
              <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-violet-600 to-indigo-500 transition-transform duration-300 group-hover:scale-x-100" />

              {/* Decorative background */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative">
                <div
                  className={`mb-7 flex h-14 w-14 items-center justify-center rounded-2xl ${color} ring-1 ring-black/[0.03] transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
                  {description}
                </p>

              </div>
            </article>
          ))}
        </div>

        {/* Bottom highlight */}
        <div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-sm sm:flex-row sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Zap className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Less busywork. More meaningful conversations.
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Keep your leads organized and your next steps clear.
              </p>
            </div>
          </div>

          <a
            href="/register"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 hover:bg-violet-700 sm:w-auto"
          >
            Get started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-y border-slate-200/70 bg-slate-50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-4 py-2 text-sm font-semibold text-violet-700">
            <Zap className="h-4 w-4" />
            A straightforward workflow
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            From new lead to
            <span className="block text-violet-700">next action.</span>
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-500 sm:text-lg">
            Keep your sales process organized with a workflow your team can
            follow.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ number, title, description }) => (
            <article
              key={number}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-sm font-bold tracking-widest text-violet-600">
                STEP {number}
              </span>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const { user } = useAuth();

  return (
    <section className="bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-20 shadow-2xl shadow-violet-950/10 sm:px-12 sm:py-24 lg:px-20">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_55%)]" />

            <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />

            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute right-8 top-8 hidden h-20 w-20 rotate-12 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm sm:block lg:right-16 lg:top-12">
            <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-violet-400" />
            <div className="absolute bottom-4 right-4 h-8 w-8 rounded-lg border border-violet-400/20" />
          </div>

          <div className="pointer-events-none absolute bottom-10 left-10 hidden h-12 w-12 rounded-full border border-indigo-300/20 sm:block" />

          {/* Content */}
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200 shadow-lg shadow-violet-950/20">
              <Sparkles className="h-4 w-4" />
              Your next customer starts here
            </div>

            <h2 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Make every lead
              <span className="mt-2 block bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                count.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Bring your leads, follow-ups, and sales workflow together.
              Let SignalDesk AI help you stay organized and focus on
              conversations that move your business forward.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to={user ? "/app" : "/register"}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:bg-violet-50 hover:shadow-violet-500/10 sm:w-auto"
              >
                {user ? "Open your dashboard" : "Get started for free"}

                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {!user && (
                <Link
                  to="/login"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10 sm:w-auto"
                >
                  Sign in
                </Link>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Keep leads organized
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />

              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                Simplify follow-ups
              </span>

              <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:block" />

              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Stay on top of sales
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
              A focused workspace for lead management and AI-assisted sales
              follow-ups.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <a
              href="#features"
              className="transition hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How it works
            </a>
            <Link
              to="/login"
              className="transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="transition hover:text-white"
            >
              Get started
            </Link>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} SignalDesk AI. All rights reserved.
          </p>
          <p>Built to make sales workflows simpler.</p>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}