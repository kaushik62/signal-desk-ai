import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../auth.jsx';
import { fieldErrors, errMsg } from '../api.js';
import { Field, ErrorBanner, inputCls, btnPrimary, panel } from '../components/ui.jsx';

export default function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(''); setErrors({});
    try {
      await (isRegister ? register(form) : login(form));
      navigate('/');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errMsg(err));
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} noValidate className={`${panel} w-full max-w-sm space-y-4 p-6`}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white"><Sparkles className="h-4 w-4" /></div>
          <h1 className="text-lg font-semibold">{isRegister ? 'Create your account' : 'Sign in'}</h1>
        </div>
        <ErrorBanner message={error} />
        {isRegister && <Field label="Full name" error={errors.name}><input className={inputCls} value={form.name} onChange={set('name')} autoComplete="name" /></Field>}
        <Field label="Email" error={errors.email}><input type="email" className={inputCls} value={form.email} onChange={set('email')} autoComplete="email" /></Field>
        <Field label="Password" error={errors.password}><input type="password" className={inputCls} value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        <p className="text-center text-sm text-gray-500">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <Link className="font-medium text-indigo-600" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
        </p>
      </form>
    </div>
  );
}
