import Link from 'next/link';
import ListingCard from '@/components/listings/ListingCard';
import { MOCK_LISTINGS } from '@/lib/mockData';

/* ─── Static data ────────────────────────────────────── */

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu'];

const STATS = [
  { value: '2,400+', label: 'Active listings'        },
  { value: '94%',    label: 'Reconfirmed this week'  },
  { value: '6',      label: 'Cities covered'          },
  { value: '₦0',     label: 'Lost to verified fraud' },
];

const HOW = [
  {
    n: '01',
    title: 'Search with real data',
    body:  'Browse listings with area price benchmarks, reconfirmation timestamps, '
         + 'and agent credibility scores on every card.',
  },
  {
    n: '02',
    title: 'Verify the agent',
    body:  'Every agent has a public credibility score built from inspection response rate, '
         + 'review history, and weekly compliance.',
  },
  {
    n: '03',
    title: 'Book an inspection',
    body:  'Request a viewing directly on the platform. Listings that miss weekly '
         + 'reconfirmation are automatically removed.',
  },
];

const INSIGHT_PREVIEW = [
  { area: 'Lekki Phase 1, Lagos',  p25: '₦2.4M', med: '₦3.1M', p75: '₦4.2M', n: 28 },
  { area: 'Wuse 2, Abuja',         p25: '₦1.8M', med: '₦2.5M', p75: '₦3.6M', n: 14 },
  { area: 'GRA, Port Harcourt',    p25: '₦1.2M', med: '₦1.9M', p75: '₦2.7M', n:  9 },
  { area: 'Ikeja GRA, Lagos',      p25: '₦2.1M', med: '₦2.9M', p75: '₦3.8M', n: 19 },
];

const FEATURED = MOCK_LISTINGS.slice(0, 3);

/* ─── Page ───────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">

          <div className="inline-flex items-center gap-2 bg-white border border-sl-slate-200
                          rounded-full px-3.5 py-1.5 text-xs font-medium text-sl-slate-600 mb-8">
            <span className="w-1.5 h-1.5 bg-sl-green-500 rounded-full animate-pulse-slow" />
            Now live in {CITIES.length} cities across Nigeria
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-sl-slate-900
                         leading-[1.08] tracking-tight mb-5">
            Property search<br />
            <span className="text-sl-green-500">built on trust.</span>
          </h1>

          <p className="text-lg text-sl-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Weekly-reconfirmed listings. Agent credibility scores.
            Data-driven area price insights. No ghost properties.
          </p>

          {/* Search bar */}
          <div className="bg-white border border-sl-slate-200 rounded-xl p-2
                          flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-card">
            <div className="flex flex-1 items-center gap-2 px-3">
              <svg className="w-4 h-4 text-sl-slate-400 flex-shrink-0" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="City, area or neighbourhood…"
                className="flex-1 py-2.5 text-sm text-sl-slate-900
                           placeholder-sl-slate-400 focus:outline-none bg-transparent"
              />
            </div>
            <select className="border-t sm:border-t-0 sm:border-l border-sl-slate-200
                               px-4 py-2.5 text-sm text-sl-slate-700 bg-transparent
                               focus:outline-none">
              <option value="">Any bedrooms</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}{n === 4 ? '+' : ''} bedroom{n !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <Link href="/listings" className="btn-md btn-primary rounded-lg whitespace-nowrap">
              Search
            </Link>
          </div>

          {/* City chips */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/listings?city=${city}`}
                className="px-3 py-1.5 text-sm text-sl-slate-600 bg-white border border-sl-slate-200
                           rounded-lg hover:border-sl-green-300 hover:text-sl-green-700 transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ═══════════════════════════════════ */}
      <section className="bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-sl-slate-200">
            {STATS.map((s) => (
              <div key={s.label} className="text-center px-4 py-2">
                <p className="text-2xl font-bold text-sl-slate-900">{s.value}</p>
                <p className="text-xs text-sl-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICE INSIGHTS TEASER (gated / blurred) ═══════ */}
      <section className="py-16 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
                Market intelligence
              </p>
              <h2 className="text-xl font-bold text-sl-slate-900">Area Price Insights</h2>
              <p className="text-sm text-sl-slate-500 mt-1">
                Median, P25 and P75 annual rents — verified listings only.
              </p>
            </div>
            <span className="badge badge-gold hidden sm:inline-flex">Members only</span>
          </div>

          <div className="border border-sl-slate-200 rounded-2xl overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-4 bg-sl-slate-50 border-b border-sl-slate-200
                            px-5 py-3 text-xs font-semibold text-sl-slate-500 uppercase tracking-wide">
              <span className="col-span-2">Area</span>
              <span className="text-right hidden sm:block">P25 / Median / P75</span>
              <span className="text-right">Listings</span>
            </div>

            {/* Blurred rows + overlay */}
            <div className="relative">
              <div className="divide-y divide-sl-slate-100 blur-gate select-none">
                {INSIGHT_PREVIEW.map((row) => (
                  <div key={row.area} className="grid grid-cols-4 px-5 py-4 items-center">
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-sl-slate-900">{row.area}</p>
                    </div>
                    <div className="hidden sm:flex items-center justify-end gap-4 text-sm">
                      <span className="text-sl-slate-500">{row.p25}</span>
                      <span className="font-semibold text-sl-slate-900">{row.med}</span>
                      <span className="text-sl-slate-500">{row.p75}</span>
                    </div>
                    <p className="text-sm text-sl-slate-500 text-right">{row.n} listings</p>
                  </div>
                ))}
              </div>

              {/* CTA overlay */}
              <div className="absolute inset-0 flex items-center justify-center
                              bg-gradient-to-b from-white/10 via-white/85 to-white">
                <div className="bg-white border border-sl-slate-200 rounded-2xl
                                px-6 py-6 text-center shadow-dropdown max-w-sm w-full mx-4">
                  <div className="w-10 h-10 bg-sl-green-50 rounded-xl flex items-center
                                  justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-sl-green-600" fill="none"
                         stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-sl-slate-900 mb-1">
                    Unlock full market data
                  </p>
                  <p className="text-xs text-sl-slate-500 mb-4 leading-relaxed">
                    Sign up free to see area price ranges, listing history,
                    and market activity for any neighbourhood.
                  </p>
                  <Link href="/register" className="btn-md btn-primary w-full justify-center">
                    Create free account
                  </Link>
                  <p className="text-xs text-sl-slate-400 mt-3">
                    Already have an account?{' '}
                    <Link href="/login" className="text-sl-green-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURED LISTINGS ══════════════════════════════ */}
      <section className="py-16 px-4 bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
                Active listings
              </p>
              <h2 className="text-xl font-bold text-sl-slate-900">
                Reconfirmed in the last 7 days
              </h2>
            </div>
            <Link href="/listings"
                  className="text-sm font-medium text-sl-green-600 hover:text-sl-green-700
                             flex items-center gap-1 transition-colors">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURED.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/listings" className="btn-lg btn-secondary">
              Browse all properties
            </Link>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════ */}
      <section className="py-16 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">
              Structured property discovery
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {HOW.map((step) => (
              <div key={step.n} className="border border-sl-slate-200 rounded-xl p-6">
                <p className="text-3xl font-bold text-sl-slate-200 mb-4 leading-none">
                  {step.n}
                </p>
                <h3 className="text-sm font-semibold text-sl-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-sl-slate-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ AGENT CTA (dark) ══════════════════════════════ */}
      <section className="py-16 px-4 bg-sl-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start
                        md:items-center justify-between gap-8">
          <div>
            <p className="text-xs font-semibold text-sl-green-400 uppercase tracking-widest mb-2">
              For agents &amp; developers
            </p>
            <h2 className="text-2xl font-bold text-white mb-2">
              List your properties on SureLeads.
            </h2>
            <p className="text-sm text-sl-slate-400 max-w-md leading-relaxed">
              Build your credibility score with every confirmed inspection.
              Weekly reconfirmation keeps your listings visible and trusted.
            </p>
            <div className="flex flex-wrap gap-4 mt-5 text-xs text-sl-slate-400">
              {['Free to list', 'Public credibility score', 'Weekly reconfirmation'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-sl-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 flex-shrink-0">
            <Link href="/register?role=AGENT" className="btn-lg btn-primary whitespace-nowrap">
              Start listing — free
            </Link>
            <Link
              href="/listings"
              className="btn-lg border border-sl-slate-700 text-sl-slate-300 rounded-lg
                         hover:border-sl-slate-500 hover:text-white transition-colors whitespace-nowrap"
            >
              Browse as client
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
