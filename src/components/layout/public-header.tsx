"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ShieldCheck } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-surface/95 backdrop-blur-md select-none">
      <div className="container-vaanix flex h-20 items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center focus-visible:outline-none">
          <Wordmark size="lg" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-base font-medium text-navy">
          <Link
            href="/how-it-works"
            className="hover:text-teal-dark transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/try"
            className="hover:text-teal-dark transition-colors"
          >
            Try a check
          </Link>
          <Link
            href="/radar"
            className="hover:text-teal-dark transition-colors"
          >
            Scam Radar
          </Link>
          <Link
            href="/developers"
            className="hover:text-teal-dark transition-colors"
          >
            Developers
          </Link>
          <Link
            href="/privacy"
            className="hover:text-teal-dark transition-colors"
          >
            Privacy
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="font-bold">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="font-bold">
            <Link href="/try">
              <ShieldCheck className="size-4 mr-1.5" />
              Check Call
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex size-10 items-center justify-center rounded-full text-navy hover:bg-light focus-visible:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-6 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-base font-semibold text-navy">
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-teal-dark"
            >
              How it works
            </Link>
            <Link
              href="/try"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-teal-dark"
            >
              Try a check
            </Link>
            <Link
              href="/radar"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-teal-dark"
            >
              Scam Radar
            </Link>
            <Link
              href="/developers"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-teal-dark"
            >
              Developers
            </Link>
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-teal-dark"
            >
              Privacy
            </Link>
          </nav>

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <Button asChild variant="outline" className="w-full font-bold">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            </Button>
            <Button asChild className="w-full font-bold">
              <Link href="/try" onClick={() => setMobileMenuOpen(false)}>
                Check Call
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
