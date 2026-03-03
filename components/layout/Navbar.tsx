'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';

const NAV_LINKS = [
  { href: '/buy',            label: 'Buy'            },
  { href: '/sell',           label: 'Sell'           },
  { href: '/rent',           label: 'Rent'           },
  { href: '/find-an-agent',  label: 'Find an Agent'  },
  { href: '/news',           label: 'News & Insights' },
];

export default function Navbar() {
  const pathname  = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav
      className={`sticky top-0 z-50 bg-white transition-all duration-150 ${
        scrolled
          ? 'shadow-card border-b border-sl-slate-200'
          : 'border-b border-sl-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" aria-label="SureLeads Listings — Home" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-sl-slate-900'
                      : 'text-sl-slate-500 hover:text-sl-slate-900 hover:bg-sl-slate-50'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-sl-green-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop auth */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-sl-slate-600 hover:text-sl-slate-900
                         rounded-lg hover:bg-sl-slate-50 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-md btn-primary"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 -mr-1 rounded-lg hover:bg-sl-slate-100 transition-colors"
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
          <div className="lg:hidden py-3 border-t border-sl-slate-100">
            <div className="space-y-0.5 mb-3">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? 'text-sl-slate-900 bg-sl-slate-50 border-l-2 border-sl-green-500 pl-4'
                        : 'text-sl-slate-600 hover:text-sl-slate-900 hover:bg-sl-slate-50'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex gap-2 pt-3 border-t border-sl-slate-100">
              <Link
                href="/login"
                className="flex-1 py-2.5 text-sm font-medium text-sl-slate-600 border border-sl-slate-200
                           rounded-lg text-center hover:bg-sl-slate-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="flex-1 btn-md btn-primary justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
