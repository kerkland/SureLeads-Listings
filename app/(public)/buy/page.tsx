import Link from 'next/link';

const FEATURES = [
  {
    title: 'Verified property ownership',
    body: 'Every property for sale will be title-verified by our legal team before listing.',
  },
  {
    title: 'Transparent pricing',
    body: 'Area price benchmarks let you negotiate with confidence — no more guessing games.',
  },
  {
    title: 'Trusted agent network',
    body: 'Work only with agents who carry a verified SureLeads credibility score.',
  },
  {
    title: 'End-to-end support',
    body: 'From property search to title transfer — we\'ll be with you at every step.',
  },
];

export default function BuyPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-sl-green-50 border border-sl-green-200
                          rounded-full px-3.5 py-1.5 text-xs font-semibold text-sl-green-700 mb-6">
            Coming soon
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-sl-slate-900 leading-tight tracking-tight mb-5">
            Buy property in Lagos<br />
            <span className="text-sl-green-500">with complete confidence.</span>
          </h1>
          <p className="text-lg text-sl-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            We're building a verified property sales marketplace for Lagos State —
            title-checked listings, trusted agents, and transparent pricing.
            Be the first to know when we launch.
          </p>

          {/* Waitlist form */}
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-sl-slate-200 rounded-xl p-2 flex gap-2 shadow-card">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2.5 text-sm text-sl-slate-900 placeholder-sl-slate-400
                           focus:outline-none bg-transparent"
              />
              <button className="btn-md btn-primary whitespace-nowrap">
                Notify me
              </button>
            </div>
            <p className="text-xs text-sl-slate-400 mt-3">
              No spam — one email when we launch.
            </p>
          </div>
        </div>
      </section>

      {/* ── What's coming ── */}
      <section className="py-20 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              What to expect
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">
              Property buying, built on trust
            </h2>
            <p className="text-sm text-sl-slate-500 mt-2 max-w-lg mx-auto">
              We're applying the same verification standard from our rental platform
              to property sales — because buying a home is the biggest decision you'll make.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                   className="border border-sl-slate-200 rounded-xl p-6 flex gap-4 items-start">
                <div className="w-8 h-8 bg-sl-green-50 rounded-lg flex items-center justify-center
                                flex-shrink-0 text-sm font-bold text-sl-green-600">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-sl-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-sl-slate-500 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rent in the meantime ── */}
      <section className="py-16 px-4 bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
            In the meantime
          </p>
          <h2 className="text-xl font-bold text-sl-slate-900 mb-3">
            Looking to rent while you wait?
          </h2>
          <p className="text-sm text-sl-slate-500 mb-8 leading-relaxed">
            Our rental platform is fully live across Lagos State with 1,200+ weekly-reconfirmed
            listings. Find a great place to stay while we build out the sales marketplace.
          </p>
          <Link href="/rent" className="btn-lg btn-primary">
            Browse Lagos rentals
          </Link>
        </div>
      </section>

    </div>
  );
}
