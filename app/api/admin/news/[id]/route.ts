import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

// ─── GET /api/admin/news/[id] ─────────────────────────────────────────────────

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id   = req.url.split('/').pop()!;
    const post = await prisma.newsPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: post });
  } catch (err) {
    console.error('[GET /api/admin/news/[id]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);

const updateSchema = z.object({
  title:      z.string().min(5).max(300).optional(),
  slug:       z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt:    z.string().min(20).max(600).optional(),
  body:       z.array(z.string().min(1)).min(1).optional(),
  category:   z.string().min(2).max(100).optional(),
  coverImage: z.string().nullable().optional(),
  featured:   z.boolean().optional(),
  published:  z.boolean().optional(),
  readTime:   z.string().optional(),
});

// ─── PUT /api/admin/news/[id] ─────────────────────────────────────────────────

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    // Extract id from URL since withAuth doesn't forward route params
    const id = req.url.split('/').pop()!;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    const { published, ...rest } = parsed.data;

    // publishedAt: set when first publishing; clear when un-publishing
    let publishedAt = existing.publishedAt;
    if (published === true && !existing.published) {
      publishedAt = new Date();
    } else if (published === false) {
      publishedAt = null;
    }

    const post = await prisma.newsPost.update({
      where: { id },
      data: {
        ...rest,
        ...(published !== undefined ? { published, publishedAt } : {}),
      },
    });

    return NextResponse.json({ success: true, data: post });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Unique constraint') || msg.includes('unique')) {
      return NextResponse.json({ success: false, error: 'Slug already exists.' }, { status: 409 });
    }
    console.error('[PUT /api/admin/news/[id]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);

// ─── DELETE /api/admin/news/[id] ──────────────────────────────────────────────

export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const id = req.url.split('/').pop()!;
    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }
    await prisma.newsPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/admin/news/[id]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
