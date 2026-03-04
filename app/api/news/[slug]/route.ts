import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCategoryColor } from '../route';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── GET /api/news/[slug] ─────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const slug = req.url.split('/').pop()!;
    const post = await prisma.newsPost.findFirst({
      where: { slug, published: true },
    });

    if (!post) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        slug:          post.slug,
        title:         post.title,
        excerpt:       post.excerpt,
        category:      post.category,
        categoryColor: getCategoryColor(post.category),
        coverImage:    post.coverImage,
        featured:      post.featured,
        readTime:      post.readTime,
        date:          formatDate(post.publishedAt ?? post.createdAt),
        body:          post.body as string[],
      },
    });
  } catch (err) {
    console.error('[GET /api/news/[slug]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
