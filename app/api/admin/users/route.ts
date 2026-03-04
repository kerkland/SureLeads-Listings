/**
 * GET /api/admin/users
 * Paginated client user list for admin management.
 *
 * Query params:
 *   search: string (name, phone, or email)
 *   status: 'all' | 'active' | 'suspended'
 *   page, limit
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status') ?? 'all';
    const page   = parseInt(searchParams.get('page')  ?? '1');
    const limit  = parseInt(searchParams.get('limit') ?? '25');
    const skip   = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      role:      'CLIENT',
      deletedAt: null,
    };

    if (status === 'active')    where.isSuspended = false;
    if (status === 'suspended') where.isSuspended = true;

    if (search.trim()) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone:    { contains: search, mode: 'insensitive' } },
        { email:    { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id:          true,
          fullName:    true,
          phone:       true,
          email:       true,
          isVerified:  true,
          isSuspended: true,
          suspendedAt: true,
          createdAt:   true,
          inspections: { select: { id: true }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Inspection counts per user
    const userIds = users.map((u) => u.id);
    const inspCounts = await prisma.inspection.groupBy({
      by:     ['clientId'],
      where:  { clientId: { in: userIds } },
      _count: { id: true },
    });
    const inspMap = new Map(inspCounts.map((r) => [r.clientId, r._count.id]));

    const data = users.map((u) => ({
      id:               u.id,
      fullName:         u.fullName,
      phone:            u.phone,
      email:            u.email,
      isVerified:       u.isVerified,
      isSuspended:      u.isSuspended,
      suspendedAt:      u.suspendedAt,
      inspectionCount:  inspMap.get(u.id) ?? 0,
      createdAt:        u.createdAt,
    }));

    return NextResponse.json({ success: true, data, total, page, totalPages: Math.ceil(total / limit) });
  });
}
