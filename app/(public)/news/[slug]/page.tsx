import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ARTICLES, getArticle } from '../_data';
import type { Article } from '../_data';

interface Props {
  params: { slug: string };
}

// Static params for pre-built static articles; DB articles are dynamic
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

async function fetchArticle(slug: string): Promise<Article | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res  = await fetch(`${base}/api/news/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) return json.data as Article;
    }
  } catch { /* fall through */ }
  return null;
}

async function fetchAllArticles(): Promise<Article[]> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res  = await fetch(`${base}/api/news`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.length > 0) return json.data as Article[];
    }
  } catch { /* fall through */ }
  return ARTICLES;
}

export default async function ArticlePage({ params }: Props) {
  // Try DB first, then fall back to static data
  let article: Article | null = await fetchArticle(params.slug);
  if (!article) article = getArticle(params.slug) ?? null;
  if (!article) notFound();

  const allArticles = await fetchAllArticles();

  /* related: same category first, then fill with others */
  const related = allArticles.filter(
    (a) => a.slug !== article!.slug && a.category === article!.category,
  ).slice(0, 2);
  const others = allArticles.filter(
    (a) => a.slug !== article!.slug && !related.find((r) => r.slug === a.slug),
  ).slice(0, 3 - related.length);
  const sideArticles = [...related, ...others].slice(0, 3);

  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-sl-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-sl-slate-500">
          <Link href="/news" className="hover:text-sl-slate-900 transition-colors">
            News &amp; Insights
          </Link>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${article.categoryColor}`}>
            {article.category}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main article ── */}
          <article className="lg:col-span-2 space-y-6">

            {/* Header card */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">
              {/* Colour strip */}
              <div className="h-1.5 bg-sl-green-500" />
              <div className="p-8">
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${article.categoryColor}`}>
                  {article.category}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-sl-slate-900 leading-tight mb-4">
                  {article.title}
                </h1>
                <div className="flex items-center gap-3 text-xs text-sl-slate-400 pb-5 border-b border-sl-slate-100 mb-6">
                  <span>{article.date}</span>
                  <span>·</span>
                  <span>{article.readTime}</span>
                </div>
                {/* Excerpt — pull-quote style */}
                <p className="text-base text-sl-slate-700 leading-relaxed font-medium
                               border-l-4 border-sl-green-400 pl-5 mb-8 italic">
                  {article.excerpt}
                </p>
                {/* Body paragraphs */}
                <div className="space-y-5">
                  {article.body.map((para, i) => (
                    <p key={i} className="text-sm text-sl-slate-700 leading-[1.85]">
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Back link */}
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-sm font-medium text-sl-slate-500
                         hover:text-sl-slate-900 transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to News &amp; Insights
            </Link>
          </article>

          {/* ── Sidebar ── */}
          <aside className="space-y-5 lg:pt-0">

            {/* Price insights CTA */}
            <div className="bg-sl-slate-900 rounded-2xl p-6">
              <p className="text-xs font-semibold text-sl-green-400 uppercase tracking-widest mb-2">
                Live data
              </p>
              <h3 className="text-base font-bold text-white mb-2">
                Check real rental prices
              </h3>
              <p className="text-xs text-sl-slate-400 mb-5 leading-relaxed">
                Area-level price benchmarks updated weekly from verified Lagos listings.
              </p>
              <Link href="/price-insights" className="btn-md btn-primary w-full justify-center text-center">
                Price insights →
              </Link>
            </div>

            {/* More articles */}
            {sideArticles.length > 0 && (
              <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
                <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-5">
                  More articles
                </p>
                <div className="space-y-5">
                  {sideArticles.map((a, i) => (
                    <div key={a.slug}>
                      {i > 0 && <div className="border-t border-sl-slate-100 mb-5" />}
                      <Link href={`/news/${a.slug}`} className="block group">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${a.categoryColor}`}>
                          {a.category}
                        </span>
                        <p className="text-sm font-semibold text-sl-slate-900 leading-snug
                                      group-hover:text-sl-green-700 transition-colors mb-1">
                          {a.title}
                        </p>
                        <p className="text-xs text-sl-slate-400">{a.date} · {a.readTime}</p>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Browse rentals CTA */}
            <div className="bg-sl-green-50 border border-sl-green-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-sl-slate-900 mb-2">
                Ready to find your home?
              </h3>
              <p className="text-xs text-sl-slate-500 mb-4 leading-relaxed">
                Browse verified, weekly-reconfirmed listings across Lagos State.
              </p>
              <Link href="/listings" className="btn-md btn-secondary w-full justify-center text-center">
                Browse listings →
              </Link>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
