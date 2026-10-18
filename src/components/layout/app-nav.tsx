'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wordmark } from '@/components/layout/wordmark';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AppNavProps {
  userEmail?: string | null;
  displayName?: string | null;
}

const navLinks = [
  { href: '/app/check', label: 'Check' },
  { href: '/app/history', label: 'History' },
  { href: '/app/family', label: 'Family' },
  { href: '/app/settings', label: 'Settings' },
  { href: '/app/api', label: 'API' },
];

export function AppNav({ userEmail, displayName }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-8">
          <Link href="/app/check" className="flex items-center hover:opacity-90 transition-opacity">
            <Wordmark size="sm" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-tint text-teal-dark font-semibold'
                      : 'text-muted hover:text-navy hover:bg-light'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="hidden md:flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-navy truncate max-w-[200px]">
              {displayName || userEmail?.split('@')[0] || 'User'}
            </p>
            {userEmail && (
              <p className="text-xs text-faint truncate max-w-[200px]">{userEmail}</p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="text-xs font-semibold text-muted hover:text-navy border-border"
          >
            {loggingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-5 h-5 text-navy"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-tint text-teal-dark font-semibold'
                      : 'text-muted hover:text-navy hover:bg-light'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="truncate">
              <p className="text-sm font-bold text-navy truncate">
                {displayName || userEmail?.split('@')[0] || 'User'}
              </p>
              {userEmail && <p className="text-xs text-faint truncate">{userEmail}</p>}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={loggingOut}
              className="text-xs font-semibold"
            >
              Sign out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
