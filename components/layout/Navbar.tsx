'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/listings" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-brand">Prop</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/listings" className="text-gray-600 hover:text-brand font-medium transition-colors">
              Browse
            </Link>
            <Link href="/listings?forAgents=true" className="text-gray-600 hover:text-brand font-medium transition-colors">
              List Property
            </Link>
            <Link href="/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-gray-600 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-col gap-4">
            <Link href="/listings" className="text-gray-600 font-medium">Browse Properties</Link>
            <Link href="/login" className="btn-secondary text-sm text-center">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm text-center">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
