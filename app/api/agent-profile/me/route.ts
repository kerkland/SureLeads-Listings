import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    try {
      const profile = await prisma.agentProfile.findUnique({
        where: { userId: user.id },
        select: {
          id:           true,
          agencyName:   true,
          cacNumber:    true,
          bio:          true,
          primaryCity:  true,
          servedCities: true,
          profilePhoto: true,
        },
      });
      return NextResponse.json({ success: true, data: profile ?? null });
    } catch (err) {
      console.error('[GET /api/agent-profile/me]', err);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 },
      );
    }
  });
}
