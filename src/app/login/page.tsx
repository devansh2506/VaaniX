'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Wordmark } from '@/components/layout/wordmark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/app';
  const initialError = searchParams.get('error');

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);
  const [sentMessage, setSentMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    initialError === 'auth_callback_failed'
      ? 'Authentication failed. Please try signing in again.'
      : initialError
  );

  const supabase = createClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSentMessage(null);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSentMessage(`We sent a temporary sign-in link to ${email}. Check your inbox to continue.`);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setErrorMessage(null);

    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setOauthLoading(false);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during sign-in.');
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Wordmark size="md" />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium text-muted hover:text-navy transition-colors"
        >
          ← Back to website
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-10">
        <Card className="p-8 sm:p-10 border border-border shadow-sm bg-surface">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
              Sign in to VaaniX
            </h1>
            <p className="text-sm text-muted mt-2">
              Protect your family and verify suspicious voice calls in real time.
            </p>
          </div>

          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl bg-red-tint border border-red/20 text-red text-sm font-medium"
              role="alert"
            >
              {errorMessage}
            </div>
          )}

          {sentMessage ? (
            <div className="p-6 rounded-2xl bg-teal-tint/40 border border-teal/20 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-tint flex items-center justify-center mx-auto mb-4 text-teal-dark font-bold text-xl">
                ✉
              </div>
              <h2 className="text-lg font-bold text-navy mb-2">Check your email</h2>
              <p className="text-sm text-navy/80 leading-relaxed mb-6">{sentMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSentMessage(null)}
                className="w-full"
              >
                Use another email address
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 flex items-center justify-center gap-3 font-semibold text-navy hover:bg-light"
                onClick={handleGoogleSignIn}
                disabled={oauthLoading || loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {oauthLoading ? 'Connecting...' : 'Continue with Google'}
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-border w-full absolute" />
                <span className="bg-surface px-3 text-xs uppercase tracking-wider text-faint relative">
                  or sign in with email
                </span>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                    Email address
                  </label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading || oauthLoading}
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading || oauthLoading}
                >
                  {loading ? 'Sending link...' : 'Send magic link'}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted leading-relaxed">
              By signing in, you agree to VaaniX&apos;s{' '}
              <Link href="/privacy" className="text-teal-dark hover:underline font-medium">
                privacy policy
              </Link>
              . Audio is processed ephemeral and never stored unless flagged as an AI clone.
            </p>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4">
        <p className="text-xs text-faint">
          © {new Date().getFullYear()} VaaniX · Public protection against AI voice cloning scams
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <p className="text-sm text-muted">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
