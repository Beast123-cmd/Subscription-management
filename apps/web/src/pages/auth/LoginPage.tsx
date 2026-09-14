import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your work email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('SecretPassword123!');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-md">
          RO
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to your organization account on RevOps
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-xs sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />

            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="pt-2">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign in
              </Button>
            </div>
          </form>

          {/* Demo Quick Logins */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Quick Demo Personas</span>
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@acmepay.io')}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-left text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800">Admin</span>
                  <span className="text-slate-400 ml-1.5">admin@acmepay.io</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Full Access
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('billing@acmepay.io')}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-left text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800">Billing Manager</span>
                  <span className="text-slate-400 ml-1.5">billing@acmepay.io</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Billing & Subs
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@acmepay.io')}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-left text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800">Read-Only</span>
                  <span className="text-slate-400 ml-1.5">viewer@acmepay.io</span>
                </div>
                <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  View Only
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          RevOps Platform · Multi-tenant billing & revenue operations
        </p>
      </div>
    </div>
  );
}
