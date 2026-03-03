import Link from 'next/link';

const AGENTS = [
  {
    id: 'agent-1',
    name: 'Chidi Okeke',
    agency: 'Okeke Properties',
    score: 820,
    verified: true,
    areas: ['Lekki Phase 1', 'Victoria Island', 'Ikoyi'],
    listings: 14,
    reviews: 38,
    rating: 4.8,
    bio: 'Specialising in Lekki and Victoria Island properties for over 8 years. 200+ successful lettings.',
    initials: 'CO',
  },
  {
    id: 'agent-2',
    name: 'Amaka Eze',
    agency: 'Eze Homes',
    score: 910,
    verified: true,
    areas: ['Ikeja GRA', 'Maryland', 'Gbagada'],
    listings: 21,
    reviews: 61,
    rating: 4.9,
    bio: 'Award-winning agent with 12 years across mainland and island Lagos. Fast, transparent, trusted.',
    initials: 'AE',
  },
  {
    id: 'agent-3',
    name: 'Tunde Adeyemi',
    agency: 'Adeyemi Realty',
    score: 650,
    verified: false,
    areas: ['Surulere', 'Yaba', 'Ojodu'],
    listings: 9,
    reviews: 17,
    rating: 4.1,
    bio: 'Focused on affordable Lagos mainland properties. Fast, transparent, and reliable.',
    initials: 'TA',
  },
  {
    id: 'agent-4',
    name: 'Seun Balogun',
    agency: 'Mainland Realty',
    score: 740,
    verified: true,
    areas: ['Yaba', 'Gbagada', 'Ketu'],
    listings: 12,
    reviews: 29,
    rating: 4.5,
    bio: 'Mainland Lagos specialist. Fast viewings, no ghost listings. Responsive within 24 hours.',
    initials: 'SB',
  },
  {
    id: 'agent-5',
    name: 'Ngozi Obi',
    agency: 'Obi & Co Realtors',
    score: 870,
    verified: true,
    areas: ['Ajah', 'Sangotedo', 'Chevron'],
    listings: 18,
    reviews: 44,
    rating: 4.7,
    bio: 'Lekki corridor expert with deep knowledge of Ajah to Chevron. Premium and mid-range specialist.',
    initials: 'NO',
  },
  {
    id: 'agent-6',
    name: 'Emeka Nwosu',
    agency: 'Nwosu Properties',
    score: 790,
    verified: true,
    areas: ['Magodo', 'Ojodu', 'Ogba'],
    listings: 11,
    reviews: 23,
    rating: 4.6,
    bio: 'Magodo and Ojodu specialist. Handles both residential and small commercial lettings.',
    initials: 'EN',
  },
];

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 800 ? 'bg-sl-green-50 text-sl-green-700 border-sl-green-200' :
    score >= 650 ? 'bg-sl-gold-50 text-sl-gold-700 border-sl-gold-200' :
                  'bg-sl-slate-100 text-sl-slate-600 border-sl-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5
                      rounded-full border ${color}`}>
      {score}
    </span>
  );
}

export default function FindAnAgentPage() {
  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
            Agent directory
          </p>
          <h1 className="text-3xl font-bold text-sl-slate-900 mb-2">Find a verified agent</h1>
          <p className="text-sm text-sl-slate-500 max-w-lg">
            Every agent on SureLeads carries a public credibility score built from inspection
            response rate, renter reviews, and weekly listing compliance.
          </p>

          {/* Search bar */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="flex flex-1 items-center gap-2 bg-sl-slate-50 border border-sl-slate-200
                            rounded-lg px-4 py-2.5">
              <svg className="w-4 h-4 text-sl-slate-400 flex-shrink-0" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, agency, or area…"
                className="flex-1 text-sm text-sl-slate-900 placeholder-sl-slate-400
                           focus:outline-none bg-transparent"
              />
            </div>
            <button className="btn-md btn-primary whitespace-nowrap">Search agents</button>
          </div>
        </div>
      </div>

      {/* ── Score legend ── */}
      <div className="bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-4 text-xs text-sl-slate-500">
          <span className="font-medium text-sl-slate-700">Credibility score:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sl-green-500" /> 800–1000 Excellent
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sl-gold-400" /> 650–799 Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sl-slate-300" /> Below 650 Building
          </span>
        </div>
      </div>

      {/* ── Agent grid ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENTS.map((agent) => (
            <div key={agent.id}
                 className="bg-white border border-sl-slate-200 rounded-2xl p-6
                            hover:shadow-card hover:border-sl-slate-300 transition-all flex flex-col">

              {/* Avatar + score */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-sl-green-100 rounded-xl flex items-center justify-center
                                text-sl-green-700 font-bold text-sm flex-shrink-0">
                  {agent.initials}
                </div>
                <div className="flex items-center gap-2">
                  {agent.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium
                                     text-sl-green-700 bg-sl-green-50 border border-sl-green-200
                                     rounded-full px-2 py-0.5">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  )}
                  <ScoreBadge score={agent.score} />
                </div>
              </div>

              {/* Name + agency */}
              <h3 className="text-base font-semibold text-sl-slate-900">{agent.name}</h3>
              <p className="text-xs text-sl-slate-500 mb-3">{agent.agency}</p>

              {/* Bio */}
              <p className="text-sm text-sl-slate-600 leading-relaxed mb-4 flex-1">{agent.bio}</p>

              {/* Areas */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {agent.areas.map((area) => (
                  <span key={area}
                        className="text-xs bg-sl-slate-100 text-sl-slate-600 px-2.5 py-1 rounded-lg">
                    {area}
                  </span>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-sl-slate-500
                              border-t border-sl-slate-100 pt-4 mb-4">
                <span>{agent.listings} listings</span>
                <span>{agent.reviews} reviews</span>
                <span>★ {agent.rating}</span>
              </div>

              {/* CTA */}
              <Link
                href={`/listings?agent=${agent.id}`}
                className="btn-md btn-secondary w-full justify-center text-sm"
              >
                View listings
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ── Agent CTA ── */}
      <section className="py-16 px-4 bg-sl-slate-900 mt-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-3">Are you an agent?</h2>
          <p className="text-sm text-sl-slate-400 mb-6 leading-relaxed">
            Join the SureLeads agent network. Build your credibility score and connect
            with verified renters across Lagos State.
          </p>
          <Link href="/register?role=AGENT" className="btn-lg btn-primary">
            Join as an agent — free
          </Link>
        </div>
      </section>

    </div>
  );
}
