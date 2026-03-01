import Link from 'next/link';
import ListingCard from '@/components/listings/ListingCard';
import { MOCK_LISTINGS } from '@/lib/mockData';

const STATS = [
  { value: '2,400+', label: 'Verified Listings' },
  { value: '₦0', label: 'Lost to Fraud' },
  { value: '98%', label: 'Inspection Success Rate' },
  { value: '6', label: 'Cities Covered' },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: '🔍',
    title: 'Find Your Property',
    desc: 'Browse verified listings across Nigerian cities with real photos, accurate prices, and agent reputation scores.',
  },
  {
    step: 2,
    icon: '📞',
    title: 'Contact the Agent',
    desc: 'Reach out to the verified agent directly to schedule a viewing. Every agent on Prop has a public reputation score.',
  },
  {
    step: 3,
    icon: '✅',
    title: 'Inspect & Move In',
    desc: 'Visit the property, confirm everything checks out, and secure your rental. Dispute resolution and escrow payments coming soon.',
  },
];

// Featured = first 3 mock listings
const FEATURED = MOCK_LISTINGS.slice(0, 3);

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand to-brand-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 text-sm mb-6">
            🇳🇬 Nigeria&apos;s most trusted property platform
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Rent with <span className="text-accent">Confidence.</span>
            <br /> Inspect without Fear.
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Verified listings. Trusted agents. No ghost properties, no wasted trips.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto shadow-xl">
            <input
              type="text"
              placeholder="Search city, area or neighbourhood..."
              className="flex-1 px-4 py-3 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand text-sm"
            />
            <select className="px-4 py-3 text-gray-700 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
              <option>Any bedrooms</option>
              <option value="1">1 bedroom</option>
              <option value="2">2 bedrooms</option>
              <option value="3">3 bedrooms</option>
              <option value="4">4+ bedrooms</option>
            </select>
            <Link href="/listings" className="btn-accent whitespace-nowrap text-sm">
              Search →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-brand">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Properties</h2>
              <p className="text-gray-500 text-sm mt-1">Hand-picked listings from verified agents</p>
            </div>
            <Link href="/listings" className="text-sm text-brand font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/listings" className="btn-primary">
              Browse All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How Prop Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Three simple steps to find and inspect a property safely.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="card p-6 text-center">
                <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-brand uppercase tracking-wider mb-2">
                  Step {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for agents */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-brand to-brand-700 rounded-3xl p-10 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Are You a Property Agent?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              List your properties on Prop, build your reputation with every successful viewing, and reach thousands of verified clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register?role=AGENT" className="btn-accent">
                Start Listing — Free
              </Link>
              <Link href="/listings" className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-brand transition-colors">
                Browse as Client
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
