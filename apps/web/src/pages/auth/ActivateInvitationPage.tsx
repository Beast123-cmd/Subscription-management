import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';

export function ActivateInvitationPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const token = params.get('token') ?? '';
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (pending) return; if (password !== confirmation) return setError('Passwords do not match.');
    setPending(true); setError('');
    try { const session = await apiClient.activateInvitation({ token, password }); localStorage.setItem('revops_auth_token', session.accessToken); localStorage.setItem('revops_active_org_id', session.activeOrganizationId ?? ''); window.location.assign('/app/dashboard'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to activate this invitation.'); setPending(false); }
  }
  return <main className="login-layout"><aside className="login-panel" aria-label="RevOps account activation"><div className="login-brand"><span className="brand-mark">R</span><span>RevOps</span></div><div className="login-statement"><p className="login-kicker">ACCOUNT ACTIVATION</p><h1>Your workspace<br />is ready.</h1><p>Set a strong password to activate your organization account and begin working.</p></div></aside><section className="login-form-area"><div className="login-form-wrap"><p className="login-kicker login-kicker-light">SECURE ACTIVATION</p><h2>Set your password</h2><p className="login-intro">This link is single-use and expires after seven days.</p><form className="mt-8 space-y-5" onSubmit={submit}><Input label="New password" type="password" autoComplete="new-password" minLength={12} required disabled={pending || !token} value={password} onChange={(event) => setPassword(event.target.value)} helperText="Use at least 12 characters." /><Input label="Confirm password" type="password" autoComplete="new-password" minLength={12} required disabled={pending || !token} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p>}<Button type="submit" size="lg" className="w-full" isLoading={pending} disabled={!token} rightIcon={<ArrowRight size={18} />}>Activate account</Button></form><div className="login-security"><ShieldCheck size={17} /><span>Your access follows the role assigned by your administrator.</span></div></div></section></main>;
}
