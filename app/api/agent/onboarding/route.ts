import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware';
import prisma from '@/lib/db';

const schema = z.object({
  agencyName:   z.string().min(2).max(100),
  cacNumber:    z.string().max(30).optional(),
  bio:          z.string().min(20).max(500),
  primaryArea:  z.string().min(1),
  servedAreas:  z.array(z.string()).default([]),
  plan:         z.enum(['STARTER', 'PROFESSIONAL', 'AGENCY']).default('STARTER'),
  profilePhoto: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    try {
      const body = await req.json();
      const parsed = schema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            error: parsed.error.issues[0]?.message ?? 'Validation failed',
          },
          { status: 400 },
        );
      }

      const { agencyName, cacNumber, bio, primaryArea, servedAreas, plan, profilePhoto } =
        parsed.data;

      // Combine primary + other areas, deduped
      const allAreas = [
        primaryArea,
        ...servedAreas.filter((a) => a !== primaryArea),
      ];

      const profile = await prisma.agentProfile.upsert({
        where: { userId: user.id },
        update: {
          agencyName,
          cacNumber:        cacNumber ?? null,
          bio,
          primaryCity:      primaryArea,
          servedCities:     allAreas,
          subscriptionTier: plan,
          ...(profilePhoto !== undefined ? { profilePhoto } : {}),
        },
        create: {
          userId:           user.id,
          agencyName,
          cacNumber:        cacNumber ?? null,
          bio,
          primaryCity:      primaryArea,
          servedCities:     allAreas,
          subscriptionTier: plan,
          profilePhoto:     profilePhoto ?? null,
        },
      });

      return NextResponse.json({ success: true, data: { profileId: profile.id } });
    } catch (err) {
      console.error('[POST /api/agent/onboarding]', err);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 },
      );
    }
  });
}
