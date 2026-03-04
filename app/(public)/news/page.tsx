import Link from 'next/link';
import { ARTICLES } from './_data';

const CATEGORIES = ['All', 'Market Report', 'Price Trends', 'Area Guide', 'Renter Guide', 'Platform'];

export default function NewsPage() {
  const [featured, ...rest] = ARTICLES;

  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
            News &amp; Insights
          </p>
          <h1 className="text-3xl font-bold text-sl-slate-900 mb-2">Lagos property market intelligence</h1>
          <p className="text-sm text-sl-slate-500 max-w-lg">
            Data-driven reports, area guides, and renter resources — all based on
            verified listing data from the SureLeads platform.
          </p>
        </div>

        {/* Category filter */}
        <div className="max-w-5xl mx-auto px-4 pb-0">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  i === 0
                    ? 'text-sl-slate-900 border-sl-green-500'
                    : 'text-sl-slate-500 border-transparent hover:text-sl-slate-700 hover:border-sl-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── Featured article ── */}
        <article className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden
                            hover:shadow-card transition-shadow">
          <div className="aspect-[2.5/1] bg-gradient-to-br from-sl-slate-800 to-sl-slate-900
                          flex items-end p-8 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-sl-slate-900/80 to-transparent" />
            <div className="relative z-10">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3
                               ${featured.categoryColor}`}>
                {featured.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug max-w-2xl">
                {featured.title}
              </h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-sl-slate-600 leading-relaxed mb-4">{featured.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-sl-slate-400">
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.readTime}</span>
              </div>
              <Link
                href={`/news/${featured.slug}`}
                className="text-sm font-medium text-sl-green-600 hover:text-sl-green-700
                           flex items-center gap-1 transition-colors"
              >
                Read article
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </article>

        {/* ── Article grid ── */}
        <div>
          <h2 className="text-sm font-semibold text-sl-slate-900 mb-5">Latest articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((article) => (
              <article
                key={article.slug}
                className="bg-white border border-sl-slate-200 rounded-2xl p-6
                           hover:shadow-card hover:border-sl-slate-300 transition-all flex flex-col"
              >
                <span className={`inline-block self-start text-xs font-semibold px-2.5 py-1
                                  rounded-full mb-4 ${article.categoryColor}`}>
                  {article.category}
                </span>
                <h3 className="text-sm font-semibold text-sl-slate-900 leading-snug mb-3 flex-1">
                  {article.title}
                </h3>
                <p className="text-xs text-sl-slate-500 leading-relaxed mb-5 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-sl-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-sl-slate-400">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                  <Link
                    href={`/news/${article.slug}`}
                    className="text-xs font-medium text-sl-green-600 hover:text-sl-green-700
                               transition-colors"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── Price insights CTA ── */}
        <div className="bg-sl-slate-900 rounded-2xl p-8 flex flex-col sm:flex-row
                        items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-sl-green-400 uppercase tracking-widest mb-1">
              Live data
            </p>
            <h3 className="text-lg font-bold text-white mb-1">
              Want real numbers, not estimates?
            </h3>
            <p className="text-sm text-sl-slate-400">
              Check verified rental price benchmarks for any Lagos area — updated weekly.
            </p>
          </div>
          <Link href="/price-insights" className="btn-lg btn-primary whitespace-nowrap flex-shrink-0">
            View price insights
          </Link>
        </div>

      </div>
    </div>
  );
}
