import Link from 'next/link';

const BENEFITS = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
    title: 'Verified Listings Only',
    body: 'Every listing is reconfirmed weekly by the agent. If it's on SureLeads, it's available.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    title: 'Credibility Scores',
    body: 'See each agent\'s verified score — built from inspection rates, reviews, and weekly compliance.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
    title: 'Price Intelligence',
    body: 'Area price benchmarks let you know if you\'re paying a fair rate before you commit.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
    title: 'No Ghost Properties',
    body: 'Listings that miss weekly reconfirmation are automatically removed. No more wasted trips.',
  },
];

const STEPS = [
  { n: '01', title: 'Search your area', body: 'Browse verified listings across Lagos by area, bedrooms, price, or property type.' },
  { n: '02', title: 'Check the agent score', body: 'Review the agent\'s credibility score, response rate, and past reviews before reaching out.' },
  { n: '03', title: 'Book an inspection', body: 'Request a viewing directly on the platform. Agents are required to respond within 24 hours.' },
  { n: '04', title: 'Move in with confidence', body: 'Your listing was reconfirmed this week. What you see is what exists.' },
];

const AREAS = [
  { name: 'Lekki Phase 1', listings: 84, from: '₦1.8M' },
  { name: 'Victoria Island', listings: 62, from: '₦3.2M' },
  { name: 'Ikoyi', listings: 48, from: '₦4.0M' },
  { name: 'Ikeja GRA', listings: 71, from: '₦1.5M' },
  { name: 'Surulere', listings: 93, from: '₦600K' },
  { name: 'Yaba', listings: 57, from: '₦700K' },
  { name: 'Ajah', listings: 66, from: '₦900K' },
  { name: 'Gbagada', listings: 45, from: '₦1.1M' },
];

export default function RentPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-sl-slate-200
                          rounded-full px-3.5 py-1.5 text-xs font-medium text-sl-slate-600 mb-6">
            <span className="w-1.5 h-1.5 bg-sl-green-500 rounded-full animate-pulse-slow" />
            Lagos State — verified rentals only
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-sl-slate-900 leading-tight tracking-tight mb-5">
            Find your next home<br />
            <span className="text-sl-green-500">without the runaround.</span>
          </h1>
          <p className="text-lg text-sl-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Every listing on SureLeads is reconfirmed weekly. No ghost properties,
            no misleading photos, no wasted inspections.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/listings" className="btn-lg btn-primary">
              Browse rentals
            </Link>
            <Link href="/price-insights" className="btn-lg btn-secondary">
              Check area prices
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why SureLeads ── */}
      <section className="py-20 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              Why SureLeads
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">
              Renting in Lagos, done right
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="border border-sl-slate-200 rounded-xl p-6">
                <div className="w-10 h-10 bg-sl-green-50 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-sl-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {b.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-sl-slate-900 mb-2">{b.title}</h3>
                <p className="text-sm text-sl-slate-500 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse by Area ── */}
      <section className="py-20 px-4 bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
                Popular areas
              </p>
              <h2 className="text-2xl font-bold text-sl-slate-900">Browse by neighbourhood</h2>
            </div>
            <Link href="/listings"
                  className="text-sm font-medium text-sl-green-600 hover:text-sl-green-700 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {AREAS.map((a) => (
              <Link
                key={a.name}
                href={`/listings?area=${encodeURIComponent(a.name)}`}
                className="bg-white border border-sl-slate-200 rounded-xl p-5
                           hover:border-sl-green-300 hover:shadow-card transition-all group"
              >
                <p className="text-sm font-semibold text-sl-slate-900 group-hover:text-sl-green-700
                               transition-colors mb-1">
                  {a.name}
                </p>
                <p className="text-xs text-sl-slate-500">{a.listings} listings</p>
                <p className="text-xs text-sl-slate-400 mt-1">From {a.from}/yr</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              How it works
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">From search to move-in in 4 steps</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-full w-full h-px bg-sl-slate-200 z-0" />
                )}
                <div className="relative border border-sl-slate-200 rounded-xl p-6 bg-white">
                  <p className="text-3xl font-bold text-sl-slate-100 mb-4 leading-none">{s.n}</p>
                  <h3 className="text-sm font-semibold text-sl-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-sl-slate-500 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-sl-slate-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to find your home?</h2>
          <p className="text-sm text-sl-slate-400 mb-8 leading-relaxed">
            Join thousands of Lagos renters who found their home through SureLeads —
            no agents calling non-stop, no ghost properties.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-lg btn-primary">
              Create free account
            </Link>
            <Link href="/listings"
                  className="btn-lg border border-sl-slate-700 text-sl-slate-300
                             rounded-lg hover:border-sl-slate-500 hover:text-white transition-colors">
              Browse without signing up
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
