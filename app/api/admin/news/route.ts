import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

// ─── Schema ───────────────────────────────────────────────────────────────────

const newsSchema = z.object({
  title:      z.string().min(5).max(300),
  slug:       z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  excerpt:    z.string().min(20).max(600),
  body:       z.array(z.string().min(1)).min(1),
  category:   z.string().min(2).max(100),
  coverImage: z.string().nullable().optional(),
  featured:   z.boolean().default(false),
  published:  z.boolean().default(false),
  readTime:   z.string().default('5 min read'),
});

// ─── GET /api/admin/news ──────────────────────────────────────────────────────

export const GET = withAuth(async () => {
  try {
    const posts = await prisma.newsPost.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:          true,
        slug:        true,
        title:       true,
        category:    true,
        coverImage:  true,
        featured:    true,
        published:   true,
        readTime:    true,
        publishedAt: true,
        createdAt:   true,
        updatedAt:   true,
      },
    });
    return NextResponse.json({ success: true, data: posts });
  } catch (err) {
    console.error('[GET /api/admin/news]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);

// ─── POST /api/admin/news ─────────────────────────────────────────────────────

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const parsed = newsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { published, ...rest } = parsed.data;

    const post = await prisma.newsPost.create({
      data: {
        ...rest,
        published,
        publishedAt: published ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ success: false, error: 'Slug already exists — choose a different one.' }, { status: 409 });
    }
    console.error('[POST /api/admin/news]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
