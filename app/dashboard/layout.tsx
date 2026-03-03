'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    href: '/dashboard/reconfirmations',
    label: 'Reconfirmations',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    href: '/dashboard/credibility',
    label: 'Credibility Score',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'My Profile',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-sl-slate-100">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex gap-0.5">
            <div className="w-3.5 h-3.5 bg-sl-green-600 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-sl-gold-400 rounded-sm opacity-70" />
          </div>
          <span className="font-bold text-sl-slate-900 text-sm">
            SureLeads{' '}
            <span className="font-normal text-sl-slate-400">Listings</span>
          </span>
        </Link>
        <p className="text-xs text-sl-slate-500 mt-2 font-medium">Agent Dashboard</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                          font-medium transition-colors ${
                active
                  ? 'bg-sl-green-50 text-sl-green-700'
                  : 'text-sl-slate-600 hover:bg-sl-slate-50 hover:text-sl-slate-900'
              }`}
            >
              <svg
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? 'text-sl-green-600' : 'text-sl-slate-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {icon}
              </svg>
              {label}
            </Link>
          );
        })}

        <div className="pt-3 mt-3 border-t border-sl-slate-100">
          <Link
            href="/listings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       font-medium text-sl-slate-500 hover:text-sl-slate-900
                       hover:bg-sl-slate-50 transition-colors"
          >
            <svg className="w-5 h-5 text-sl-slate-400 flex-shrink-0"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Browse listings
          </Link>
        </div>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-sl-slate-100">
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-sl-slate-500 hover:text-sl-slate-900
                     hover:bg-sl-slate-50 transition-colors w-full"
        >
          <svg className="w-5 h-5 text-sl-slate-400 flex-shrink-0"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-sl-slate-200
                        fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed inset-x-0 top-0 z-50 flex items-center justify-between
                      bg-white border-b border-sl-slate-200 px-4 h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="w-3.5 h-3.5 bg-sl-green-600 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-sl-gold-400 rounded-sm opacity-70" />
          </div>
          <span className="font-bold text-sl-slate-900 text-sm">SureLeads</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 -mr-1 rounded-lg text-sl-slate-600 hover:text-sl-slate-900
                     hover:bg-sl-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col
                       shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="min-h-screen md:ml-60 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
