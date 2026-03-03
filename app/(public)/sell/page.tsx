import Link from 'next/link';

const BENEFITS = [
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
    title: 'Access qualified renters',
    body: 'Connect directly with verified, registered users who are actively searching — not just browsing.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    title: 'Build your credibility score',
    body: 'Your public score grows with every confirmed inspection, positive review, and reconfirmation.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />,
    title: 'Maximum listing visibility',
    body: 'Weekly-reconfirmed listings rank higher and stay visible. Inactive listings are removed automatically.',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M0 0h24v24H0z M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    title: 'Free to list',
    body: 'No upfront fees. List as many properties as you manage. We earn only when you succeed.',
  },
];

const HOW = [
  { n: '01', title: 'Create your agent profile', body: 'Sign up, verify your identity, and set up your public credibility profile.' },
  { n: '02', title: 'List your properties', body: 'Add photos, pricing, and property details. Our team reviews each listing before it goes live.' },
  { n: '03', title: 'Reconfirm weekly', body: 'Confirm each listing is still available every 7 days. Takes 60 seconds. Keeps your score high.' },
  { n: '04', title: 'Manage inspections', body: 'Accept or schedule viewing requests directly through the platform. All logged for transparency.' },
];

const STATS = [
  { value: '1,200+', label: 'Active listings' },
  { value: '94%',    label: 'Reconfirmation rate' },
  { value: '4.7★',   label: 'Avg agent rating' },
  { value: '₦0',     label: 'Listing fee' },
];

export default function SellPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-sl-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold text-sl-green-400 uppercase tracking-widest mb-3">
                For agents &amp; landlords
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
                List smarter.<br />
                <span className="text-sl-green-400">Close faster.</span>
              </h1>
              <p className="text-base text-sl-slate-400 leading-relaxed mb-8">
                SureLeads connects you with serious, verified renters across Lagos.
                Your credibility score grows every time you show up — and that score wins business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/register?role=AGENT" className="btn-lg btn-primary">
                  Start listing — it's free
                </Link>
                <Link href="/listings"
                      className="btn-lg border border-sl-slate-700 text-sl-slate-300 rounded-lg
                                 hover:border-sl-slate-500 hover:text-white transition-colors">
                  See how listings look
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-sl-slate-800 rounded-2xl border border-sl-slate-700 p-8">
              <p className="text-xs font-semibold text-sl-green-400 uppercase tracking-widest mb-6">
                Platform at a glance
              </p>
              <div className="grid grid-cols-2 gap-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-sl-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-20 px-4 bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              Why list on SureLeads
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">Built for serious agents</h2>
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

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-sl-slate-50 border-b border-sl-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
              Getting started
            </p>
            <h2 className="text-2xl font-bold text-sl-slate-900">From signup to first inquiry in minutes</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW.map((s) => (
              <div key={s.n} className="border border-sl-slate-200 rounded-xl p-6 bg-white">
                <p className="text-3xl font-bold text-sl-slate-100 mb-4 leading-none">{s.n}</p>
                <h3 className="text-sm font-semibold text-sl-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-sl-slate-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Credibility CTA ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 bg-sl-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-sl-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-sl-slate-900 mb-3">
            Your credibility is your competitive edge
          </h2>
          <p className="text-sm text-sl-slate-500 mb-8 leading-relaxed max-w-lg mx-auto">
            Renters on SureLeads filter by credibility score. The higher yours is, the more
            visibility your listings get — and the more trust you earn with every transaction.
          </p>
          <Link href="/register?role=AGENT" className="btn-lg btn-primary">
            Create your agent profile
          </Link>
          <p className="text-xs text-sl-slate-400 mt-4">Free to join. No listing fees.</p>
        </div>
      </section>

    </div>
  );
}
