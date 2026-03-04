import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Category → Tailwind colour classes (must be safelisted)
export function getCategoryColor(category: string): string {
  switch (category) {
    case 'Market Report': return 'text-sl-green-600 bg-sl-green-50';
    case 'Price Trends':  return 'text-blue-600 bg-blue-50';
    case 'Area Guide':    return 'text-purple-600 bg-purple-50';
    case 'Renter Guide':  return 'text-red-600 bg-red-50';
    case 'Platform':      return 'text-sl-gold-700 bg-sl-gold-50';
    default:              return 'text-sl-slate-600 bg-sl-slate-100';
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── GET /api/news ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const posts = await prisma.newsPost.findMany({
      where: { published: true },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
    });

    const data = posts.map((p) => ({
      slug:          p.slug,
      title:         p.title,
      excerpt:       p.excerpt,
      category:      p.category,
      categoryColor: getCategoryColor(p.category),
      coverImage:    p.coverImage,
      featured:      p.featured,
      readTime:      p.readTime,
      date:          formatDate(p.publishedAt ?? p.createdAt),
      body:          p.body as string[],
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[GET /api/news]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
