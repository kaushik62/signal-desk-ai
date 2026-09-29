import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useEffect, useRef, useState } from 'react';
import {
  Sparkles, Zap, Target, BarChart3, Mail, Users, ArrowRight, Check,
  Star, ChevronRight, Shield, Clock, TrendingUp, Menu, X,
} from 'lucide-react';

/* ── Tiny hook to animate number counting up ── */
function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = Date.now();
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        setValue(Math.floor(p * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return [value, ref];
}

/* ── Navigation bar ── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/95 backdrop-blur-xl shadow-lg border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <nav className="section flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="SignalDesk AI home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-glow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">SignalDesk AI</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to="/" className="btn-primary text-sm px-5 py-2">
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-4 py-2">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-gray-400 hover:text-white" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-gray-950/98 backdrop-blur-xl px-6 py-4 space-y-3">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#pricing', 'Pricing']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-300 hover:text-white py-2">{label}</a>
          ))}
          <div className="pt-3 flex flex-col gap-3">
            {user ? (
              <Link to="/" className="btn-primary justify-center">Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost justify-center text-gray-200 border-white/20 hover:bg-white/10">Sign in</Link>
                <Link to="/register" className="btn-primary justify-center">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ── Hero Section ── */
function HeroSection() {
  const { user } = useAuth();
  const [leadsV, leadsRef] = useCountUp(1240);
  const [rateV,  rateRef]  = useCountUp(68);
  const [timeV,  timeRef]  = useCountUp(4);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient pt-16">
      {/* Mesh / glow overlays */}
      <div className="pointer-events-none absolute inset-0 bg-mesh" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-brand-600/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="section relative z-10 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Lead Conversion
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-white animate-fade-up">
              Convert leads{' '}
              <span className="text-gradient">10× faster</span>{' '}
              with AI
            </h1>

            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl animate-fade-up animate-delay-100">
              SignalDesk AI scores, tracks, and sends perfectly-timed follow-ups for every lead — so your team closes more deals while doing less manual work.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-fade-up animate-delay-200">
              <Link
                to={user ? '/' : '/register'}
                id="hero-cta-primary"
                className="btn-primary text-base px-7 py-3.5"
              >
                {user ? 'Open Dashboard' : 'Start free today'}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                id="hero-cta-secondary"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/30"
              >
                See how it works
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </a>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-6 animate-fade-up animate-delay-300">
              <div className="flex -space-x-2">
                {['#6366f1','#8b5cf6','#06b6d4','#10b981'].map((c, i) => (
                  <div key={i} className="h-9 w-9 rounded-full border-2 border-gray-900 flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                    {['JD','AM','SK','RN'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array(5).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  <span className="ml-1.5 text-sm font-semibold text-white">4.9/5</span>
                </div>
                <p className="text-xs text-gray-500">from 200+ sales teams</p>
              </div>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative animate-fade-up animate-delay-200">
            <div className="animate-float">
              <div className="glass p-1 shadow-2xl shadow-brand-900/40">
                {/* Mockup header */}
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  <div className="ml-3 h-5 flex-1 rounded bg-white/10 text-xs text-gray-500 flex items-center px-2">app.signaldesk.ai</div>
                </div>

                {/* Mockup body */}
                <div className="p-4 space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Hot Leads',   val: leadsV, ref: leadsRef, color: 'from-brand-500 to-purple-500' },
                      { label: 'Conv. Rate',  val: `${rateV}%`, ref: rateRef,  color: 'from-emerald-500 to-teal-500' },
                      { label: 'Hours Saved', val: `${timeV}×`,  ref: timeRef,  color: 'from-amber-500 to-orange-500' },
                    ].map(({ label, val, ref, color }) => (
                      <div key={label} ref={ref} className="rounded-xl bg-white/5 border border-white/10 p-3">
                        <div className={`text-xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{val}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Leads table mockup */}
                  <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                      <span className="text-xs font-semibold text-white">Recent Leads</span>
                      <span className="text-[10px] text-brand-400 font-medium">View all →</span>
                    </div>
                    {[
                      { name: 'Arjun Mehta',   company: 'Razorpay',  score: 92, status: 'Hot',  color: 'bg-red-400' },
                      { name: 'Sneha Kumar',   company: 'Zepto',     score: 74, status: 'Warm', color: 'bg-amber-400' },
                      { name: 'Ravi Pillai',   company: 'Flipkart',  score: 61, status: 'Warm', color: 'bg-amber-400' },
                    ].map((l) => (
                      <div key={l.name} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
                        <div className="h-6 w-6 rounded-full bg-brand-600/30 flex items-center justify-center text-[9px] font-bold text-brand-300 shrink-0">
                          {l.name.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white truncate">{l.name}</div>
                          <div className="text-[9px] text-gray-500 truncate">{l.company}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${l.color}`} />
                          <span className="text-[9px] text-gray-400">{l.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI follow-up chip */}
                  <div className="flex items-center gap-2 rounded-xl bg-brand-600/20 border border-brand-500/30 px-3 py-2">
                    <div className="h-6 w-6 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-brand-200">AI Follow-up ready</div>
                      <div className="text-[9px] text-brand-400 truncate">Personalised email for Arjun Mehta generated</div>
                    </div>
                    <span className="shrink-0 text-[9px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-medium">Send</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating accent cards */}
            <div className="absolute -top-6 -right-6 glass px-4 py-3 shadow-float animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">+34% MoM</div>
                  <div className="text-[10px] text-gray-500">Conversion rate</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-6 glass px-4 py-3 shadow-float animate-float" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-brand-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">AI Generated</div>
                  <div className="text-[10px] text-gray-500">Follow-up sent ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features ── */
const features = [
  {
    icon: Target,
    title: 'AI Lead Scoring',
    desc: 'Every lead is scored 0–100 by our AI based on engagement, firmographics, and behaviour signals.',
    color: 'from-brand-500 to-purple-600',
    bg: 'bg-brand-50',
  },
  {
    icon: Mail,
    title: 'Smart Follow-ups',
    desc: 'AI writes hyper-personalised follow-up emails and schedules them at the perfect moment.',
    color: 'from-sky-500 to-cyan-600',
    bg: 'bg-sky-50',
  },
  {
    icon: BarChart3,
    title: 'Pipeline Analytics',
    desc: 'Visual dashboards show conversion trends, source ROI, and stale leads that need attention.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Users,
    title: 'Lead Management',
    desc: 'Centralise all leads with powerful search, filters, and status tracking in one clean interface.',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Clock,
    title: 'Follow-up Scheduling',
    desc: 'Set it and forget it. AI schedules follow-ups based on engagement and optimal sending windows.',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    desc: 'Enterprise-grade security with encrypted data storage, session management, and audit logs.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="section">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <Zap className="h-3.5 w-3.5" /> Everything you need
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            Built for modern{' '}
            <span className="text-gradient-dark">sales teams</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            From first touch to closed deal, SignalDesk AI automates the repetitive parts of sales so your team focuses on relationships.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div
              key={title}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-float hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${color}`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ── */
const steps = [
  { n: '01', title: 'Import your leads', desc: 'Add leads manually or import from any source. SignalDesk normalises and enriches your data automatically.' },
  { n: '02', title: 'AI scores & prioritises', desc: 'Our model analyses every signal and gives each lead a score from 0–100, surfacing the hottest opportunities first.' },
  { n: '03', title: 'AI writes follow-ups', desc: 'For each lead, the AI drafts a personalised follow-up email based on their profile and previous interactions.' },
  { n: '04', title: 'You review & convert', desc: 'Approve, edit, and send with one click. Watch your conversion rate climb while saving hours every week.' },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="section">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <ChevronRight className="h-3.5 w-3.5" /> Simple 4-step process
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            How <span className="text-gradient-dark">SignalDesk AI</span> works
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">Get from zero to automated follow-ups in under 10 minutes.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-brand-200 to-transparent z-0" />
              )}
              <div className="relative z-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-float hover:-translate-y-1 transition-all duration-300">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white font-bold text-lg shadow-glow-sm">
                  {n}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats Bar ── */
function StatsSection() {
  const stats = [
    { value: '10×', label: 'Faster follow-ups' },
    { value: '68%', label: 'Average conversion lift' },
    { value: '4 hrs', label: 'Saved per rep per week' },
    { value: '200+', label: 'Teams using SignalDesk' },
  ];
  return (
    <section className="py-20 bg-hero-gradient relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
      <div className="section relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl md:text-5xl font-extrabold text-gradient mb-2">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ── */
const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for solo sales reps getting started.',
    features: ['Up to 100 leads', 'AI lead scoring', '10 AI follow-ups/month', 'Basic analytics', 'Email support'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹2,499',
    period: '/mo',
    desc: 'For growing sales teams closing more deals.',
    features: ['Unlimited leads', 'Advanced AI scoring', 'Unlimited follow-ups', 'Full analytics suite', 'Priority support', 'Team collaboration', 'API access'],
    cta: 'Start Pro trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Tailored for large sales organisations.',
    features: ['Everything in Pro', 'Custom AI training', 'SSO & SAML', 'Dedicated success manager', 'SLA guarantees', 'Custom integrations'],
    cta: 'Contact sales',
    highlight: false,
  },
];

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="section">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <Star className="h-3.5 w-3.5" /> Simple pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">
            Plans for every <span className="text-gradient-dark">team size</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">Start free, scale as you grow. No hidden fees, no long-term contracts.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {plans.map(({ name, price, period, desc, features, cta, highlight }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                highlight
                  ? 'bg-hero-gradient border border-brand-500/30 shadow-glow scale-105 -mx-2'
                  : 'bg-white border border-gray-100 shadow-card hover:shadow-float hover:-translate-y-1'
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-gradient text-white text-xs font-bold px-4 py-1 rounded-full shadow-glow-sm">
                  Most Popular
                </div>
              )}
              <div className={`text-sm font-semibold mb-1 ${highlight ? 'text-brand-300' : 'text-brand-600'}`}>{name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={`text-4xl font-extrabold ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}</span>
                <span className={`text-sm ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{period}</span>
              </div>
              <p className={`text-sm mb-6 ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-brand-500/30' : 'bg-brand-50'}`}>
                      <Check className={`h-3 w-3 ${highlight ? 'text-brand-300' : 'text-brand-600'}`} />
                    </div>
                    <span className={highlight ? 'text-gray-300' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block w-full text-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  highlight
                    ? 'bg-white text-brand-700 hover:bg-gray-50 shadow-float'
                    : 'bg-brand-gradient text-white shadow-glow-sm hover:shadow-glow hover:scale-[1.02]'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ── */
function CtaSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="section">
        <div className="relative rounded-3xl bg-hero-gradient p-12 md:p-20 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-50" />
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-300">
              <Sparkles className="h-3.5 w-3.5" /> Start today, close tomorrow
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Ready to 10× your<br />
              <span className="text-gradient">conversion rate?</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Join hundreds of sales teams already using SignalDesk AI to close more deals with less effort.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base px-8 py-4">
                Get started for free <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10">
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-white/5">
      <div className="section py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient shadow-glow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">SignalDesk AI</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              AI-powered lead management and follow-up automation for modern sales teams.
            </p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} SignalDesk AI. All rights reserved.</p>
          <p className="text-xs text-gray-600">Made with ♥ for sales teams everywhere</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Page export ── */
export default function HomePage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      {/* <PricingSection /> */}
      <CtaSection />
      <Footer />
    </div>
  );
}
