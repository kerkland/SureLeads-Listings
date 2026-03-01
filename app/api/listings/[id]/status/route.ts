import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

type Ctx = { params: Record<string, string> };

const statusSchema = z.object({
  status: z.enum(['AVAILABLE', 'PAUSED', 'RENTED']),
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, { params }: Ctx) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: params.id, deletedAt: null } });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.agentId !== req.user.sub && req.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('[PATCH /listings/id/status]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['AGENT', 'ADMIN']);
