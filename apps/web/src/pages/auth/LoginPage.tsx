import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Layers, ShieldCheck } from 'lucide-react';
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
  return <main className="login-layout">
    <section className="login-story" aria-label="About RevOps">
      <div className="flex items-center gap-3 text-lg font-semibold"><span className="brand-mark"><Layers size={22} /></span> RevOps</div>
      <div className="login-story-copy"><p className="eyebrow">THE BUSINESS OF RECURRING</p><h1>More clarity.<br />Less busywork.</h1><p className="mt-6 max-w-md text-lg leading-relaxed text-indigo-100">Your customers, subscriptions and billing.<br className="hidden lg:block" /> One considered workspace.</p>
      <div className="login-path" aria-label="From customer to payment"><span>01 <b>Connect</b></span><span>02 <b>Bill</b></span><span>03 <b>Grow</b></span></div></div>
      <p className="text-sm text-indigo-200">Built for the people behind the numbers.</p>
    </section>
    <section className="login-entry">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-indigo-600">YOUR WORKSPACE AWAITS</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Welcome back.</h2>
        <p className="mt-3 mb-8 text-base leading-relaxed text-slate-600">Sign in with your work account to pick up where you left off.</p>
        <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); if(pending) return; setPending(true); setError(''); try { await login(email.trim(), password); navigate('/select-organization', { replace: true }); } catch(failure) { setError(failure instanceof Error ? failure.message : 'Unable to sign in.'); } finally { setPending(false); } }}>
          <Input label="Work email" type="email" autoComplete="username" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com" disabled={pending} />
          <div><Input label="Password" type={visible?'text':'password'} autoComplete="current-password" required value={password} onChange={(e)=>setPassword(e.target.value)} disabled={pending} />
          <button className="mt-2 flex min-h-8 items-center gap-2 text-sm text-slate-600" type="button" aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={16}/>:<Eye size={16}/>} {visible?'Hide':'Show'} password</button></div>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <Button type="submit" size="lg" className="w-full" isLoading={pending} rightIcon={<ArrowRight size={18}/>}>Sign in</Button>
        </form>
        <div className="mt-8 border-t border-slate-200 pt-5"><div className="flex gap-2 text-sm text-slate-600"><ShieldCheck size={18} className="shrink-0 text-indigo-600"/><p>Your account determines your role and workspace access.</p></div><p className="mt-4 text-sm text-slate-500">Need access or help signing in? Contact your organization administrator.</p></div>
      </div>
    </section>
  </main>;
}
