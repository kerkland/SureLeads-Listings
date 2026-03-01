'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';

const NAV_LINKS = [
  { href: '/listings',       label: 'Browse' },
  { href: '/price-insights', label: 'Market data' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-150 ${
        scrolled
          ? 'shadow-card border-b border-sl-slate-200'
          : 'border-b border-sl-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" aria-label="SureLeads Listings — Home">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm text-sl-slate-600 hover:text-sl-slate-900
                           hover:bg-sl-slate-100 rounded-lg font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login"    className="btn-md btn-ghost font-medium">Sign in</Link>
            <Link href="/register" className="btn-md btn-primary">Get started</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 -mr-1 rounded-lg hover:bg-sl-slate-100 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-5 h-5 text-sl-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-sl-slate-100 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex px-3 py-2.5 text-sm text-sl-slate-700 hover:bg-sl-slate-50
                           rounded-lg font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 mt-1 border-t border-sl-slate-100">
              <Link
                href="/login"
                className="flex-1 btn-md btn-ghost border border-sl-slate-200 justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex-1 btn-md btn-primary justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
