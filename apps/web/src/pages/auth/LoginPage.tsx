import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) { event.preventDefault(); if (pending) return; setPending(true); setError(''); try { await login(email.trim(), password); navigate('/select-organization', { replace: true }); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to sign in.'); } finally { setPending(false); } }
  return <main className="login-layout">
    <aside className="login-panel" aria-label="RevOps product information"><div className="login-brand"><span className="brand-mark">R</span><span>RevOps</span></div><div className="login-statement"><p className="login-kicker">REVENUE OPERATIONS</p><h1>Built for the<br />work behind revenue.</h1><p>One workspace for the commercial records your team relies on: customers, contracts, invoices and settlement.</p></div><div className="login-proof" aria-label="Workspace features"><div><span>01</span><strong>Clear records</strong><p>Commercial data that stays connected.</p></div><div><span>02</span><strong>Controlled access</strong><p>Roles keep sensitive work in the right hands.</p></div><div><span>03</span><strong>Reliable billing</strong><p>Every financial action has a clear state.</p></div></div><p className="login-footnote">RevOps · Revenue workspace</p></aside>
    <section className="login-form-area"><div className="login-form-wrap"><div className="login-mobile-brand"><span className="brand-mark">R</span><span>RevOps</span></div><p className="login-kicker login-kicker-light">SECURE SIGN IN</p><h2>Welcome back</h2><p className="login-intro">Use your organization account to continue.</p><form className="mt-8 space-y-5" onSubmit={submit}><Input label="Work email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" disabled={pending} /><div><Input label="Password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} /><button className="password-visibility" type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}{visible ? 'Hide password' : 'Show password'}</button></div>{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p>}<Button type="submit" size="lg" className="w-full" isLoading={pending} rightIcon={<ArrowRight size={18} />}>Sign in</Button></form><div className="login-security"><ShieldCheck size={17} /><span>Your role and organization access are verified after sign in.</span></div><p className="login-support">Need help? Contact your organization administrator.</p></div></section>
  </main>;
}
