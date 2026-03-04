/**
 * PATCH /api/admin/users/[id]
 * Suspend or reinstate a client user.
 *
 * Body: { action: 'SUSPEND', reason?: string } | { action: 'REINSTATE' }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SUSPEND'),   reason: z.string().optional() }),
  z.object({ action: z.literal('REINSTATE') }),
]);

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.url.split('/').pop()!;
    const body   = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    if (user.role !== 'CLIENT') {
      return NextResponse.json({ success: false, error: 'This endpoint is for CLIENT users only' }, { status: 400 });
    }

    if (parsed.data.action === 'SUSPEND') {
      await prisma.user.update({
        where: { id: userId },
        data:  { isSuspended: true, suspendedAt: new Date() },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data:  { isSuspended: false, suspendedAt: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/admin/users/[id]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
